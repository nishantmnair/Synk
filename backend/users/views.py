from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q
from .models import User, Profile, Couple
from .serializers import UserSerializer, ProfileSerializer, CoupleSerializer
import secrets
from firebase_admin import auth as firebase_auth


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
    def join(self, request):
        """Join a couple using invite code"""
        invite_code = request.data.get('invite_code')
        
        if not invite_code:
            return Response({'error': 'Invite code required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user is already part of a couple
        existing_couple = Couple.objects.filter(
            Q(user1=request.user) | Q(user2=request.user)
        ).first()
        if existing_couple:
            return Response({'error': 'You are already part of a couple'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            couple = Couple.objects.get(invite_code=invite_code)
            
            # Check if user is trying to join their own couple
            if couple.user1 == request.user:
                return Response({'error': 'Cannot join your own couple'}, status=status.HTTP_400_BAD_REQUEST)
            
            if couple.user2:
                return Response({'error': 'Couple already complete'}, status=status.HTTP_400_BAD_REQUEST)
            
            couple.user2 = request.user
            couple.save()
            
            serializer = self.get_serializer(couple)
            return Response(serializer.data)
        
        except Couple.DoesNotExist:
            return Response({'error': 'Invalid invite code'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([AllowAny])
def signup_with_email(request):
    """Create a new user with email and password"""
    email = request.data.get('email')
    password = request.data.get('password')
    name = request.data.get('name', '').strip()
    
    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not name:
        return Response({'error': 'Name is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Create user in Firebase
        firebase_user = firebase_auth.create_user(
            email=email,
            password=password,
            display_name=name
        )
        
        # Create user in Django
        user = User.objects.create_user(
            firebase_uid=firebase_user.uid,
            email=email,
            name=name
        )
        
        # Generate custom token for the user
        custom_token = firebase_auth.create_custom_token(firebase_user.uid)
        
        return Response({
            'message': 'User created successfully',
            'custom_token': custom_token.decode('utf-8'),
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name
            }
        }, status=status.HTTP_201_CREATED)
        
    except firebase_auth.EmailAlreadyExistsError:
        return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def signin_with_email(request):
    """Sign in with email - returns user info for frontend to authenticate with Firebase"""
    email = request.data.get('email')
    
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Verify user exists in Firebase
        firebase_user = firebase_auth.get_user_by_email(email)
        
        # Return success - frontend will handle Firebase authentication
        return Response({
            'message': 'User found',
            'firebase_uid': firebase_user.uid,
            'email': firebase_user.email
        }, status=status.HTTP_200_OK)
        
    except firebase_auth.UserNotFoundError:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
