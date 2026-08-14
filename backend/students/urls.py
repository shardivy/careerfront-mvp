from django.urls import path

from students.views import StudentSyncAPIView


urlpatterns = [
    path(
        "student/sync/",
        StudentSyncAPIView.as_view(),
        name="student-sync"
    ),
]