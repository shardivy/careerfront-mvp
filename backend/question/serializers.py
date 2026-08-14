from rest_framework import serializers

from question.models import Question


class QuestionSerializer(serializers.ModelSerializer):

    class Meta:
        model = Question

        fields = [
            "id",
            "question_code",
            "subsection_id",

            "question_type",
            "question_text",
            "question_image",

            "options_json",
            "option_image",

            "correct_answer_json",

            "marks",
            "negative_marks",
            "explanation",

            "display_order",
            "status",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "question_code",
            "created_at",
            "updated_at",
        ]