"""
Tests for API management commands
"""
import pytest
from django.contrib.auth.models import User
from django.core.management import call_command
from io import StringIO


@pytest.mark.django_db
class TestCreateTestUser:
    """Test create_test_user management command"""

    def test_creates_user_with_defaults(self):
        """Test creating test user with default username/password"""
        out = StringIO()
        call_command('create_test_user', stdout=out)
        assert User.objects.filter(username='testuser').exists()
        user = User.objects.get(username='testuser')
        assert user.check_password('testpass123')
        assert 'Successfully created' in out.getvalue()

    def test_creates_user_with_custom_args(self):
        """Test creating test user with custom username, password, email"""
        out = StringIO()
        call_command(
            'create_test_user',
            '--username', 'customuser',
            '--password', 'custompass',
            '--email', 'custom@example.com',
            stdout=out
        )
        assert User.objects.filter(username='customuser').exists()
        user = User.objects.get(username='customuser')
        assert user.email == 'custom@example.com'
        assert user.check_password('custompass')

    def test_skips_when_user_exists(self):
        """Test command warns and skips when user already exists"""
        User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        out = StringIO()
        call_command('create_test_user', stdout=out)
        # Should only have one testuser
        assert User.objects.filter(username='testuser').count() == 1
        assert 'already exists' in out.getvalue()
