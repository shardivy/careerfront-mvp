from django.contrib import admin

from students.models import Student, StudentTestResponse

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "student_code",
        "global_student_id",
        "first_name",
        "last_name",
        "grade_id",
        "section_name",
        "email",
        "mobile",
        "status",
        "created_at",
    )

    list_filter = (
        "status",
        "grade_id",
        "section_name",
        "created_at",
    )

    search_fields = (
        "student_code",
        "global_student_id",
        "first_name",
        "last_name",
        "email",
        "mobile",
        "parent_name",
        "parent_mobile",
    )

    readonly_fields = (
        "id",
        "created_at",
        "updated_at",
    )

    ordering = (
        "-created_at",
    )


@admin.register(StudentTestResponse)
class StudentTestResponseAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "attempt_id",
        "student",
        "assessment_id",
        "question",
        "subsection_id",
        "is_answered",
        "is_correct",
        "marks_awarded",
        "test_status",
        "last_activity_at",
        "submitted_at",
    )

    list_filter = (
        "test_status",
        "is_answered",
        "is_correct",
        "assessment_id",
        "subsection_id",
        "created_at",
    )

    search_fields = (
        "attempt_id",
        "student__student_code",
        "student__first_name",
        "student__last_name",
        "question__question_code",
    )

    readonly_fields = (
        "id",
        "created_at",
        "updated_at",
    )

    autocomplete_fields = (
        "student",
        "question",
    )

    ordering = (
        "-created_at",
    )

    list_per_page = 50
