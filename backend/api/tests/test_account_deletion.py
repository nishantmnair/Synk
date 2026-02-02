"""
Tests for account deletion functionality
"""
import pytest
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIRequestFactory, APIClient
from rest_framework import status

from api.serializers import AccountDeletionSerializer
from api.models import Task, Milestone, Activity, Suggestion, Collection, UserPreferences, Couple


@pytest.mark.django_db
class TestAccountDeletionSerializer:
    """Test AccountDeletionSerializer"""
    
    @pytest.fixture
    def user(self):
        """Create test user"""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        return user
    
    def test_valid_password(self, user):
        """Test serializer with correct password"""
        factory = APIRequestFactory()
        request = factory.post('/')
        request.user = user
        
        serializer = AccountDeletionSerializer(
            data={'password': 'testpass123'},
            context={'request': request}
        )
        assert serializer.is_valid()
    
    def test_invalid_password(self, user):
        """Test serializer with incorrect password"""
        factory = APIRequestFactory()
        request = factory.post('/')
        request.user = user
        
        serializer = AccountDeletionSerializer(
            data={'password': 'wrongpassword'},
            context={'request': request}
        )
        assert not serializer.is_valid()
        assert 'password' in serializer.errors
        assert 'incorrect' in str(serializer.errors['password']).lower()
    
    def test_missing_password(self, user):
        """Test serializer with missing password"""
        factory = APIRequestFactory()
        request = factory.post('/')
        request.user = user
        
        serializer = AccountDeletionSerializer(
            data={},
            context={'request': request}
        )
        assert not serializer.is_valid()
        assert 'password' in serializer.errors


@pytest.mark.django_db
class TestAccountDeletionEndpoint:
    """Test account deletion API endpoint"""
    
    @pytest.fixture
    def user(self):
        """Create test user"""
        user = User.objects.create_user(
            username='deletetest',
            email='deletetest@example.com',
            password='DeletePass123!',
            first_name='Delete',
            last_name='Test'
        )
        return user
    
    @pytest.fixture
    def client(self):
        """Create API client"""
        return APIClient()
    
    def test_delete_account_requires_authentication(self, client):
        """Test that delete account endpoint requires authentication"""
        response = client.post('/api/users/delete_account/', {'password': 'test'})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_delete_account_with_correct_password(self, user, client):
        """Test successful account deletion with correct password"""
        client.force_authenticate(user=user)
        user_id = user.id
        
        response = client.post('/api/users/delete_account/', {
            'password': 'DeletePass123!'
        }, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'successfully deleted' in response.data['detail'].lower()
        assert not User.objects.filter(id=user_id).exists()
    
    def test_delete_account_with_wrong_password(self, user, client):
        """Test account deletion fails with wrong password"""
        client.force_authenticate(user=user)
        user_id = user.id
        
        response = client.post('/api/users/delete_account/', {
            'password': 'WrongPassword123!'
        }, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'password' in response.data
        assert User.objects.filter(id=user_id).exists()
    
    def test_delete_account_missing_password(self, user, client):
        """Test account deletion fails with missing password"""
        client.force_authenticate(user=user)
        user_id = user.id
        
        response = client.post('/api/users/delete_account/', {}, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'password' in response.data
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
        response = client.post('/api/users/delete_account/', {
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
        response = client.post('/api/users/delete_account/', {
            'password': 'DeletePass123!'
        }, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert Milestone.objects.filter(user_id=user.id).count() == 0
    
    def test_delete_account_cascades_to_preferences(self, user, client):
        """Test that deleting account also deletes user preferences"""
        client.force_authenticate(user=user)
        
        # Create preferences
        UserPreferences.objects.create(
            user=user,
            vibe='Feeling adventurous'
        )
        
        assert UserPreferences.objects.filter(user_id=user.id).exists()
        
        # Delete account
        response = client.post('/api/users/delete_account/', {
            'password': 'DeletePass123!'
        }, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert not UserPreferences.objects.filter(user_id=user.id).exists()
    
    def test_deleted_account_cannot_login(self, user):
        """Test that deleted accounts cannot login"""
        client = APIClient()
        
        # First login works
        response = client.post('/api/token/', {
            'username': 'deletetest',
            'password': 'DeletePass123!'
        }, format='json')
        assert response.status_code == status.HTTP_200_OK
        token = response.data['access']
        
        # Delete account
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = client.post('/api/users/delete_account/', {
            'password': 'DeletePass123!'
        }, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        # Try to login after deletion
        response = client.post('/api/token/', {
            'username': 'deletetest',
            'password': 'DeletePass123!'
        }, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert 'No active account found' in response.data['detail']
