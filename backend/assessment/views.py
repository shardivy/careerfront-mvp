from django.shortcuts import render
from django.db import transaction
from django.db.models import Max, Subquery
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from assessment.models import AssessmentStructure
from assessment.serializers import AssessmentStructureSerializer, SubsectionListSerializer
from question.pagination import DefaultPagination

class AssessmentStructureCreateAPIView(APIView):

    @transaction.atomic
    def post(self, request):

        # -----------------------------------------
        # Validate request
        # -----------------------------------------
        serializer = AssessmentStructureSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data

        # -----------------------------------------
        # Generate Grade ID
        # -----------------------------------------
        last_grade_id = (
            AssessmentStructure.objects
            .aggregate(max_id=Max("grade_id"))
            ["max_id"]
        )

        grade_id = (last_grade_id or 0) + 1

        # -----------------------------------------
        # Generate Assessment ID
        # -----------------------------------------
        last_assessment_id = (
            AssessmentStructure.objects
            .aggregate(max_id=Max("assessment_id"))
            ["max_id"]
        )

        assessment_id = (last_assessment_id or 0) + 1

        # -----------------------------------------
        # Generate Assessment Code
        # ASSE001, ASSE002, ASSE003...
        # -----------------------------------------
        last_assessment_code = (
            AssessmentStructure.objects
            .filter(assessment_code__startswith="ASSE")
            .order_by("-assessment_id")
            .values_list("assessment_code", flat=True)
            .first()
        )

        if last_assessment_code:
            last_number = int(
                last_assessment_code.replace("ASSE", "")
            )
            assessment_code = f"ASSE{last_number + 1:03d}"
        else:
            assessment_code = "ASSE001"

        # -----------------------------------------
        # Generate Section ID
        # -----------------------------------------
        last_section_id = (
            AssessmentStructure.objects
            .aggregate(max_id=Max("section_id"))
            ["max_id"]
        )

        section_id = (last_section_id or 0) + 1

        # -----------------------------------------
        # Generate Section Code
        # SEC001, SEC002, SEC003...
        # -----------------------------------------
        last_section_code = (
            AssessmentStructure.objects
            .filter(section_code__startswith="SEC")
            .order_by("-section_id")
            .values_list("section_code", flat=True)
            .first()
        )

        if last_section_code:
            last_number = int(
                last_section_code.replace("SEC", "")
            )
            section_code = f"SEC{last_number + 1:03d}"
        else:
            section_code = "SEC001"

        # -----------------------------------------
        # Generate Subsection ID
        # -----------------------------------------
        last_subsection_id = (
            AssessmentStructure.objects
            .aggregate(max_id=Max("subsection_id"))
            ["max_id"]
        )

        subsection_id = (last_subsection_id or 0) + 1

        # -----------------------------------------
        # Generate Subsection Code
        # SUBSEC001, SUBSEC002, SUBSEC003...
        # -----------------------------------------
        last_subsection_code = (
            AssessmentStructure.objects
            .filter(subsection_code__startswith="SUBSEC")
            .order_by("-subsection_id")
            .values_list("subsection_code", flat=True)
            .first()
        )

        if last_subsection_code:
            last_number = int(
                last_subsection_code.replace("SUBSEC", "")
            )
            subsection_code = f"SUBSEC{last_number + 1:03d}"
        else:
            subsection_code = "SUBSEC001"

        # -----------------------------------------
        # Create Assessment Structure
        # -----------------------------------------
        assessment_structure = AssessmentStructure.objects.create(
            grade_id=grade_id,
            grade_name=data["grade_name"],

            assessment_id=assessment_id,
            assessment_code=assessment_code,
            assessment_name=data["assessment_name"],
            assessment_description=data.get(
                "assessment_description"
            ),

            section_id=section_id,
            section_code=section_code,
            section_name=data.get("section_name"),
            section_display_order=data.get("section_display_order"),

            subsection_id=subsection_id,
            subsection_code=subsection_code,
            subsection_name=data["subsection_name"],
            subsection_description=data.get(
                "subsection_description"
            ),
            subsection_display_order=data[
                "subsection_display_order"
            ],

            time_limit_minutes=data.get(
                "time_limit_minutes"
            ),
            instructions=data.get("instructions"),

            status=data.get("status", "ACTIVE"),
        )

        # -----------------------------------------
        # Response
        # -----------------------------------------
        response_serializer = AssessmentStructureSerializer(
            assessment_structure
        )

        return Response(
            {
                "success": True,
                "message": "Assessment structure created successfully.",
                "data": response_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )
        
class SectionListAPIView(APIView):

    def get(self, request):

        sections = (
            AssessmentStructure.objects
            .values(
                "section_id",
                "section_code",
                "section_name",
                "section_display_order",
            )
            .distinct()
            .order_by("section_display_order")
        )

        return Response(
            {
                "success": True,
                "message": "Section list fetched successfully.",
                "data": sections,
            },
            status=status.HTTP_200_OK,
        )
        
class SectionWiseSubsectionListAPIView(APIView):

    def get(self, request, section_id):

        subsections = (
            AssessmentStructure.objects
            .filter(
                section_id=section_id,
                status="ACTIVE"
            )
            .order_by("subsection_display_order")
        )

        serializer = SubsectionListSerializer(subsections, many=True)

        return Response(
            {
                "success": True,
                "message": "Section-wise subsection list fetched successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )
        
class SubsectionListAPIView(APIView):

    pagination_class = DefaultPagination

    def get(self, request):

        # Get one structure row for each subsection
        subsection_ids = (
            AssessmentStructure.objects
            .filter(status="ACTIVE")
            .values("subsection_id")
            .distinct()
        )

        subsections = (
            AssessmentStructure.objects
            .filter(
                status="ACTIVE",
                subsection_id__in=Subquery(
                    subsection_ids.values("subsection_id")
                )
            )
            .values(
                "subsection_id",
                "subsection_code",
                "subsection_name",
                "subsection_description",
                "subsection_display_order",
                "time_limit_minutes",
                "instructions",
            )
            .order_by(
                # "subsection_display_order",
                "subsection_id"
            )
        )

        paginator = self.pagination_class()

        page = paginator.paginate_queryset(
            subsections,
            request,
            view=self
        )

        data = []

        for subsection in page:
            data.append({
                "subsection_id": subsection["subsection_id"],
                "subsection_code": subsection["subsection_code"],
                "subsection_name": subsection["subsection_name"],
                "subsection_description": subsection[
                    "subsection_description"
                ],
                "subsection_display_order": subsection[
                    "subsection_display_order"
                ],
                "time_limit_minutes": subsection[
                    "time_limit_minutes"
                ],
                "instructions": subsection["instructions"],
            })

        return paginator.get_paginated_response({
            "success": True,
            "subsections": data
        })
        
        