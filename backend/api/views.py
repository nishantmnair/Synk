from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from contextlib import suppress
from django.db import models as django_models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.mail import send_mail
from datetime import timedelta, date
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import (
    Task, Milestone, Activity, Suggestion, Collection, UserPreferences,
    Couple, CouplingCode, DailyConnection, DailyConnectionAnswer, InboxItem, Memory
)
from .serializers import (
    TaskSerializer, MilestoneSerializer, ActivitySerializer,
    SuggestionSerializer, CollectionSerializer, UserPreferencesSerializer,
    UserSerializer, UserRegistrationSerializer, CoupleSerializer, CouplingCodeSerializer,
    UserDetailSerializer, UserProfileSerializer, DailyConnectionSerializer,
    DailyConnectionAnswerSerializer, InboxItemSerializer, MemorySerializer
)
from .mixins import PartnerResolutionMixin, BroadcastMixin




# Minimal AI views kept for URL resolution and simple testing
class PlanDateView(APIView):
    """Placeholder view for AI plan date endpoint"""
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        return Response({'detail': 'plan date placeholder'}, status=status.HTTP_200_OK)


class ProTipView(APIView):
    """Placeholder view for AI pro tip endpoint"""
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        return Response({'detail': 'pro tip placeholder'}, status=status.HTTP_200_OK)


class DailyPromptView(APIView):
    """Placeholder view for AI daily prompt endpoint"""
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        return Response({'detail': 'daily prompt placeholder'}, status=status.HTTP_200_OK)


