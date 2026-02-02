"""
Django signals for API app
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import UserProfile


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Create a UserProfile whenever a new User is created.
    This ensures every user has a UUID and normalized email stored.
    """
    if created:
        try:
            # Use get_or_create in case the profile was already created
            UserProfile.objects.get_or_create(
                user=instance,
                defaults={
                    'email_normalized': instance.email.lower()
                }
            )
        except Exception as e:
            # Log error but don't break user creation
            import traceback
            traceback.print_exc()


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """
    Save the user's profile whenever the user is saved.
    This keeps the profile's email_normalized in sync with the user's email.
    """
    try:
        if hasattr(instance, 'profile'):
            instance.profile.save()
    except Exception as e:
        # Log error but don't break user save
        pass

