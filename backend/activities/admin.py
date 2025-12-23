from django.contrib import admin
from .models import Section, Activity, ActivityHistory, ActivityReminder


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ['title', 'couple', 'parent_section', 'display_order', 'created_at']
    list_filter = ['couple', 'created_at']
    search_fields = ['title']
    ordering = ['couple', 'display_order']


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ['title', 'couple', 'section', 'status', 'is_recurring', 'is_deleted', 'created_at']
    list_filter = ['status', 'is_deleted', 'is_recurring', 'created_at']
    search_fields = ['title', 'description']
    ordering = ['couple', 'display_order']


@admin.register(ActivityHistory)
class ActivityHistoryAdmin(admin.ModelAdmin):
    list_display = ['activity', 'completed_by', 'completed_at']
    list_filter = ['completed_at']
    search_fields = ['activity__title', 'notes']
    readonly_fields = ['completed_at']


@admin.register(ActivityReminder)
class ActivityReminderAdmin(admin.ModelAdmin):
    list_display = ['activity_title', 'couple', 'dismissed', 'created_at']
    list_filter = ['dismissed', 'created_at']
    search_fields = ['activity_title']
