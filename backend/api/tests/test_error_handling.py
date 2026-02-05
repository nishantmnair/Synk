"""
Comprehensive tests for UC-012 API Error Handling
Tests standardized error responses, validation errors, and error codes
"""
import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from api.exceptions import (
    DuplicateEmailError, DuplicateUsernameError, PasswordMismatchError,
    WeakPasswordError, InvalidCredentialsError, AuthenticationRequiredError,
    NotFoundError, ValidationError as SynkValidationError
)
from api.models import Task, Couple, CouplingCode, UserPreferences


@pytest.mark.django_db
class TestErrorResponseFormat:
    """Test that all errors follow the standardized response format"""
    
    def setup_method(self):
        self.client = APIClient()
    
    def test_validation_error_format(self):
        """Test validation error returns proper format with field_errors"""
        response = self.client.post('/api/register/', {
            'email': 'invalid-email',
            'username': 'testuser',
            'password': 'weak',
            'password_confirm': 'weak'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()['status'] == 'error'
        assert 'error_code' in response.json()
        assert 'message' in response.json()
        assert 'errors' in response.json()  # Should have field-level errors
    
    def test_authentication_error_format(self):
        """Test authentication error returns proper format"""
        response = self.client.post('/api/token/', {
            'username': 'nonexistent',
            'password': 'wrongpassword'
        })
        
        # Missing required fields returns 400 validation error
        # Invalid credentials returns 401 from AuthenticationFailed
        # Since both fields are provided but wrong, should get 400 from serializer validation
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED]
        data = response.json()
        assert data['status'] == 'error'
        assert 'error_code' in data
        assert 'message' in data
    
    def test_not_found_error_format(self):
        """Test 404 error returns proper format"""
        # Create a user and authenticate
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='ValidPassword123!'
        )
        self.client.force_authenticate(user=user)
        
        # Try to update a non-existent task
        response = self.client.put('/api/tasks/99999/', {
            'name': 'Updated Task'
        })
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert data['status'] == 'error'
        assert data['error_code'] == 'not_found'
        assert 'message' in data
    
    def test_unauthenticated_request_error(self):
        """Test unauthenticated request returns 401"""
        # Try to access protected endpoint without token
        response = self.client.get('/api/users/me/')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert data['status'] == 'error'
        assert 'error_code' in data
        assert 'message' in data


