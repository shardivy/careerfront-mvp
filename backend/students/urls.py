from django.urls import path

from students.views import StudentSyncAPIView, StudentTestResponseAPIView


urlpatterns = [
    path(
        "student/sync/",
        StudentSyncAPIView.as_view(),
        name="student-sync"
    ),
    path(
        "student-test-responses/",
        StudentTestResponseAPIView.as_view(),
        name="student-test-responses-bulk"
    ),
]