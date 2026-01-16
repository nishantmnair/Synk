from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.utils import timezone
from django.db import models as django_models
from datetime import timedelta
from .models import Task, Milestone, Activity, Suggestion, Collection, UserPreferences, Couple, CouplingCode
from .serializers import (
    TaskSerializer, MilestoneSerializer, ActivitySerializer,
    SuggestionSerializer, CollectionSerializer, UserPreferencesSerializer, 
    UserSerializer, UserRegistrationSerializer, CoupleSerializer, CouplingCodeSerializer
)
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Get tasks for user and their partner if coupled
        partner = self._get_partner(user)
        if partner:
            return Task.objects.filter(user__in=[user, partner])
        return Task.objects.filter(user=user)
    
    def _get_partner(self, user):
        """Helper to get user's partner if coupled"""
        try:
            couple = Couple.objects.get(user1=user)
            return couple.user2
        except Couple.DoesNotExist:
            try:
                couple = Couple.objects.get(user2=user)
                return couple.user1
            except Couple.DoesNotExist:
                return None
    
    def perform_create(self, serializer):
        task = serializer.save()
        self._broadcast('task:created', TaskSerializer(task).data)
    
    def perform_update(self, serializer):
        task = serializer.save()
        self._broadcast('task:updated', TaskSerializer(task).data)
    
    def perform_destroy(self, instance):
        task_id = instance.id
        instance.delete()
        self._broadcast('task:deleted', {'id': task_id})
    
    def _broadcast(self, event_type, data):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{self.request.user.id}",
            {
                "type": "send_message",
                "event": event_type,
                "data": data
            }
        )


class MilestoneViewSet(viewsets.ModelViewSet):
    serializer_class = MilestoneSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Get milestones for user and their partner if coupled
        partner = self._get_partner(user)
        if partner:
            return Milestone.objects.filter(user__in=[user, partner])
        return Milestone.objects.filter(user=user)
    
    def _get_partner(self, user):
        """Helper to get user's partner if coupled"""
        try:
            couple = Couple.objects.get(user1=user)
            return couple.user2
        except Couple.DoesNotExist:
            try:
                couple = Couple.objects.get(user2=user)
                return couple.user1
            except Couple.DoesNotExist:
                return None
    
    def perform_create(self, serializer):
        milestone = serializer.save()
        self._broadcast('milestone:created', MilestoneSerializer(milestone).data)
    
    def perform_update(self, serializer):
        milestone = serializer.save()
        self._broadcast('milestone:updated', MilestoneSerializer(milestone).data)
    
    def perform_destroy(self, instance):
        milestone_id = instance.id
        instance.delete()
        self._broadcast('milestone:deleted', {'id': milestone_id})
    
    def _broadcast(self, event_type, data):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{self.request.user.id}",
            {
                "type": "send_message",
                "event": event_type,
                "data": data
            }
        )


class ActivityViewSet(viewsets.ModelViewSet):
    serializer_class = ActivitySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        limit = int(self.request.query_params.get('limit', 50))
        # Get activities for user and their partner if coupled
        partner = self._get_partner(user)
        if partner:
            return Activity.objects.filter(user__in=[user, partner])[:limit]
        return Activity.objects.filter(user=user)[:limit]
    
    def _get_partner(self, user):
        """Helper to get user's partner if coupled"""
        try:
            couple = Couple.objects.get(user1=user)
            return couple.user2
        except Couple.DoesNotExist:
            try:
                couple = Couple.objects.get(user2=user)
                return couple.user1
            except Couple.DoesNotExist:
                return None
    
    def perform_create(self, serializer):
        activity = serializer.save()
        self._broadcast('activity:created', ActivitySerializer(activity).data)
    
    def _broadcast(self, event_type, data):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{self.request.user.id}",
            {
                "type": "send_message",
                "event": event_type,
                "data": data
            }
        )


