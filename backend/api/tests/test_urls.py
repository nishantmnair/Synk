"""
Tests for URL routing
"""
import pytest
from django.urls import reverse, resolve
from rest_framework.test import APIClient
from api.views import (
    TaskViewSet, MilestoneViewSet, ActivityViewSet,
    SuggestionViewSet, CollectionViewSet, UserPreferencesViewSet,
    UserViewSet, UserRegistrationViewSet, CoupleViewSet, CouplingCodeViewSet
)


@pytest.mark.django_db
class TestURLRouting:
    """Test URL routing"""
    
    def test_tasks_url(self):
        """Test tasks URL resolves correctly"""
        url = reverse('task-list')
        assert url == '/api/tasks/'
        resolver = resolve(url)
        assert resolver.func.cls == TaskViewSet
    
    def test_milestones_url(self):
        """Test milestones URL resolves correctly"""
        url = reverse('milestone-list')
        assert url == '/api/milestones/'
        resolver = resolve(url)
        assert resolver.func.cls == MilestoneViewSet
    
    def test_activities_url(self):
        """Test activities URL resolves correctly"""
        url = reverse('activity-list')
        assert url == '/api/activities/'
        resolver = resolve(url)
        assert resolver.func.cls == ActivityViewSet
    
    def test_suggestions_url(self):
        """Test suggestions URL resolves correctly"""
        url = reverse('suggestion-list')
        assert url == '/api/suggestions/'
    
    def test_collections_url(self):
        """Test collections URL resolves correctly"""
        url = reverse('collection-list')
        assert url == '/api/collections/'
    
    def test_preferences_url(self):
        """Test preferences URL resolves correctly"""
        url = reverse('preferences-list')
        assert url == '/api/preferences/'
    
    def test_users_url(self):
        """Test users URL resolves correctly"""
        url = reverse('user-list')
        assert url == '/api/users/'
    
    def test_register_url(self):
        """Test register URL resolves correctly"""
        url = reverse('register-list')
        assert url == '/api/register/'
        resolver = resolve(url)
        assert resolver.func.cls == UserRegistrationViewSet
    
    def test_couple_url(self):
        """Test couple URL resolves correctly"""
        url = reverse('couple-list')
        assert url == '/api/couple/'
    
    def test_coupling_codes_url(self):
        """Test coupling codes URL resolves correctly"""
        url = reverse('coupling-code-list')
        assert url == '/api/coupling-codes/'


@pytest.mark.django_db
class TestAPIEndpoints:
    """Test API endpoints are accessible"""
    
    def test_tasks_endpoint_exists(self, client):
        """Test tasks endpoint exists (requires auth)"""
        response = client.get('/api/tasks/')
        assert response.status_code == 401  # Unauthorized without auth
    
    def test_register_endpoint_allows_any(self, client):
        """Test register endpoint allows unauthenticated access"""
        response = client.post('/api/register/', {})
        # Should fail validation but not 401
        assert response.status_code != 401
