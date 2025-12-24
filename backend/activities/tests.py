import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from unittest.mock import patch
from activities.models import Section, Activity, ActivityHistory, ActivityReminder
from users.models import User, Couple
import factory
from factory.django import DjangoModelFactory
from conftest import UserFactory, CoupleFactory
import secrets


class SectionFactory(DjangoModelFactory):
    class Meta:
        model = Section
    
    couple = factory.SubFactory(CoupleFactory)
    title = factory.Faker('sentence', nb_words=3)
    display_order = factory.Sequence(lambda n: n)


class ActivityFactory(DjangoModelFactory):
    class Meta:
        model = Activity
    
    couple = factory.SubFactory(CoupleFactory)
    section = factory.SubFactory(SectionFactory, couple=factory.SelfAttribute('..couple'))
    title = factory.Faker('sentence', nb_words=4)
    status = 'not_started'


@pytest.mark.django_db
class TestSectionModel:
    """Test Section model functionality"""
    
    def test_create_section(self):
        section = SectionFactory()
        assert section.title is not None
        assert section.couple is not None
    
    def test_section_ordering(self):
        couple = CoupleFactory()
        section1 = SectionFactory(couple=couple, display_order=1)
        section2 = SectionFactory(couple=couple, display_order=0)
        
        sections = Section.objects.filter(couple=couple).order_by('display_order')
        assert sections[0] == section2
        assert sections[1] == section1
    
    def test_section_with_parent(self):
        """Test nested sections"""
        couple = CoupleFactory()
        parent = SectionFactory(couple=couple)
        child = SectionFactory(couple=couple, parent_section=parent)
        
        assert child.parent_section == parent
    
    def test_section_str(self):
        section = SectionFactory(title="Test Section")
        assert "Test Section" in str(section)


@pytest.mark.django_db
class TestActivityModel:
    """Test Activity model functionality"""
    
    def test_create_activity(self):
        activity = ActivityFactory()
        assert activity.title is not None
        assert activity.couple is not None
        assert activity.status == 'not_started'
    
    def test_activity_default_order(self):
        """Test that activities have default order"""
        couple = CoupleFactory()
        activity1 = ActivityFactory(couple=couple)
        activity2 = ActivityFactory(couple=couple)
        
        assert activity1.display_order >= 0
        assert activity2.display_order >= 0
    
    def test_activity_status_choices(self):
        """Test valid activity statuses"""
        couple = CoupleFactory()
        for status in ['not_started', 'in_progress', 'finished']:
            activity = ActivityFactory(couple=couple, status=status)
            assert activity.status == status
    
    def test_activity_soft_delete(self):
        """Test soft delete functionality"""
        activity = ActivityFactory()
        activity.is_deleted = True
        activity.save()
        
        assert activity.is_deleted is True
        assert Activity.objects.filter(pk=activity.pk).exists()
    
    def test_activity_recurring(self):
        """Test recurring activities"""
        activity = ActivityFactory(is_recurring=True, recurrence_interval='weekly')
        assert activity.is_recurring is True
        assert activity.recurrence_interval == 'weekly'


@pytest.mark.django_db
class TestActivityHistory:
    """Test Activity History functionality"""
    
    def test_create_history(self):
        """Test creating activity completion history"""
        activity = ActivityFactory()
        user = activity.couple.user1
        
        history = ActivityHistory.objects.create(
            activity=activity,
            completed_by=user,
            notes="Completed successfully"
        )
        
        assert history.activity == activity
        assert history.completed_by == user
        assert history.notes == "Completed successfully"


@pytest.mark.django_db
class TestActivityReminder:
    """Test Activity Reminder functionality"""
    
    def test_create_reminder(self):
        """Test creating activity reminder"""
        activity = ActivityFactory()
        
        reminder = ActivityReminder.objects.create(
            couple=activity.couple,
            activity_title=activity.title
        )
        
        assert reminder.activity_title == activity.title
        assert reminder.dismissed is False
    
    def test_dismiss_reminder(self):
        """Test dismissing reminder"""
        activity = ActivityFactory()
        reminder = ActivityReminder.objects.create(
            couple=activity.couple,
            activity_title=activity.title
        )
        
        reminder.dismissed = True
        reminder.save()
        
        assert reminder.dismissed is True