class SuggestionViewSet(viewsets.ModelViewSet):
    serializer_class = SuggestionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Get suggestions for user and their partner if coupled
        partner = self._get_partner(user)
        if partner:
            return Suggestion.objects.filter(user__in=[user, partner])
        return Suggestion.objects.filter(user=user)
    
    def _get_partner(self, user):
        """Helper to get user's partner if coupled"""
        try:
            couple = Couple.objects.get(user1=user)
            return couple.user2
        except Couple.DoesNotExist:
            try:
                couple = Couple.objects.get(user2=user)
                return couple.user1
            except Couple.DoesNotExist:
                return None
    
    def perform_create(self, serializer):
        suggestion = serializer.save()
        self._broadcast('suggestion:created', SuggestionSerializer(suggestion).data)
    
    def perform_destroy(self, instance):
        suggestion_id = instance.id
        instance.delete()
        self._broadcast('suggestion:deleted', {'id': suggestion_id})
    
    def _broadcast(self, event_type, data):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{self.request.user.id}",
            {
                "type": "send_message",
                "event": event_type,
                "data": data
            }
        )


class CollectionViewSet(viewsets.ModelViewSet):
    serializer_class = CollectionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Get collections for user and their partner if coupled
        partner = self._get_partner(user)
        if partner:
            return Collection.objects.filter(user__in=[user, partner])
        return Collection.objects.filter(user=user)
    
    def _get_partner(self, user):
        """Helper to get user's partner if coupled"""
        try:
            couple = Couple.objects.get(user1=user)
            return couple.user2
        except Couple.DoesNotExist:
            try:
                couple = Couple.objects.get(user2=user)
                return couple.user1
            except Couple.DoesNotExist:
                return None
    
    def perform_create(self, serializer):
        collection = serializer.save()
        self._broadcast('collection:created', CollectionSerializer(collection).data)
    
    def perform_update(self, serializer):
        collection = serializer.save()
        self._broadcast('collection:updated', CollectionSerializer(collection).data)
    
    def perform_destroy(self, instance):
        collection_id = instance.id
        instance.delete()
        self._broadcast('collection:deleted', {'id': collection_id})
    
    def _broadcast(self, event_type, data):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{self.request.user.id}",
            {
                "type": "send_message",
                "event": event_type,
                "data": data
            }
        )


class UserPreferencesViewSet(viewsets.ModelViewSet):
    serializer_class = UserPreferencesSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserPreferences.objects.filter(user=self.request.user)
    
    def list(self, request):
        preferences, created = UserPreferences.objects.get_or_create(
            user=request.user,
            defaults={
                'anniversary': '2024-01-15',
                'is_private': True,
                'notifications': True,
                'vibe': 'Feeling adventurous'
            }
        )
        serializer = self.get_serializer(preferences)
        return Response(serializer.data)
    
    def perform_update(self, serializer):
        preferences = serializer.save()
        self._broadcast('preferences:updated', UserPreferencesSerializer(preferences).data)
    
    def _broadcast(self, event_type, data):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{self.request.user.id}",
            {
                "type": "send_message",
                "event": event_type,
                "data": data
            }
        )


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return User.objects.filter(id=self.request.user.id)


