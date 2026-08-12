from django.urls import path


from assessment.views import AssessmentStructureCreateAPIView, SectionListAPIView, SectionWiseSubsectionListAPIView

urlpatterns = [
    path(
        "assessment-structure/create/",
        AssessmentStructureCreateAPIView.as_view(),
        name="assessment-structure-create",
    ),
    path(
        "sections/",
        SectionListAPIView.as_view(),
        name="section-list",
    ),
    path(
        "sections/<int:section_id>/subsections/",
        SectionWiseSubsectionListAPIView.as_view(),
        name="section-wise-subsection-list",
    ),
]