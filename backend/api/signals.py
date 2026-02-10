"""
Django signals for API app
"""
import logging
from contextlib import suppress
from django.db.models.signals import post_save, post_delete, pre_delete
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import UserProfile, Couple, InboxItem
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .serializers import InboxItemSerializer

logger = logging.getLogger(__name__)


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
    with suppress(Exception):
        if hasattr(instance, 'profile'):
            instance.profile.save()


@receiver(post_save, sender=Couple)
def notify_partners_on_couple(sender, instance, created, **kwargs):
    """
    When a couple relationship is created, notify both partners in real-time.
    This sends the couple:coupled event when users connect via coupling code.
    """
    if created:
        try:
            channel_layer = get_channel_layer()
            
            # Notify both users
            for user in [instance.user1, instance.user2]:
                async_to_sync(channel_layer.group_send)(
                    f"user_{user.id}",
                    {
                        "type": "send_message",
                        "event": "couple:coupled",
                        "data": {}
                    }
                )
            logger.info(f"Notified users {instance.user1.id} and {instance.user2.id} of coupling")
        except Exception as e:
            logger.error(f"Error notifying partners on couple creation: {str(e)}", exc_info=True)


@receiver(pre_delete, sender=Couple)
def notify_partner_on_uncouple(sender, instance, **kwargs):
    """
    When a couple relationship is deleted (either directly or via cascade when a user is deleted),
    notify the remaining partner in real-time.
    """
    # Determine which user is being deleted and which remains
    # Both users might still exist (direct uncouple), or one might be deleted (cascade)
    # We'll notify whoever is still there
    partner = None
    
    # Try to get user1
    with suppress(User.DoesNotExist):
        user1 = User.objects.get(pk=instance.user1.pk)
        partner = user1
    
    # If user1 doesn't exist, notify user2
    if not partner:
        with suppress(User.DoesNotExist):
            user2 = User.objects.get(pk=instance.user2.pk)
            partner = user2
    
    # Send real-time notification to the remaining partner
    if partner:
        with suppress(Exception):
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"user_{partner.id}",
                {
                    "type": "send_message",
                    "event": "couple:uncoupled",
                    "data": {
                        "message": "Your partner has deleted their account. You have been uncoupled."
                    }
                }
            )


@receiver(post_save, sender=InboxItem)
def broadcast_inbox_item_update(sender, instance, created, **kwargs):
    """
    Broadcast inbox item changes to the recipient in real-time.
    This ensures inbox updates are sent via WebSocket when items are created or modified.
    """
    try:
        channel_layer = get_channel_layer()
        serialized_data = InboxItemSerializer(instance).data
        
        event_type = "inbox:created" if created else "inbox:updated"
        group_name = f"user_{instance.recipient.id}"
        
        logger.info(f"Broadcasting {event_type} for inbox item {instance.id} to group {group_name}")
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "send_message",
                "event": event_type,
                "data": serialized_data
            }
        )
        logger.info(f"Successfully broadcast {event_type}")
    except Exception as e:
        logger.error(f"Error broadcasting inbox item: {str(e)}", exc_info=True)


@receiver(post_delete, sender=InboxItem)
def broadcast_inbox_item_deletion(sender, instance, **kwargs):
    """
    Broadcast inbox item deletion to the recipient in real-time.
    """
    with suppress(Exception):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{instance.recipient.id}",
            {
                "type": "send_message",
                "event": "inbox:deleted",
                "data": {"id": instance.id}
            }
        )


