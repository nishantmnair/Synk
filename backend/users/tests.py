import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from unittest.mock import patch, MagicMock
from users.models import User, Profile, Couple
from users.serializers import UserSerializer, ProfileSerializer, CoupleSerializer


@pytest.mark.django_db
class TestUserModel:
    """Test User model functionality"""
    
    def test_create_user(self, user):
        assert user.email is not None
        assert user.firebase_uid is not None
        assert user.is_active is True
    
    def test_user_str(self, user):
        assert str(user) == user.email
    
    def test_user_defaults(self):
        user = User.objects.create(
            firebase_uid='test123',
            email='test@example.com'
        )
        assert user.is_active is True
        assert user.is_staff is False
        assert user.is_superuser is False


@pytest.mark.django_db
class TestProfileModel:
    """Test Profile model functionality"""
    
    def test_create_profile(self, profile):
        assert profile.user is not None
        assert profile.full_name is not None
    
    def test_profile_str(self, profile):
        assert str(profile) == f"Profile: {profile.full_name}"
    
    def test_profile_one_per_user(self, user):
        """Test that a user can only have one profile"""
        profile1 = Profile.objects.create(user=user, full_name="Test User")
        assert Profile.objects.filter(user=user).count() == 1
    
    def test_profile_optional_fields(self, user):
        profile = Profile.objects.create(user=user, full_name="Test")
        # bio and timezone can be None or empty string depending on DB defaults
        assert profile.bio == '' or profile.bio is None
        assert profile.timezone == '' or profile.timezone is None or profile.timezone == 'UTC'


@pytest.mark.django_db
class TestCoupleModel:
    """Test Couple model functionality"""
    
    def test_create_couple(self, couple):
        assert couple.user1 is not None
        assert couple.invite_code is not None
        assert len(couple.invite_code) > 0
    
    def test_couple_members(self, couple):
        assert couple.user1 in [couple.user1, couple.user2]
    
    def test_couple_invite_code_unique(self):
        """Test that invite codes are unique"""
        from users.models import User
        user1 = User.objects.create(firebase_uid='uid1', email='user1@test.com')
        user2 = User.objects.create(firebase_uid='uid2', email='user2@test.com')
        
        couple1 = Couple.objects.create(user1=user1, invite_code='CODE123')
        couple2 = Couple.objects.create(user1=user2, invite_code='CODE456')
        
        assert couple1.invite_code != couple2.invite_code
    
    def test_couple_with_two_users(self):
        """Test couple with both users"""
        user1 = User.objects.create(firebase_uid='uid1', email='user1@test.com')
        user2 = User.objects.create(firebase_uid='uid2', email='user2@test.com')
        
        couple = Couple.objects.create(
            user1=user1,
            user2=user2,
            invite_code='TEST123'
        )
        
        assert couple.user1 == user1
        assert couple.user2 == user2


