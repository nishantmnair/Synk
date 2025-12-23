import pytest
from django.urls import reverse
from rest_framework import status
from activities.models import Section, Activity, ActivityHistory, ActivityReminder
import factory
from factory.django import DjangoModelFactory
from conftest import UserFactory, CoupleFactory


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
    section = factory.SubFactory(SectionFactory)
    title = factory.Faker('sentence', nb_words=4)
    status = 'not_started'


@pytest.mark.django_db
class TestSectionModel:
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


@pytest.mark.django_db
class TestActivityModel:
    def test_create_activity(self):
        activity = ActivityFactory()
        assert activity.title is not None
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
