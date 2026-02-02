"""
Tests for authentication endpoints and user API endpoints (UC-011)
Tests for:
- POST /api/auth/register - User registration
- POST /api/token/ - User login (SimpleJWT)
- GET /api/users/me - Get current user profile
- PUT /api/users/me - Update current user profile
- POST /api/auth/logout - User logout
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from api.models import UserProfile, Couple, CouplingCode
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


@pytest.mark.django_db
class TestUserRegistration:
    """Test POST /api/auth/register endpoint"""
    
    def setup_method(self):
        """Setup test client"""
        self.client = APIClient()
    
    def test_register_new_user_success(self):
        """Test successful user registration with all fields"""
        response = self.client.post('/api/register/', {
            'username': 'newuser1',
            'email': 'newuser1@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'first_name': 'John',
            'last_name': 'Doe'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['status'] == 'success'
        assert response.data['message'] == 'User account created successfully.'
        assert 'data' in response.data
        assert response.data['data']['username'] == 'newuser1'
        assert response.data['data']['email'] == 'newuser1@example.com'
        assert response.data['data']['first_name'] == 'John'
        
        # Verify user was created in database
        user = User.objects.get(username='newuser1')
        assert user.email == 'newuser1@example.com'
        assert user.first_name == 'John'
        assert user.last_name == 'Doe'
        
        # Verify UserProfile was created via signal
        assert UserProfile.objects.filter(user=user).exists()
    
    def test_register_minimal_fields(self):
        """Test registration with minimal required fields"""
        response = self.client.post('/api/register/', {
            'username': 'minimaluser',
            'email': 'minimal@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['status'] == 'success'
        assert response.data['data']['username'] == 'minimaluser'
        assert response.data['data']['first_name'] == ''
        assert response.data['data']['last_name'] == ''
    
    def test_register_missing_username(self):
        """Test registration fails with missing username"""
        response = self.client.post('/api/register/', {
            'email': 'test@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['status'] == 'error'
        assert 'errors' in response.data
        assert 'username' in response.data['errors']
    
    def test_register_missing_email(self):
        """Test registration fails with missing email"""
        response = self.client.post('/api/register/', {
            'username': 'testuser',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['status'] == 'error'
        assert 'email' in response.data['errors']
    
    def test_register_missing_password(self):
        """Test registration fails with missing password"""
        response = self.client.post('/api/register/', {
            'username': 'testuser',
            'email': 'test@example.com',
            'password_confirm': 'SecurePass123!'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['status'] == 'error'
    
    def test_register_passwords_mismatch(self):
        """Test registration fails when passwords don't match"""
        response = self.client.post('/api/register/', {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'DifferentPass123!'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['status'] == 'error'
        assert 'password' in response.data['errors']
    
    def test_register_short_password(self):
        """Test registration fails with password too short"""
        response = self.client.post('/api/register/', {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'Short1!',
            'password_confirm': 'Short1!'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['status'] == 'error'
        assert 'password' in response.data['errors']
    
    def test_register_duplicate_email(self):
        """Test registration fails with existing email"""
        # Create first user
        User.objects.create_user(
            username='user1',
            email='duplicate@example.com',
            password='SecurePass123!'
        )
        
        # Try to register with same email
        response = self.client.post('/api/register/', {
            'username': 'user2',
            'email': 'duplicate@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['status'] == 'error'
        assert 'email' in response.data['errors']
    
    def test_register_duplicate_username(self):
        """Test registration fails with existing username"""
        User.objects.create_user(
            username='existinguser',
            email='existing@example.com',
            password='SecurePass123!'
        )
        
        response = self.client.post('/api/register/', {
            'username': 'existinguser',
            'email': 'new@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['status'] == 'error'
        assert 'username' in response.data['errors']
    
    def test_register_with_coupling_code_valid(self):
        """Test registration with valid coupling code"""
        # Create a user with a coupling code
        user1 = User.objects.create_user(
            username='user1',
            email='user1@example.com',
            password='SecurePass123!'
        )
        
        # Create valid coupling code
        coupling_code = CouplingCode.objects.create(
            created_by=user1,
            code='TESTCODE123',
            expires_at=timezone.now() + timedelta(hours=24)
        )
        
        # Register with coupling code
        response = self.client.post('/api/register/', {
            'username': 'user2',
            'email': 'user2@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'coupling_code': 'TESTCODE123'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        
        # Verify users are coupled
        user2 = User.objects.get(username='user2')
        couple = Couple.objects.get(user1=user1, user2=user2)
        assert couple is not None
        
        # Verify code was marked as used
        coupling_code.refresh_from_db()
        assert coupling_code.used_by == user2
        assert coupling_code.used_at is not None
    
    def test_register_with_invalid_coupling_code(self):
        """Test registration with invalid coupling code (should still create user)"""
        response = self.client.post('/api/register/', {
            'username': 'user1',
            'email': 'user1@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'coupling_code': 'INVALIDCODE'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        # User is created even if code is invalid
        user = User.objects.get(username='user1')
        assert user is not None
    
    def test_register_with_expired_coupling_code(self):
        """Test registration with expired coupling code"""
        user1 = User.objects.create_user(
            username='user1',
            email='user1@example.com',
            password='SecurePass123!'
        )
        
        # Create expired coupling code
        CouplingCode.objects.create(
            created_by=user1,
            code='EXPIREDCODE',
            expires_at=timezone.now() - timedelta(hours=1)
        )
        
        # Try to register with expired code
        response = self.client.post('/api/register/', {
            'username': 'user2',
            'email': 'user2@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'coupling_code': 'EXPIREDCODE'
        })
        
        # User is created but not coupled
        assert response.status_code == status.HTTP_201_CREATED
        user2 = User.objects.get(username='user2')
        assert not Couple.objects.filter(user2=user2).exists()


@pytest.mark.django_db
class TestUserLogin:
    """Test POST /api/token/ endpoint (SimpleJWT login)"""
    
    def setup_method(self):
        """Setup test client and user"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!'
        )
    
    def test_login_success(self):
        """Test successful login"""
        response = self.client.post('/api/token/', {
            'username': 'testuser',
            'password': 'TestPass123!'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
        # SimpleJWT returns tokens, not our custom format
    
    def test_login_invalid_username(self):
        """Test login fails with invalid username"""
        response = self.client.post('/api/token/', {
            'username': 'nonexistent',
            'password': 'TestPass123!'
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_login_invalid_password(self):
        """Test login fails with invalid password"""
        response = self.client.post('/api/token/', {
            'username': 'testuser',
            'password': 'WrongPassword123!'
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_login_missing_credentials(self):
        """Test login fails with missing fields"""
        response = self.client.post('/api/token/', {
            'username': 'testuser'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestGetCurrentUserProfile:
    """Test GET /api/users/me/ endpoint"""
    
    def setup_method(self):
        """Setup test client and user"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!',
            first_name='Test',
            last_name='User'
        )
        
        # Get tokens
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
    
    def test_get_profile_success(self):
        """Test successful retrieval of user profile"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get('/api/users/me/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'success'
        assert response.data['message'] == 'User profile retrieved successfully.'
        
        data = response.data['data']
        assert data['username'] == 'testuser'
        assert data['email'] == 'test@example.com'
        assert data['first_name'] == 'Test'
        assert data['last_name'] == 'User'
        
        # Verify nested profile data
        assert 'profile' in data
        assert data['profile']['email_normalized'] == 'test@example.com'
    
    def test_get_profile_unauthorized(self):
        """Test get profile fails without authentication"""
        response = self.client.get('/api/users/me/')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_get_profile_invalid_token(self):
        """Test get profile fails with invalid token"""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid_token')
        response = self.client.get('/api/users/me/')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestUpdateUserProfile:
    """Test PUT /api/users/me/ endpoint"""
    
    def setup_method(self):
        """Setup test client and user"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!',
            first_name='Old',
            last_name='Name'
        )
        
        # Get tokens
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
    
    def test_update_profile_first_name(self):
        """Test updating first name"""
        response = self.client.put('/api/users/me/', {
            'first_name': 'New'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'success'
        assert response.data['message'] == 'Profile updated successfully.'
        assert response.data['data']['first_name'] == 'New'
        
        # Verify database update
        self.user.refresh_from_db()
        assert self.user.first_name == 'New'
    
    def test_update_profile_last_name(self):
        """Test updating last name"""
        response = self.client.put('/api/users/me/', {
            'last_name': 'NewLast'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['data']['last_name'] == 'NewLast'
        
        self.user.refresh_from_db()
        assert self.user.last_name == 'NewLast'
    
    def test_update_profile_email(self):
        """Test updating email"""
        response = self.client.put('/api/users/me/', {
            'email': 'newemail@example.com'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['data']['email'] == 'newemail@example.com'
        
        self.user.refresh_from_db()
        assert self.user.email == 'newemail@example.com'
    
    def test_update_profile_all_fields(self):
        """Test updating all profile fields"""
        response = self.client.put('/api/users/me/', {
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'john.doe@example.com'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['data']['first_name'] == 'John'
        assert response.data['data']['last_name'] == 'Doe'
        assert response.data['data']['email'] == 'john.doe@example.com'
    
    def test_update_profile_duplicate_email(self):
        """Test updating profile fails with duplicate email"""
        # Create another user
        User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='TestPass123!'
        )
        
        # Try to update to existing email
        response = self.client.put('/api/users/me/', {
            'email': 'other@example.com'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['status'] == 'error'
        assert 'email' in response.data['errors']
    
    def test_update_profile_case_insensitive_duplicate_email(self):
        """Test duplicate email check is case-insensitive"""
        User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='TestPass123!'
        )
        
        response = self.client.put('/api/users/me/', {
            'email': 'OTHER@EXAMPLE.COM'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'email' in response.data['errors']
    
    def test_update_profile_own_email_allowed(self):
        """Test updating to own email is allowed"""
        response = self.client.put('/api/users/me/', {
            'email': 'test@example.com'
        })
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_update_profile_unauthorized(self):
        """Test update profile fails without authentication"""
        self.client.credentials()  # Clear credentials
        response = self.client.put('/api/users/me/', {
            'first_name': 'Hacker'
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_update_profile_empty_request(self):
        """Test update profile with empty request (no changes)"""
        response = self.client.put('/api/users/me/', {})
        
        assert response.status_code == status.HTTP_200_OK
        # User should remain unchanged
        self.user.refresh_from_db()
        assert self.user.first_name == 'Old'
        assert self.user.last_name == 'Name'


@pytest.mark.django_db
class TestUserLogout:
    """Test POST /api/auth/logout/ endpoint"""
    
    def setup_method(self):
        """Setup test client and user"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!'
        )
        
        # Get tokens
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
    
    def test_logout_success(self):
        """Test successful logout"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.post('/api/auth/logout/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'success'
        assert 'Successfully logged out' in response.data['detail']
    
    def test_logout_unauthorized(self):
        """Test logout fails without authentication"""
        response = self.client.post('/api/auth/logout/')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_logout_invalid_token(self):
        """Test logout fails with invalid token"""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid_token')
        response = self.client.post('/api/auth/logout/')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_logout_with_refresh_token(self):
        """Test that logout works with access token (not refresh)"""
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
        response = self.client.post('/api/auth/logout/')
        
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestAuthenticationFlow:
    """Integration tests for complete auth flow"""
    
    def setup_method(self):
        """Setup test client"""
        self.client = APIClient()
    
    def test_complete_auth_flow(self):
        """Test complete flow: register -> login -> get profile -> update -> logout"""
        
        # 1. Register new user
        reg_response = self.client.post('/api/register/', {
            'username': 'flowuser',
            'email': 'flowuser@example.com',
            'password': 'FlowPass123!',
            'password_confirm': 'FlowPass123!',
            'first_name': 'Flow',
            'last_name': 'User'
        })
        assert reg_response.status_code == status.HTTP_201_CREATED
        
        # 2. Login
        login_response = self.client.post('/api/token/', {
            'username': 'flowuser',
            'password': 'FlowPass123!'
        })
        assert login_response.status_code == status.HTTP_200_OK
        access_token = login_response.data['access']
        
        # 3. Get profile
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        get_response = self.client.get('/api/users/me/')
        assert get_response.status_code == status.HTTP_200_OK
        assert get_response.data['data']['username'] == 'flowuser'
        
        # 4. Update profile
        update_response = self.client.put('/api/users/me/', {
            'first_name': 'Updated'
        })
        assert update_response.status_code == status.HTTP_200_OK
        assert update_response.data['data']['first_name'] == 'Updated'
        
        # 5. Logout
        logout_response = self.client.post('/api/auth/logout/')
        assert logout_response.status_code == status.HTTP_200_OK
        
        # 6. Verify can't access protected endpoint after logout
        # (Note: In JWT, logout doesn't invalidate tokens by default.
        # This test documents current behavior - token still works)
        verify_response = self.client.get('/api/users/me/')
        # Token is still valid since we don't have blacklisting
        assert verify_response.status_code == status.HTTP_200_OK
