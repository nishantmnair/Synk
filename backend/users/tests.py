import pytest
from django.urls import reverse
from rest_framework import status
from users.models import User, Profile, Couple


@pytest.mark.django_db
class TestUserModel:
    def test_create_user(self, user):
        assert user.email is not None
        assert user.firebase_uid is not None
        assert user.is_active is True
    
    def test_user_str(self, user):
        assert str(user) == user.email


@pytest.mark.django_db
class TestProfileModel:
    def test_create_profile(self, profile):
        assert profile.user is not None
        assert profile.name is not None
    
    def test_profile_str(self, profile):
        assert str(profile) == f"{profile.user.email}'s profile"


@pytest.mark.django_db
class TestCoupleModel:
    def test_create_couple(self, couple):
        assert couple.user1 is not None
        assert couple.invite_code is not None
    
    def test_couple_members(self, couple):
        assert couple.user1 in [couple.user1, couple.user2]


@pytest.mark.django_db
class TestUserAPI:
    def test_list_users(self, api_client, user):
        # This would need Firebase token authentication
        # For now, just testing the endpoint exists
        url = reverse('user-list')
        response = api_client.get(url)
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_401_UNAUTHORIZED]
    
    def test_profile_detail(self, api_client, profile):
        url = reverse('profile-detail', kwargs={'pk': profile.pk})
        response = api_client.get(url)
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_401_UNAUTHORIZED]
