from django.db import models

from assessment.models import AssessmentStructure
from question.models import Question

class Student(models.Model):

    # -----------------------------------------
    # Local CareerFront student ID
    # -----------------------------------------
    id = models.BigAutoField(primary_key=True)

    # -----------------------------------------
    # Common ID between old project
    # and CareerFront
    # -----------------------------------------
    global_student_id = models.UUIDField(
        unique=True,
        db_index=True
    )

    # -----------------------------------------
    # CareerFront-specific student code
    # -----------------------------------------
    student_code = models.CharField(
        max_length=30,
        unique=True
    )

    first_name = models.CharField(
        max_length=100
    )

    last_name = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    grade_id = models.BigIntegerField()

    section_name = models.CharField(
        max_length=30,
        blank=True,
        null=True
    )

    email = models.EmailField(
        max_length=255,
        blank=True,
        null=True
    )

    mobile = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )

    parent_name = models.CharField(
        max_length=150,
        blank=True,
        null=True
    )

    parent_mobile = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )
    
    # -----------------------------------------
    # Authentication
    # -----------------------------------------

    password = models.CharField(
        max_length=128,
        blank=True,
        null=True
    )

    is_email_verified = models.BooleanField(
        default=False,
        blank=True,
        null=True
    )

    status = models.CharField(
        max_length=20,
        choices=(
            ("ACTIVE", "Active"),
            ("INACTIVE", "Inactive"),
        ),
        default="ACTIVE"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"{self.student_code} - {self.first_name}"
    
class StudentEmailOTP(models.Model):

    id = models.BigAutoField(
        primary_key=True
    )

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="email_otps"
    )

    otp = models.CharField(
        max_length=6
    )

    is_used = models.BooleanField(
        default=False
    )

    expires_at = models.DateTimeField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        db_table = "student_email_otps"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.student.student_code} - {self.otp}"
    
class StudentTestResponse(models.Model):
    
    SUBSECTION_STATUS_CHOICES = (
        ("IN_PROGRESS", "In Progress"),
        ("SUBMITTED", "Submitted"),
    )

    id = models.BigAutoField(
        primary_key=True
    )

    attempt_id = models.UUIDField(
        db_index=True
    )

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="test_responses"
    )

    assessment_id = models.BigIntegerField(
        db_index=True
    )

    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name="student_responses"
    )

    subsection = models.ForeignKey(
        AssessmentStructure,
        to_field="subsection_id",
        db_column="subsection_id",
        on_delete=models.PROTECT,
        related_name="student_test_responses"
    )

    selected_response_json = models.JSONField(
        blank=True,
        null=True
    )

    is_answered = models.BooleanField(
        default=False
    )

    is_correct = models.BooleanField(
        blank=True,
        null=True
    )

    marks_awarded = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        blank=True,
        null=True
    )

    subsection_started_at = models.DateTimeField(
        blank=True,
        null=True
    )

    subsection_completed_at = models.DateTimeField(
        blank=True,
        null=True
    )

    subsection_time_taken_seconds = models.IntegerField(
        blank=True,
        null=True
    )
    
    subsection_status = models.CharField(
        max_length=20,
        choices=SUBSECTION_STATUS_CHOICES,
        default="IN_PROGRESS",
        db_index=True
    )

    last_activity_at = models.DateTimeField(
        blank=True,
        null=True
    )

    answered_at = models.DateTimeField(
        blank=True,
        null=True
    )

    submitted_at = models.DateTimeField(
        blank=True,
        null=True
    )

    test_status = models.CharField(
        max_length=20,
        choices=(
            ("IN_PROGRESS", "In Progress"),
            ("COMPLETED", "Completed"),
        ),
        default="IN_PROGRESS"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "attempt_id",
                    "question"
                ],
                name="unique_question_per_attempt"
            )
        ]

    def __str__(self):
        return (
            f"{self.attempt_id} - "
            f"{self.student.student_code} - "
            f"{self.question.question_code}"
        )
