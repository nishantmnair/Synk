from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import secrets


class Task(models.Model):
    TASK_STATUS_CHOICES = [
        ('Backlog', 'Backlog'),
        ('Planning', 'Planning'),
        ('Upcoming', 'Upcoming'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=TASK_STATUS_CHOICES, default='Backlog')
    liked = models.BooleanField(default=False)
    fired = models.BooleanField(default=False)
    progress = models.IntegerField(default=0)  # 0-100
    alex_progress = models.IntegerField(default=0)  # 0-100
    sam_progress = models.IntegerField(default=0)  # 0-100
    description = models.TextField(blank=True, null=True)
    time = models.CharField(max_length=50, blank=True, null=True)
    location = models.CharField(max_length=200, blank=True, null=True)
    avatars = models.JSONField(default=list)  # List of avatar URLs
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title


class Milestone(models.Model):
    STATUS_CHOICES = [
        ('Upcoming', 'Upcoming'),
        ('Completed', 'Completed'),
        ('Dreaming', 'Dreaming'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='milestones')
    name = models.CharField(max_length=200)
    date = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Upcoming')
    sam_excitement = models.IntegerField(default=0)  # 0-100
    alex_excitement = models.IntegerField(default=0)  # 0-100
    icon = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class Activity(models.Model):
    # Removed USER_CHOICES restriction - allow any user name
    # For couples app, this will be the logged-in user's name or their partner's name
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    activity_user = models.CharField(max_length=100)  # Name of the user who performed the activity
    action = models.CharField(max_length=100)
    item = models.CharField(max_length=200)
    timestamp = models.CharField(max_length=50)
    avatar = models.URLField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Activities'
    
    def __str__(self):
        return f"{self.activity_user} {self.action} {self.item}"


class Suggestion(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='suggestions')
    title = models.CharField(max_length=200)
    suggested_by = models.CharField(max_length=100)
    date = models.CharField(max_length=50)
    description = models.TextField()
    location = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    excitement = models.IntegerField(default=0)  # 0-100
    tags = models.JSONField(default=list)  # List of tags
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title


class Collection(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='collections')
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50)
    color = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class UserPreferences(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='preferences')
    anniversary = models.DateField(blank=True, null=True)
    is_private = models.BooleanField(default=True)
    notifications = models.BooleanField(default=True)
    vibe = models.CharField(max_length=200, default='Feeling adventurous')
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = 'User Preferences'
    
    def __str__(self):
        return f"Preferences for {self.user.username}"


class Couple(models.Model):
    """Links two users together as a couple"""
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='couple_as_user1')
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='couple_as_user2')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = [['user1', 'user2']]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user1.username} & {self.user2.username}"
    
    def get_partner(self, user):
        """Get the partner of a given user"""
        if user == self.user1:
            return self.user2
        elif user == self.user2:
            return self.user1
        return None


class CouplingCode(models.Model):
    """Temporary codes for coupling accounts"""
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='coupling_codes')
    code = models.CharField(max_length=12, unique=True)
    used_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='used_coupling_codes')
    used_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Code {self.code} by {self.created_by.username}"
    
    @classmethod
    def generate_code(cls):
        """Generate a unique 8-character code"""
        while True:
            code = secrets.token_hex(4).upper()  # 8 character hex code
            if not cls.objects.filter(code=code, used_by__isnull=True, expires_at__gt=timezone.now()).exists():
                return code
    
    def is_valid(self):
        """Check if code is still valid (not used and not expired)"""
        return self.used_by is None and self.expires_at > timezone.now()
