from django.contrib import admin

from question.models import Question

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):

    # -------------------------------------------------
    # List View
    # -------------------------------------------------

    list_display = (
        "id",
        "question_code",
        "subsection_id",
        "question_type",
        "question_text_short",
        "marks",
        "negative_marks",
        "display_order",
        "status",
        "created_at",
        "updated_at",
    )

    # -------------------------------------------------
    # Filters
    # -------------------------------------------------

    list_filter = (
        "question_type",
        "status",
        "subsection_id",
        "created_at",
        "updated_at",
    )

    # -------------------------------------------------
    # Search
    # -------------------------------------------------

    search_fields = (
        "question_code",
        "question_text",
        "subsection_id",
    )

    # -------------------------------------------------
    # Ordering
    # -------------------------------------------------

    ordering = (
        # "subsection_id",
        # "display_order",
        "-created_at",
    )

    # -------------------------------------------------
    # Read Only Fields
    # -------------------------------------------------

    readonly_fields = (
        "id",
        "question_code",
        "created_at",
        "updated_at",
    )

    # -------------------------------------------------
    # Form Layout
    # -------------------------------------------------

    fieldsets = (

        (
            "Question Information",
            {
                "fields": (
                    "id",
                    "question_code",
                    "subsection_id",
                    "question_type",
                    "question_text",
                    "question_image",
                )
            },
        ),

        (
            "Options",
            {
                "fields": (
                    "options_json",
                    "option_image",
                    "correct_answer_json",
                )
            },
        ),

        (
            "Marks & Explanation",
            {
                "fields": (
                    "marks",
                    "negative_marks",
                    "explanation",
                )
            },
        ),

        (
            "Question Order & Status",
            {
                "fields": (
                    "display_order",
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

    # -------------------------------------------------
    # Custom Display
    # -------------------------------------------------

    @admin.display(description="Question")
    def question_text_short(self, obj):
        if len(obj.question_text) > 80:
            return f"{obj.question_text[:80]}..."
        return obj.question_text
