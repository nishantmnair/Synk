"""
Tests for remaining API views and viewsets (Task, Milestone, Activity, etc.)
Focuses on achieving 90%+ coverage for new UC-011 features
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from api.models import (
    Task, Milestone, Activity, Suggestion, Collection,
    UserPreferences, Couple, CouplingCode
)
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


@pytest.mark.django_db
class TestTaskViewSet:
    """Test Task endpoints"""
    
    def setup_method(self):
        """Setup test client and user"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='taskuser',
            email='task@example.com',
            password='TestPass123!'
        )
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
    
    def test_list_tasks(self):
        """Test listing tasks"""
        # Create a task
        Task.objects.create(
            user=self.user,
            title='Test Task',
            description='A test task'
        )
        
        response = self.client.get('/api/tasks/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
    
    def test_create_task(self):
        """Test creating a task"""
        response = self.client.post('/api/tasks/', {
            'title': 'New Task',
            'category': 'Work',
            'description': 'Test task'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == 'New Task'
    
    def test_retrieve_task(self):
        """Test retrieving a specific task"""
        task = Task.objects.create(
            user=self.user,
            title='Test Task',
            description='A test task'
        )
        
        response = self.client.get(f'/api/tasks/{task.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == 'Test Task'
    
    def test_update_task(self):
        """Test updating a task"""
        task = Task.objects.create(
            user=self.user,
            title='Test Task',
            category='Work',
            description='A test task'
        )
        
        response = self.client.put(f'/api/tasks/{task.id}/', {
            'title': 'Updated Task',
            'category': 'Work',
            'description': 'Updated description'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == 'Updated Task'
    
    def test_delete_task(self):
        """Test deleting a task"""
        task = Task.objects.create(
            user=self.user,
            title='Test Task',
            description='A test task'
        )
        
        response = self.client.delete(f'/api/tasks/{task.id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT


@pytest.mark.django_db
class TestMilestoneViewSet:
    """Test Milestone endpoints"""
    
    def setup_method(self):
        """Setup test client and user"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='milestoneuser',
            email='milestone@example.com',
            password='TestPass123!'
        )
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
    
    def test_list_milestones(self):
        """Test listing milestones"""
        Milestone.objects.create(
            user=self.user,
            name='Test Milestone',
            date='2026-12-31',
            icon='🎯'
        )
        
        response = self.client.get('/api/milestones/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
    
    def test_create_milestone(self):
        """Test creating a milestone"""
        response = self.client.post('/api/milestones/', {
            'name': 'New Milestone',
            'date': '2026-12-31',
            'icon': '🎯'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'New Milestone'


@pytest.mark.django_db
class TestActivityViewSet:
    """Test Activity endpoints"""
    
    def setup_method(self):
        """Setup test client and user"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='activityuser',
            email='activity@example.com',
            password='TestPass123!'
        )
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
    
    def test_list_activities(self):
        """Test listing activities"""
        Activity.objects.create(
            user=self.user,
            activity_user='Test User',
            action='completed',
            item='Test Activity',
            timestamp='2026-02-02',
            avatar='https://example.com/avatar.jpg'
        )
        
        response = self.client.get('/api/activities/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestCoupleViewSet:
    """Test Couple endpoints"""
    
    def setup_method(self):
        """Setup test client and users"""
        self.client = APIClient()
        self.user1 = User.objects.create_user(
            username='user1',
            email='user1@example.com',
            password='TestPass123!'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='TestPass123!'
        )
        
        refresh = RefreshToken.for_user(self.user1)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
    
    def test_list_couple_not_coupled(self):
        """Test listing couple when user is not coupled"""
        response = self.client.get('/api/couple/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_coupled'] == False
    
    def test_list_couple_when_coupled(self):
        """Test listing couple when user is coupled"""
        Couple.objects.create(user1=self.user1, user2=self.user2)
        
        response = self.client.get('/api/couple/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_coupled'] == True
    
    def test_uncouple(self):
        """Test uncoupling accounts"""
        couple = Couple.objects.create(user1=self.user1, user2=self.user2)
        
        response = self.client.delete('/api/couple/uncouple/')
        assert response.status_code == status.HTTP_200_OK
        
        # Verify couple was deleted
        assert not Couple.objects.filter(user1=self.user1).exists()


@pytest.mark.django_db
class TestCouplingCodeViewSet:
    """Test Coupling Code endpoints"""
    
    def setup_method(self):
        """Setup test client and user"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='codeuser',
            email='code@example.com',
            password='TestPass123!'
        )
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
    
    def test_create_coupling_code(self):
        """Test creating a coupling code"""
        response = self.client.post('/api/coupling-codes/', {})
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'code' in response.data
        assert len(response.data['code']) == 8
    
    def test_list_coupling_codes(self):
        """Test listing coupling codes"""
        CouplingCode.objects.create(
            created_by=self.user,
            expires_at=timezone.now() + timedelta(hours=24)
        )
        
        response = self.client.get('/api/coupling-codes/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestUserPreferencesViewSet:
    """Test User Preferences endpoints"""
    
    def setup_method(self):
        """Setup test client and user"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='prefuser',
            email='pref@example.com',
            password='TestPass123!'
        )
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
    
    def test_list_preferences(self):
        """Test listing preferences"""
        UserPreferences.objects.create(
            user=self.user
        )
        
        response = self.client.get('/api/preferences/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_update_preferences(self):
        """Test updating preferences"""
        prefs = UserPreferences.objects.create(
            user=self.user
        )
        
        response = self.client.put(f'/api/preferences/{prefs.id}/', {})
        
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestErrorHandling:
    """Test error handling in views"""
    
    def setup_method(self):
        """Setup test client and user"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='erroruser',
            email='error@example.com',
            password='TestPass123!'
        )
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
    
    def test_404_not_found(self):
        """Test 404 error for non-existent resource"""
        response = self.client.get('/api/tasks/99999/')
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_401_unauthorized_protected_endpoint(self):
        """Test 401 error for protected endpoints without auth"""
        client = APIClient()  # No auth
        response = client.get('/api/tasks/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_delete_list_endpoint_allowed(self):
        """Test that DELETE on detail endpoint works"""
        task = Task.objects.create(
            user=self.user,
            title='Test Task'
        )
        response = self.client.delete(f'/api/tasks/{task.id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT


@pytest.mark.django_db
class TestResponseFormats:
    """Test response formats for API consistency"""
    
    def setup_method(self):
        """Setup test client and user"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='formatuser',
            email='format@example.com',
            password='TestPass123!'
        )
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
    
    def test_register_response_format(self):
        """Test registration response has correct format"""
        response = self.client.post('/api/register/', {
            'username': 'formattest',
            'email': 'formattest@example.com',
            'password': 'TestPass123!',
            'password_confirm': 'TestPass123!'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'status' in response.data
        assert response.data['status'] == 'success'
        assert 'message' in response.data
        assert 'data' in response.data
    
    def test_get_profile_response_format(self):
        """Test get profile response has correct format"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get('/api/users/me/')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'status' in response.data
        assert response.data['status'] == 'success'
        assert 'message' in response.data
        assert 'data' in response.data
    
    def test_logout_response_format(self):
        """Test logout response has correct format"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.post('/api/auth/logout/')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'status' in response.data
        assert response.data['status'] == 'success'

@pytest.mark.django_db
class TestCollectionViewSet:
    """Test Collection endpoints"""
    
    def setup_method(self):
        """Setup test client and user"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='collectionuser',
            email='collection@example.com',
            password='TestPass123!'
        )
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
    
    def test_list_collections(self):
        """Test listing collections"""
        # Create collections
        Collection.objects.create(
            user=self.user,
            name='Travel',
            icon='flight'
        )
        Collection.objects.create(
            user=self.user,
            name='Cooking',
            icon='restaurant'
        )
        
        response = self.client.get('/api/collections/')
        assert response.status_code == status.HTTP_200_OK
        # Raw paginated format from Django REST Framework
        assert response.data.get('count') == 2
        assert len(response.data.get('results', [])) == 2
    
    def test_create_collection(self):
        """Test creating a collection"""
        response = self.client.post('/api/collections/', {
            'name': 'Travel',
            'icon': 'flight',
            'color': '#ff0000'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'Travel'
        assert response.data['icon'] == 'flight'
        assert response.data['color'] == '#ff0000'
        # Verify user is automatically assigned
        assert str(response.data['user']) == str(self.user.id)
    
    def test_retrieve_collection(self):
        """Test retrieving a specific collection"""
        collection = Collection.objects.create(
            user=self.user,
            name='Travel',
            icon='flight'
        )
        
        response = self.client.get(f'/api/collections/{collection.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Travel'
        assert response.data['icon'] == 'flight'
    
    def test_update_collection(self):
        """Test updating a collection"""
        collection = Collection.objects.create(
            user=self.user,
            name='Travel',
            icon='flight'
        )
        
        response = self.client.put(f'/api/collections/{collection.id}/', {
            'name': 'Adventure',
            'icon': 'hiking'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Adventure'
        assert response.data['icon'] == 'hiking'
    
    def test_delete_collection(self):
        """Test deleting a collection"""
        collection = Collection.objects.create(
            user=self.user,
            name='Travel',
            icon='flight'
        )
        
        response = self.client.delete(f'/api/collections/{collection.id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert Collection.objects.filter(id=collection.id).count() == 0
    
    def test_collections_are_ordered_by_created_at(self):
        """Test collections are ordered by created_at (most recent first)"""
        # Create collections with slight delay
        col1 = Collection.objects.create(user=self.user, name='First', icon='star')
        col2 = Collection.objects.create(user=self.user, name='Second', icon='favorite')
        col3 = Collection.objects.create(user=self.user, name='Third', icon='home')
        
        response = self.client.get('/api/collections/')
        assert response.status_code == status.HTTP_200_OK
        
        # Raw paginated format from Django REST Framework
        data = response.data.get('results', [])
        
        # Most recent should be first
        assert data[0]['name'] == 'Third'
        assert data[1]['name'] == 'Second'
        assert data[2]['name'] == 'First'
    
    def test_user_cannot_see_other_users_collections(self):
        """Test that users can only see their own collections"""
        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='TestPass123!'
        )
        
        # Create collection for other user
        Collection.objects.create(
            user=other_user,
            name='Other User Collection',
            icon='lock'
        )
        
        # Create collection for current user
        Collection.objects.create(
            user=self.user,
            name='My Collection',
            icon='home'
        )
        
        response = self.client.get('/api/collections/')
        assert response.status_code == status.HTTP_200_OK
        
        # Raw paginated format from Django REST Framework
        data = response.data.get('results', [])
        
        # Should only see own collection
        assert len(data) == 1
        assert data[0]['name'] == 'My Collection'
    
    def test_partial_update_collection(self):
        """Test partial update (PATCH) of a collection"""
        collection = Collection.objects.create(
            user=self.user,
            name='Travel',
            icon='flight',
            color='#ff0000'
        )
        
        response = self.client.patch(f'/api/collections/{collection.id}/', {
            'name': 'Updated Travel'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Updated Travel'
        assert response.data['icon'] == 'flight'  # Should remain unchanged
        assert response.data['color'] == '#ff0000'  # Should remain unchanged