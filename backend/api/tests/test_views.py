"""
Tests for API views
"""
import pytest
from unittest.mock import patch
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

    def test_update_milestone(self, authenticated_client, user, milestone):
        """Test updating a milestone"""
        response = authenticated_client.patch(
            f'/api/milestones/{milestone.id}/',
            {'name': 'Updated Milestone'},
            format='json'
        )
        assert response.status_code == 200
        assert response.data['name'] == 'Updated Milestone'

    def test_delete_milestone(self, authenticated_client, user, milestone):
        """Test deleting a milestone"""
        mid = milestone.id
        response = authenticated_client.delete(f'/api/milestones/{mid}/')
        assert response.status_code == 204
        assert not Milestone.objects.filter(id=mid).exists()


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

    def test_list_activities_with_limit(self, authenticated_client, user, activity):
        """Test listing activities with limit query param"""
        response = authenticated_client.get('/api/activities/?limit=5')
        assert response.status_code == 200
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        assert len(results) <= 5


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

    def test_update_collection(self, authenticated_client, user, collection):
        """Test updating a collection"""
        response = authenticated_client.patch(
            f'/api/collections/{collection.id}/',
            {'name': 'Updated Collection'},
            format='json'
        )
        assert response.status_code == 200
        assert response.data['name'] == 'Updated Collection'

    def test_delete_collection(self, authenticated_client, user, collection):
        """Test deleting a collection"""
        cid = collection.id
        response = authenticated_client.delete(f'/api/collections/{cid}/')
        assert response.status_code == 204
        assert not Collection.objects.filter(id=cid).exists()


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

    def test_register_with_invalid_coupling_code(self, client):
        """Test registration with invalid/expired coupling code still creates user but not coupled"""
        data = {
            'username': 'solouser',
            'email': 'solo@example.com',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
            'coupling_code': 'EXPIREDCODE'
        }
        response = client.post('/api/register/', data, format='json')
        assert response.status_code == 201
        assert User.objects.filter(username='solouser').exists()
        assert not Couple.objects.exists()


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

    def test_get_couple_status_coupled_as_user2(self, user2, couple):
        """Test getting couple status when current user is user2 in couple"""
        from rest_framework.test import APIClient
        client = APIClient()
        resp = client.post('/api/token/', {'username': user2.username, 'password': 'testpass123'})
        token = resp.data.get('access')
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = client.get('/api/couple/')
        assert response.status_code == 200
        assert response.data['is_coupled'] is True

    def test_couple_create_returns_400(self, authenticated_client, user):
        """Test create couple directly returns 400 (use codes instead)"""
        response = authenticated_client.post('/api/couple/', {}, format='json')
        assert response.status_code == 400
        assert 'coupling code' in response.data.get('detail', '').lower()

    def test_uncouple_when_not_coupled(self, authenticated_client, user):
        """Test uncouple when not coupled returns 400"""
        response = authenticated_client.delete('/api/couple/uncouple/')
        assert response.status_code == 400
        assert 'not currently coupled' in response.data.get('detail', '').lower()
    
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

    def test_create_code_when_already_coupled(self, authenticated_client, user, user2, couple):
        """Test cannot create coupling code when already coupled"""
        response = authenticated_client.post('/api/coupling-codes/', {}, format='json')
        assert response.status_code == 400
        assert 'already coupled' in response.data.get('detail', '').lower()

    def test_use_code_empty(self, authenticated_client, user):
        """Test use coupling code with empty code returns 400"""
        response = authenticated_client.post(
            '/api/coupling-codes/use/',
            {'code': ''},
            format='json'
        )
        assert response.status_code == 400
        assert 'code' in response.data.get('detail', '').lower() or 'required' in response.data.get('detail', '').lower()

    def test_use_code_when_already_coupled(self, authenticated_client, user, user2, couple):
        """Test cannot use coupling code when already coupled"""
        code = CouplingCode.objects.create(
            created_by=User.objects.create_user(username='other', email='other@example.com', password='pass'),
            code='OTHERCODE',
            expires_at=timezone.now() + timedelta(hours=24)
        )
        response = authenticated_client.post(
            '/api/coupling-codes/use/',
            {'code': 'OTHERCODE'},
            format='json'
        )
        assert response.status_code == 400
        assert 'already coupled' in response.data.get('detail', '').lower()


@pytest.mark.django_db
class TestAIViews:
    """Test Plan Date, Pro Tip, and Daily Prompt API endpoints."""

    def test_plan_date_requires_auth(self, client):
        """Plan date endpoint requires authentication."""
        response = client.post('/api/ai/plan-date/', {'vibe': 'adventurous'}, format='json')
        assert response.status_code == 401

    def test_plan_date_returns_fallback_without_gemini_key(self, authenticated_client):
        """Plan date returns fallback idea when Gemini key not set or API fails."""
        response = authenticated_client.post(
            '/api/ai/plan-date/',
            {'vibe': 'Feeling adventurous'},
            format='json'
        )
        assert response.status_code == 200
        data = response.data
        assert 'title' in data
        assert 'description' in data
        assert 'location' in data
        assert 'category' in data
        assert data['title'] == 'Cozy Movie Marathon'

    def test_plan_date_uses_default_vibe_when_empty(self, authenticated_client):
        """Plan date uses default vibe when body is empty."""
        response = authenticated_client.post(
            '/api/ai/plan-date/',
            {},
            format='json'
        )
        assert response.status_code == 200
        assert 'title' in response.data

    @patch('api.views.generate_date_idea')
    def test_plan_date_returns_idea_when_gemini_succeeds(self, mock_generate, authenticated_client):
        """Plan date returns Gemini idea when API succeeds."""
        mock_generate.return_value = {
            'title': 'Sunset Picnic',
            'description': 'A relaxing evening.',
            'location': 'Park',
            'category': 'Romantic',
        }
        response = authenticated_client.post(
            '/api/ai/plan-date/',
            {'vibe': 'relaxed'},
            format='json'
        )
        assert response.status_code == 200
        assert response.data['title'] == 'Sunset Picnic'
        assert response.data['location'] == 'Park'
        mock_generate.assert_called_once_with('relaxed', hint=None)

    def test_pro_tip_requires_auth(self, client):
        """Pro tip endpoint requires authentication."""
        response = client.post(
            '/api/ai/pro-tip/',
            {'milestones': [{'name': 'Trip', 'status': 'Upcoming'}]},
            format='json'
        )
        assert response.status_code == 401

    def test_pro_tip_returns_tip_or_fallback(self, authenticated_client):
        """Pro tip returns tip string or fallback."""
        response = authenticated_client.post(
            '/api/ai/pro-tip/',
            {'milestones': [{'name': 'Trip', 'status': 'Upcoming'}]},
            format='json'
        )
        assert response.status_code == 200
        assert 'tip' in response.data
        assert isinstance(response.data['tip'], str)

    def test_daily_prompt_requires_auth(self, client):
        """Daily prompt endpoint requires authentication."""
        response = client.post('/api/ai/daily-prompt/', {}, format='json')
        assert response.status_code == 401

    def test_daily_prompt_returns_prompt_or_fallback(self, authenticated_client):
        """Daily prompt returns prompt string or fallback."""
        response = authenticated_client.post(
            '/api/ai/daily-prompt/',
            {},
            format='json'
        )
        assert response.status_code == 200
        assert 'prompt' in response.data
        assert isinstance(response.data['prompt'], str)
