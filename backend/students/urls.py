from django.urls import path

from students.views import BulkStudentTestResponseAPIView, StudentSyncAPIView


urlpatterns = [
    path(
        "student/sync/",
        StudentSyncAPIView.as_view(),
        name="student-sync"
    ),
    path(
        "student-test-responses/bulk/",
        BulkStudentTestResponseAPIView.as_view(),
        name="student-test-responses-bulk"
    ),
]