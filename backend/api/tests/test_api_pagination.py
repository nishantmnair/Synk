"""
Tests for API pagination handling
Tests that the API correctly handles Django REST Framework paginated responses
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from api.models import Task, Collection

User = get_user_model()


@pytest.mark.django_db
class TestAPIPaginationHandling:
    """Test API pagination response format"""
    
    def setup_method(self):
        """Setup test client and user"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='paginationuser',
            email='pagination@example.com',
            password='TestPass123!'
        )
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
    
    def assert_paginated_response_structure(self, response):
        """Assert that response has correct paginated structure"""
        assert isinstance(response.data, dict)
        assert 'count' in response.data
        assert 'results' in response.data
    
    def get_with_200_status(self, url):
        """Make GET request and assert 200 status"""
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        return response
    
    def create_tasks(self, count):
        """Create multiple tasks for testing"""
        for i in range(1, count + 1):
            Task.objects.create(user=self.user, title=f'Task {i}', description='Test')
    
    def create_collections(self, count):
        """Create multiple collections for testing"""
        for i in range(1, count + 1):
            Collection.objects.create(user=self.user, name=f'Collection {i}', icon='star')
    
    def assert_paginated_endpoint(self, endpoint: str, create_func, count: int, expected_count: int = None):
        """Helper method to test a paginated endpoint with created items"""
        if expected_count is None:
            expected_count = count
        
        # Create items using provided function
        create_func(count)
        
        # Get paginated response
        response = self.get_with_200_status(endpoint)
        
        # Assert paginated structure
        self.assert_paginated_response_structure(response)
        assert response.data['count'] == expected_count
        assert len(response.data['results']) <= 100  # Default page size
    
    def test_paginated_response_structure(self):
        """Test that paginated responses have correct structure"""
        self.assert_paginated_endpoint('/api/tasks/', self.create_tasks, 5)
    
    def test_empty_paginated_response(self):
        """Test that empty responses are still paginated"""
        response = self.get_with_200_status('/api/tasks/')
        
        # Empty paginated response should still have structure
        self.assert_paginated_response_structure(response)
        assert response.data['count'] == 0
        assert len(response.data['results']) == 0
    
    def test_collections_paginated_response(self):
        """Test that collections endpoint returns paginated response"""
        self.assert_paginated_endpoint('/api/collections/', self.create_collections, 3)
    
    def test_pagination_with_limit_parameter(self):
        """Test that pagination respects page size"""
        # Create multiple items
        create_count = 10
        self.create_tasks(create_count)
        
        # DRF PageNumberPagination uses ?page parameter, not ?limit
        # The default page size is 100, so all items should be on page 1
        response = self.get_with_200_status('/api/tasks/?page=1')
        
        # Should return paginated response with all items on first page
        assert response.data['count'] == create_count
        assert len(response.data['results']) == create_count
        assert response.data['next'] is None  # All items fit on first page
    
    def test_pagination_with_page_parameter(self):
        """Test that pagination works with page parameter"""
        # Create multiple items
        create_count = 5
        self.create_tasks(create_count)
        
        # First page
        response = self.get_with_200_status('/api/tasks/?page=1')
        
        # Total count should be consistent
        assert response.data['count'] == create_count
    
    def test_response_contains_required_fields(self):
        """Test that paginated responses contain all required metadata"""
        create_count = 1
        self.create_collections(create_count)
        
        response = self.get_with_200_status('/api/collections/')
        
        # Check pagination metadata
        self.assert_paginated_response_structure(response)
        assert 'next' in response.data
        assert 'previous' in response.data
        
        # Check data structure
        results = response.data['results']
        assert len(results) > 0
        item = results[0]
        assert 'id' in item
        assert 'name' in item
        assert 'icon' in item

