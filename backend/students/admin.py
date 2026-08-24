import json

from django.contrib import admin
from django.http import HttpResponse
import openpyxl
from django.utils import timezone

from students.models import Student, StudentEmailOTP, StudentTestResponse
from assessment.models import AssessmentStructure

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
    
@admin.register(StudentEmailOTP)
class StudentEmailOTPAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "student",
        "otp",
        "is_used",
        "expires_at",
        "created_at",
    )

    list_filter = (
        "is_used",
        "expires_at",
        "created_at",
    )

    search_fields = (
        "student__student_code",
        "student__first_name",
        "student__last_name",
        "student__email",
        "otp",
    )

    readonly_fields = (
        "created_at",
    )

    ordering = (
        "-created_at",
    )


# @admin.register(StudentTestResponse)
# class StudentTestResponseAdmin(admin.ModelAdmin):

#     list_display = (
#         "id",
#         "attempt_id",
#         "student",
#         "assessment_id",
#         "question",
#         "subsection_id",
#         "is_answered",
#         "is_correct",
#         "marks_awarded",
#         "test_status",
#         "last_activity_at",
#         "submitted_at",
#     )

#     list_filter = (
#         "test_status",
#         "is_answered",
#         "is_correct",
#         "assessment_id",
#         "subsection_id",
#         "created_at",
#     )

#     search_fields = (
#         "attempt_id",
#         "student__student_code",
#         "student__first_name",
#         "student__last_name",
#         "question__question_code",
#     )

#     readonly_fields = (
#         "id",
#         "created_at",
#         "updated_at",
#     )

#     autocomplete_fields = (
#         "student",
#         "question",
#     )

#     ordering = (
#         "-created_at",
#     )

#     list_per_page = 50



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

    actions = [
        "export_to_excel",
    ]

    @admin.action(description="Export to Excel")
    def export_to_excel(self, request, queryset):

        def excel_datetime(value):
            if value and timezone.is_aware(value):
                return timezone.make_naive(value)
            return value

        # =====================================================
        # FETCH STUDENT + QUESTION
        # =====================================================

        queryset = queryset.select_related(
            "student",
            "question",
        )

        # =====================================================
        # FETCH SUBSECTION NAMES FROM ASSESSMENT STRUCTURE
        # =====================================================

        subsection_ids = queryset.values_list(
            "subsection_id",
            flat=True
        ).distinct()

        subsection_map = {
            obj.subsection_id: obj.subsection_name
            for obj in AssessmentStructure.objects.filter(
                subsection_id__in=subsection_ids
            ).only(
                "subsection_id",
                "subsection_name",
            )
        }

        # =====================================================
        # WORKBOOK
        # =====================================================

        workbook = openpyxl.Workbook()
        worksheet = workbook.active
        worksheet.title = "Student Test Responses"

        # =====================================================
        # HEADERS
        # =====================================================

        worksheet.append([
            "ID",
            "Attempt ID",
            "Student Code",
            "Student Name",
            "Assessment ID",
            "Question Code",
            "Question",
            "Subsection ID",
            "Subsection Name",
            "Selected Response",
            "Is Answered",
            "Is Correct",
            "Marks Awarded",
            "Test Status",
            "Last Activity At",
            "Submitted At",
            "Created At",
        ])

        # =====================================================
        # DATA
        # =====================================================

        for obj in queryset:

            student_code = ""
            student_name = ""

            question_code = ""
            question_text = ""

            # =================================================
            # STUDENT
            # =================================================

            if obj.student:

                student_code = (
                    obj.student.student_code or ""
                )

                student_name = (
                    f"{obj.student.first_name or ''} "
                    f"{obj.student.last_name or ''}"
                ).strip()

            # =================================================
            # QUESTION
            # =================================================

            if obj.question:

                question_code = (
                    obj.question.question_code or ""
                )

                question_text = (
                    obj.question.question_text or ""
                )

            # =================================================
            # SUBSECTION
            # =================================================

            subsection_name = subsection_map.get(
                obj.subsection_id,
                ""
            )

            # =================================================
            # SELECTED RESPONSE JSON
            # =================================================

            if obj.selected_response_json is not None:

                selected_response = json.dumps(
                    obj.selected_response_json,
                    ensure_ascii=False
                )

            else:

                selected_response = ""

            # =================================================
            # EXCEL ROW
            # =================================================

            worksheet.append([
                obj.id,

                str(obj.attempt_id)
                if obj.attempt_id
                else "",

                student_code,
                student_name,

                obj.assessment_id,

                # Question Code
                question_code,

                # Actual Question
                question_text,

                # Subsection ID
                obj.subsection_id,

                # Subsection Name
                subsection_name,

                # Selected Response
                selected_response,

                obj.is_answered,
                obj.is_correct,
                obj.marks_awarded,
                obj.test_status,

                excel_datetime(
                    obj.last_activity_at
                ),

                excel_datetime(
                    obj.submitted_at
                ),

                excel_datetime(
                    obj.created_at
                ),
            ])

        # =====================================================
        # AUTO COLUMN WIDTH
        # =====================================================

        for column in worksheet.columns:

            max_length = 0
            column_letter = column[0].column_letter

            for cell in column:

                if cell.value is not None:

                    max_length = max(
                        max_length,
                        len(str(cell.value))
                    )

            worksheet.column_dimensions[
                column_letter
            ].width = min(
                max_length + 2,
                80
            )

        # =====================================================
        # RESPONSE
        # =====================================================

        response = HttpResponse(
            content_type=(
                "application/vnd.openxmlformats-officedocument."
                "spreadsheetml.sheet"
            )
        )

        response["Content-Disposition"] = (
            'attachment; filename="student_test_responses.xlsx"'
        )

        workbook.save(response)

        return response