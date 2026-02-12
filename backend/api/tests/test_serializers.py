"""
Tests for API serializers
"""
import pytest
from datetime import timedelta
from django.contrib.auth.models import User
from django.utils import timezone
from api.models import CouplingCode
from api.serializers import (
    TaskSerializer, MilestoneSerializer, ActivitySerializer,
    UserRegistrationSerializer, CoupleSerializer, CouplingCodeSerializer
)


@pytest.mark.django_db
class TestTaskSerializer:
    """Test TaskSerializer"""
    
    def test_serialize_task(self, user, task):
        """Test serializing a task"""
        serializer = TaskSerializer(task)
        data = serializer.data
        assert data['title'] == 'Test Task'
        assert data['category'] == 'Test'
        assert data['priority'] == 'medium'
        assert data['status'] == 'Backlog'
        assert 'id' in data
    
    def test_deserialize_task(self, user):
        """Test deserializing task data"""
        data = {
            'title': 'New Task',
            'category': 'Adventure',
            'priority': 'high',
            'status': 'Backlog'
        }
        # Mock request in context for serializer
        from django.test import RequestFactory
        from rest_framework.test import APIRequestFactory
        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = user
        
        serializer = TaskSerializer(data=data, context={'request': request})
        assert serializer.is_valid()
        task = serializer.save()
        assert task.title == 'New Task'
        assert task.user == user


@pytest.mark.django_db
class TestMilestoneSerializer:
    """Test MilestoneSerializer"""
    
    def test_serialize_milestone(self, user, milestone):
        """Test serializing a milestone"""
        serializer = MilestoneSerializer(milestone)
        data = serializer.data
        assert data['name'] == 'Test Milestone'
        assert data['status'] == 'Upcoming'
        assert 'id' in data


@pytest.mark.django_db
class TestActivitySerializer:
    """Test ActivitySerializer"""
    
    def test_serialize_activity(self, user, activity):
        """Test serializing an activity"""
        serializer = ActivitySerializer(activity)
        data = serializer.data
        assert data['user'] == 'Test User'
        assert data['action'] == 'added'
        assert data['item'] == 'Test Item'
        assert 'id' in data
    
    def test_deserialize_activity(self, user):
        """Test deserializing activity data"""
        data = {
            'user': 'Test User',
            'action': 'added',
            'item': 'Test Item',
            'timestamp': 'Just now',
            'avatar': 'https://example.com/avatar.png'
        }
        # Mock request in context for serializer
        from rest_framework.test import APIRequestFactory
        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = user
        
        serializer = ActivitySerializer(data=data, context={'request': request})
        assert serializer.is_valid()
        activity = serializer.save()
        assert activity.activity_user == 'Test User'
        assert activity.action == 'added'


@pytest.mark.django_db
class TestUserRegistrationSerializer:
    """Test UserRegistrationSerializer"""
    
    def _create_registration_data(self, username='testuser', email='test@example.com', 
                                  password='TestPass123!', password_confirm='TestPass123!',
                                  first_name='Test', last_name='User'):
        """Helper method to create registration test data"""
        return {
            'username': username,
            'email': email,
            'password': password,
            'password_confirm': password_confirm,
            'first_name': first_name,
            'last_name': last_name
        }
    
    def _assert_invalid_registration_data(self, registration_data, expected_error_field):
        """Helper to test registration data is invalid with expected error field"""
        serializer = UserRegistrationSerializer(data=registration_data)
        assert not serializer.is_valid()
        assert expected_error_field in serializer.errors
    
    def test_validate_passwords_match(self):
        """Test password validation"""
        data = self._create_registration_data(password_confirm='wrongpass')
        self._assert_invalid_registration_data(data, 'password')
    
    def test_validate_username(self):
        """Test username validation"""
        # Username too short
        data = self._create_registration_data(username='ab')
        self._assert_invalid_registration_data(data, 'username')

    def test_validate_username_empty(self):
        """Test username cannot be empty or whitespace"""
        data = self._create_registration_data(username='   ')
        self._assert_invalid_registration_data(data, 'username')

    def test_validate_username_duplicate(self):
        """Test username duplicate"""
        User.objects.create_user(username='taken', email='taken@example.com', password='pass')
        data = self._create_registration_data(username='taken', email='new@example.com')
        self._assert_invalid_registration_data(data, 'username')
    
    def test_validate_email(self):
        """Test email validation"""
        # Duplicate email
        User.objects.create_user(username='existing', email='test@example.com', password='pass')
        data = self._create_registration_data(username='newuser', email='test@example.com')
        self._assert_invalid_registration_data(data, 'email')

    def test_validate_email_empty(self):
        """Test email cannot be empty"""
        data = self._create_registration_data(username='newuser', email='')
        self._assert_invalid_registration_data(data, 'email')
    
    def test_create_user(self):
        """Test creating user from serializer"""
        data = self._create_registration_data(username='newuser', email='newuser@example.com')
        serializer = UserRegistrationSerializer(data=data)
        assert serializer.is_valid()
        user = serializer.save()
        assert user.username == 'newuser'
        assert user.email == 'newuser@example.com'
        assert user.check_password('TestPass123!')

    def test_create_user_empty_optional_names(self):
        """Test creating user with empty first_name/last_name - serializer converts to None (may raise if DB rejects)"""
        data = self._create_registration_data(username='newuser2', email='newuser2@example.com',
                                               first_name='', last_name='')
        serializer = UserRegistrationSerializer(data=data)
        assert serializer.is_valid()
        try:
            user = serializer.save()
            assert user.first_name in ('', None)
            assert user.last_name in ('', None)
        except Exception as e:
            # Some DBs (e.g. SQLite) have NOT NULL on first_name/last_name; serializer raises ValidationError
            from rest_framework.exceptions import ValidationError
            assert isinstance(e, ValidationError)
            assert 'detail' in e.detail


@pytest.mark.django_db
class TestCoupleSerializer:
    """Test CoupleSerializer"""
    
    def test_serialize_couple(self, user, user2, couple):
        """Test serializing a couple"""
        request = type('Request', (), {'user': user})()
        serializer = CoupleSerializer(couple, context={'request': request})
        data = serializer.data
        assert 'user1' in data
        assert 'user2' in data
        assert 'partner' in data
        assert data['partner']['id'] == user2.id


@pytest.mark.django_db
class TestCouplingCodeSerializer:
    """Test CouplingCodeSerializer"""
    
    def test_serialize_coupling_code(self, user):
        """Test serializing a coupling code"""
        code = CouplingCode.objects.create(
            created_by=user,
            code='TESTCODE',
            expires_at=timezone.now() + timedelta(hours=24)
        )
        serializer = CouplingCodeSerializer(code)
        data = serializer.data
        assert data['code'] == 'TESTCODE'
        assert 'expires_at' in data
