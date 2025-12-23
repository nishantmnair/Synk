from django.contrib import admin
from .models import User, Profile, Couple


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'full_name', 'firebase_uid', 'is_active', 'created_at']
    search_fields = ['email', 'full_name', 'firebase_uid']
    list_filter = ['is_active', 'is_staff', 'created_at']
    readonly_fields = ['firebase_uid', 'created_at', 'updated_at']


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'full_name', 'created_at']
    search_fields = ['user__email', 'full_name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Couple)
class CoupleAdmin(admin.ModelAdmin):
    list_display = ['user1', 'user2', 'invite_code', 'anniversary_date', 'created_at']
    search_fields = ['invite_code', 'user1__email', 'user2__email']
    readonly_fields = ['invite_code', 'created_at', 'updated_at']
