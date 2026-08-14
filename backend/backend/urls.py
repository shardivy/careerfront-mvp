from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/assessment/', include('assessment.urls')),
    path('api/question/', include('question.urls')),
    path('api/students/', include('students.urls')),
    
]
