from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TaskViewSet, MilestoneViewSet, ActivityViewSet,
    SuggestionViewSet, CollectionViewSet, UserPreferencesViewSet,
    UserViewSet, UserRegistrationViewSet, CoupleViewSet, CouplingCodeViewSet,
    PlanDateView, ProTipView, DailyPromptView,
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
    # AI helper endpoints
    path('ai/plan-date/', PlanDateView.as_view(), name='ai-plan-date'),
    path('ai/pro-tip/', ProTipView.as_view(), name='ai-pro-tip'),
    path('ai/daily-prompt/', DailyPromptView.as_view(), name='ai-daily-prompt'),
]