@pytest.mark.django_db
class TestDuplicateEmailHandling:
    """Test UC-012 requirement: specific handling for duplicate email"""
    
    def setup_method(self):
        self.client = APIClient()
        # Create a user with existing email
        self.existing_user = User.objects.create_user(
            username='existing',
            email='taken@example.com',
            password='ValidPassword123!'
        )
    
    def test_duplicate_email_error_code(self):
        """Test duplicate email returns error code and field error"""
        response = self.client.post('/api/register/', {
            'email': 'taken@example.com',
            'username': 'newuser',
            'password': 'ValidPassword123!',
            'password_confirm': 'ValidPassword123!'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert data['status'] == 'error'
        assert 'error_code' in data
        assert 'errors' in data
        assert 'email' in data['errors']
        assert any('already' in msg.lower() for msg in data['errors']['email'])
    
    def test_duplicate_username_error_code(self):
        """Test duplicate username returns specific error code and field error"""
        response = self.client.post('/api/register/', {
            'email': 'new@example.com',
            'username': 'existing',
            'password': 'ValidPassword123!',
            'password_confirm': 'ValidPassword123!'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert data['status'] == 'error'
        assert 'username' in data['errors']
        assert any('already' in msg.lower() for msg in data['errors']['username'])


@pytest.mark.django_db
class TestValidationErrorDetails:
    """Test UC-012 requirement: form validation errors displayed clearly"""
    
    def setup_method(self):
        self.client = APIClient()
    
    def _assert_registration_error_field_present(self, register_data, expected_field):
        """Helper to test registration error contains expected field"""
        response = self.client.post('/api/register/', register_data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert 'errors' in data
        assert expected_field in data['errors']
        return data
    
    def test_password_mismatch_field_error(self):
        """Test password mismatch shows field-level error"""
        self._assert_registration_error_field_present({
            'email': 'test@example.com',
            'username': 'testuser',
            'password': 'ValidPassword123!',
            'password_confirm': 'DifferentPassword123!'
        }, 'password')
    
    def test_weak_password_field_error(self):
        """Test weak password shows field-level error"""
        data = self._assert_registration_error_field_present({
            'email': 'test@example.com',
            'username': 'testuser',
            'password': 'weak',
            'password_confirm': 'weak'
        }, 'password')
        # Password error message should exist (can be about length or strength)
        assert len(data['errors']['password']) > 0
    
    def test_invalid_email_format_error(self):
        """Test invalid email format shows field-level error"""
        self._assert_registration_error_field_present({
            'email': 'not-an-email',
            'username': 'testuser',
            'password': 'ValidPassword123!',
            'password_confirm': 'ValidPassword123!'
        }, 'email')


@pytest.mark.django_db
class TestInvalidCredentialsHandling:
    """Test proper handling of invalid login credentials"""
    
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='ValidPassword123!'
        )
    
    def test_invalid_email_login(self):
        """Test login with non-existent username returns 401"""
        response = self.client.post('/api/token/', {
            'username': 'nonexistent',
            'password': 'ValidPassword123!'
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert data['error_code'] == 'invalid_credentials'
        assert 'credentials' in data['message'].lower()
    
    def test_invalid_password_login(self):
        """Test login with wrong password returns 401"""
        response = self.client.post('/api/token/', {
            'username': 'testuser',
            'password': 'WrongPassword123!'
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert data['error_code'] == 'invalid_credentials'
    
    def test_no_generic_password_error(self):
        """Test that error doesn't reveal sensitive info"""
        response = self.client.post('/api/token/', {
            'username': 'nonexistent',
            'password': 'WrongPassword123!'
        })
        
        data = response.json()
        # Should not reveal which field is wrong
        assert 'password' not in data['message'].lower()


@pytest.mark.django_db
class TestServerErrorHandling:
    """Test UC-012 requirement: server errors logged but generic message returned"""
    
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='ValidPassword123!'
        )
    
    def test_server_error_generic_message(self):
        """Test 500 error returns generic message to user (details logged server-side)"""
        # This would be triggered by an actual server error in code
        # For now, we can test the format is correct when it occurs
        # A real test would mock a database error or similar
        pass
    
    def test_error_includes_error_code_not_details(self):
        """Test error response includes error_code, not exception details"""
        # Simulate an error response
        response = self.client.get('/api/tasks/invalid-id/')
        
        assert response.status_code >= 400
        data = response.json()
        assert 'error_code' in data
        assert data['status'] == 'error'
        # Should not expose internal details
        assert 'traceback' not in str(data)
        assert 'exception' not in str(data).lower()


@pytest.mark.django_db
class TestAuthenticationRequiredErrors:
    """Test proper handling of missing/invalid authentication"""
    
    def setup_method(self):
        self.client = APIClient()
    
    def test_missing_token_returns_401(self):
        """Test missing auth token returns 401"""
        response = self.client.get('/api/users/me/')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert data['status'] == 'error'
        assert 'error_code' in data
        assert 'message' in data
    
    def test_invalid_token_returns_401(self):
        """Test invalid token returns 401"""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid_token_here')
        response = self.client.get('/api/users/me/')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert data['status'] == 'error'
        assert 'error_code' in data
    
    def test_expired_token_handling(self):
        """Test expired token handling (if applicable)"""
        # This would require JWT token manipulation
        # Real test would create an expired token and test refresh
        pass


@pytest.mark.django_db
class TestErrorCodeConsistency:
    """Test that error codes are consistent across the API"""
    
    def setup_method(self):
        self.client = APIClient()
    
    def test_validation_error_code_consistent(self):
        """Test all validation errors use consistent error code"""
        # Test email validation
        response1 = self.client.post('/api/register/', {
            'email': 'invalid',
            'username': 'test',
            'password': 'ValidPassword123!',
            'password_confirm': 'ValidPassword123!'
        })
        
        # Test password validation
        response2 = self.client.post('/api/register/', {
            'email': 'test@example.com',
            'username': 'test',
            'password': 'weak',
            'password_confirm': 'weak'
        })
        
        # Both should have validation_error or similar code
        assert response1.json().get('error_code')
        assert response2.json().get('error_code')
        # Both status should be 400
        assert response1.status_code == status.HTTP_400_BAD_REQUEST
        assert response2.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_auth_error_code_consistent(self):
        """Test all auth errors use consistent error codes"""
        # Unauthorized access
        response1 = self.client.get('/api/users/me/')
        
        # Invalid credentials
        response2 = self.client.post('/api/token/', {
            'username': 'testuser',
            'password': 'wrong'
        })
        
        # Both should have error_code
        assert response1.json().get('error_code')
        assert response2.json().get('error_code')
        # Both status should be 401
        assert response1.status_code == status.HTTP_401_UNAUTHORIZED
        # response2 could be 400 (missing field) or 401 (invalid credentials)
        assert response2.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED]


@pytest.mark.django_db
class TestErrorMessageUserFriendliness:
    """Test that error messages are user-friendly"""
    
    def setup_method(self):
        self.client = APIClient()
    
    def test_error_message_is_readable(self):
        """Test error messages are in plain English"""
        response = self.client.post('/api/register/', {
            'email': 'invalid-email',
            'username': 'test',
            'password': 'weak',
            'password_confirm': 'weak'
        })
        
        data = response.json()
        message = data['message']
        
        # Message should be readable (not JSON or code)
        assert len(message) > 0
        assert not message.startswith('{')
        assert not message.startswith('[')
    
    def test_validation_errors_are_readable(self):
        """Test field validation errors are readable"""
        response = self.client.post('/api/register/', {
            'email': 'invalid-email',
            'username': 'test',
            'password': 'weak',
            'password_confirm': 'weak'
        })
        
        data = response.json()
        assert 'errors' in data
        errors = data['errors']
        # Check that each error field has a non-empty list of string messages
        assert len(errors) > 0
        assert all(
            isinstance(field_errors, list) and
            len(field_errors) > 0 and
            all(isinstance(msg, str) and len(msg) > 0 for msg in field_errors)
            for field_errors in errors.values()
        )


@pytest.mark.django_db
class TestUserFriendlyErrorMessages:
    """Test that error messages are user-friendly and helpful"""
    
    def setup_method(self):
        self.client = APIClient()
    
    def test_invalid_credentials_error_is_user_friendly(self):
        """Test invalid credentials error message is helpful"""
        # Create valid user
        User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='ValidPassword123!'
        )
        
        # Try with wrong password
        response = self.client.post('/api/token/', {
            'username': 'testuser',
            'password': 'WrongPassword123!'
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        message = data.get('message', '').lower()
        # Should mention password or credentials, not internal errors
        assert 'password' in message or 'credentials' in message or 'incorrect' in message
        assert 'traceback' not in str(data)
        assert 'exception' not in str(data).lower()
    
    def test_duplicate_email_error_is_user_friendly(self):
        """Test duplicate email error offers helpful guidance"""
        # Create user with email
        User.objects.create_user(
            username='testuser',
            email='existing@example.com',
            password='ValidPassword123!'
        )
        
        # Try to register with same email
        response = self.client.post('/api/register/', {
            'email': 'existing@example.com',
            'username': 'newuser',
            'password': 'ValidPassword123!',
            'password_confirm': 'ValidPassword123!'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        message = data.get('message', '').lower()
        
        # Error should be helpful
        assert 'email' in message or 'registered' in message
        # Should not expose internal Django details
        assert not message.startswith('{')
        assert not message.startswith('[')
    
    def test_weak_password_error_provides_guidance(self):
        """Test weak password error explains requirements"""
        response = self.client.post('/api/register/', {
            'email': 'test@example.com',
            'username': 'testuser',
            'password': 'weak',
            'password_confirm': 'weak'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert 'password' in data.get('errors', {})
        password_errors = data['errors']['password']
        msg = ' '.join(password_errors).lower()
        # Should explain what's needed
        assert '8' in msg or 'character' in msg or 'uppercase' in msg or 'lowercase' in msg or 'number' in msg
    
    def test_authentication_required_error_is_helpful(self):
        """Test authentication required error tells user to login"""
        response = self.client.get('/api/users/me/')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        message = data.get('message', '').lower()
        
        # Should suggest logging in
        assert 'authentication' in message or 'login' in message or 'credentials' in message
    
    def test_not_found_error_is_user_friendly(self):
        """Test 404 error is clear about what's missing"""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='ValidPassword123!'
        )
        self.client.force_authenticate(user=user)
        
        response = self.client.get('/api/tasks/99999/')
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        message = data.get('message', '').lower()
        
        # Should be clear about what wasn't found
        assert 'not found' in message or 'requested' in message
