from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, ProfileViewSet, CoupleViewSet, signup_with_email, signin_with_email

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'profiles', ProfileViewSet)
router.register(r'couples', CoupleViewSet)

urlpatterns = [
    path('auth/signup/', signup_with_email, name='signup'),
    path('auth/signin/', signin_with_email, name='signin'),
    path('', include(router.urls)),
]
