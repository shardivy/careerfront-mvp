from rest_framework import serializers

from assessment.models import AssessmentStructure

class AssessmentStructureSerializer(serializers.ModelSerializer):

    class Meta:
        model = AssessmentStructure
        fields = [
            "id",

            # Grade
            "grade_id",
            "grade_name",

            # Assessment
            "assessment_id",
            "assessment_code",
            "assessment_name",
            "assessment_description",

            # Section
            "section_id",
            "section_code",
            "section_name",
            "section_display_order",

            # Subsection
            "subsection_id",
            "subsection_code",
            "subsection_name",
            "subsection_description",
            "subsection_display_order",

            # Configuration
            "time_limit_minutes",
            "instructions",

            # Status
            "status",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "grade_id",
            "assessment_id",
            "assessment_code",
            "section_id",
            "section_code",
            "subsection_id",
            "subsection_code",
            "created_at",
            "updated_at",
        ]
        
class SectionListSerializer(serializers.ModelSerializer):

    class Meta:
        model = AssessmentStructure
        fields = [
            "section_id",
            "section_code",
            "section_name",
            "section_display_order",
        ]
        
class SubsectionListSerializer(serializers.ModelSerializer):

    class Meta:
        model = AssessmentStructure
        fields = [
            "subsection_id",
            "subsection_code",
            "subsection_name",
            "subsection_description",
            "subsection_display_order",
            "time_limit_minutes",
            "instructions",
            "status",
        ]