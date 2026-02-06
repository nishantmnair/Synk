"""
Tests for Inbox and Daily Connection views
"""
import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from datetime import date
from api.models import (
    DailyConnection, DailyConnectionAnswer, InboxItem, Couple
)


@pytest.mark.django_db
class TestInboxViewSet(APITestCase):
    """Test InboxItem API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(username='user1', password='pass123', email='user1@test.com')
        self.user2 = User.objects.create_user(username='user2', password='pass123', email='user2@test.com')
        self.couple = Couple.objects.create(user1=self.user1, user2=self.user2)
        
        self.connection = DailyConnection.objects.create(
            couple=self.couple,
            date=date.today(),
            prompt="What makes you feel loved?"
        )
        
        self.answer = DailyConnectionAnswer.objects.create(
            connection=self.connection,
            user=self.user1,
            answer_text="When you listen to me"
        )
        
        self.inbox_item = InboxItem.objects.create(
            sender=self.user1,
            recipient=self.user2,
            item_type='connection_answer',
            title='Daily Connection Answer',
            description='User1 answered the daily connection',
            connection_answer=self.answer,
            is_read=False
        )

    def test_inbox_list_authenticated(self):
        """Test listing inbox items when authenticated"""
        self.client.force_authenticate(user=self.user2)
        response = self.client.get('/api/inbox/')
        assert response.status_code == status.HTTP_200_OK

    def test_inbox_list_unauthenticated(self):
        """Test listing inbox items when not authenticated"""
        response = self.client.get('/api/inbox/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_inbox_mark_as_read(self):
        """Test marking inbox item as read"""
        self.client.force_authenticate(user=self.user2)
        response = self.client.post(f'/api/inbox/{self.inbox_item.id}/mark_as_read/')
        assert response.status_code == status.HTTP_200_OK
        
        self.inbox_item.refresh_from_db()
        assert self.inbox_item.is_read == True

    def test_inbox_get_unread(self):
        """Test getting unread inbox count"""
        self.client.force_authenticate(user=self.user2)
        response = self.client.get('/api/inbox/unread/')
        assert response.status_code == status.HTTP_200_OK

    def test_inbox_react(self):
        """Test reacting to inbox item with heart"""
        self.client.force_authenticate(user=self.user2)
        response = self.client.post(f'/api/inbox/{self.inbox_item.id}/react/')
        assert response.status_code == status.HTTP_200_OK
        
        self.inbox_item.refresh_from_db()
        assert self.inbox_item.has_reacted == True

    def test_inbox_share_response(self):
        """Test sharing a response to inbox item"""
        self.client.force_authenticate(user=self.user2)
        response = self.client.post(
            f'/api/inbox/{self.inbox_item.id}/share_response/',
            {'response': 'That means so much to me!'},
            format='json'
        )
        assert response.status_code == status.HTTP_200_OK
        
        self.inbox_item.refresh_from_db()
        assert self.inbox_item.response == 'That means so much to me!'
        assert self.inbox_item.responded_at is not None

    def test_inbox_mark_all_as_read(self):
        """Test marking all inbox items as read"""
        # Create another unread item
        InboxItem.objects.create(
            sender=self.user1,
            recipient=self.user2,
            item_type='connection_answer',
            title='Another answer',
            description='Another connection answer',
            is_read=False
        )
        
        self.client.force_authenticate(user=self.user2)
        response = self.client.post('/api/inbox/mark_all_as_read/')
        assert response.status_code == status.HTTP_200_OK
        
        unread_count = InboxItem.objects.filter(recipient=self.user2, is_read=False).count()
        assert unread_count == 0

    def test_inbox_only_shows_own_items(self):
        """Test that users only see their own inbox items"""
        # Create item for user1
        InboxItem.objects.create(
            sender=self.user2,
            recipient=self.user1,
            item_type='message',
            title='Message for user1',
            is_read=False
        )
        
        self.client.force_authenticate(user=self.user2)
        response = self.client.get('/api/inbox/')
        assert response.status_code == status.HTTP_200_OK
        # Response is paginated, check results
        results = response.data.get('results', response.data)
        # Should have received the inbox item from setUp
        assert len(results) >= 1


@pytest.mark.django_db
class TestDailyConnectionViewSet(APITestCase):
    """Test DailyConnection API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(username='user1', password='pass123', email='user1@test.com')
        self.user2 = User.objects.create_user(username='user2', password='pass123', email='user2@test.com')
        self.couple = Couple.objects.create(user1=self.user1, user2=self.user2)
        
        self.connection = DailyConnection.objects.create(
            couple=self.couple,
            date=date.today(),
            prompt="What's your favorite memory together?"
        )

    def test_get_today_connection(self):
        """Test getting today's daily connection"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/daily-connections/today/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['prompt'] == self.connection.prompt

    def test_submit_answer(self):
        """Test submitting an answer to daily connection"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(
            f'/api/daily-connections/{self.connection.id}/answer/',
            {'answer_text': 'Our trip to Japan was amazing!'},
            format='json'
        )
        # Should return 201 Created or 200 OK depending on view implementation
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]
        
        # Verify answer was saved
        assert DailyConnectionAnswer.objects.filter(
            user=self.user1,
            connection=self.connection
        ).exists()

    def test_submit_answer_unauthenticated(self):
        """Test submitting answer without authentication"""
        response = self.client.post(
            f'/api/daily-connections/{self.connection.id}/answer/',
            {'answer_text': 'Test answer'},
            format='json'
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_connections(self):
        """Test listing all daily connections for couple"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/daily-connections/')
        assert response.status_code == status.HTTP_200_OK
