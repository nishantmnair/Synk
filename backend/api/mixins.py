"""
Reusable mixins for ViewSets to avoid code duplication
"""
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.db.models import Q
from .models import Couple


class PartnerResolutionMixin:
    """
    Mixin for ViewSets that need access to both user's own data and partner's data.
    
    Provides a helper method to resolve the partner in a couple relationship.
    Useful for ViewSets like Task, Suggestion, Collection where coupled users
    should see each other's data.
    """
    
    @staticmethod
    def get_partner(user):
        """
        Get user's partner if coupled, otherwise None.
        
        Args:
            user: Django User object
            
        Returns:
            User object (the partner) or None if user is not coupled
        """
        try:
            couple = Couple.objects.get(user1=user)
            return couple.user2
        except Couple.DoesNotExist:
            try:
                couple = Couple.objects.get(user2=user)
                return couple.user1
            except Couple.DoesNotExist:
                return None


class BroadcastMixin:
    """
    Mixin for ViewSets that broadcast WebSocket events to users.
    
    Provides broadcast methods to send real-time updates via Django Channels.
    
    Usage:
        class TaskViewSet(PartnerResolutionMixin, BroadcastMixin, viewsets.ModelViewSet):
            def perform_create(self, serializer):
                task = serializer.save()
                self.broadcast('task:created', TaskSerializer(task).data)
    """
    
    def broadcast(self, event_type, data):
        """
        Broadcast a WebSocket event to the current user and their partner (if coupled).
        
        Args:
            event_type: String event type (e.g., 'task:created', 'suggestion:deleted')
            data: Serialized data to send to the client
        """
        channel_layer = get_channel_layer()
        # Send to current user
        async_to_sync(channel_layer.group_send)(
            f"user_{self.request.user.id}",
            {
                "type": "send_message",
                "event": event_type,
                "data": data
            }
        )
        
        # Send to partner if coupled
        if hasattr(self, 'get_partner'):
            if partner := self.get_partner(self.request.user):
                async_to_sync(channel_layer.group_send)(
                    f"user_{partner.id}",
                    {
                        "type": "send_message",
                        "event": event_type,
                        "data": data
                    }
                )

    def broadcast_to_user(self, user, event_type, data):
        """
        Broadcast a WebSocket event to a specific user.
        
        Args:
            user: Django User object to send the event to
            event_type: String event type (e.g., 'inbox:created')
            data: Serialized data to send to the client
        """
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{user.id}",
            {
                "type": "send_message",
                "event": event_type,
                "data": data
            }
        )
