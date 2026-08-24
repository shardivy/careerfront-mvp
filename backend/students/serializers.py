from rest_framework import serializers

from question.models import Question
from students.models import Student


class StudentSyncSerializer(serializers.ModelSerializer):

    grade_name = serializers.CharField(
        write_only=True,
        required=True
    )

    class Meta:
        model = Student
        fields = [
            "global_student_id",
            "first_name",
            "last_name",
            "grade_name",
            "section_name",
            "email",
            "mobile",
            "parent_name",
            "parent_mobile",
        ]

    def create(self, validated_data):

        # Remove grade_name because Student model
        # does not contain this field
        validated_data.pop("grade_name", None)

        return Student.objects.create(**validated_data)

    def update(self, instance, validated_data):

        # Remove grade_name because it is handled
        # separately in StudentSyncAPIView
        validated_data.pop("grade_name", None)

        return super().update(instance, validated_data)
        
class StudentAnswerSerializer(serializers.Serializer):

    question_id = serializers.IntegerField()

    selected_response_json = serializers.JSONField(
        required=False,
        allow_null=True
    )

    is_answered = serializers.BooleanField(
        default=False
    )


class BulkStudentTestResponseSerializer(serializers.Serializer):

    attempt_id = serializers.UUIDField()

    student_id = serializers.IntegerField()

    assessment_id = serializers.IntegerField()

    subsection_id = serializers.IntegerField()

    answers = StudentAnswerSerializer(
        many=True
    )

    def validate(self, attrs):

        # -----------------------------------------
        # Validate student
        # -----------------------------------------

        try:
            student = Student.objects.get(
                id=attrs["student_id"],
                status="ACTIVE"
            )
        except Student.DoesNotExist:
            raise serializers.ValidationError({
                "student_id": "Active student not found."
            })

        attrs["student"] = student

        # -----------------------------------------
        # Validate questions
        # -----------------------------------------

        question_ids = [
            answer["question_id"]
            for answer in attrs["answers"]
        ]

        questions = Question.objects.filter(
            id__in=question_ids,
            status="ACTIVE"
        )

        question_map = {
            question.id: question
            for question in questions
        }

        errors = []

        for answer in attrs["answers"]:

            question_id = answer["question_id"]

            if question_id not in question_map:
                errors.append(
                    f"Question {question_id} not found."
                )
                continue

            question = question_map[question_id]

            # -----------------------------------------
            # Question must belong to subsection
            # -----------------------------------------

            if question.subsection_id != attrs["subsection_id"]:
                errors.append(
                    f"Question {question_id} does not "
                    f"belong to subsection "
                    f"{attrs['subsection_id']}."
                )

        if errors:
            raise serializers.ValidationError({
                "answers": errors
            })

        attrs["question_map"] = question_map

        return attrs