@pytest.mark.django_db
class TestSectionAPI:
    """Test Section API endpoints"""
    
    @patch('users.authentication.FirebaseAuthentication.authenticate')
    def test_list_sections(self, mock_auth, couple):
        """Test listing sections"""
        mock_auth.return_value = (couple.user1, None)
        client = APIClient()
        
        SectionFactory.create_batch(3, couple=couple)
        
        url = reverse('section-list')
        response = client.get(url, {'couple_id': couple.id}, HTTP_AUTHORIZATION='Bearer fake-token')
        
        assert response.status_code == status.HTTP_200_OK
        data = response.data if isinstance(response.data, list) else response.data.get('results', [])
        assert len(data) >= 3
    
    @patch('users.authentication.FirebaseAuthentication.authenticate')
    def test_create_section(self, mock_auth, couple):
        """Test creating a section"""
        mock_auth.return_value = (couple.user1, None)
        client = APIClient()
        
        url = reverse('section-list')
        data = {
            'couple': couple.id,
            'title': 'New Section',
            'display_order': 1
        }
        response = client.post(url, data, format='json', HTTP_AUTHORIZATION='Bearer fake-token')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == 'New Section'
    
    @patch('users.authentication.FirebaseAuthentication.authenticate')
    def test_update_section(self, mock_auth, couple):
        """Test updating a section"""
        mock_auth.return_value = (couple.user1, None)
        client = APIClient()
        
        section = SectionFactory(couple=couple)
        
        url = reverse('section-detail', kwargs={'pk': section.pk})
        data = {'title': 'Updated Section'}
        response = client.patch(url, data, format='json', HTTP_AUTHORIZATION='Bearer fake-token')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == 'Updated Section'
    
    @patch('users.authentication.FirebaseAuthentication.authenticate')
    def test_delete_section(self, mock_auth, couple):
        """Test deleting a section"""
        mock_auth.return_value = (couple.user1, None)
        client = APIClient()
        
        section = SectionFactory(couple=couple)
        
        url = reverse('section-detail', kwargs={'pk': section.pk})
        response = client.delete(url, HTTP_AUTHORIZATION='Bearer fake-token')
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Section.objects.filter(pk=section.pk).exists()


