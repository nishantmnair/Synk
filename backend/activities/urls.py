from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SectionViewSet, ActivityViewSet, ActivityReminderViewSet

router = DefaultRouter()
router.register(r'sections', SectionViewSet)
router.register(r'activities', ActivityViewSet)
router.register(r'reminders', ActivityReminderViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
