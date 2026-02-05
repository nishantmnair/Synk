"""
Tests for API models
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
class TestTask:
    """Test Task model"""
    
    def test_create_task(self, user):
        """Test creating a task"""
        task = Task.objects.create(
            user=user,
            title='Test Task',
            category='Adventure',
            priority='high',
            status='Backlog'
        )
        assert task.title == 'Test Task'
        assert task.user == user
        assert task.priority == 'high'
        assert task.status == 'Backlog'
    
    def test_task_str(self, user):
        """Test task string representation"""
        task = Task.objects.create(
            user=user,
            title='Test Task',
            category='Adventure',
            priority='high',
            status='Backlog'
        )
        assert str(task) == 'Test Task'
    
    def test_task_defaults(self, user):
        """Test task default values"""
        task = Task.objects.create(
            user=user,
            title='Test Task',
            category='Adventure'
        )
        assert task.priority == 'medium'
        assert task.status == 'Backlog'
        assert task.liked == False
        assert task.fired == False
        assert task.progress == 0
        assert task.avatars == []


@pytest.mark.django_db
class TestMilestone:
    """Test Milestone model"""
    
    def test_create_milestone(self, user):
        """Test creating a milestone"""
        milestone = Milestone.objects.create(
            user=user,
            name='Test Milestone',
            date='2024-12-31',
            status='Upcoming',
            icon='star'
        )
        assert milestone.name == 'Test Milestone'
        assert milestone.user == user
        assert milestone.status == 'Upcoming'
    
    def test_milestone_str(self, user):
        """Test milestone string representation"""
        milestone = Milestone.objects.create(
            user=user,
            name='Test Milestone',
            date='2024-12-31',
            status='Upcoming',
            icon='star'
        )
        assert str(milestone) == 'Test Milestone'


@pytest.mark.django_db
class TestActivity:
    """Test Activity model"""
    
    def test_create_activity(self, user):
        """Test creating an activity"""
        activity = Activity.objects.create(
            user=user,
            activity_user='Test User',
            action='added',
            item='Test Item',
            timestamp='Just now',
            avatar='https://example.com/avatar.png'
        )
        assert activity.activity_user == 'Test User'
        assert activity.action == 'added'
        assert activity.item == 'Test Item'
    
    def test_activity_str(self, user):
        """Test activity string representation"""
        activity = Activity.objects.create(
            user=user,
            activity_user='Test User',
            action='added',
            item='Test Item',
            timestamp='Just now',
            avatar='https://example.com/avatar.png'
        )
        assert 'Test User' in str(activity)
        assert 'added' in str(activity)
        assert 'Test Item' in str(activity)


@pytest.mark.django_db
class TestSuggestion:
    """Test Suggestion model"""
    
    def test_create_suggestion(self, user):
        """Test creating a suggestion"""
        suggestion = Suggestion.objects.create(
            user=user,
            title='Test Suggestion',
            suggested_by='Test User',
            date='Today',
            description='Test description',
            location='Test Location',
            category='Adventure'
        )
        assert suggestion.title == 'Test Suggestion'
        assert suggestion.suggested_by == 'Test User'
        assert suggestion.tags == []
    
    def test_suggestion_str(self, user):
        """Test suggestion string representation"""
        suggestion = Suggestion.objects.create(
            user=user,
            title='Test Suggestion',
            suggested_by='Test User',
            date='Today',
            description='Test description',
            location='Test Location',
            category='Adventure'
        )
        assert str(suggestion) == 'Test Suggestion'


@pytest.mark.django_db
class TestCollection:
    """Test Collection model"""
    
    def test_create_collection(self, user):
        """Test creating a collection"""
        collection = Collection.objects.create(
            user=user,
            name='Test Collection',
            icon='folder'
        )
        assert collection.name == 'Test Collection'
        assert collection.user == user
    
    def test_collection_str(self, user):
        """Test collection string representation"""
        collection = Collection.objects.create(
            user=user,
            name='Test Collection',
            icon='folder'
        )
        assert str(collection) == 'Test Collection'


@pytest.mark.django_db
class TestUserPreferences:
    """Test UserPreferences model"""
    
    def test_create_preferences(self, user):
        """Test creating user preferences"""
        prefs = UserPreferences.objects.create(
            user=user,
            vibe='Feeling great'
        )
        assert prefs.user == user
        assert prefs.vibe == 'Feeling great'
        assert prefs.is_private == True
        assert prefs.notifications == True
    
    def test_preferences_str(self, user):
        """Test preferences string representation"""
        prefs = UserPreferences.objects.create(user=user)
        assert user.username in str(prefs)


@pytest.mark.django_db
class TestCouple:
    """Test Couple model"""
    
    def test_create_couple(self, user, user2):
        """Test creating a couple"""
        couple = Couple.objects.create(
            user1=user,
            user2=user2
        )
        assert couple.user1 == user
        assert couple.user2 == user2
    
    def test_couple_get_partner(self, user, user2):
        """Test getting partner from couple"""
        couple = Couple.objects.create(
            user1=user,
            user2=user2
        )
        assert couple.get_partner(user) == user2
        assert couple.get_partner(user2) == user
        assert couple.get_partner(User()) is None
    
    def test_couple_str(self, user, user2):
        """Test couple string representation"""
        couple = Couple.objects.create(
            user1=user,
            user2=user2
        )
        assert user.username in str(couple)
        assert user2.username in str(couple)


@pytest.mark.django_db
class TestCouplingCode:
    """Test CouplingCode model"""
    
    def test_create_coupling_code(self, user):
        """Test creating a coupling code"""
        code = CouplingCode.objects.create(
            created_by=user,
            code='TESTCODE',
            expires_at=timezone.now() + timedelta(hours=24)
        )
        assert code.created_by == user
        assert code.code == 'TESTCODE'
        assert code.used_by is None
        assert code.is_valid() is True
    
    def test_coupling_code_generate(self):
        """Test generating unique coupling code"""
        code1 = CouplingCode.generate_code()
        code2 = CouplingCode.generate_code()
        assert code1 != code2
        assert len(code1) == 8
    
    def test_coupling_code_is_valid(self, user):
        """Test coupling code validity"""
        # Valid code
        valid_code = CouplingCode.objects.create(
            created_by=user,
            code='VALID',
            expires_at=timezone.now() + timedelta(hours=1)
        )
        assert valid_code.is_valid() == True
        
        # Expired code
        expired_code = CouplingCode.objects.create(
            created_by=user,
            code='EXPIRED',
            expires_at=timezone.now() - timedelta(hours=1)
        )
        assert expired_code.is_valid() == False
        
        # Used code
        used_code = CouplingCode.objects.create(
            created_by=user,
            code='USED',
            expires_at=timezone.now() + timedelta(hours=1),
            used_by=user
        )
        assert used_code.is_valid() == False

    def test_coupling_code_str(self, user):
        """Test coupling code string representation"""
        code = CouplingCode.objects.create(
            created_by=user,
            code='ABC12345',
            expires_at=timezone.now() + timedelta(hours=24)
        )
        s = str(code)
        assert 'ABC12345' in s
        assert user.username in s
