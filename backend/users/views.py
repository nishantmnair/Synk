from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import User, Profile, Couple
from .serializers import UserSerializer, ProfileSerializer, CoupleSerializer
import secrets


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """User viewset - read-only"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class ProfileViewSet(viewsets.ModelViewSet):
    """Profile management"""
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Profile.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # Check if profile already exists
        if Profile.objects.filter(user=self.request.user).exists():
            raise serializers.ValidationError('Profile already exists for this user')
        serializer.save(user=self.request.user)


class CoupleViewSet(viewsets.ModelViewSet):
    """Couple management"""
    queryset = Couple.objects.all()
    serializer_class = CoupleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Couple.objects.filter(
            Q(user1=user) | Q(user2=user)
        )
    
    def perform_create(self, serializer):
        # Generate unique invite code
        invite_code = secrets.token_urlsafe(8).upper()[:8]
        serializer.save(user1=self.request.user, invite_code=invite_code)
    
    @action(detail=False, methods=['post'])
    def join_by_code(self, request):
        """Join a couple using invite code"""
        invite_code = request.data.get('invite_code')
        
        if not invite_code:
            return Response({'error': 'Invite code required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            couple = Couple.objects.get(invite_code=invite_code)
            
            if couple.user2:
                return Response({'error': 'Couple already complete'}, status=status.HTTP_400_BAD_REQUEST)
            
            couple.user2 = request.user
            couple.save()
            
            serializer = self.get_serializer(couple)
            return Response(serializer.data)
        
        except Couple.DoesNotExist:
            return Response({'error': 'Invalid invite code'}, status=status.HTTP_404_NOT_FOUND)