class UserRegistrationViewSet(viewsets.GenericViewSet):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    queryset = User.objects.none()  # Empty queryset since we're not listing users
    
    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # If a coupling code is provided, try to couple the accounts
            coupling_code = request.data.get('coupling_code', '').strip().upper()
            if coupling_code:
                try:
                    code_obj = CouplingCode.objects.get(
                        code=coupling_code,
                        used_by__isnull=True,
                        expires_at__gt=timezone.now()
                    )
                    # Create couple relationship
                    couple = Couple.objects.create(
                        user1=code_obj.created_by,
                        user2=user
                    )
                    # Mark code as used
                    code_obj.used_by = user
                    code_obj.used_at = timezone.now()
                    code_obj.save()
                except CouplingCode.DoesNotExist:
                    # Invalid or expired code - user is created but not coupled
                    pass
            
            # Return user data (without password)
            user_serializer = UserSerializer(user)
            return Response(user_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CoupleViewSet(viewsets.ModelViewSet):
    serializer_class = CoupleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Get couple where user is either user1 or user2
        return Couple.objects.filter(
            django_models.Q(user1=user) | django_models.Q(user2=user)
        )
    
    def list(self, request):
        """Get current user's couple status"""
        user = request.user
        try:
            couple = Couple.objects.get(user1=user)
        except Couple.DoesNotExist:
            try:
                couple = Couple.objects.get(user2=user)
            except Couple.DoesNotExist:
                return Response({'is_coupled': False, 'partner': None})
        
        serializer = self.get_serializer(couple, context={'request': request})
        return Response({'is_coupled': True, **serializer.data})
    
    def create(self, request):
        """Coupling should only happen via code - this endpoint is for admin use"""
        return Response({'detail': 'Use coupling codes to couple accounts'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['delete'])
    def uncouple(self, request):
        """Remove couple relationship"""
        user = request.user
        
        try:
            couple = Couple.objects.get(user1=user)
            couple.delete()
            return Response({'detail': 'Successfully uncoupled'}, status=status.HTTP_200_OK)
        except Couple.DoesNotExist:
            try:
                couple = Couple.objects.get(user2=user)
                couple.delete()
                return Response({'detail': 'Successfully uncoupled'}, status=status.HTTP_200_OK)
            except Couple.DoesNotExist:
                return Response(
                    {'detail': 'You are not currently coupled'},
                    status=status.HTTP_400_BAD_REQUEST
                )


class CouplingCodeViewSet(viewsets.ModelViewSet):
    serializer_class = CouplingCodeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only show codes created by current user that are not used
        return CouplingCode.objects.filter(
            created_by=self.request.user,
            used_by__isnull=True,
            expires_at__gt=timezone.now()
        )
    
    def create(self, request):
        """Generate a new coupling code"""
        user = request.user
        
        # Check if user is already coupled
        if Couple.objects.filter(user1=user).exists() or Couple.objects.filter(user2=user).exists():
            return Response(
                {'detail': 'You are already coupled with someone. Please uncouple first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate code with 24 hour expiry
        code = CouplingCode.generate_code()
        expires_at = timezone.now() + timedelta(hours=24)
        
        coupling_code = CouplingCode.objects.create(
            created_by=user,
            code=code,
            expires_at=expires_at
        )
        
        serializer = self.get_serializer(coupling_code)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def use(self, request):
        """Use a coupling code to connect accounts"""
        user = request.user
        code = request.data.get('code', '').strip().upper()
        
        if not code:
            return Response({'detail': 'Code is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user is already coupled
        if Couple.objects.filter(user1=user).exists() or Couple.objects.filter(user2=user).exists():
            return Response(
                {'detail': 'You are already coupled with someone. Please uncouple first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            code_obj = CouplingCode.objects.get(
                code=code,
                used_by__isnull=True,
                expires_at__gt=timezone.now()
            )
            
            # Don't allow self-coupling
            if code_obj.created_by == user:
                return Response(
                    {'detail': 'You cannot use your own coupling code'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create couple relationship
            couple = Couple.objects.create(
                user1=code_obj.created_by,
                user2=user
            )
            
            # Mark code as used
            code_obj.used_by = user
            code_obj.used_at = timezone.now()
            code_obj.save()
            
            serializer = CoupleSerializer(couple, context={'request': request})
            return Response({'is_coupled': True, **serializer.data}, status=status.HTTP_201_CREATED)
            
        except CouplingCode.DoesNotExist:
            return Response(
                {'detail': 'Invalid or expired coupling code'},
                status=status.HTTP_400_BAD_REQUEST
            )
