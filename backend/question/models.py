from django.db import models

class Question(models.Model):
    """
    Stores questions belonging to a subsection.
    """

    STATUS_CHOICES = (
        ("ACTIVE", "Active"),
        ("INACTIVE", "Inactive"),
    )

    QUESTION_TYPE_CHOICES = (
        ("SINGLE_CHOICE", "Single Choice"),
        ("MULTIPLE_CHOICE", "Multiple Choice"),
        ("TRUE_FALSE", "True / False"),
        ("TEXT", "Text"),
    )

    id = models.BigAutoField(primary_key=True)

    question_code = models.CharField(
        max_length=30,
        unique=True
    )

    # -----------------------------------------
    # Parent subsection
    # -----------------------------------------
    subsection_id = models.BigIntegerField()

    # -----------------------------------------
    # Question
    # -----------------------------------------
    question_type = models.CharField(
        max_length=30,
        choices=QUESTION_TYPE_CHOICES
    )

    question_text = models.TextField()

    question_image = models.FileField(
        upload_to="questions/",
        blank=True,
        null=True
    )

    # -----------------------------------------
    # Options
    # -----------------------------------------
    options_json = models.JSONField(
        blank=True,
        null=True
    )

    option_image = models.FileField(
        upload_to="question_options/",
        blank=True,
        null=True
    )

    # -----------------------------------------
    # Correct answer
    # -----------------------------------------
    correct_answer_json = models.JSONField(
        blank=True,
        null=True
    )

    # -----------------------------------------
    # Marks
    # -----------------------------------------
    marks = models.DecimalField(
        max_digits=6,
        decimal_places=2
    )

    negative_marks = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=0,
        blank=True,
        null=True
    )

    explanation = models.TextField(
        blank=True,
        null=True
    )

    # -----------------------------------------
    # Question order
    # -----------------------------------------
    display_order = models.IntegerField()

    # -----------------------------------------
    # Status
    # -----------------------------------------
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="ACTIVE"
    )

    # -----------------------------------------
    # Timestamps
    # -----------------------------------------
    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "questions"
        ordering = ["subsection_id", "display_order"]

        indexes = [
            models.Index(
                fields=["subsection_id"]
            ),
            models.Index(
                fields=["status"]
            ),
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "subsection_id",
                    "display_order"
                ],
                name="unique_question_order_per_subsection"
            )
        ]

    def __str__(self):
        return f"{self.question_code} - {self.question_text[:50]}"