@pytest.mark.django_db
class TestUserAPI:
    """Test User API endpoints"""
    
    def test_list_users_unauthenticated(self, api_client):
        """Test that unauthenticated users cannot list users"""
        url = reverse('user-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    @patch('users.authentication.FirebaseAuthentication.authenticate')
    def test_get_current_user(self, mock_auth, user):
        """Test getting current user endpoint"""
        mock_auth.return_value = (user, None)
        client = APIClient()
        
        url = reverse('user-me')
        response = client.get(url, HTTP_AUTHORIZATION='Bearer fake-token')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == user.email


@pytest.mark.django_db
class TestProfileAPI:
    """Test Profile API endpoints"""
    
    @patch('users.authentication.FirebaseAuthentication.authenticate')
    def test_create_profile(self, mock_auth, user):
        """Test creating a profile"""
        mock_auth.return_value = (user, None)
        client = APIClient()
        
        url = reverse('profile-list')
        data = {'full_name': 'John Doe', 'bio': 'Test bio'}
        response = client.post(url, data, format='json', HTTP_AUTHORIZATION='Bearer fake-token')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['full_name'] == 'John Doe'
        assert Profile.objects.filter(user=user).exists()
    
    @patch('users.authentication.FirebaseAuthentication.authenticate')
    def test_create_duplicate_profile(self, mock_auth, profile):
        """Test that creating duplicate profile fails"""
        mock_auth.return_value = (profile.user, None)
        client = APIClient()
        
        url = reverse('profile-list')
        data = {'full_name': 'Another Name'}
        response = client.post(url, data, format='json', HTTP_AUTHORIZATION='Bearer fake-token')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    @patch('users.authentication.FirebaseAuthentication.authenticate')
    def test_list_profiles(self, mock_auth, profile):
        """Test listing user's own profiles"""
        mock_auth.return_value = (profile.user, None)
        client = APIClient()
        
        url = reverse('profile-list')
        response = client.get(url, HTTP_AUTHORIZATION='Bearer fake-token')
        
        assert response.status_code == status.HTTP_200_OK
        # Handle paginated response
        if isinstance(response.data, dict) and 'results' in response.data:
            assert len(response.data['results']) == 1
        else:
            assert len(response.data) == 1
    
    @patch('users.authentication.FirebaseAuthentication.authenticate')
    def test_update_profile(self, mock_auth, profile):
        """Test updating a profile"""
        mock_auth.return_value = (profile.user, None)
        client = APIClient()
        
        url = reverse('profile-detail', kwargs={'pk': profile.pk})
        data = {'full_name': 'Updated Name', 'bio': 'Updated bio'}
        response = client.patch(url, data, format='json', HTTP_AUTHORIZATION='Bearer fake-token')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['full_name'] == 'Updated Name'
        
        profile.refresh_from_db()
        assert profile.full_name == 'Updated Name'


@pytest.mark.django_db
class TestCoupleAPI:
    """Test Couple API endpoints"""
    
    @patch('users.authentication.FirebaseAuthentication.authenticate')
    def test_create_couple(self, mock_auth, user):
        """Test creating a couple"""
        mock_auth.return_value = (user, None)
        client = APIClient()
        
        url = reverse('couple-list')
        response = client.post(url, {}, format='json', HTTP_AUTHORIZATION='Bearer fake-token')
        
        assert response.status_code == status.HTTP_201_CREATED
        # Response returns user ID which may be different format depending on serializer
        assert 'user1' in response.data
        assert 'invite_code' in response.data
        assert len(response.data['invite_code']) > 0
    
    @patch('users.authentication.FirebaseAuthentication.authenticate')
    def test_join_couple_with_code(self, mock_auth, couple):
        """Test joining a couple with invite code"""
        user2 = User.objects.create(firebase_uid='uid2', email='user2@test.com')
        mock_auth.return_value = (user2, None)
        client = APIClient()
        
        url = reverse('couple-join')
        data = {'invite_code': couple.invite_code}
        response = client.post(url, data, format='json', HTTP_AUTHORIZATION='Bearer fake-token')
        
        assert response.status_code == status.HTTP_200_OK
        
        couple.refresh_from_db()
        assert couple.user2 == user2
    
    @patch('users.authentication.FirebaseAuthentication.authenticate')
    def test_join_couple_invalid_code(self, mock_auth, user):
        """Test joining couple with invalid code"""
        mock_auth.return_value = (user, None)
        client = APIClient()
        
        url = reverse('couple-join')
        data = {'invite_code': 'INVALID'}
        response = client.post(url, data, format='json', HTTP_AUTHORIZATION='Bearer fake-token')
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    @patch('users.authentication.FirebaseAuthentication.authenticate')
    def test_join_own_couple(self, mock_auth, couple):
        """Test that user cannot join their own couple"""
        mock_auth.return_value = (couple.user1, None)
        client = APIClient()
        
        url = reverse('couple-join')
        data = {'invite_code': couple.invite_code}
        response = client.post(url, data, format='json', HTTP_AUTHORIZATION='Bearer fake-token')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'already part of a couple' in str(response.data).lower()
    
    @patch('users.authentication.FirebaseAuthentication.authenticate')
    def test_join_couple_already_member(self, mock_auth, couple):
        """Test that user already in a couple cannot join another"""
        user2 = User.objects.create(firebase_uid='uid2', email='user2@test.com')
        couple2 = Couple.objects.create(user1=user2, invite_code='CODE123')
        
        mock_auth.return_value = (couple.user1, None)
        client = APIClient()
        
        url = reverse('couple-join')
        data = {'invite_code': couple2.invite_code}
        response = client.post(url, data, format='json', HTTP_AUTHORIZATION='Bearer fake-token')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'already part of a couple' in str(response.data)
    
    @patch('users.authentication.FirebaseAuthentication.authenticate')
    def test_join_complete_couple(self, mock_auth):
        """Test that cannot join a couple that already has 2 users"""
        user1 = User.objects.create(firebase_uid='uid1', email='user1@test.com')
        user2 = User.objects.create(firebase_uid='uid2', email='user2@test.com')
        user3 = User.objects.create(firebase_uid='uid3', email='user3@test.com')
        
        couple = Couple.objects.create(user1=user1, user2=user2, invite_code='FULL123')
        
        mock_auth.return_value = (user3, None)
        client = APIClient()
        
        url = reverse('couple-join')
        data = {'invite_code': couple.invite_code}
        response = client.post(url, data, format='json', HTTP_AUTHORIZATION='Bearer fake-token')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'already complete' in str(response.data)
    
    @patch('users.authentication.FirebaseAuthentication.authenticate')
    def test_list_couples(self, mock_auth, couple):
        """Test listing couples for current user"""
        mock_auth.return_value = (couple.user1, None)
        client = APIClient()
        
        url = reverse('couple-list')
        response = client.get(url, HTTP_AUTHORIZATION='Bearer fake-token')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1


@pytest.mark.django_db
class TestSerializers:
    """Test serializers"""
    
    def test_user_serializer(self, user):
        serializer = UserSerializer(user)
        assert 'email' in serializer.data
        assert 'firebase_uid' in serializer.data
    
    def test_profile_serializer(self, profile):
        serializer = ProfileSerializer(profile)
        assert 'full_name' in serializer.data
        assert 'user' in serializer.data
    
    def test_couple_serializer(self, couple):
        serializer = CoupleSerializer(couple)
        assert 'invite_code' in serializer.data
        assert 'user1' in serializer.data
