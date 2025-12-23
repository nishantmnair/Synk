import pytest
from django.contrib.auth import get_user_model
from users.models import Profile, Couple
import factory
from factory.django import DjangoModelFactory

User = get_user_model()


class UserFactory(DjangoModelFactory):
    class Meta:
        model = User
    
    email = factory.Faker('email')
    firebase_uid = factory.Faker('uuid4')
    is_active = True


class ProfileFactory(DjangoModelFactory):
    class Meta:
        model = Profile
    
    user = factory.SubFactory(UserFactory)
    name = factory.Faker('name')
    partner_name = factory.Faker('name')


class CoupleFactory(DjangoModelFactory):
    class Meta:
        model = Couple
    
    user1 = factory.SubFactory(UserFactory)
    user2 = factory.SubFactory(UserFactory)
    invite_code = factory.Faker('uuid4')


@pytest.fixture
def user():
    return UserFactory()


@pytest.fixture
def profile(user):
    return ProfileFactory(user=user)


@pytest.fixture
def couple():
    return CoupleFactory()


@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()
