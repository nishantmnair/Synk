from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import Activity, ActivityReminder
import logging

logger = logging.getLogger(__name__)


@shared_task
def check_activity_reminders():
    """
    Daily task to check for activities that haven't been completed recently
    and create reminders for couples
    """
    logger.info("Checking for activity reminders...")
    
    # Find recurring activities not completed in the last 30 days
    thirty_days_ago = timezone.now() - timedelta(days=30)
    
    overdue_activities = Activity.objects.filter(
        is_recurring=True,
        is_deleted=False,
        last_completed_at__lt=thirty_days_ago
    ).select_related('couple')
    
    reminders_created = 0
    for activity in overdue_activities:
        # Check if reminder already exists
        exists = ActivityReminder.objects.filter(
            couple=activity.couple,
            activity_title=activity.title,
            dismissed=False
        ).exists()
        
        if not exists:
            ActivityReminder.objects.create(
                couple=activity.couple,
                activity_title=activity.title
            )
            reminders_created += 1
    
    logger.info(f"Created {reminders_created} new reminders")
    return f"Created {reminders_created} reminders"


@shared_task
def cleanup_old_data():
    """
    Weekly task to clean up old dismissed reminders and deleted activities
    """
    logger.info("Cleaning up old data...")
    
    # Delete dismissed reminders older than 90 days
    ninety_days_ago = timezone.now() - timedelta(days=90)
    deleted_reminders = ActivityReminder.objects.filter(
        dismissed=True,
        updated_at__lt=ninety_days_ago
    ).delete()
    
    # Permanently delete soft-deleted activities older than 90 days
    deleted_activities = Activity.objects.filter(
        is_deleted=True,
        updated_at__lt=ninety_days_ago
    ).delete()
    
    logger.info(f"Deleted {deleted_reminders[0]} old reminders and {deleted_activities[0]} old activities")
    return f"Cleaned up {deleted_reminders[0]} reminders and {deleted_activities[0]} activities"


@shared_task
def send_activity_notification(activity_id, user_id):
    """
    Example task to send notifications when an activity is completed
    This would integrate with email/push notification services
    """
    logger.info(f"Sending notification for activity {activity_id} to user {user_id}")
    # TODO: Implement actual notification logic
    return f"Notification sent for activity {activity_id}"
