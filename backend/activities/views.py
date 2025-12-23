from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.utils import timezone
from .models import Section, Activity, ActivityHistory, ActivityReminder
from .serializers import (
    SectionSerializer, ActivitySerializer,
    ActivityHistorySerializer, ActivityReminderSerializer
)
from users.models import Couple


class IsCoupleeMember(IsAuthenticated):
    """Permission to check if user is a member of the couple"""
    
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'couple'):
            return obj.couple.is_member(request.user)
        return False


class SectionViewSet(viewsets.ModelViewSet):
    """Section management"""
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    permission_classes = [IsCoupleeMember]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['display_order', 'created_at']
    ordering = ['display_order']
    
    def get_queryset(self):
        user = self.request.user
        return Section.objects.filter(
            Q(couple__user1=user) | Q(couple__user2=user)
        ).select_related('couple', 'parent_section')
    
    @action(detail=False, methods=['get'])
    def by_couple(self, request):
        """Get sections for a specific couple"""
        couple_id = request.query_params.get('couple_id')
        if not couple_id:
            return Response({'error': 'couple_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        sections = self.get_queryset().filter(couple_id=couple_id, parent_section__isnull=True)
        serializer = self.get_serializer(sections, many=True)
        return Response(serializer.data)


class ActivityViewSet(viewsets.ModelViewSet):
    """Activity management with full CRUD"""
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    permission_classes = [IsCoupleeMember]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['display_order', 'created_at', 'last_completed_at']
    ordering = ['display_order']
    
    def get_queryset(self):
        user = self.request.user
        queryset = Activity.objects.filter(
            Q(couple__user1=user) | Q(couple__user2=user)
        ).select_related('couple', 'section').prefetch_related('history')
        
        # Filter by status
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter deleted/active
        show_deleted = self.request.query_params.get('show_deleted', 'false').lower() == 'true'
        if not show_deleted:
            queryset = queryset.filter(is_deleted=False)
        
        # Filter by section
        section_id = self.request.query_params.get('section_id')
        if section_id:
            queryset = queryset.filter(section_id=section_id)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def mark_complete(self, request, pk=None):
        """Mark activity as complete and log history if recurring"""
        activity = self.get_object()
        activity.status = 'finished'
        activity.last_completed_at = timezone.now()
        activity.save()
        
        if activity.is_recurring:
            ActivityHistory.objects.create(
                activity=activity,
                completed_by=request.user,
                notes=request.data.get('notes', '')
            )
        
        serializer = self.get_serializer(activity)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restore a deleted activity"""
        activity = self.get_object()
        activity.is_deleted = False
        activity.save()
        
        serializer = self.get_serializer(activity)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """Bulk update display order"""
        activity_orders = request.data.get('orders', [])  # [{id: 1, display_order: 0}, ...]
        
        for item in activity_orders:
            Activity.objects.filter(id=item['id']).update(display_order=item['display_order'])
        
        return Response({'status': 'success'})


class ActivityReminderViewSet(viewsets.ModelViewSet):
    """Activity reminder management"""
    queryset = ActivityReminder.objects.all()
    serializer_class = ActivityReminderSerializer
    permission_classes = [IsCoupleeMember]
    
    def get_queryset(self):
        user = self.request.user
        queryset = ActivityReminder.objects.filter(
            Q(couple__user1=user) | Q(couple__user2=user)
        )
        
        # Filter dismissed/active
        show_dismissed = self.request.query_params.get('show_dismissed', 'false').lower() == 'true'
        if not show_dismissed:
            queryset = queryset.filter(dismissed=False)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Dismiss a reminder"""
        reminder = self.get_object()
        reminder.dismissed = True
        reminder.save()
        
        serializer = self.get_serializer(reminder)
        return Response(serializer.data)
