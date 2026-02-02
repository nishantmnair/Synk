from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TaskViewSet, MilestoneViewSet, ActivityViewSet,
    SuggestionViewSet, CollectionViewSet, UserPreferencesViewSet,
    UserViewSet, UserRegistrationViewSet, CoupleViewSet, CouplingCodeViewSet,
)

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'milestones', MilestoneViewSet, basename='milestone')
router.register(r'activities', ActivityViewSet, basename='activity')
router.register(r'suggestions', SuggestionViewSet, basename='suggestion')
router.register(r'collections', CollectionViewSet, basename='collection')
router.register(r'preferences', UserPreferencesViewSet, basename='preferences')
router.register(r'users', UserViewSet, basename='user')
router.register(r'register', UserRegistrationViewSet, basename='register')
router.register(r'couple', CoupleViewSet, basename='couple')
router.register(r'coupling-codes', CouplingCodeViewSet, basename='coupling-code')

urlpatterns = [
    path('', include(router.urls)),
]
