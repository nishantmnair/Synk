from rest_framework import serializers
from .models import Section, Activity, ActivityHistory, ActivityReminder


class SectionSerializer(serializers.ModelSerializer):
    subsections = serializers.SerializerMethodField()
    
    class Meta:
        model = Section
        fields = ['id', 'couple', 'title', 'parent_section', 'display_order', 'subsections', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_subsections(self, obj):
        subsections = obj.subsections.all()
        return SectionSerializer(subsections, many=True).data


class ActivityHistorySerializer(serializers.ModelSerializer):
    completed_by_email = serializers.EmailField(source='completed_by.email', read_only=True)
    
    class Meta:
        model = ActivityHistory
        fields = ['id', 'activity', 'completed_by', 'completed_by_email', 'completed_at', 'notes']
        read_only_fields = ['id', 'completed_at']


class ActivitySerializer(serializers.ModelSerializer):
    section_title = serializers.CharField(source='section.title', read_only=True)
    history = ActivityHistorySerializer(many=True, read_only=True)
    
    class Meta:
        model = Activity
        fields = [
            'id', 'couple', 'section', 'section_title',
            'title', 'description', 'status',
            'is_deleted', 'is_recurring', 'recurrence_interval', 'last_completed_at',
            'display_order', 'history',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ActivityReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityReminder
        fields = ['id', 'couple', 'activity_title', 'dismissed', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
