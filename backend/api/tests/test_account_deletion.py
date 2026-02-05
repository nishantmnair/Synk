"""
Tests for account deletion functionality
"""
import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APIRequestFactory

from api.serializers import AccountDeletionSerializer
from api.models import Task, Milestone, UserPreferences

User = get_user_model()


@pytest.mark.django_db
class TestAccountDeletionSerializer:
    """Test AccountDeletionSerializer"""
    
    @pytest.fixture
    def user(self):
        """Create test user"""
        return User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
    
    @pytest.fixture
    def auth_request(self, user):
        """Provide a request with an authenticated user for serializer tests."""
        factory = APIRequestFactory()
        request = factory.post('/')
        request.user = user
        return request
    
    def test_valid_password(self, auth_request):
        """Test serializer with correct password"""
        serializer = AccountDeletionSerializer(
            data={'password': 'testpass123'},
            context={'request': auth_request}
        )
        assert serializer.is_valid()
    
    def test_invalid_password(self, auth_request):
        """Test serializer with incorrect password"""
        serializer = AccountDeletionSerializer(
            data={'password': 'wrongpassword'},
            context={'request': auth_request}
        )
        assert not serializer.is_valid()
        assert 'password' in serializer.errors
        assert 'incorrect' in str(serializer.errors['password']).lower()
    
    def test_missing_password(self, auth_request):
        """Test serializer with missing password"""
        serializer = AccountDeletionSerializer(
            data={},
            context={'request': auth_request}
        )
        assert not serializer.is_valid()
        assert 'password' in serializer.errors


@pytest.mark.django_db
class TestAccountDeletionEndpoint:
    """Test account deletion API endpoint"""
    
    @pytest.fixture
    def user(self):
        """Create test user"""
        return User.objects.create_user(
            username='deletetest',
            email='deletetest@example.com',
            password='DeletePass123!',
            first_name='Delete',
            last_name='Test'
        )
    
    @pytest.fixture
    def client(self):
        """Create API client"""
        return APIClient()
    
    def test_delete_account_requires_authentication(self, client):
        """Test that delete account endpoint requires authentication"""
        url = reverse('user-delete-account')
        response = client.post(url, {'password': 'test'})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_delete_account_with_correct_password(self, user, client):
        """Test successful account deletion with correct password"""
        client.force_authenticate(user=user)
        user_id = user.id
        
        url = reverse('user-delete-account')
        response = client.post(url, {
            'password': 'DeletePass123!'
        }, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'successfully deleted' in response.data['detail'].lower()
        assert not User.objects.filter(id=user_id).exists()
    
    def test_delete_account_with_wrong_password(self, user, client):
        """Test account deletion fails with wrong password"""
        client.force_authenticate(user=user)
        user_id = user.id
        
        url = reverse('user-delete-account')
        response = client.post(url, {
            'password': 'WrongPassword123!'
        }, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['status'] == 'error'
        assert response.data['error_code'] == 'password_validation_error'
        assert 'password' in response.data.get('errors', {})
        assert isinstance(response.data['errors']['password'], list)
        assert any('incorrect' in str(msg).lower() for msg in response.data['errors']['password'])
        assert User.objects.filter(id=user_id).exists()
    
    def test_delete_account_missing_password(self, user, client):
        """Test account deletion fails with missing password"""
        client.force_authenticate(user=user)
        user_id = user.id
        
        url = reverse('user-delete-account')
        response = client.post(url, {}, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['status'] == 'error'
        assert response.data['error_code'] == 'password_validation_error'
        assert 'password' in response.data.get('errors', {})
        assert User.objects.filter(id=user_id).exists()
    
    def test_delete_account_cascades_to_tasks(self, user, client):
        """Test that deleting account also deletes all tasks"""
        client.force_authenticate(user=user)
        
        # Create tasks
        Task.objects.create(
            user=user,
            title='Task 1',
            category='Test',
            priority='high',
            status='Backlog'
        )
        Task.objects.create(
            user=user,
            title='Task 2',
            category='Test',
            priority='medium',
            status='In Progress'
        )
        
        assert Task.objects.filter(user_id=user.id).count() == 2
        
        # Delete account
        url = reverse('user-delete-account')
        response = client.post(url, {
            'password': 'DeletePass123!'
        }, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert Task.objects.filter(user_id=user.id).count() == 0
    
    def test_delete_account_cascades_to_milestones(self, user, client):
        """Test that deleting account also deletes all milestones"""
        client.force_authenticate(user=user)
        
        # Create milestones
        Milestone.objects.create(
            user=user,
            name='Milestone 1',
            date='2025-12-31',
            icon='flag'
        )
        
        assert Milestone.objects.filter(user_id=user.id).count() == 1
        
        # Delete account
        url = reverse('user-delete-account')
        response = client.post(url, {
            'password': 'DeletePass123!'
        }, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert Milestone.objects.filter(user_id=user.id).count() == 0
    
    def test_delete_account_cascades_to_preferences(self, user, client):
        """Test that deleting account also deletes user preferences"""
        client.force_authenticate(user=user)
        
        # Create preferences
        UserPreferences.objects.create(
            user=user
        )
        
        assert UserPreferences.objects.filter(user_id=user.id).exists()
        
        # Delete account
        url = reverse('user-delete-account')
        response = client.post(url, {
            'password': 'DeletePass123!'
        }, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert not UserPreferences.objects.filter(user_id=user.id).exists()
    
    def test_deleted_account_cannot_login(self, user):
        """Test that deleted accounts cannot login"""
        client = APIClient()
        
        # First login works
        token_url = reverse('token_obtain_pair')
        response = client.post(token_url, {
            'username': 'deletetest',
            'password': 'DeletePass123!'
        }, format='json')
        assert response.status_code == status.HTTP_200_OK
        token = response.data['access']
        
        # Delete account
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        delete_url = reverse('user-delete-account')
        response = client.post(delete_url, {
            'password': 'DeletePass123!'
        }, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        # Try deleting again (idempotency/clear error)
        response = client.post(delete_url, {
            'password': 'DeletePass123!'
        }, format='json')
        assert response.status_code in (
            status.HTTP_404_NOT_FOUND,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_401_UNAUTHORIZED,
        )
        
        # Try to login after deletion
        response = client.post(token_url, {
            'username': 'deletetest',
            'password': 'DeletePass123!'
        }, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert 'invalid_credentials' in response.data.get('error_code', '') or 'No active account found' in response.data.get('message', '')
