"""
Tests for UC-010: User Data Persistence
Tests user registration, password hashing, email normalization, timestamps, UUID, and database constraints
"""
import pytest
import uuid
from django.contrib.auth.models import User
from django.utils import timezone
from django.contrib.auth.hashers import check_password
from rest_framework.test import APIClient
from rest_framework import status
from uuid import UUID
from django.urls import reverse

from api.models import UserProfile
from api.serializers import UserRegistrationSerializer, UserProfileSerializer


def unique_username(base='testuser'):
    """Generate a unique username"""
    return f"{base}_{uuid.uuid4().hex[:8]}"


def unique_email(base='test'):
    """Generate a unique email"""
    return f"{base}_{uuid.uuid4().hex[:8]}@example.com"


@pytest.mark.django_db
class TestUserDataPersistence:
    """Test user registration data persistence (UC-010)"""
    
    @pytest.fixture
    def api_client(self):
        """Create API client"""
        return APIClient()
    
    @pytest.fixture
    def registration_url(self):
        """Registration endpoint URL"""
        return reverse('register-list')
    
    # AC-1: User registration creates record in users table
    def test_user_registration_creates_user_record(self, api_client, registration_url):
        """Test that user registration creates a record in the users table"""
        username = unique_username()
        email = unique_email()
        
        registration_data = {
            'username': username,
            'email': email,
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'first_name': 'Test',
            'last_name': 'User'
        }
        
        response = api_client.post(registration_url, registration_data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(username=username).exists()
        user = User.objects.get(username=username)
        assert user.email == email
        assert user.first_name == 'Test'
        assert user.last_name == 'User'
    
    def test_user_registration_creates_userprofile(self, api_client, registration_url):
        """Test that user registration also creates a UserProfile record"""
        username = unique_username()
        email = unique_email()
        
        registration_data = {
            'username': username,
            'email': email,
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        }
        
        response = api_client.post(registration_url, registration_data)
        
        assert response.status_code == status.HTTP_201_CREATED
        user = User.objects.get(username=username)
        assert hasattr(user, 'profile')
        assert UserProfile.objects.filter(user=user).exists()
    
    # AC-2: Password stored as bcrypt hash, never plain text
    def test_password_stored_as_hash_not_plain_text(self, api_client, registration_url):
        """Test that passwords are stored as hashes, not plain text"""
        username = unique_username()
        email = unique_email()
        plain_password = 'SecurePass123!'
        registration_data = {
            'username': username,
            'email': email,
            'password': plain_password,
            'password_confirm': plain_password
        }
        
        response = api_client.post(registration_url, registration_data)
        
        assert response.status_code == status.HTTP_201_CREATED
        user = User.objects.get(username=username)
        
        # Password should NOT be plain text
        assert user.password != plain_password
        # Password should be a hash
        assert user.password.startswith('pbkdf2_sha256$')
        # Hash verification should work
        assert check_password(plain_password, user.password)
    
    def test_password_hash_verification(self):
        """Test that bcrypt/PBKDF2 password hashing works correctly"""
        user = User.objects.create_user(
            username=unique_username(),
            email=unique_email(),
            password='TestPass123'
        )
        
        # Correct password should verify
        assert check_password('TestPass123', user.password)
        # Wrong password should not verify
        assert not check_password('WrongPass', user.password)
    
    # AC-3: Email addresses stored in lowercase for consistency
    def test_email_stored_in_lowercase(self, api_client, registration_url):
        """Test that email is stored in lowercase"""
        username = unique_username()
        email_upper = 'TestEmail@EXAMPLE.COM'
        registration_data = {
            'username': username,
            'email': email_upper,
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        }
        
        response = api_client.post(registration_url, registration_data)
        
        assert response.status_code == status.HTTP_201_CREATED
        user = User.objects.get(username=username)
        assert user.email == 'testemail@example.com'
    
    def test_email_normalized_in_profile(self):
        """Test that email is normalized to lowercase in UserProfile"""
        user = User.objects.create_user(
            username=unique_username(),
            email='ProfiLe@Example.COM',
            password='SecurePass123!'
        )
        
        profile = UserProfile.objects.get(user=user)
        assert profile.email_normalized == 'profile@example.com'
    
    # AC-4: Created_at and updated_at timestamps automatically maintained
    def test_created_at_timestamp_set(self, api_client, registration_url):
        """Test that created_at timestamp is automatically set on registration"""
        username = unique_username()
        email = unique_email()
        before_registration = timezone.now()
        
        registration_data = {
            'username': username,
            'email': email,
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        }
        
        response = api_client.post(registration_url, registration_data)
        
        after_registration = timezone.now()
        assert response.status_code == status.HTTP_201_CREATED
        
        user = User.objects.get(username=username)
        profile = user.profile
        
        assert profile.created_at is not None
        assert before_registration <= profile.created_at <= after_registration
    
    def test_updated_at_timestamp_set(self):
        """Test that updated_at timestamp is automatically set"""
        user = User.objects.create_user(
            username=unique_username(),
            email=unique_email(),
            password='SecurePass123!'
        )
        
        profile = user.profile
        assert profile.updated_at is not None
        
        # Update the profile
        original_updated_at = profile.updated_at
        profile.save()
        profile.refresh_from_db()
        
        assert profile.updated_at >= original_updated_at
    
    def test_timestamps_persist_across_sessions(self):
        """Test that timestamps persist across sessions (database persistence)"""
        user = User.objects.create_user(
            username=unique_username(),
            email=unique_email(),
            password='SecurePass123!'
        )
        
        original_profile = user.profile
        original_created_at = original_profile.created_at
        original_updated_at = original_profile.updated_at
        
        # Simulate a new session by retrieving from database
        retrieved_user = User.objects.get(username=user.username)
        retrieved_profile = retrieved_user.profile
        
        # Timestamps should be identical
        assert retrieved_profile.created_at == original_created_at
        assert retrieved_profile.updated_at == original_updated_at
    
    # AC-5: User IDs are UUID format for security
    def test_user_profile_has_uuid(self, api_client, registration_url):
        """Test that UserProfile has a UUID field"""
        username = unique_username()
        email = unique_email()
        registration_data = {
            'username': username,
            'email': email,
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        }
        
        response = api_client.post(registration_url, registration_data)
        
        assert response.status_code == status.HTTP_201_CREATED
        user = User.objects.get(username=username)
        profile = user.profile
        
        # Should have a UUID
        assert hasattr(profile, 'id_uuid')
        assert profile.id_uuid is not None
        # Should be a valid UUID
        assert isinstance(profile.id_uuid, UUID)
    
    def test_uuid_is_unique(self):
        """Test that each UserProfile has a unique UUID"""
        user1 = User.objects.create_user(
            username=unique_username(),
            email=unique_email(),
            password='SecurePass123!'
        )
        
        user2 = User.objects.create_user(
            username=unique_username(),
            email=unique_email(),
            password='SecurePass123!'
        )
        
        assert user1.profile.id_uuid != user2.profile.id_uuid
    
    def test_uuid_is_stable_across_sessions(self):
        """Test that UUID persists and doesn't change across sessions"""
        user = User.objects.create_user(
            username=unique_username(),
            email=unique_email(),
            password='SecurePass123!'
        )
        
        original_uuid = user.profile.id_uuid
        
        # Retrieve from database again
        retrieved_user = User.objects.get(username=user.username)
        
        assert retrieved_user.profile.id_uuid == original_uuid
    
    # AC-6: Database constraints prevent duplicate emails
    def test_duplicate_email_constraint(self, api_client, registration_url):
        """Test that database constraint prevents duplicate emails"""
        username1 = unique_username()
        username2 = unique_username()
        email = unique_email()
        
        registration_data = {
            'username': username1,
            'email': email,
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        }
        
        # First registration should succeed
        response1 = api_client.post(registration_url, registration_data)
        assert response1.status_code == status.HTTP_201_CREATED
        
        # Second registration with same email should fail
        registration_data['username'] = username2
        response2 = api_client.post(registration_url, registration_data)
        
        assert response2.status_code == status.HTTP_400_BAD_REQUEST
        # Error response has new standardized format with 'errors' key
        assert 'errors' in response2.data and 'email' in response2.data['errors']
    
    def test_case_insensitive_email_duplicate_check(self, api_client, registration_url):
        """Test that duplicate check is case-insensitive"""
        username1 = unique_username()
        username2 = unique_username()
        email_base = unique_email()
        
        registration_data = {
            'username': username1,
            'email': email_base,
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        }
        
        response1 = api_client.post(registration_url, registration_data)
        assert response1.status_code == status.HTTP_201_CREATED
        
        # Try with different case
        registration_data['username'] = username2
        registration_data['email'] = email_base.upper()
        response2 = api_client.post(registration_url, registration_data)
        
        assert response2.status_code == status.HTTP_400_BAD_REQUEST
    
    # AC-7: Profile data properly linked to user accounts
    def test_userprofile_linked_to_user(self, api_client, registration_url):
        """Test that UserProfile is properly linked to User account"""
        username = unique_username()
        email = unique_email()
        
        registration_data = {
            'username': username,
            'email': email,
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'first_name': 'Linked',
            'last_name': 'User'
        }
        
        response = api_client.post(registration_url, registration_data)
        
        assert response.status_code == status.HTTP_201_CREATED
        user = User.objects.get(username=username)
        profile = user.profile
        
        # Profile should be properly linked
        assert profile.user == user
        assert profile.email_normalized == user.email.lower()
    
    def test_user_profile_cascade_delete(self):
        """Test that UserProfile is deleted when User is deleted"""
        user = User.objects.create_user(
            username=unique_username(),
            email=unique_email(),
            password='SecurePass123!'
        )
        
        profile_id = user.profile.id
        
        # Delete user
        user.delete()
        
        # Profile should also be deleted
        assert not UserProfile.objects.filter(id=profile_id).exists()
    
    # Serializer tests
    def test_user_registration_serializer_creates_profile(self):
        """Test that UserRegistrationSerializer creates UserProfile"""
        username = unique_username()
        email = unique_email()
        
        serializer = UserRegistrationSerializer(data={
            'username': username,
            'email': email,
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        })
        
        assert serializer.is_valid()
        user = serializer.save()
        
        assert hasattr(user, 'profile')
        assert UserProfile.objects.filter(user=user).exists()
    
    def test_user_profile_serializer(self):
        """Test that UserProfileSerializer properly serializes profile data"""
        user = User.objects.create_user(
            username=unique_username(),
            email=unique_email(),
            password='SecurePass123!'
        )
        
        serializer = UserProfileSerializer(user.profile)
        data = serializer.data
        
        assert 'id_uuid' in data
        assert 'user' in data
        assert 'email_normalized' in data
        assert 'created_at' in data
        assert 'updated_at' in data
        assert str(user.profile.id_uuid) == str(data['id_uuid'])
    
    # AC-8: Frontend Verification - Register, logout, login, verify persistence
    def test_user_data_persists_across_login_sessions(self, api_client, registration_url):
        """Test that user data persists across login/logout sessions"""
        username = unique_username()
        email = unique_email()
        
        # Register user
        registration_data = {
            'username': username,
            'email': email,
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'first_name': 'Session',
            'last_name': 'Test'
        }
        
        response = api_client.post(registration_url, registration_data)
        assert response.status_code == status.HTTP_201_CREATED
        
        # Get token for login
        token_response = api_client.post('/api/token/', {
            'username': username,
            'password': 'SecurePass123!'
        })
        assert token_response.status_code == status.HTTP_200_OK
        
        # Verify user data
        user = User.objects.get(username=username)
        assert user.email == email
        assert user.first_name == 'Session'
        assert user.last_name == 'Test'
        assert user.profile.email_normalized == email.lower()
        assert user.profile.id_uuid is not None
    
    def test_registration_response_includes_profile_data(self, api_client, registration_url):
        """Test that registration response includes profile UUID"""
        username = unique_username()
        email = unique_email()
        
        registration_data = {
            'username': username,
            'email': email,
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        }
        
        response = api_client.post(registration_url, registration_data)
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        
        # Response should have 'data' field with user info
        assert 'data' in data
        assert 'id' in data['data']
        
        # Verify profile was created
        user = User.objects.get(username=username)
        assert user.profile is not None
    
    def test_empty_optional_fields_handled(self, api_client, registration_url):
        """Test that empty optional fields (first_name, last_name) are handled correctly"""
        username = unique_username()
        email = unique_email()
        
        registration_data = {
            'username': username,
            'email': email,
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'first_name': '',
            'last_name': ''
        }
        
        response = api_client.post(registration_url, registration_data)
        
        assert response.status_code == status.HTTP_201_CREATED
        user = User.objects.get(username=username)
        assert user.first_name == ''
        assert user.last_name == ''
        assert user.profile is not None
