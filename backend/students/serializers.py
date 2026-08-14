from rest_framework import serializers

from students.models import Student


class StudentSyncSerializer(serializers.ModelSerializer):

    class Meta:
        model = Student
        fields = [
            "global_student_id",
            "first_name",
            "last_name",
            "grade_id",
            "section_name",
            "email",
            "mobile",
            "parent_name",
            "parent_mobile",
        ]