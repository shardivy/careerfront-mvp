from django.urls import path

from question.views import BulkQuestionCreateAPIView, QuestionAPIView, SubsectionQuestionsAPIView


urlpatterns = [

    # Create + List
    path(
        "questions/",
        QuestionAPIView.as_view(),
        name="question-list-create"
    ),

    # Detail
    path(
        "questions/<int:question_id>/",
        QuestionAPIView.as_view(),
        name="question-detail"
    ),
    path(
        "questions/bulk-create/",
        BulkQuestionCreateAPIView.as_view(),
        name="bulk-question-create"
    ),
    path(
        "subsections/<int:subsection_id>/questions/",
        SubsectionQuestionsAPIView.as_view(),
        name="subsection-questions"
    )
]