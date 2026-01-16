"""
Pytest configuration and shared fixtures for Django tests
"""
import pytest
from django.contrib.auth.models import User
from django.test import Client
from rest_framework.test import APIClient
from api.models import (
    Task, Milestone, Activity, Suggestion, Collection, 
    UserPreferences, Couple, CouplingCode
)

@pytest.fixture
def user(db):
    """Create a test user"""
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User'
    )

@pytest.fixture
def user2(db):
    """Create a second test user"""
    return User.objects.create_user(
        username='testuser2',
        email='test2@example.com',
        password='testpass123',
        first_name='Test2',
        last_name='User2'
    )

@pytest.fixture
def authenticated_client(user):
    """Create an authenticated API client"""
    client = APIClient()
    # Get JWT token
    response = client.post('/api/token/', {
        'username': user.username,
        'password': 'testpass123'
    })
    if response.status_code == 200:
        token = response.data['access']
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return client

@pytest.fixture
def task(user):
    """Create a test task"""
    return Task.objects.create(
        user=user,
        title='Test Task',
        category='Test',
        priority='medium',
        status='Backlog'
    )

@pytest.fixture
def milestone(user):
    """Create a test milestone"""
    return Milestone.objects.create(
        user=user,
        name='Test Milestone',
        date='2024-12-31',
        status='Upcoming',
        icon='star'
    )

@pytest.fixture
def activity(user):
    """Create a test activity"""
    return Activity.objects.create(
        user=user,
        activity_user='Test User',
        action='added',
        item='Test Item',
        timestamp='Just now',
        avatar='https://example.com/avatar.png'
    )

@pytest.fixture
def suggestion(user):
    """Create a test suggestion"""
    return Suggestion.objects.create(
        user=user,
        title='Test Suggestion',
        suggested_by='Test User',
        date='Today',
        description='Test description',
        location='Test Location',
        category='Test'
    )

@pytest.fixture
def collection(user):
    """Create a test collection"""
    return Collection.objects.create(
        user=user,
        name='Test Collection',
        icon='folder'
    )

@pytest.fixture
def preferences(user):
    """Create test user preferences"""
    return UserPreferences.objects.create(
        user=user,
        vibe='Feeling great'
    )

@pytest.fixture
def couple(user, user2):
    """Create a test couple"""
    return Couple.objects.create(
        user1=user,
        user2=user2
    )
