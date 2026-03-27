from django.urls import path
from .views import ViolationDetectionView

app_name = 'detection'

urlpatterns = [
    path('detect/', ViolationDetectionView.as_view(), name='violation-detection'),
]
