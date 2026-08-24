from django.urls import path

from students.views import StudentLoginAPIView, StudentRegisterAPIView, StudentSyncAPIView, StudentTestResponseAPIView, StudentVerifyEmailAPIView


urlpatterns = [
    
     path(
        "register/",
        StudentRegisterAPIView.as_view(),
        name="student-register"
    ),

    path(
        "verify-email/",
        StudentVerifyEmailAPIView.as_view(),
        name="student-verify-email"
    ),

    path(
        "login/",
        StudentLoginAPIView.as_view(),
        name="student-login"
    ),
    
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