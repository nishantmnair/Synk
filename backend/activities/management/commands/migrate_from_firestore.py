"""
Django management command to migrate data from Firestore to PostgreSQL
Usage: python manage.py migrate_from_firestore
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from activities.models import Section, Activity, ActivityHistory
from users.models import Profile, Couple
import firebase_admin
from firebase_admin import credentials, firestore
import os

User = get_user_model()


class Command(BaseCommand):
    help = 'Migrate data from Firestore to PostgreSQL'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting Firestore to PostgreSQL migration...')
        
        # Initialize Firebase (if not already initialized)
        if not firebase_admin._apps:
            cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH')
            if not cred_path:
                self.stdout.write(self.style.ERROR('FIREBASE_CREDENTIALS_PATH not set'))
                return
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        
        db = firestore.client()
        
        # Migrate Users & Profiles
        self.stdout.write('Migrating users and profiles...')
        profiles_ref = db.collection('profiles')
        for doc in profiles_ref.stream():
            data = doc.to_dict()
            user_id = doc.id
            
            # Create or update user
            user, created = User.objects.get_or_create(
                firebase_uid=user_id,
                defaults={
                    'email': data.get('email', f'{user_id}@firebase.com'),
                    'is_active': True
                }
            )
            
            # Create or update profile
            Profile.objects.update_or_create(
                user=user,
                defaults={
                    'name': data.get('name', ''),
                    'partner_name': data.get('partner_name')
                }
            )
            
            self.stdout.write(f'  {"Created" if created else "Updated"} user: {user.email}')
        
        # Migrate Couples
        self.stdout.write('Migrating couples...')
        couples_ref = db.collection('couples')
        couple_map = {}  # Firestore ID -> Django Couple instance
        
        for doc in couples_ref.stream():
            data = doc.to_dict()
            
            # Get users
            user1_uid = data.get('user1_id')
            user2_uid = data.get('user2_id')
            
            try:
                user1 = User.objects.get(firebase_uid=user1_uid) if user1_uid else None
                user2 = User.objects.get(firebase_uid=user2_uid) if user2_uid else None
                
                if user1:
                    couple, created = Couple.objects.get_or_create(
                        user1=user1,
                        user2=user2,
                        defaults={'invite_code': data.get('invite_code', '')}
                    )
                    couple_map[doc.id] = couple
                    self.stdout.write(f'  {"Created" if created else "Updated"} couple: {doc.id}')
            except User.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'  Skipping couple {doc.id} - users not found'))
        
        # Migrate Sections
        self.stdout.write('Migrating sections...')
        sections_ref = db.collection('sections')
        section_map = {}  # Firestore ID -> Django Section instance
        
        for doc in sections_ref.stream():
            data = doc.to_dict()
            couple_id = data.get('couple_id')
            
            if couple_id in couple_map:
                section, created = Section.objects.get_or_create(
                    couple=couple_map[couple_id],
                    title=data.get('title', 'Untitled'),
                    defaults={
                        'display_order': data.get('display_order', 0)
                    }
                )
                section_map[doc.id] = section
                self.stdout.write(f'  {"Created" if created else "Updated"} section: {data.get("title")}')
        
        # Migrate Activities
        self.stdout.write('Migrating activities...')
        activities_ref = db.collection('activities')
        
        for doc in activities_ref.stream():
            data = doc.to_dict()
            couple_id = data.get('couple_id')
            section_id = data.get('section_id')
            
            if couple_id in couple_map:
                Activity.objects.get_or_create(
                    couple=couple_map[couple_id],
                    title=data.get('title', 'Untitled'),
                    defaults={
                        'section': section_map.get(section_id),
                        'description': data.get('description', ''),
                        'status': data.get('status', 'not_started'),
                        'is_recurring': data.get('is_recurring', False),
                        'display_order': data.get('display_order', 0),
                        'last_completed_at': data.get('last_completed_at')
                    }
                )
                self.stdout.write(f'  Migrated activity: {data.get("title")}')
        
        self.stdout.write(self.style.SUCCESS('Migration completed successfully!'))
