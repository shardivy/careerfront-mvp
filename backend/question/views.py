import json

from django.shortcuts import render
from django.db import transaction
from django.db.models import Max

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import (
    MultiPartParser,
    FormParser,
    JSONParser,
)
from .pagination import DefaultPagination

from assessment.models import AssessmentStructure
from question.models import Question
from question.serializers import QuestionSerializer

class QuestionAPIView(APIView):

    # =====================================================
    # POST - CREATE QUESTION
    # =====================================================

    @transaction.atomic
    def post(self, request):

        subsection_id = request.data.get("subsection_id")

        # -----------------------------------------
        # Validate subsection
        # -----------------------------------------
        if not subsection_id:
            return Response(
                {
                    "success": False,
                    "message": "subsection_id is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        subsection = (
            AssessmentStructure.objects
            .filter(
                subsection_id=subsection_id,
                status="ACTIVE"
            )
            .first()
        )

        if not subsection:
            return Response(
                {
                    "success": False,
                    "message": "Subsection not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # -----------------------------------------
        # Generate Question Code
        # -----------------------------------------

        grade_name = subsection.grade_name

        # Example:
        # Grade 10 -> G10
        grade_number = "".join(
            char for char in grade_name
            if char.isdigit()
        )

        if grade_number:
            grade_code = f"G{grade_number}"
        else:
            grade_code = "G"

        # Find last question for this grade
        last_question = (
            Question.objects
            .filter(
                question_code__startswith=f"Q-{grade_code}-"
            )
            .order_by("-id")
            .first()
        )

        if last_question:
            last_number = int(
                last_question.question_code.split("-")[-1]
            )

            next_number = last_number + 1
        else:
            next_number = 1

        question_code = (
            f"Q-{grade_code}-{next_number:04d}"
        )

        # -----------------------------------------
        # Prepare data
        # -----------------------------------------

        data = request.data.copy()

        data["question_code"] = question_code

        # -----------------------------------------
        # Validate
        # -----------------------------------------

        serializer = QuestionSerializer(data=data)

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------
        # Create Question
        # -----------------------------------------

        question = serializer.save()

        # -----------------------------------------
        # Response
        # -----------------------------------------

        return Response(
            {
                "success": True,
                "message": "Question created successfully.",
                "data": QuestionSerializer(question).data
            },
            status=status.HTTP_201_CREATED
        )

    # =====================================================
    # GET - QUESTION LIST / DETAIL
    # =====================================================

    def get(self, request, question_id=None):

        # -----------------------------------------
        # Detail
        # -----------------------------------------

        if question_id:

            question = (
                Question.objects
                .filter(id=question_id)
                .first()
            )

            if not question:
                return Response(
                    {
                        "success": False,
                        "message": "Question not found."
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            serializer = QuestionSerializer(question)

            return Response(
                {
                    "success": True,
                    "data": serializer.data
                },
                status=status.HTTP_200_OK
            )

        # -----------------------------------------
        # List
        # -----------------------------------------

        queryset = Question.objects.all()

        # -----------------------------------------
        # Filter by subsection
        # -----------------------------------------

        subsection_id = request.query_params.get(
            "subsection_id"
        )

        if subsection_id:
            queryset = queryset.filter(
                subsection_id=subsection_id
            )

        # -----------------------------------------
        # Filter by status
        # -----------------------------------------

        status_filter = request.query_params.get(
            "status"
        )

        if status_filter:
            queryset = queryset.filter(
                status=status_filter
            )

        # -----------------------------------------
        # Order
        # -----------------------------------------

        queryset = queryset.order_by(
            "subsection_id",
            "display_order"
        )

        serializer = QuestionSerializer(
            queryset,
            many=True
        )

        return Response(
            {
                "success": True,
                "count": queryset.count(),
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )
        
class BulkQuestionCreateAPIView(APIView):

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    @transaction.atomic
    def post(self, request):

        # =====================================================
        # 1. GET SUBSECTION ID
        # =====================================================

        subsection_id = request.data.get("subsection_id")

        if not subsection_id:
            return Response(
                {
                    "success": False,
                    "message": "subsection_id is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            subsection_id = int(subsection_id)
        except (TypeError, ValueError):
            return Response(
                {
                    "success": False,
                    "message": "subsection_id must be an integer."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # =====================================================
        # 2. CHECK SUBSECTION
        # =====================================================

        subsection = (
            AssessmentStructure.objects
            .filter(
                subsection_id=subsection_id,
                status="ACTIVE"
            )
            .first()
        )

        if not subsection:
            return Response(
                {
                    "success": False,
                    "message": "Subsection not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # =====================================================
        # 3. GET QUESTIONS JSON
        # =====================================================

        questions_data = request.data.get("questions")

        if not questions_data:
            return Response(
                {
                    "success": False,
                    "message": "questions is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # =====================================================
        # 4. PARSE JSON
        # =====================================================

        try:

            if isinstance(questions_data, str):
                questions_data = json.loads(
                    questions_data
                )

        except json.JSONDecodeError:

            return Response(
                {
                    "success": False,
                    "message": "Invalid questions JSON."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # =====================================================
        # 5. VALIDATE LIST
        # =====================================================

        if not isinstance(questions_data, list):

            return Response(
                {
                    "success": False,
                    "message": "questions must be a list."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not questions_data:

            return Response(
                {
                    "success": False,
                    "message": "At least one question is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # =====================================================
        # 7. FIND LAST QUESTION NUMBER
        # =====================================================

        last_question = (
            Question.objects
            .order_by("-id")
            .first()
        )

        if last_question:
            try:
                last_number = int(
                    last_question.question_code.replace("Q-", "")
                )
            except (ValueError, AttributeError):
                last_number = 0
        else:
            last_number = 0

        
        
        # =====================================================
        # GET NEXT DISPLAY ORDER FOR THIS SUBSECTION
        # =====================================================

        last_order = (
            Question.objects
            .filter(
                subsection_id=subsection_id
            )
            .order_by("-display_order")
            .values_list(
                "display_order",
                flat=True
            )
            .first()
        )

        if last_order is None:
            next_display_order = 1
        else:
            next_display_order = last_order + 1
            
        # =====================================================
        # 8. CREATE QUESTIONS
        # =====================================================

        created_questions = []

        for index, question_data in enumerate(
            questions_data,
            start=1
        ):

            # ---------------------------------------------
            # Question Code
            # ---------------------------------------------

            next_number = last_number + index

            question_code = f"Q-{next_number:04d}"
            
            # ---------------------------------------------
            # Auto Display Order
            # ---------------------------------------------

            display_order = next_display_order

            next_display_order += 1

            # ---------------------------------------------
            # Required fields
            # ---------------------------------------------

            question_type = question_data.get(
                "question_type"
            )

            question_text = question_data.get(
                "question_text"
            )

            marks = question_data.get("marks")

            

            if not question_text:

                return Response(
                    {
                        "success": False,
                        "message":
                            f"question_text is required "
                            f"for question {index}."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # if marks is None:

            #     return Response(
            #         {
            #             "success": False,
            #             "message":
            #                 f"marks is required "
            #                 f"for question {index}."
            #         },
            #         status=status.HTTP_400_BAD_REQUEST
            #     )


            # ---------------------------------------------
            # Options
            # ---------------------------------------------

            options_json = question_data.get(
                "options_json"
            )

            correct_answer_json = question_data.get(
                "correct_answer_json"
            )

            if question_type in [
                "SINGLE_CHOICE",
                "MULTIPLE_CHOICE"
            ]:

                if not options_json:

                    return Response(
                        {
                            "success": False,
                            "message":
                                f"options_json is required "
                                f"for question {index}."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # if not correct_answer_json:

                #     return Response(
                #         {
                #             "success": False,
                #             "message":
                #                 f"correct_answer_json is required "
                #                 f"for question {index}."
                #         },
                #         status=status.HTTP_400_BAD_REQUEST
                #     )

            # ---------------------------------------------
            # Images
            # ---------------------------------------------

            question_image = request.FILES.get(
                f"question_image_{index}"
            )

            option_image = request.FILES.get(
                f"option_image_{index}"
            )

            # ---------------------------------------------
            # Create
            # ---------------------------------------------

            question = Question.objects.create(

                question_code=question_code,

                subsection_id=subsection_id,

                question_type=question_type,

                question_text=question_text,

                question_image=question_image,

                options_json=options_json,

                option_image=option_image,

                correct_answer_json=
                    correct_answer_json,

                marks=marks,

                negative_marks=
                    question_data.get(
                        "negative_marks",
                        0
                    ),

                explanation=
                    question_data.get(
                        "explanation"
                    ),

                display_order=display_order,

                status=
                    question_data.get(
                        "status",
                        "ACTIVE"
                    ),
            )

            created_questions.append(question)

        # =====================================================
        # 9. RESPONSE
        # =====================================================

        serializer = QuestionSerializer(
            created_questions,
            many=True
        )

        return Response(
            {
                "success": True,
                "message":
                    f"{len(created_questions)} "
                    f"questions created successfully.",
                "subsection_id": subsection_id,
                "data": serializer.data,
            },
            status=status.HTTP_201_CREATED
        )
     
    @transaction.atomic
    def put(self, request, question_id):

        # =====================================================
        # 1. GET QUESTION
        # =====================================================

        try:
            question = Question.objects.get(
                id=question_id
            )
        except Question.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Question not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # =====================================================
        # 2. GET SUBSECTION ID
        # =====================================================

        subsection_id = request.data.get("subsection_id")

        if not subsection_id:
            return Response(
                {
                    "success": False,
                    "message": "subsection_id is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            subsection_id = int(subsection_id)
        except (TypeError, ValueError):
            return Response(
                {
                    "success": False,
                    "message": "subsection_id must be an integer."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # =====================================================
        # 3. CHECK SUBSECTION
        # =====================================================

        subsection = (
            AssessmentStructure.objects
            .filter(
                subsection_id=subsection_id,
                status="ACTIVE"
            )
            .first()
        )

        if not subsection:
            return Response(
                {
                    "success": False,
                    "message": "Subsection not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # =====================================================
        # 4. UPDATE QUESTION TYPE
        # =====================================================

        if "question_type" in request.data:
            question.question_type = request.data.get(
                "question_type"
            )

        # =====================================================
        # 5. UPDATE QUESTION TEXT
        # =====================================================

        if "question_text" in request.data:
            question.question_text = request.data.get(
                "question_text"
            )

        # =====================================================
        # 6. UPDATE QUESTION IMAGE
        # =====================================================

        if "question_image" in request.FILES:
            question.question_image = request.FILES.get(
                "question_image"
            )

        # =====================================================
        # 7. UPDATE OPTIONS
        # =====================================================

        if "options_json" in request.data:

            options_json = request.data.get(
                "options_json"
            )

            if isinstance(options_json, str):
                try:
                    options_json = json.loads(
                        options_json
                    )
                except json.JSONDecodeError:
                    return Response(
                        {
                            "success": False,
                            "message": "Invalid options_json."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

            question.options_json = options_json

        # =====================================================
        # 8. UPDATE CORRECT ANSWER
        # =====================================================

        if "correct_answer_json" in request.data:

            correct_answer_json = request.data.get(
                "correct_answer_json"
            )

            if isinstance(correct_answer_json, str):
                try:
                    correct_answer_json = json.loads(
                        correct_answer_json
                    )
                except json.JSONDecodeError:
                    return Response(
                        {
                            "success": False,
                            "message": "Invalid correct_answer_json."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

            question.correct_answer_json = correct_answer_json

        # =====================================================
        # 9. UPDATE MARKS
        # =====================================================

        if "marks" in request.data:
            question.marks = request.data.get(
                "marks"
            )

        # =====================================================
        # 10. UPDATE NEGATIVE MARKS
        # =====================================================

        if "negative_marks" in request.data:
            question.negative_marks = request.data.get(
                "negative_marks"
            )

        # =====================================================
        # 11. UPDATE EXPLANATION
        # =====================================================

        if "explanation" in request.data:
            question.explanation = request.data.get(
                "explanation"
            )

        # =====================================================
        # 12. UPDATE STATUS
        # =====================================================

        if "status" in request.data:
            question.status = request.data.get(
                "status"
            )

        # =====================================================
        # 13. UPDATE OPTION IMAGE
        # =====================================================

        if "option_image" in request.FILES:
            question.option_image = request.FILES.get(
                "option_image"
            )

        # =====================================================
        # 14. SAVE
        # =====================================================

        question.save()

        # =====================================================
        # 15. RESPONSE
        # =====================================================

        serializer = QuestionSerializer(question)

        return Response(
            {
                "success": True,
                "message": "Question updated successfully.",
                "question_id": question.id,
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        ) 
        
class SubsectionQuestionsAPIView(APIView):

    def get(self, request, subsection_id):

        # -----------------------------------------
        # 1. Get subsection
        # -----------------------------------------

        subsection = (
            AssessmentStructure.objects
            .filter(
                subsection_id=subsection_id,
                status="ACTIVE"
            )
            .only(
                "subsection_id",
                "subsection_name"
            )
            .first()
        )

        if not subsection:
            return Response(
                {
                    "success": False,
                    "message": "Subsection not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # -----------------------------------------
        # 2. Get questions
        # -----------------------------------------

        questions = (
            Question.objects
            .filter(
                subsection_id=subsection_id,
                status="ACTIVE"
            )
            .only(
                "id",
                "question_code",
                "subsection_id",
                "question_type",
                "question_text",
                "question_image",
                "options_json",
                "marks",
                "negative_marks",
                "display_order",
            )
            .order_by(
                "display_order",
                "id"
            )
        )

        # -----------------------------------------
        # 3. Prepare response
        # -----------------------------------------

        data = []

        for question in questions:

            question_image = None

            if question.question_image:
                question_image = request.build_absolute_uri(
                    question.question_image.url
                )

            data.append({
                "id": question.id,
                "question_code": question.question_code,
                "subsection_id": question.subsection_id,
                "question_type": question.question_type,
                "question_text": question.question_text,
                "question_image": question_image,
                "options": question.options_json,
                "marks": question.marks,
                "negative_marks": question.negative_marks,
                "display_order": question.display_order,
            })

        # -----------------------------------------
        # 4. Response
        # -----------------------------------------

        return Response(
            {
                "success": True,
                "subsection_id": subsection.subsection_id,
                "subsection_name": subsection.subsection_name,
                "question_count": len(data),
                "questions": data,
            },
            status=status.HTTP_200_OK
        )
