from django.db import models
from django.utils import timezone
from users.models import User, Couple


class Section(models.Model):
    """Activity organization sections"""
    couple = models.ForeignKey(Couple, on_delete=models.CASCADE, related_name='sections')
    title = models.CharField(max_length=255)
    parent_section = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subsections')
    display_order = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'sections'
        ordering = ['display_order', 'title']
        indexes = [
            models.Index(fields=['couple', 'display_order']),
        ]
    
    def __str__(self):
        return self.title


class Activity(models.Model):
    """Activity/date idea items"""
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('finished', 'Finished'),
    ]
    
    RECURRENCE_CHOICES = [
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    ]
    
    couple = models.ForeignKey(Couple, on_delete=models.CASCADE, related_name='activities')
    section = models.ForeignKey(Section, on_delete=models.SET_NULL, null=True, blank=True, related_name='activities')
    
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started')
    
    is_deleted = models.BooleanField(default=False)
    is_recurring = models.BooleanField(default=False)
    recurrence_interval = models.CharField(max_length=20, choices=RECURRENCE_CHOICES, null=True, blank=True)
    last_completed_at = models.DateTimeField(null=True, blank=True)
    
    display_order = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'activities'
        ordering = ['display_order', '-created_at']
        indexes = [
            models.Index(fields=['couple', 'is_deleted', 'status']),
            models.Index(fields=['couple', 'display_order']),
        ]
    
    def __str__(self):
        return self.title


class ActivityHistory(models.Model):
    """Completion history for recurring activities"""
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name='history')
    completed_by = models.ForeignKey(User, on_delete=models.CASCADE)
    completed_at = models.DateTimeField(default=timezone.now)
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'activity_history'
        ordering = ['-completed_at']
        verbose_name_plural = 'Activity histories'
    
    def __str__(self):
        return f"{self.activity.title} - {self.completed_at.strftime('%Y-%m-%d')}"


class ActivityReminder(models.Model):
    """Activity suggestions/reminders"""
    couple = models.ForeignKey(Couple, on_delete=models.CASCADE, related_name='reminders')
    activity_title = models.CharField(max_length=500)
    dismissed = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'activity_reminders'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Reminder: {self.activity_title}"
