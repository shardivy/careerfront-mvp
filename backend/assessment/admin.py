from django.contrib import admin

from assessment.models import AssessmentStructure

@admin.register(AssessmentStructure)
class AssessmentStructureAdmin(admin.ModelAdmin):

    # -----------------------------------------
    # List View
    # -----------------------------------------
    list_display = (
        "id",
        "grade_id",
        "grade_name",
        "assessment_id",
        "assessment_code",
        "assessment_name",
        "section_id",
        "section_code",
        "section_name",
        "subsection_id",
        "subsection_code",
        "subsection_name",
        "section_display_order",
        "subsection_display_order",
        "time_limit_minutes",
        "status",
        "created_at",
    )

    # -----------------------------------------
    # Search
    # -----------------------------------------
    search_fields = (
        "grade_name",
        "assessment_code",
        "assessment_name",
        "section_code",
        "section_name",
        "subsection_code",
        "subsection_name",
    )

    # -----------------------------------------
    # Filters
    # -----------------------------------------
    list_filter = (
        "status",
        "grade_id",
        "assessment_id",
        "section_id",
        "time_limit_minutes",
    )

    # -----------------------------------------
    # Ordering
    # -----------------------------------------
    ordering = (
        # "grade_id",
        # "assessment_id",
        # "section_display_order",
        # "subsection_display_order",
        "-created_at",
    )

    # -----------------------------------------
    # Read-only fields
    # -----------------------------------------
    readonly_fields = (
        "created_at",
        "updated_at",
    )

    # -----------------------------------------
    # Form Fieldsets
    # -----------------------------------------
    fieldsets = (
        (
            "Grade",
            {
                "fields": (
                    "grade_id",
                    "grade_name",
                )
            },
        ),
        (
            "Assessment",
            {
                "fields": (
                    "assessment_id",
                    "assessment_code",
                    "assessment_name",
                    "assessment_description",
                )
            },
        ),
        (
            "Section",
            {
                "fields": (
                    "section_id",
                    "section_code",
                    "section_name",
                    "section_display_order",
                )
            },
        ),
        (
            "Subsection",
            {
                "fields": (
                    "subsection_id",
                    "subsection_code",
                    "subsection_name",
                    "subsection_description",
                    "subsection_display_order",
                )
            },
        ),
        (
            "Subsection Configuration",
            {
                "fields": (
                    "time_limit_minutes",
                    "instructions",
                )
            },
        ),
        (
            "Status",
            {
                "fields": (
                    "status",
                )
            },
        ),
        (
            "Timestamps",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                )
            },
        ),
    )

    # -----------------------------------------
    # Pagination
    # -----------------------------------------
    list_per_page = 25
