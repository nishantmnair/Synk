"""
Tests for API views
"""
import pytest
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from api.models import (
    Task, Milestone, Activity, Suggestion, Collection,
    UserPreferences, Couple, CouplingCode
)


@pytest.mark.django_db
class TestTaskViewSet:
    """Test TaskViewSet"""
    
    def test_list_tasks(self, authenticated_client, user, task):
        """Test listing tasks"""
        response = authenticated_client.get('/api/tasks/')
        assert response.status_code == 200
        # DRF returns paginated response with 'results' key
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        assert len(results) == 1
        assert results[0]['title'] == 'Test Task'
    
    def test_create_task(self, authenticated_client, user):
        """Test creating a task"""
        data = {
            'title': 'New Task',
            'category': 'Adventure',
            'priority': 'high',
            'status': 'Backlog'
        }
        response = authenticated_client.post('/api/tasks/', data, format='json')
        assert response.status_code == 201
        # Handle both dict and direct data response
        task_data = response.data.get('results', response.data) if isinstance(response.data, dict) and 'results' in response.data else response.data
        assert task_data['title'] == 'New Task'
        assert Task.objects.filter(user=user, title='New Task').exists()
    
    def test_update_task(self, authenticated_client, user, task):
        """Test updating a task"""
        data = {'title': 'Updated Task'}
        response = authenticated_client.patch(f'/api/tasks/{task.id}/', data, format='json')
        assert response.status_code == 200
        # Handle both dict and direct data response
        task_data = response.data.get('results', response.data) if isinstance(response.data, dict) and 'results' in response.data else response.data
        assert task_data['title'] == 'Updated Task'
    
    def test_delete_task(self, authenticated_client, user, task):
        """Test deleting a task"""
        response = authenticated_client.delete(f'/api/tasks/{task.id}/')
        assert response.status_code == 204
        assert not Task.objects.filter(id=task.id).exists()
    
    def test_task_with_partner(self, authenticated_client, user, user2, couple):
        """Test tasks include partner's tasks when coupled"""
        # Create task for partner
        partner_task = Task.objects.create(
            user=user2,
            title='Partner Task',
            category='Test',
            priority='medium',
            status='Backlog'
        )
        response = authenticated_client.get('/api/tasks/')
        assert response.status_code == 200
        # DRF returns paginated response with 'results' key
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        assert len(results) >= 1


@pytest.mark.django_db
class TestMilestoneViewSet:
    """Test MilestoneViewSet"""
    
    def test_list_milestones(self, authenticated_client, user, milestone):
        """Test listing milestones"""
        response = authenticated_client.get('/api/milestones/')
        assert response.status_code == 200
        # DRF returns paginated response with 'results' key
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        assert len(results) == 1
    
    def test_create_milestone(self, authenticated_client, user):
        """Test creating a milestone"""
        data = {
            'name': 'New Milestone',
            'date': '2024-12-31',
            'status': 'Upcoming',
            'icon': 'star'
        }
        response = authenticated_client.post('/api/milestones/', data, format='json')
        assert response.status_code == 201
        assert response.data['name'] == 'New Milestone'


@pytest.mark.django_db
class TestActivityViewSet:
    """Test ActivityViewSet"""
    
    def test_list_activities(self, authenticated_client, user, activity):
        """Test listing activities"""
        response = authenticated_client.get('/api/activities/')
        assert response.status_code == 200
        # DRF returns paginated response with 'results' key
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        assert len(results) == 1
    
    def test_create_activity(self, authenticated_client, user):
        """Test creating an activity"""
        data = {
            'user': 'Test User',
            'action': 'added',
            'item': 'Test Item',
            'timestamp': 'Just now',
            'avatar': 'https://example.com/avatar.png'
        }
        response = authenticated_client.post('/api/activities/', data, format='json')
        assert response.status_code == 201
        assert response.data['action'] == 'added'


@pytest.mark.django_db
class TestSuggestionViewSet:
    """Test SuggestionViewSet"""
    
    def test_list_suggestions(self, authenticated_client, user, suggestion):
        """Test listing suggestions"""
        response = authenticated_client.get('/api/suggestions/')
        assert response.status_code == 200
        # DRF returns paginated response with 'results' key
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        assert len(results) == 1
    
    def test_create_suggestion(self, authenticated_client, user):
        """Test creating a suggestion"""
        data = {
            'title': 'New Suggestion',
            'suggested_by': 'Test User',
            'date': 'Today',
            'description': 'Test description',
            'location': 'Test Location',
            'category': 'Adventure'
        }
        response = authenticated_client.post('/api/suggestions/', data, format='json')
        assert response.status_code == 201
        assert response.data['title'] == 'New Suggestion'
    
    def test_delete_suggestion(self, authenticated_client, user, suggestion):
        """Test deleting a suggestion"""
        response = authenticated_client.delete(f'/api/suggestions/{suggestion.id}/')
        assert response.status_code == 204
        assert not Suggestion.objects.filter(id=suggestion.id).exists()


@pytest.mark.django_db
class TestCollectionViewSet:
    """Test CollectionViewSet"""
    
    def test_list_collections(self, authenticated_client, user, collection):
        """Test listing collections"""
        response = authenticated_client.get('/api/collections/')
        assert response.status_code == 200
        # DRF returns paginated response with 'results' key
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        assert len(results) == 1
    
    def test_create_collection(self, authenticated_client, user):
        """Test creating a collection"""
        data = {
            'name': 'New Collection',
            'icon': 'folder'
        }
        response = authenticated_client.post('/api/collections/', data, format='json')
        assert response.status_code == 201
        assert response.data['name'] == 'New Collection'


