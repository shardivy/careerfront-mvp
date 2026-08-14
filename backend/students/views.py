from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from students.models import Student
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
