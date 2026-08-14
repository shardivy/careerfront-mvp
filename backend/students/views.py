from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.utils import timezone

from students.models import Student, StudentTestResponse
from students.serializers import BulkStudentTestResponseSerializer, StudentSyncSerializer

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
    
class BulkStudentTestResponseAPIView(APIView):

    @transaction.atomic
    def post(self, request):

        serializer = BulkStudentTestResponseSerializer(
            data=request.data
        )

        if not serializer.is_valid():

            return Response(
                {
                    "success": False,
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data

        attempt_id = data["attempt_id"]
        student = data["student"]
        assessment_id = data["assessment_id"]
        subsection_id = data["subsection_id"]
        answers = data["answers"]
        question_map = data["question_map"]

        created_count = 0
        updated_count = 0

        response_data = []

        # -----------------------------------------
        # Process every answer
        # -----------------------------------------

        for answer in answers:

            question_id = answer["question_id"]

            question = question_map[question_id]

            selected_response = answer.get(
                "selected_response_json"
            )

            is_answered = answer.get(
                "is_answered",
                False
            )

            # -----------------------------------------
            # Find existing response
            # -----------------------------------------

            response_obj = StudentTestResponse.objects.filter(
                attempt_id=attempt_id,
                question_id=question_id
            ).first()

            # -----------------------------------------
            # CREATE
            # -----------------------------------------

            if not response_obj:

                response_obj = StudentTestResponse(
                    attempt_id=attempt_id,
                    student=student,
                    assessment_id=assessment_id,
                    question=question,
                    subsection_id=subsection_id
                )

                created_count += 1

            # -----------------------------------------
            # UPDATE
            # -----------------------------------------

            else:

                # Same attempt cannot belong
                # to another student

                if response_obj.student_id != student.id:

                    return Response(
                        {
                            "success": False,
                            "message": (
                                "Attempt does not belong "
                                "to this student."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                updated_count += 1

            # -----------------------------------------
            # Save answer
            # -----------------------------------------

            response_obj.selected_response_json = (
                selected_response
            )

            response_obj.is_answered = is_answered

            response_obj.last_activity_at = timezone.now()

            # -----------------------------------------
            # Calculate correctness
            # -----------------------------------------

            if not is_answered:

                response_obj.is_correct = None
                response_obj.marks_awarded = None

            else:

                correct_answer = (
                    question.correct_answer_json or {}
                )

                selected_answer = (
                    selected_response or {}
                )

                selected_option = (
                    selected_answer.get("option_id")
                )

                correct_option = (
                    correct_answer.get("option_id")
                )

                if selected_option == correct_option:

                    response_obj.is_correct = True

                    response_obj.marks_awarded = (
                        question.marks or 0
                    )

                else:

                    response_obj.is_correct = False

                    response_obj.marks_awarded = -(
                        question.negative_marks or 0
                    )

                response_obj.answered_at = timezone.now()

            response_obj.save()

            response_data.append(
                {
                    "id": response_obj.id,
                    "question_id": question_id,
                    "is_answered": response_obj.is_answered,
                    "is_correct": response_obj.is_correct,
                    "marks_awarded": response_obj.marks_awarded,
                }
            )

        # -----------------------------------------
        # Response
        # -----------------------------------------

        return Response(
            {
                "success": True,
                "message": "Student responses saved successfully.",
                "attempt_id": str(attempt_id),
                "student_id": student.id,
                "assessment_id": assessment_id,
                "subsection_id": subsection_id,
                "created_count": created_count,
                "updated_count": updated_count,
                "total_answers": len(answers),
                "responses": response_data,
            },
            status=status.HTTP_200_OK
        )
