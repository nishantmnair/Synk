from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, firebase_uid, email=None, **extra_fields):
        if not firebase_uid:
            raise ValueError('Firebase UID is required')
        
        email = self.normalize_email(email) if email else None
        user = self.model(firebase_uid=firebase_uid, email=email, **extra_fields)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, firebase_uid, email=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(firebase_uid, email, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model integrated with Firebase Auth"""
    firebase_uid = models.CharField(max_length=128, unique=True, db_index=True)
    email = models.EmailField(blank=True, null=True)
    full_name = models.CharField(max_length=255, blank=True)
    display_name = models.CharField(max_length=255, blank=True)
    photo_url = models.URLField(blank=True, null=True)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'firebase_uid'
    REQUIRED_FIELDS = []
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return self.email or self.firebase_uid


class Profile(models.Model):
    """Extended user profile information"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=255)
    bio = models.TextField(blank=True)
    timezone = models.CharField(max_length=50, default='UTC')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'profiles'
    
    def __str__(self):
        return f"Profile: {self.full_name}"


class Couple(models.Model):
    """Couple relationship linking two users"""
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='couple_as_user1')
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='couple_as_user2')
    anniversary_date = models.DateField(null=True, blank=True)
    invite_code = models.CharField(max_length=16, unique=True, db_index=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'couples'
        indexes = [
            models.Index(fields=['invite_code']),
        ]
    
    def __str__(self):
        user2_name = self.user2.email if self.user2 else 'Pending'
        return f"{self.user1.email} & {user2_name}"
    
    def is_member(self, user):
        """Check if a user is part of this couple"""
        return user.id in [self.user1_id, self.user2_id]