@pytest.mark.django_db
class TestUserPreferencesViewSet:
    """Test UserPreferencesViewSet"""
    
    def test_get_preferences(self, authenticated_client, user):
        """Test getting user preferences (creates if not exist)"""
        response = authenticated_client.get('/api/preferences/')
        assert response.status_code == 200
        assert 'vibe' in response.data
    
    def test_update_preferences(self, authenticated_client, user, preferences):
        """Test updating preferences"""
        data = {'vibe': 'Feeling great'}
        response = authenticated_client.patch(f'/api/preferences/{preferences.id}/', data, format='json')
        assert response.status_code == 200
        assert response.data['vibe'] == 'Feeling great'


@pytest.mark.django_db
class TestUserViewSet:
    """Test UserViewSet"""
    
    def test_get_current_user(self, authenticated_client, user):
        """Test getting current user"""
        response = authenticated_client.get('/api/users/')
        assert response.status_code == 200
        # DRF returns paginated response with 'results' key
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        assert len(results) == 1
        assert results[0]['id'] == user.id
        assert results[0]['email'] == user.email


@pytest.mark.django_db
class TestUserRegistrationViewSet:
    """Test UserRegistrationViewSet"""
    
    def test_register_user(self, client):
        """Test user registration"""
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
            'first_name': 'New',
            'last_name': 'User'
        }
        response = client.post('/api/register/', data, format='json')
        assert response.status_code == 201
        assert User.objects.filter(username='newuser').exists()
    
    def test_register_with_coupling_code(self, client, user):
        """Test registration with coupling code"""
        # Create coupling code
        code = CouplingCode.objects.create(
            created_by=user,
            code='TESTCODE',
            expires_at=timezone.now() + timedelta(hours=24)
        )
        data = {
            'username': 'partner',
            'email': 'partner@example.com',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
            'coupling_code': 'TESTCODE'
        }
        response = client.post('/api/register/', data, format='json')
        assert response.status_code == 201
        # Check if couple was created
        assert Couple.objects.filter(user1=user).exists() or Couple.objects.filter(user2=user).exists()


@pytest.mark.django_db
class TestCoupleViewSet:
    """Test CoupleViewSet"""
    
    def test_get_couple_status(self, authenticated_client, user):
        """Test getting couple status (uncoupled)"""
        response = authenticated_client.get('/api/couple/')
        assert response.status_code == 200
        assert response.data['is_coupled'] == False
    
    def test_get_couple_status_coupled(self, authenticated_client, user, user2, couple):
        """Test getting couple status (coupled)"""
        response = authenticated_client.get('/api/couple/')
        assert response.status_code == 200
        assert response.data['is_coupled'] == True
        assert 'partner' in response.data
    
    def test_uncouple(self, authenticated_client, user, user2, couple):
        """Test uncoupling"""
        response = authenticated_client.delete('/api/couple/uncouple/')
        assert response.status_code == 200
        assert not Couple.objects.filter(id=couple.id).exists()


@pytest.mark.django_db
class TestCouplingCodeViewSet:
    """Test CouplingCodeViewSet"""
    
    def test_create_coupling_code(self, authenticated_client, user):
        """Test creating a coupling code"""
        response = authenticated_client.post('/api/coupling-codes/', {}, format='json')
        assert response.status_code == 201
        assert 'code' in response.data
        assert len(response.data['code']) == 8
    
    def test_list_coupling_codes(self, authenticated_client, user):
        """Test listing coupling codes"""
        # Create a code
        CouplingCode.objects.create(
            created_by=user,
            code='TESTCODE',
            expires_at=timezone.now() + timedelta(hours=24)
        )
        response = authenticated_client.get('/api/coupling-codes/')
        assert response.status_code == 200
        assert len(response.data) >= 1
    
    def test_use_coupling_code(self, authenticated_client, user, user2):
        """Test using a coupling code"""
        # Create code by user2
        code = CouplingCode.objects.create(
            created_by=user2,
            code='TESTCODE',
            expires_at=timezone.now() + timedelta(hours=24)
        )
        # Use code by user
        response = authenticated_client.post(
            '/api/coupling-codes/use/',
            {'code': 'TESTCODE'},
            format='json'
        )
        assert response.status_code == 201
        assert response.data['is_coupled'] == True
        # Verify code is marked as used
        code.refresh_from_db()
        assert code.used_by == user
    
    def test_use_invalid_code(self, authenticated_client, user):
        """Test using invalid coupling code"""
        response = authenticated_client.post(
            '/api/coupling-codes/use/',
            {'code': 'INVALID'},
            format='json'
        )
        assert response.status_code == 400
    
    def test_use_own_code(self, authenticated_client, user):
        """Test cannot use own coupling code"""
        code = CouplingCode.objects.create(
            created_by=user,
            code='OWNCODE',
            expires_at=timezone.now() + timedelta(hours=24)
        )
        response = authenticated_client.post(
            '/api/coupling-codes/use/',
            {'code': 'OWNCODE'},
            format='json'
        )
        assert response.status_code == 400