@pytest.mark.django_db
class TestActivityAPI:
    """Test Activity API endpoints"""
    
    @patch('users.authentication.FirebaseAuthentication.authenticate')
    def test_list_activities(self, mock_auth, couple):
        """Test listing activities"""
        mock_auth.return_value = (couple.user1, None)
        client = APIClient()
        
        ActivityFactory.create_batch(5, couple=couple)
        
        url = reverse('activity-list')
        response = client.get(url, {'couple_id': couple.id}, HTTP_AUTHORIZATION='Bearer fake-token')
        
        assert response.status_code == status.HTTP_200_OK
        data = response.data if isinstance(response.data, list) else response.data.get('results', [])
        assert len(data) >= 5
    
    @patch('users.authentication.FirebaseAuthentication.authenticate')
    def test_create_activity(self, mock_auth, couple):
        """Test creating an activity"""
        mock_auth.return_value = (couple.user1, None)
        client = APIClient()
        
        section = SectionFactory(couple=couple)
        
        url = reverse('activity-list')
        data = {
            'couple': couple.id,
            'section': section.id,
            'title': 'New Activity',
            'description': 'Test description',
            'status': 'not_started',
            'order': 1
        }
        response = client.post(url, data, format='json', HTTP_AUTHORIZATION='Bearer fake-token')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == 'New Activity'
    
    @patch('users.authentication.FirebaseAuthentication.authenticate')
    def test_update_activity(self, mock_auth, couple):
        """Test updating an activity"""
        mock_auth.return_value = (couple.user1, None)
        client = APIClient()
        
        activity = ActivityFactory(couple=couple)
        
        url = reverse('activity-detail', kwargs={'pk': activity.pk})
        data = {'status': 'in_progress', 'title': 'Updated Activity'}
        response = client.patch(url, data, format='json', HTTP_AUTHORIZATION='Bearer fake-token')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'in_progress'
        assert response.data['title'] == 'Updated Activity'
    
    @patch('users.authentication.FirebaseAuthentication.authenticate')
    def test_soft_delete_activity(self, mock_auth, couple):
        """Test soft deleting an activity"""
        mock_auth.return_value = (couple.user1, None)
        client = APIClient()
        
        activity = ActivityFactory(couple=couple)
        
        url = reverse('activity-detail', kwargs={'pk': activity.pk})
        data = {'is_deleted': True}
        response = client.patch(url, data, format='json', HTTP_AUTHORIZATION='Bearer fake-token')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_deleted'] is True
        
        # Verify it still exists in DB
        assert Activity.objects.filter(pk=activity.pk).exists()
    
    @patch('users.authentication.FirebaseAuthentication.authenticate')
    def test_mark_activity_complete(self, mock_auth, couple):
        """Test marking activity as complete"""
        mock_auth.return_value = (couple.user1, None)
        client = APIClient()
        
        activity = ActivityFactory(couple=couple, status='in_progress')
        
        url = reverse('activity-mark-complete', kwargs={'pk': activity.pk})
        data = {'notes': 'Completed on time'}
        response = client.post(url, data, format='json', HTTP_AUTHORIZATION='Bearer fake-token')
        
        assert response.status_code == status.HTTP_200_OK
        
        activity.refresh_from_db()
        assert activity.status == 'finished'
        assert activity.last_completed_at is not None
    
    @patch('users.authentication.FirebaseAuthentication.authenticate')
    def test_filter_activities_by_section(self, mock_auth, couple):
        """Test filtering activities by section"""
        mock_auth.return_value = (couple.user1, None)
        client = APIClient()
        
        section = SectionFactory(couple=couple)
        ActivityFactory.create_batch(3, couple=couple, section=section)
        ActivityFactory.create_batch(2, couple=couple)  # Different section
        
        url = reverse('activity-list')
        response = client.get(
            url,
            {'couple_id': couple.id, 'section_id': section.id},
            HTTP_AUTHORIZATION='Bearer fake-token'
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.data if isinstance(response.data, list) else response.data.get('results', [])
        assert len(data) >= 3
    
    @patch('users.authentication.FirebaseAuthentication.authenticate')
    def test_filter_activities_by_status(self, mock_auth, couple):
        """Test filtering activities by status"""
        mock_auth.return_value = (couple.user1, None)
        client = APIClient()
        
        ActivityFactory.create_batch(2, couple=couple, status='not_started')
        ActivityFactory.create_batch(3, couple=couple, status='finished')
        
        url = reverse('activity-list')
        response = client.get(
            url,
            {'couple_id': couple.id, 'status': 'finished'},
            HTTP_AUTHORIZATION='Bearer fake-token'
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.data if isinstance(response.data, list) else response.data.get('results', [])
        assert len(data) >= 3
    
    @patch('users.authentication.FirebaseAuthentication.authenticate')
    def test_reorder_activities(self, mock_auth, couple):
        """Test reordering activities"""
        mock_auth.return_value = (couple.user1, None)
        client = APIClient()
        
        activity1 = ActivityFactory(couple=couple, order=0)
        activity2 = ActivityFactory(couple=couple, order=1)
        
        url = reverse('activity-reorder')
        data = {
            'activities': [
                {'id': activity2.id, 'order': 0},
                {'id': activity1.id, 'order': 1}
            ]
        }
        response = client.post(url, data, format='json', HTTP_AUTHORIZATION='Bearer fake-token')
        
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestReminderAPI:
    """Test Activity Reminder API endpoints"""
    
    @patch('users.authentication.FirebaseAuthentication.authenticate')
    def test_list_reminders(self, mock_auth, couple):
        """Test listing reminders"""
        mock_auth.return_value = (couple.user1, None)
        client = APIClient()
        
        activity = ActivityFactory(couple=couple)
        ActivityReminder.objects.create(
            couple=couple,
            activity_title=activity.title
        )
        
        url = reverse('activityreminder-list')
        response = client.get(url, {'couple_id': couple.id}, HTTP_AUTHORIZATION='Bearer fake-token')
        
        assert response.status_code == status.HTTP_200_OK
        data = response.data if isinstance(response.data, list) else response.data.get('results', [])
        assert len(data) >= 1
    
    @patch('users.authentication.FirebaseAuthentication.authenticate')
    def test_dismiss_reminder(self, mock_auth, couple):
        """Test dismissing a reminder"""
        mock_auth.return_value = (couple.user1, None)
        client = APIClient()
        
        activity = ActivityFactory(couple=couple)
        reminder = ActivityReminder.objects.create(
            couple=couple,
            activity_title=activity.title
        )
        
        url = reverse('activityreminder-dismiss', kwargs={'pk': reminder.pk})
        response = client.post(url, HTTP_AUTHORIZATION='Bearer fake-token')
        
        assert response.status_code == status.HTTP_200_OK
        
        reminder.refresh_from_db()
        assert reminder.dismissed is True
        assert activity.status == 'not_started'
    
    def test_mark_complete(self):
        activity = ActivityFactory()
        user = UserFactory()
        
        activity.status = 'completed'
        activity.save()
        
        ActivityHistory.objects.create(
            activity=activity,
            completed_by=user
        )
        
        assert activity.status == 'completed'
        assert ActivityHistory.objects.filter(activity=activity).count() == 1


@pytest.mark.django_db
class TestActivityAPI:
    def test_list_activities(self, api_client):
        url = reverse('activity-list')
        response = api_client.get(url)
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_401_UNAUTHORIZED]
    
    def test_create_section(self, api_client):
        url = reverse('section-list')
        data = {'title': 'Test Section'}
        response = api_client.post(url, data)
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_401_UNAUTHORIZED]
