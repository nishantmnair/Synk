from django.contrib import admin
from .models import Task, Milestone, Activity, Suggestion, Collection, UserPreferences, Couple, CouplingCode, DailyConnectionPrompt


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'status', 'priority', 'user', 'created_at']
    list_filter = ['status', 'priority', 'created_at']
    search_fields = ['title', 'description']


@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    list_display = ['name', 'status', 'date', 'user', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name']


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ['activity_user', 'action', 'item', 'user', 'created_at']
    list_filter = ['activity_user', 'created_at']
    search_fields = ['item']


@admin.register(Suggestion)
class SuggestionAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'suggested_by', 'user', 'created_at']
    list_filter = ['category', 'created_at']
    search_fields = ['title', 'description']


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon', 'user', 'created_at']
    search_fields = ['name']


@admin.register(UserPreferences)
class UserPreferencesAdmin(admin.ModelAdmin):
    list_display = ['user']


@admin.register(Couple)
class CoupleAdmin(admin.ModelAdmin):
    list_display = ['user1', 'user2', 'created_at']
    search_fields = ['user1__username', 'user2__username']


@admin.register(CouplingCode)
class CouplingCodeAdmin(admin.ModelAdmin):
    list_display = ['code', 'created_by', 'used_by', 'expires_at', 'created_at']
    list_filter = ['expires_at', 'created_at']
    search_fields = ['code', 'created_by__username', 'used_by__username']


@admin.register(DailyConnectionPrompt)
class DailyConnectionPromptAdmin(admin.ModelAdmin):
    list_display = ['prompt_text', 'category', 'is_active', 'created_at']
    list_filter = ['category', 'is_active', 'created_at']
    search_fields = ['prompt_text']
    readonly_fields = ['created_at', 'updated_at']
