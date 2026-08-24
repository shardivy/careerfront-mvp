import uuid

from django.shortcuts import render
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import check_password
from django.contrib.auth.hashers import make_password
from datetime import timedelta

from assessment.models import AssessmentStructure
from question.models import Question
from students.models import Student, StudentEmailOTP, StudentTestResponse
from students.serializers import StudentSyncSerializer
from students.utils import generate_student_code, send_student_otp_email

class StudentRegisterAPIView(APIView):

    @transaction.atomic
    def post(self, request):

        first_name = request.data.get("first_name")
        last_name = request.data.get("last_name")
        mobile = request.data.get("mobile")
        grade_name = request.data.get("grade_name")

        email = request.data.get("email")
        password = request.data.get("password")
        confirm_password = request.data.get("confirm_password")

        # -----------------------------------------
        # Validation
        # -----------------------------------------

        if not first_name:
            return Response(
                {
                    "success": False,
                    "message": "first_name is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not last_name:
            return Response(
                {
                    "success": False,
                    "message": "last_name is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not mobile:
            return Response(
                {
                    "success": False,
                    "message": "mobile is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not grade_name:
            return Response(
                {
                    "success": False,
                    "message": "grade_name is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not email:
            return Response(
                {
                    "success": False,
                    "message": "email is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not password:
            return Response(
                {
                    "success": False,
                    "message": "password is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not confirm_password:
            return Response(
                {
                    "success": False,
                    "message": "confirm_password is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if password != confirm_password:
            return Response(
                {
                    "success": False,
                    "message": "Password and confirm password do not match."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------
        # Check email already registered
        # -----------------------------------------

        if Student.objects.filter(
            email=email
        ).exists():

            return Response(
                {
                    "success": False,
                    "message": "Email is already registered."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------
        # Get grade from grade name
        # -----------------------------------------

        grade = AssessmentStructure.objects.filter(
            grade_name=grade_name
        ).values(
            "grade_id",
            "grade_name"
        ).first()

        if not grade:
            return Response(
                {
                    "success": False,
                    "message": "Grade not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # -----------------------------------------
        # Generate student code
        # -----------------------------------------

        student_code = generate_student_code()

        # -----------------------------------------
        # Create student
        # -----------------------------------------

        student = Student.objects.create(
            global_student_id=uuid.uuid4(),
            student_code=student_code,
            first_name=first_name,
            last_name=last_name,
            grade_id=grade["grade_id"],
            email=email,
            mobile=mobile,
            password=make_password(password),
            is_email_verified=False,
            status="ACTIVE"
        )

        # -----------------------------------------
        # Fixed OTP
        # -----------------------------------------

        otp = settings.STUDENT_FIXED_OTP

        expires_at = timezone.now() + timedelta(
            minutes=10
        )

        # -----------------------------------------
        # Save OTP
        # -----------------------------------------

        StudentEmailOTP.objects.create(
            student=student,
            otp=otp,
            expires_at=expires_at
        )

        # -----------------------------------------
        # Send OTP email
        # -----------------------------------------

        send_student_otp_email(
            student_name=student.first_name,
            student_email=student.email,
            otp=otp
        )

        # -----------------------------------------
        # Response
        # -----------------------------------------

        return Response(
            {
                "success": True,
                "message": "Registration successful. OTP has been sent to your email.",
                "student_id": student.id,
                "student_code": student.student_code,
                "email": student.email,
                "mobile": student.mobile,
                "grade": grade["grade_name"]
            },
            status=status.HTTP_201_CREATED
        )       
        
        
class StudentVerifyEmailAPIView(APIView):

    @transaction.atomic
    def post(self, request):

        email = request.data.get("email")
        otp = request.data.get("otp")

        # -----------------------------------------
        # Validation
        # -----------------------------------------

        if not email:
            return Response(
                {
                    "success": False,
                    "message": "email is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not otp:
            return Response(
                {
                    "success": False,
                    "message": "OTP is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------
        # Find student by email
        # -----------------------------------------

        try:
            student = Student.objects.get(
                email=email
            )

        except Student.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Student with this email not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # -----------------------------------------
        # Already verified
        # -----------------------------------------

        if student.is_email_verified:

            return Response(
                {
                    "success": False,
                    "message": "Email is already verified."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------
        # Find OTP
        # -----------------------------------------

        otp_obj = StudentEmailOTP.objects.filter(
            student=student,
            otp=otp,
            is_used=False
        ).first()

        if not otp_obj:

            return Response(
                {
                    "success": False,
                    "message": "Invalid OTP."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------
        # Check OTP expiry
        # -----------------------------------------

        if timezone.now() > otp_obj.expires_at:

            otp_obj.is_used = True

            otp_obj.save(
                update_fields=["is_used"]
            )

            return Response(
                {
                    "success": False,
                    "message": "OTP has expired."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------
        # Verify email
        # -----------------------------------------

        student.is_email_verified = True

        student.save(
            update_fields=[
                "is_email_verified",
                "updated_at"
            ]
        )

        # -----------------------------------------
        # Mark OTP as used
        # -----------------------------------------

        otp_obj.is_used = True

        otp_obj.save(
            update_fields=["is_used"]
        )

        # -----------------------------------------
        # Response
        # -----------------------------------------

        return Response(
            {
                "success": True,
                "message": "Email verified successfully.",
                "student_id": student.id,
                "student_code": student.student_code,
                "email": student.email
            },
            status=status.HTTP_200_OK
        )
        
              
class StudentLoginAPIView(APIView):

    def post(self, request):

        email = request.data.get("email")
        password = request.data.get("password")

        # -----------------------------------------
        # Validation
        # -----------------------------------------

        if not email:
            return Response(
                {
                    "success": False,
                    "message": "Email is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not password:
            return Response(
                {
                    "success": False,
                    "message": "Password is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------
        # Find student by email
        # -----------------------------------------

        try:
            student = Student.objects.get(
                email=email
            )

        except Student.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Invalid email or password."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        # -----------------------------------------
        # Check account status
        # -----------------------------------------

        if student.status != "ACTIVE":

            return Response(
                {
                    "success": False,
                    "message": "Student account is inactive."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # -----------------------------------------
        # Check email verification
        # -----------------------------------------

        if not student.is_email_verified:

            return Response(
                {
                    "success": False,
                    "message": "Please verify your email before login."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # -----------------------------------------
        # Check password
        # -----------------------------------------

        if not check_password(
            password,
            student.password
        ):

            return Response(
                {
                    "success": False,
                    "message": "Invalid email or password."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        # -----------------------------------------
        # Get grade name
        # -----------------------------------------

        grade = AssessmentStructure.objects.filter(
            grade_id=student.grade_id
        ).values(
            "grade_id",
            "grade_name"
        ).first()

        if not grade:
            return Response(
                {
                    "success": False,
                    "message": "Grade not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # -----------------------------------------
        # Login success
        # -----------------------------------------

        return Response(
            {
                "success": True,
                "message": "Login successful.",
                "student": {
                    "id": student.id,
                    "global_student_id": str(
                        student.global_student_id
                    ),
                    "student_code": student.student_code,
                    "first_name": student.first_name,
                    "last_name": student.last_name,
                    "email": student.email,
                    "grade_name": student.study_class,
                    "grade_name": grade["grade_name"],
                    "section_name": student.section_name
                }
            },
            status=status.HTTP_200_OK
        )


# class StudentSyncAPIView(APIView):

#     def post(self, request):

#         global_student_id = request.data.get("global_student_id")

#         if not global_student_id:
#             return Response(
#                 {
#                     "success": False,
#                     "message": "global_student_id is required."
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # -----------------------------------------
#         # Check whether student already exists
#         # -----------------------------------------

#         student = Student.objects.filter(
#             global_student_id=global_student_id
#         ).first()

#         # -----------------------------------------
#         # Existing student
#         # -----------------------------------------

#         if student:

#             serializer = StudentSyncSerializer(
#                 student,
#                 data=request.data,
#                 partial=True
#             )

#             serializer.is_valid(raise_exception=True)
#             serializer.save()

#             return Response(
#                 {
#                     "success": True,
#                     "message": "Student already exists. Student details updated.",
#                     "student": {
#                         "id": student.id,
#                         "global_student_id": str(
#                             student.global_student_id
#                         ),
#                         "student_code": student.student_code,
#                         "first_name": student.first_name,
#                         "last_name": student.last_name,
#                     }
#                 },
#                 status=status.HTTP_200_OK
#             )

#         # -----------------------------------------
#         # New student
#         # -----------------------------------------

#         serializer = StudentSyncSerializer(
#             data=request.data
#         )

#         serializer.is_valid(raise_exception=True)

#         student = serializer.save(
#             student_code=self.generate_student_code()
#         )

#         return Response(
#             {
#                 "success": True,
#                 "message": "Student created successfully.",
#                 "student": {
#                     "id": student.id,
#                     "global_student_id": str(
#                         student.global_student_id
#                     ),
#                     "student_code": student.student_code,
#                     "first_name": student.first_name,
#                     "last_name": student.last_name,
#                 }
#             },
#             status=status.HTTP_201_CREATED
#         )

#     def generate_student_code(self):

#         last_student = Student.objects.order_by("-id").first()

#         if not last_student:
#             next_number = 1
#         else:
#             next_number = last_student.id + 1

#         return f"TMP{next_number:06d}"

class StudentSyncAPIView(APIView):

    def post(self, request):

        global_student_id = request.data.get("global_student_id")
        grade_name = request.data.get("grade_name")

        # -----------------------------------------
        # Validate required fields
        # -----------------------------------------

        if not global_student_id:
            return Response(
                {
                    "success": False,
                    "message": "global_student_id is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not grade_name:
            return Response(
                {
                    "success": False,
                    "message": "grade_name is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------------------
        # Find grade_id from AssessmentStructure
        # -----------------------------------------

        assessment_structure = (
            AssessmentStructure.objects
            .filter(
                grade_name__iexact=grade_name,
                status="ACTIVE"
            )
            .first()
        )

        if not assessment_structure:
            return Response(
                {
                    "success": False,
                    "message": f"Grade '{grade_name}' not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        grade_id = assessment_structure.grade_id

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

            student = serializer.save(
                grade_id=grade_id
            )

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
                        "grade_id": student.grade_id,
                        "grade_name": grade_name,
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
            student_code=self.generate_student_code(),
            grade_id=grade_id
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
                    "grade_id": student.grade_id,
                    "grade_name": grade_name,
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
        
        
        
        
        
        