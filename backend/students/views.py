import uuid

from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404

from assessment.models import AssessmentStructure
from question.models import Question
from students.models import Student, StudentTestResponse
from students.serializers import StudentSyncSerializer

class StudentSyncAPIView(APIView):

    def post(self, request):

        global_student_id = request.data.get("global_student_id")

        if not global_student_id:
            return Response(
                {
                    "success": False,
                    "message": "global_student_id is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------
        # Check whether student already exists
        # -----------------------------------------

        student = Student.objects.filter(
            global_student_id=global_student_id
        ).first()

        # -----------------------------------------
        # Existing student
        # -----------------------------------------

        if student:

            serializer = StudentSyncSerializer(
                student,
                data=request.data,
                partial=True
            )

            serializer.is_valid(raise_exception=True)
            serializer.save()

            return Response(
                {
                    "success": True,
                    "message": "Student already exists. Student details updated.",
                    "student": {
                        "id": student.id,
                        "global_student_id": str(
                            student.global_student_id
                        ),
                        "student_code": student.student_code,
                        "first_name": student.first_name,
                        "last_name": student.last_name,
                    }
                },
                status=status.HTTP_200_OK
            )

        # -----------------------------------------
        # New student
        # -----------------------------------------

        serializer = StudentSyncSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        student = serializer.save(
            student_code=self.generate_student_code()
        )

        return Response(
            {
                "success": True,
                "message": "Student created successfully.",
                "student": {
                    "id": student.id,
                    "global_student_id": str(
                        student.global_student_id
                    ),
                    "student_code": student.student_code,
                    "first_name": student.first_name,
                    "last_name": student.last_name,
                }
            },
            status=status.HTTP_201_CREATED
        )

    def generate_student_code(self):

        last_student = Student.objects.order_by("-id").first()

        if not last_student:
            next_number = 1
        else:
            next_number = last_student.id + 1

        return f"TMP{next_number:06d}"
    
class StudentTestResponseAPIView(APIView):
    """
    Save/update multiple student answers.

    Supports:
    - Multiple subsections in one request
    - Multiple questions per subsection
    - Partial answer saving
    - Automatic subsection submission
    - Automatic assessment_id from AssessmentStructure
    - Attempt-based answer tracking
    """

    @transaction.atomic
    def post(self, request):

        # =====================================================
        # 1. GET REQUEST DATA
        # =====================================================

        attempt_id = request.data.get("attempt_id")
        student_id = request.data.get("student_id")
        subsections = request.data.get("subsections")

        # =====================================================
        # 2. VALIDATION
        # =====================================================

        if not attempt_id:
            return Response(
                {
                    "success": False,
                    "message": "attempt_id is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not student_id:
            return Response(
                {
                    "success": False,
                    "message": "student_id is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not subsections:
            return Response(
                {
                    "success": False,
                    "message": "subsections is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not isinstance(subsections, list):
            return Response(
                {
                    "success": False,
                    "message": "subsections must be a list."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # =====================================================
        # 3. VALIDATE ATTEMPT ID
        # =====================================================

        try:
            attempt_uuid = uuid.UUID(str(attempt_id))

        except (ValueError, AttributeError):

            return Response(
                {
                    "success": False,
                    "message": "Invalid attempt_id."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # =====================================================
        # 4. GET STUDENT
        # =====================================================

        student = get_object_or_404(
            Student,
            id=student_id
        )

        # =====================================================
        # RESULT
        # =====================================================

        subsection_results = []

        # =====================================================
        # 5. PROCESS EACH SUBSECTION
        # =====================================================

        for subsection_data in subsections:

            subsection_id = subsection_data.get(
                "subsection_id"
            )

            answers = subsection_data.get(
                "answers",
                []
            )

            # -------------------------------------------------
            # Validate subsection
            # -------------------------------------------------

            if not subsection_id:

                return Response(
                    {
                        "success": False,
                        "message": "subsection_id is required."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not isinstance(answers, list):

                return Response(
                    {
                        "success": False,
                        "message": (
                            f"answers must be a list "
                            f"for subsection {subsection_id}."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # =================================================
            # 6. GET SUBSECTION
            # =================================================

            subsection = get_object_or_404(
                AssessmentStructure,
                subsection_id=subsection_id,
                status="ACTIVE"
            )

            # =================================================
            # 7. GET ASSESSMENT ID AUTOMATICALLY
            # =================================================

            assessment_id = subsection.assessment_id

            # =================================================
            # 8. GET ALL QUESTIONS OF THIS SUBSECTION
            #
            # Question.subsection_id is BigIntegerField.
            # No ForeignKey is required.
            # =================================================

            subsection_questions = Question.objects.filter(
                subsection_id=subsection_id,
                status="ACTIVE"
            )

            total_questions = subsection_questions.count()

            # =================================================
            # 9. PROCESS ANSWERS
            # =================================================

            for answer in answers:

                question_id = answer.get(
                    "question_id"
                )

                selected_response_json = answer.get(
                    "selected_response_json"
                )

                is_answered = answer.get(
                    "is_answered",
                    False
                )

                # ---------------------------------------------
                # Validate question_id
                # ---------------------------------------------

                if not question_id:

                    return Response(
                        {
                            "success": False,
                            "message": (
                                f"question_id is required "
                                f"for subsection "
                                f"{subsection_id}."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # ---------------------------------------------
                # Get question
                # ---------------------------------------------

                question = get_object_or_404(
                    Question,
                    id=question_id
                )

                # ---------------------------------------------
                # Validate question belongs to subsection
                # ---------------------------------------------

                if question.subsection_id != subsection_id:

                    return Response(
                        {
                            "success": False,
                            "message": (
                                f"Question {question_id} "
                                f"does not belong to subsection "
                                f"{subsection_id}."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # =================================================
                # 10. CHECK EXISTING RESPONSE
                # =================================================

                existing_response = (
                    StudentTestResponse.objects.filter(
                        attempt_id=attempt_uuid,
                        question=question
                    ).first()
                )

                # =================================================
                # 11. PREVENT UPDATE AFTER SUBMISSION
                # =================================================

                if (
                    existing_response
                    and existing_response.subsection_status
                    == "SUBMITTED"
                ):

                    return Response(
                        {
                            "success": False,
                            "message": (
                                f"Subsection {subsection_id} "
                                f"is already submitted."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # =================================================
                # 12. SAVE / UPDATE ANSWER
                # =================================================

                response_obj, created = (
                    StudentTestResponse.objects.update_or_create(

                        attempt_id=attempt_uuid,

                        question=question,

                        defaults={

                            "student": student,

                            "assessment_id":
                                assessment_id,

                            "subsection":
                                subsection,

                            "selected_response_json":
                                selected_response_json,

                            "is_answered":
                                is_answered,

                            "last_activity_at":
                                timezone.now(),

                            "answered_at":
                                (
                                    timezone.now()
                                    if is_answered
                                    else None
                                ),

                            "subsection_status":
                                "IN_PROGRESS",

                            "test_status":
                                "IN_PROGRESS",
                        }
                    )
                )

            # =================================================
            # 13. COUNT ANSWERED QUESTIONS
            # =================================================

            answered_questions = (
                StudentTestResponse.objects.filter(
                    attempt_id=attempt_uuid,
                    student=student,
                    subsection=subsection,
                    is_answered=True
                )
                .values("question_id")
                .distinct()
                .count()
            )

            # =================================================
            # 14. CALCULATE REMAINING QUESTIONS
            # =================================================

            remaining_questions = max(
                total_questions - answered_questions,
                0
            )

            # =================================================
            # 15. CHECK SUBSECTION STATUS
            # =================================================

            if (
                total_questions > 0
                and answered_questions >= total_questions
            ):

                subsection_status = "SUBMITTED"

                completed_at = timezone.now()

                # ---------------------------------------------
                # Get first response
                # ---------------------------------------------

                first_response = (
                    StudentTestResponse.objects.filter(
                        attempt_id=attempt_uuid,
                        student=student,
                        subsection=subsection
                    )
                    .order_by("created_at")
                    .first()
                )

                started_at = None

                if first_response:

                    started_at = (
                        first_response.subsection_started_at
                    )

                    if not started_at:
                        started_at = first_response.created_at

                # ---------------------------------------------
                # Calculate time taken
                # ---------------------------------------------

                time_taken_seconds = None

                if started_at:

                    time_taken_seconds = int(
                        (
                            completed_at -
                            started_at
                        ).total_seconds()
                    )

                # ---------------------------------------------
                # Mark ALL responses of subsection submitted
                # ---------------------------------------------

                StudentTestResponse.objects.filter(
                    attempt_id=attempt_uuid,
                    student=student,
                    subsection=subsection
                ).update(

                    subsection_status="SUBMITTED",

                    subsection_started_at=started_at,

                    subsection_completed_at=completed_at,

                    subsection_time_taken_seconds=
                        time_taken_seconds,

                    submitted_at=completed_at
                )

            else:

                subsection_status = "IN_PROGRESS"

            # =================================================
            # 16. ADD SUBSECTION SUMMARY ONLY
            # =================================================

            subsection_results.append(
                {
                    "subsection_id":
                        subsection.subsection_id,

                    "total_questions":
                        total_questions,

                    "answered_questions":
                        answered_questions,

                    "remaining_questions":
                        remaining_questions,

                    "subsection_status":
                        subsection_status,
                }
            )

        # =====================================================
        # 17. CHECK WHOLE ASSESSMENT STATUS
        # =====================================================

        # Get assessment IDs from requested subsections
        assessment_ids = list(
            set(
                AssessmentStructure.objects.filter(
                    subsection_id__in=[
                        item["subsection_id"]
                        for item in subsection_results
                    ]
                ).values_list(
                    "assessment_id",
                    flat=True
                )
            )
        )

        test_status = "IN_PROGRESS"

        if assessment_ids:

            assessment_id = assessment_ids[0]

            # ---------------------------------------------
            # All active subsections for assessment
            # ---------------------------------------------

            total_assessment_subsections = (
                AssessmentStructure.objects.filter(
                    assessment_id=assessment_id,
                    status="ACTIVE"
                )
                .values("subsection_id")
                .distinct()
                .count()
            )

            # ---------------------------------------------
            # Submitted subsections
            # ---------------------------------------------

            submitted_subsections = (
                StudentTestResponse.objects.filter(
                    attempt_id=attempt_uuid,
                    student=student,
                    subsection_status="SUBMITTED"
                )
                .values("subsection_id")
                .distinct()
                .count()
            )

            # ---------------------------------------------
            # Complete entire test
            # ---------------------------------------------

            if (
                total_assessment_subsections > 0
                and submitted_subsections
                >= total_assessment_subsections
            ):

                test_status = "COMPLETED"

                StudentTestResponse.objects.filter(
                    attempt_id=attempt_uuid,
                    student=student
                ).update(
                    test_status="COMPLETED"
                )

        # =====================================================
        # 18. FINAL RESPONSE
        # =====================================================

        return Response(
            {
                "success": True,

                "message":
                    "Student responses saved successfully.",

                "attempt_id":
                    str(attempt_uuid),

                "student_id":
                    student.id,

                "test_status":
                    test_status,

                "subsections":
                    subsection_results
            },
            status=status.HTTP_200_OK
        )      
        
        
        
        
        
        