from django.db import models


class AssessmentStructure(models.Model):
    """
    Master assessment structure for MVP.

    Grade
        ↓
    Assessment
        ↓
    Section
        ↓
    Subsection
    """

    STATUS_CHOICES = (
        ("ACTIVE", "Active"),
        ("INACTIVE", "Inactive"),
    )

    id = models.BigAutoField(primary_key=True)

    # -----------------------------------------
    # Grade
    # -----------------------------------------
    grade_id = models.BigIntegerField()
    grade_name = models.CharField(max_length=50)

    # -----------------------------------------
    # Assessment
    # -----------------------------------------
    assessment_id = models.BigIntegerField()
    assessment_code = models.CharField(max_length=30)
    assessment_name = models.CharField(max_length=200)
    assessment_description = models.TextField(
        blank=True,
        null=True
    )

    # -----------------------------------------
    # Section
    # -----------------------------------------
    section_id = models.BigIntegerField()
    section_code = models.CharField(max_length=30)
    section_name = models.CharField(max_length=100)
    section_display_order = models.IntegerField()

    # -----------------------------------------
    # Subsection
    # -----------------------------------------
    subsection_id = models.BigIntegerField(unique=True)
    subsection_code = models.CharField(max_length=30)
    subsection_name = models.CharField(max_length=100)
    subsection_description = models.TextField(
        blank=True,
        null=True
    )

    subsection_display_order = models.IntegerField()

    # -----------------------------------------
    # Subsection configuration
    # -----------------------------------------
    time_limit_minutes = models.IntegerField(
        blank=True,
        null=True
    )

    instructions = models.TextField(
        blank=True,
        null=True
    )

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
        db_table = "assessment_structure"
        ordering = [
            "section_display_order",
            "subsection_display_order"
        ]

        indexes = [
            models.Index(
                fields=["grade_id"]
            ),
            models.Index(
                fields=["assessment_id"]
            ),
            models.Index(
                fields=["section_id"]
            ),
            models.Index(
                fields=["subsection_id"]
            ),
        ]

    def __str__(self):
        return (
            f"{self.assessment_name} - "
            f"{self.section_name} - "
            f"{self.subsection_name}"
        )
        