class AuthLogoutView(APIView):
    """
    POST /api/auth/logout - Logout endpoint
    Ends user session by invalidating refresh token
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Logout user by invalidating refresh token
        """
        try:
            # In JWT, logout is handled by blacklisting tokens (optional)
            # For now, we just return success since client will discard tokens
            return Response(
                {
                    'status': 'success',
                    'detail': 'Successfully logged out.'
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {
                    'status': 'error',
                    'detail': f'Logout failed: {str(e)}'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TaskViewSet(PartnerResolutionMixin, BroadcastMixin, viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Get tasks for user and their partner if coupled
        partner = self.get_partner(user)
        if partner:
            return Task.objects.filter(user__in=[user, partner])
        return Task.objects.filter(user=user)
    
    def perform_create(self, serializer):
        task = serializer.save()
        self.broadcast('task:created', TaskSerializer(task).data)
    
    def perform_update(self, serializer):
        task = serializer.save()
        self.broadcast('task:updated', TaskSerializer(task).data)
    
    def perform_destroy(self, instance):
        task_id = instance.id
        instance.delete()
        self.broadcast('task:deleted', {'id': task_id})


class MilestoneViewSet(PartnerResolutionMixin, BroadcastMixin, viewsets.ModelViewSet):
    serializer_class = MilestoneSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Get milestones for user and their partner if coupled
        partner = self.get_partner(user)
        if partner:
            return Milestone.objects.filter(user__in=[user, partner])
        return Milestone.objects.filter(user=user)
    
    def perform_create(self, serializer):
        milestone = serializer.save()
        self.broadcast('milestone:created', MilestoneSerializer(milestone).data)
    
    def perform_update(self, serializer):
        milestone = serializer.save()
        self.broadcast('milestone:updated', MilestoneSerializer(milestone).data)
    
    def perform_destroy(self, instance):
        milestone_id = instance.id
        instance.delete()
        self.broadcast('milestone:deleted', {'id': milestone_id})


class ActivityViewSet(PartnerResolutionMixin, BroadcastMixin, viewsets.ModelViewSet):
    serializer_class = ActivitySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        limit = int(self.request.query_params.get('limit', 50))
        # Get activities for user and their partner if coupled
        partner = self.get_partner(user)
        if partner:
            return Activity.objects.filter(user__in=[user, partner])[:limit]
        return Activity.objects.filter(user=user)[:limit]
    
    def perform_create(self, serializer):
        activity = serializer.save()
        self.broadcast('activity:created', ActivitySerializer(activity).data)


class SuggestionViewSet(PartnerResolutionMixin, BroadcastMixin, viewsets.ModelViewSet):
    serializer_class = SuggestionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Get suggestions for user and their partner if coupled
        partner = self.get_partner(user)
        if partner:
            return Suggestion.objects.filter(user__in=[user, partner])
        return Suggestion.objects.filter(user=user)
    
    def perform_create(self, serializer):
        suggestion = serializer.save()
        self.broadcast('suggestion:created', SuggestionSerializer(suggestion).data)
    
    def perform_destroy(self, instance):
        suggestion_id = instance.id
        instance.delete()
        self.broadcast('suggestion:deleted', {'id': suggestion_id})


class CollectionViewSet(PartnerResolutionMixin, BroadcastMixin, viewsets.ModelViewSet):
    serializer_class = CollectionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Get collections for user and their partner if coupled
        partner = self.get_partner(user)
        if partner:
            return Collection.objects.filter(user__in=[user, partner]).order_by('-created_at')
        return Collection.objects.filter(user=user).order_by('-created_at')
    
    def perform_create(self, serializer):
        collection = serializer.save()
        self.broadcast('collection:created', CollectionSerializer(collection).data)
    
    def perform_update(self, serializer):
        collection = serializer.save()
        self.broadcast('collection:updated', CollectionSerializer(collection).data)
    
    def perform_destroy(self, instance):
        collection_id = instance.id
        instance.delete()
        self.broadcast('collection:deleted', {'id': collection_id})


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
    
    def _broadcast(self, event_type, data):
        channel_layer = get_channel_layer()
        # Broadcast to current user
        async_to_sync(channel_layer.group_send)(
            f"user_{self.request.user.id}",
            {
                "type": "send_message",
                "event": event_type,
                "data": data
            }
        )
        # Broadcast to partner if coupled
        if partner := self._get_partner(self.request.user):
            async_to_sync(channel_layer.group_send)(
                f"user_{partner.id}",
                {
                    "type": "send_message",
                    "event": event_type,
                    "data": data
                }
            )


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserDetailSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return User.objects.filter(id=self.request.user.id)
    
    @action(detail=False, methods=['get', 'put'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Get or update current user profile
        GET /api/users/me - Get current user profile
        PUT /api/users/me - Update current user profile
        
        PUT accepts:
        - first_name (string, optional)
        - last_name (string, optional)
        - email (string, optional)
        
        Returns:
            200: User profile data
            400: Validation error
            401: Unauthorized
        """
        user = request.user
        
        if request.method == 'GET':
            serializer = UserDetailSerializer(user)
            return Response({
                'status': 'success',
                'message': 'User profile retrieved successfully.',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        
        elif request.method == 'PUT':
            # Update user fields
            first_name = request.data.get('first_name')
            last_name = request.data.get('last_name')
            email = request.data.get('email')
            
            if first_name is not None:
                user.first_name = first_name
            if last_name is not None:
                user.last_name = last_name
            if email is not None:
                # Check if email already exists for another user
                if User.objects.filter(email__iexact=email.lower()).exclude(id=user.id).exists():
                    return Response(
                        {
                            'status': 'error',
                            'message': 'Email already exists.',
                            'errors': {'email': 'A user with this email already exists.'}
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                user.email = email.lower()
            
            user.save()
            
            # Update UserProfile email_normalized
            with suppress(Exception):
                user.profile.email_normalized = user.email.lower()
                user.profile.updated_at = timezone.now()
                user.profile.save(update_fields=['email_normalized', 'updated_at'])
            
            serializer = UserDetailSerializer(user)
            return Response({
                'status': 'success',
                'message': 'Profile updated successfully.',
                'data': serializer.data
            }, status=status.HTTP_200_OK)

    
    @action(detail=False, methods=['post'])
    def delete_account(self, request):
        """Delete user account and all associated data"""
        from .serializers import AccountDeletionSerializer
        from .exceptions import ValidationError as SynkValidationError
        from django.core.mail import send_mail
        
        serializer = AccountDeletionSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            # Use custom exception to ensure standardized error response format
            raise SynkValidationError(
                detail="Password validation failed",
                code="password_validation_error",
                field_errors=serializer.errors
            )
        
        user = request.user
        email = user.email
        username = user.username
        
        try:
            # Send confirmation email before deletion
            with suppress(Exception):
                send_mail(
                    subject='Your Synk Account Has Been Deleted',
                    message=f'Your account "{username}" and all associated data have been permanently deleted from Synk.',
                    from_email='noreply@synk.local',
                    recipient_list=[email],
                    fail_silently=True,
                )
            
            # Delete all associated data (cascading deletes handled by Django models)
            user.delete()
            
            return Response(
                {'status': 'success', 'detail': 'Account successfully deleted.'}, 
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'status': 'error', 'detail': f'Error deleting account: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )




class UserRegistrationViewSet(viewsets.GenericViewSet):
    """
    POST /api/register - User registration endpoint
    Creates new user account with email and password
    
    Request:
        - email (string, required)
        - password (string, required)
        - password_confirm (string, required)
        - username (string, required)
        - first_name (string, optional)
        - last_name (string, optional)
        - coupling_code (string, optional)
    
    Returns:
        201: User account created successfully
        400: Validation error
        500: Server error
    """
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    queryset = User.objects.none()  # Empty queryset since we're not listing users
    
    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)  # Let error handler deal with validation errors
        
        # Let exceptions propagate to global handler for consistent error formatting
        user = serializer.save()
        
        # If a coupling code is provided, try to couple the accounts
        if coupling_code := request.data.get('coupling_code', '').strip().upper():
            with suppress(CouplingCode.DoesNotExist):
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
        
        # Update UserProfile with last login
        with suppress(Exception):
            user.profile.last_login_at = timezone.now()
            user.profile.save(update_fields=['last_login_at'])
        
        # Return standardized success response (frontend logs in separately to get tokens)
        return Response(
            {
                'status': 'success',
                'message': 'User account created successfully.',
                'data': UserSerializer(user).data
            },
            status=status.HTTP_201_CREATED
        )


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


class DailyConnectionViewSet(PartnerResolutionMixin, BroadcastMixin, viewsets.ModelViewSet):
    """
    ViewSet for managing daily connections and answers.
    - GET /api/daily-connections/ - Get all daily connections for couple
    - GET /api/daily-connections/today/ - Get today's daily connection
    - POST /api/daily-connections/{id}/answer/ - Submit an answer to a daily connection
    """
    serializer_class = DailyConnectionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if partner := self.get_partner(user):
            # Get couple that includes current user
            if couple := Couple.objects.filter(
                django_models.Q(user1=user) | django_models.Q(user2=user)
            ).first():
                return DailyConnection.objects.filter(couple=couple)
        
        return DailyConnection.objects.none()
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's daily connection for the couple"""
        user = request.user
        
        if not (partner := self.get_partner(user)):
            # Return an empty daily connection if user is not coupled
            return Response({
                'id': None,
                'date': str(date.today()),
                'prompt': 'Connect with your partner to share daily prompts.',
                'answers': [],
                'created_at': None,
                'updated_at': None
            }, status=status.HTTP_200_OK)
        
        if not (couple := Couple.objects.filter(
            django_models.Q(user1=user) | django_models.Q(user2=user)
        ).first()):
            # Fallback if couple relationship not found despite partner existing
            return Response({
                'id': None,
                'date': str(date.today()),
                'prompt': 'Connect with your partner to share daily prompts.',
                'answers': [],
                'created_at': None,
                'updated_at': None
            }, status=status.HTTP_200_OK)
        
        today = date.today()
        connection, created = DailyConnection.objects.get_or_create(
            couple=couple,
            date=today,
            defaults={
                'prompt': 'What is something meaningful you want to share with your partner today?'
            }
        )
        
        serializer = self.get_serializer(connection)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def answer(self, request, pk=None):
        """Submit an answer to a daily connection"""
        connection = self.get_object()
        answer_text = request.data.get('answer_text', '').strip()
        
        if not answer_text:
            return Response(
                {'detail': 'Answer text cannot be empty'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create or update the answer
        answer, created = DailyConnectionAnswer.objects.update_or_create(
            connection=connection,
            user=request.user,
            defaults={'answer_text': answer_text}
        )
        
        # Create inbox item for partner
        if partner := self.get_partner(request.user):
            inbox_item = InboxItem.objects.create(
                recipient=partner,
                sender=request.user,
                item_type='connection_answer',
                title=f'{request.user.username} shared their daily connection answer',
                description=f'"{answer_text[:100]}..."' if len(answer_text) > 100 else f'"{answer_text}"',
                content={'prompt': connection.prompt, 'answer': answer_text},
                connection_answer=answer
            )
            
            # Broadcast to partner
            self.broadcast('connection_answer:created', {
                'connection_id': connection.id,
                'answer': DailyConnectionAnswerSerializer(answer).data
            })
            
            # Broadcast inbox:created event to partner
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"user_{partner.id}",
                {
                    "type": "send_message",
                    "event": "inbox:created",
                    "data": InboxItemSerializer(inbox_item).data
                }
            )
        
        serializer = DailyConnectionAnswerSerializer(answer)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class InboxItemViewSet(BroadcastMixin, viewsets.ModelViewSet):
    """
    ViewSet for managing inbox items.
    - GET /api/inbox/ - Get all inbox items for current user
    - GET /api/inbox/unread/ - Get unread inbox items
    - POST /api/inbox/{id}/mark-as-read/ - Mark inbox item as read
    
    Real-time updates are handled automatically via Django signals.
    """
    serializer_class = InboxItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return InboxItem.objects.filter(recipient=self.request.user)
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get unread inbox items"""
        unread_items = self.get_queryset().filter(is_read=False)
        
        page = self.paginate_queryset(unread_items)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(unread_items, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark an inbox item as read"""
        item = self.get_object()
        item.is_read = True
        item.save()  # This will trigger the signal and broadcast
        
        serializer = self.get_serializer(item)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Mark all inbox items as read"""
        items = self.get_queryset().filter(is_read=False)
        
        # Update and broadcast each item
        updated = 0
        for item in items:
            item.is_read = True
            item.save()  # This will trigger the signal and broadcast
            updated += 1
        
        return Response(
            {'detail': f'{updated} items marked as read'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def react(self, request, pk=None):
        """React with heart to an inbox item"""
        item = self.get_object()
        item.has_reacted = True
        item.save()  # This will trigger the signal and broadcast
        
        serializer = self.get_serializer(item)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def share_response(self, request, pk=None):
        """Share a response to an inbox item"""
        item = self.get_object()
        response_text = request.data.get('response', '').strip()
        
        if not response_text:
            return Response(
                {'detail': 'Response text cannot be empty'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        item.response = response_text
        item.responded_at = timezone.now()
        item.save()  # This will trigger the signal and broadcast
        
        serializer = self.get_serializer(item)
        return Response(serializer.data, status=status.HTTP_200_OK)

class MemoryViewSet(PartnerResolutionMixin, BroadcastMixin, viewsets.ModelViewSet):
    """
    ViewSet for managing shared memories.
    - GET /api/memories/ - Get all memories for current user and partner
    - POST /api/memories/ - Create a new memory
    - GET /api/memories/{id}/ - Get a specific memory
    - PUT /api/memories/{id}/ - Update a memory
    - PATCH /api/memories/{id}/ - Partial update a memory
    - DELETE /api/memories/{id}/ - Delete a memory
    
    Real-time updates are handled automatically via Django signals.
    """
    serializer_class = MemorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Get memories for user and their partner if coupled
        partner = self.get_partner(user)
        if partner:
            return Memory.objects.filter(user__in=[user, partner])
        return Memory.objects.filter(user=user)
    
    def perform_create(self, serializer):
        memory = serializer.save()
        self.broadcast('memory:created', MemorySerializer(memory).data)
    
    def perform_update(self, serializer):
        memory = serializer.save()
        self.broadcast('memory:updated', MemorySerializer(memory).data)
    
    def perform_destroy(self, instance):
        memory_id = instance.id
        instance.delete()
        self.broadcast('memory:deleted', {'id': memory_id})
    
    @action(detail=True, methods=['post'])
    def toggle_favorite(self, request, pk=None):
        """Toggle favorite status of a memory"""
        memory = self.get_object()
        memory.is_favorite = not memory.is_favorite
        memory.save()
        
        serializer = self.get_serializer(memory)
        self.broadcast('memory:updated', serializer.data)
        return Response(serializer.data, status=status.HTTP_200_OK)