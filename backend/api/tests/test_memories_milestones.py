"""
Tests for Memories and Milestones views
"""
import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from datetime import date
from api.models import Memory, Milestone, Couple


@pytest.mark.django_db
class TestMemoriesViewSet(APITestCase):
    """Test Memories API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='user1', password='pass123', email='user1@test.com')
        
        self.memory = Memory.objects.create(
            user=self.user,
            title='Our first date',
            description='We had dinner at that Italian place',
            date=date(2023, 6, 15),
            photos=['photo1.jpg', 'photo2.jpg'],
            tags=['romantic', 'date', 'summer'],
            is_favorite=False
        )

    def test_list_memories(self):
        """Test listing user's memories"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/memories/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_create_memory(self):
        """Test creating a new memory"""
        self.client.force_authenticate(user=self.user)
        data = {
            'title': 'Beach day',
            'description': 'Sun, sand, and smiles',
            'date': '2024-08-20',
            'photos': ['beach1.jpg'],
            'tags': ['beach', 'summer', 'fun']
        }
        response = self.client.post('/api/memories/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Memory.objects.count() == 2

    def test_retrieve_memory(self):
        """Test retrieving a specific memory"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f'/api/memories/{self.memory.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == 'Our first date'

    def test_update_memory(self):
        """Test updating a memory"""
        self.client.force_authenticate(user=self.user)
        data = {
            'title': 'Our first date - Updated',
            'description': 'Best night ever!',
            'date': '2023-06-15',
            'tags': ['romantic', 'special']
        }
        response = self.client.put(f'/api/memories/{self.memory.id}/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        self.memory.refresh_from_db()
        assert self.memory.title == 'Our first date - Updated'

    def test_delete_memory(self):
        """Test deleting a memory"""
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f'/api/memories/{self.memory.id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert Memory.objects.count() == 0

    def test_toggle_favorite(self):
        """Test toggling memory favorite status"""
        self.client.force_authenticate(user=self.user)
        
        # Toggle to favorite
        response = self.client.post(f'/api/memories/{self.memory.id}/toggle_favorite/')
        assert response.status_code == status.HTTP_200_OK
        
        self.memory.refresh_from_db()
        assert self.memory.is_favorite == True
        
        # Toggle back to not favorite
        response = self.client.post(f'/api/memories/{self.memory.id}/toggle_favorite/')
        assert response.status_code == status.HTTP_200_OK
        
        self.memory.refresh_from_db()
        assert self.memory.is_favorite == False

    def test_memories_unauthenticated(self):
        """Test that unauthenticated users cannot access memories"""
        response = self.client.get('/api/memories/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_user_only_sees_own_memories(self):
        """Test that users only see their own memories"""
        other_user = User.objects.create_user(username='user2', password='pass123', email='user2@test.com')
        other_memory = Memory.objects.create(
            user=other_user,
            title='Other user memory',
            date=date.today(),
            tags=[]
        )
        
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/memories/')
        assert response.status_code == status.HTTP_200_OK
        
        # Response is paginated
        results = response.data.get('results', response.data)
        # Should only see own memory
        assert len(results) == 1
        assert results[0]['id'] == self.memory.id


@pytest.mark.django_db
class TestMilestonesViewSet(APITestCase):
    """Test Milestones API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(username='user1', password='pass123', email='user1@test.com')
        self.user2 = User.objects.create_user(username='user2', password='pass123', email='user2@test.com')
        self.couple = Couple.objects.create(user1=self.user1, user2=self.user2)
        
        self.milestone = Milestone.objects.create(
            user=self.user1,
            name='Trip to Japan',
            date=date(2025, 6, 1),
            status='Upcoming',
            icon='flight'
        )

    def test_list_milestones(self):
        """Test listing couple's milestones"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/milestones/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_create_milestone(self):
        """Test creating a new milestone"""
        self.client.force_authenticate(user=self.user1)
        data = {
            'name': 'Anniversary trip',
            'date': '2025-12-01',
            'status': 'Upcoming',
            'icon': 'favorite'
        }
        response = self.client.post('/api/milestones/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Milestone.objects.count() == 2

    def test_retrieve_milestone(self):
        """Test retrieving a specific milestone"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f'/api/milestones/{self.milestone.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Trip to Japan'

    def test_update_milestone(self):
        """Test updating a milestone"""
        self.client.force_authenticate(user=self.user1)
        data = {
            'name': 'Trip to Japan and Korea',
            'date': '2025-06-01',
            'status': 'Upcoming',
            'icon': 'flight_takeoff'
        }
        response = self.client.put(f'/api/milestones/{self.milestone.id}/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        self.milestone.refresh_from_db()
        assert self.milestone.name == 'Trip to Japan and Korea'

    def test_delete_milestone(self):
        """Test deleting a milestone"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.delete(f'/api/milestones/{self.milestone.id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert Milestone.objects.count() == 0

    def test_milestone_status_update(self):
        """Test updating milestone status to completed"""
        self.client.force_authenticate(user=self.user1)
        data = {
            'name': 'Trip to Japan',
            'date': '2025-06-01',
            'status': 'Completed',
            'icon': 'flight'
        }
        response = self.client.put(f'/api/milestones/{self.milestone.id}/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        self.milestone.refresh_from_db()
        assert self.milestone.status == 'Completed'

    def test_milestones_unauthenticated(self):
        """Test that unauthenticated users cannot access milestones"""
        response = self.client.get('/api/milestones/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
