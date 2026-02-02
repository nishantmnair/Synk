from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from .models import Task, Milestone, Activity, Suggestion, Collection, UserPreferences, Couple, CouplingCode


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name']
        extra_kwargs = {
            'email': {'required': True},
            'username': {'required': True},
        }
    
    def validate_username(self, value):
        """Validate username"""
        if not value or not value.strip():
            raise serializers.ValidationError('Username cannot be empty.')
        if len(value.strip()) < 3:
            raise serializers.ValidationError('Username must be at least 3 characters long.')
        # Check if username already exists
        if User.objects.filter(username__iexact=value.strip()).exists():
            raise serializers.ValidationError('A user with this username already exists.')
        return value.strip()
    
    def validate_email(self, value):
        """Validate email"""
        if not value or not value.strip():
            raise serializers.ValidationError('Email is required.')
        # Check if email already exists
        if User.objects.filter(email__iexact=value.strip().lower()).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.strip().lower()
    
    def validate_password(self, value):
        """Validate password strength"""
        if len(value) < 8:
            raise serializers.ValidationError('Password must be at least 8 characters long.')
        return value
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        # Convert empty strings to None for optional fields
        if 'first_name' in validated_data and validated_data['first_name'] == '':
            validated_data['first_name'] = None
        if 'last_name' in validated_data and validated_data['last_name'] == '':
            validated_data['last_name'] = None
        
        # create_user already hashes the password, so we pass it directly
        # Validation methods above already check for duplicates, but keep try/except as safety net
        try:
            user = User.objects.create_user(password=password, **validated_data)
        except Exception as e:
            # Additional safety net for database-level constraints
            error_str = str(e).lower()
            if 'username' in error_str or 'unique constraint' in error_str:
                raise serializers.ValidationError({'username': 'A user with this username already exists.'})
            elif 'email' in error_str:
                raise serializers.ValidationError({'email': 'A user with this email already exists.'})
            raise serializers.ValidationError({'detail': 'Failed to create user. Please try again.'})
        
        return user


class TaskSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)  # Convert to string for frontend
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'category', 'priority', 'status', 'liked', 'fired',
            'progress', 'alex_progress', 'sam_progress', 'description', 'time',
            'location', 'avatars', 'created_at', 'updated_at', 'user'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = str(data['id'])  # Ensure ID is string
        return data
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class CoupleSerializer(serializers.ModelSerializer):
    user1 = UserSerializer(read_only=True)
    user2 = UserSerializer(read_only=True)
    partner = serializers.SerializerMethodField()
    
    class Meta:
        model = Couple
        fields = ['id', 'user1', 'user2', 'partner', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_partner(self, obj):
        """Return partner info based on current user"""
        request = self.context.get('request')
        if request and request.user:
            partner = obj.get_partner(request.user)
            if partner:
                return UserSerializer(partner).data
        return None


class CouplingCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CouplingCode
        fields = ['id', 'code', 'expires_at', 'created_at']
        read_only_fields = ['id', 'code', 'expires_at', 'created_at']


class MilestoneSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    
    class Meta:
        model = Milestone
        fields = [
            'id', 'name', 'date', 'status', 'sam_excitement', 'alex_excitement',
            'icon', 'created_at', 'updated_at', 'user'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = str(data['id'])
        return data
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class CoupleSerializer(serializers.ModelSerializer):
    user1 = UserSerializer(read_only=True)
    user2 = UserSerializer(read_only=True)
    partner = serializers.SerializerMethodField()
    
    class Meta:
        model = Couple
        fields = ['id', 'user1', 'user2', 'partner', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_partner(self, obj):
        """Return partner info based on current user"""
        request = self.context.get('request')
        if request and request.user:
            partner = obj.get_partner(request.user)
            if partner:
                return UserSerializer(partner).data
        return None


class CouplingCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CouplingCode
        fields = ['id', 'code', 'expires_at', 'created_at']
        read_only_fields = ['id', 'code', 'expires_at', 'created_at']


class ActivitySerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    user = serializers.CharField(write_only=True, required=False)  # Accept 'user' for activity_user on write
    user_display = serializers.SerializerMethodField(read_only=True)  # Display activity_user as 'user' on read
    
    class Meta:
        model = Activity
        fields = [
            'id', 'user', 'user_display', 'action', 'item', 'timestamp', 'avatar',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'user_display']
    
    def get_user_display(self, obj):
        return obj.activity_user  # Return 'Sam' or 'Alex' as 'user' field
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = str(data['id'])
        # Map user_display back to 'user' for frontend compatibility
        if 'user_display' in data:
            data['user'] = data.pop('user_display')
        return data
    
    def create(self, validated_data):
        # Handle 'user' field from frontend (which is actually activity_user)
        if 'user' in validated_data:
            validated_data['activity_user'] = validated_data.pop('user')
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class SuggestionSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    
    class Meta:
        model = Suggestion
        fields = [
            'id', 'title', 'suggested_by', 'date', 'description', 'location',
            'category', 'excitement', 'tags', 'created_at', 'user'
        ]
        read_only_fields = ['id', 'created_at', 'user']
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = str(data['id'])
        return data
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class CoupleSerializer(serializers.ModelSerializer):
    user1 = UserSerializer(read_only=True)
    user2 = UserSerializer(read_only=True)
    partner = serializers.SerializerMethodField()
    
    class Meta:
        model = Couple
        fields = ['id', 'user1', 'user2', 'partner', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_partner(self, obj):
        """Return partner info based on current user"""
        request = self.context.get('request')
        if request and request.user:
            partner = obj.get_partner(request.user)
            if partner:
                return UserSerializer(partner).data
        return None


class CouplingCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CouplingCode
        fields = ['id', 'code', 'expires_at', 'created_at']
        read_only_fields = ['id', 'code', 'expires_at', 'created_at']


class CollectionSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    
    class Meta:
        model = Collection
        fields = ['id', 'name', 'icon', 'color', 'created_at', 'user']
        read_only_fields = ['id', 'created_at', 'user']
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = str(data['id'])
        return data
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class CoupleSerializer(serializers.ModelSerializer):
    user1 = UserSerializer(read_only=True)
    user2 = UserSerializer(read_only=True)
    partner = serializers.SerializerMethodField()
    
    class Meta:
        model = Couple
        fields = ['id', 'user1', 'user2', 'partner', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_partner(self, obj):
        """Return partner info based on current user"""
        request = self.context.get('request')
        if request and request.user:
            partner = obj.get_partner(request.user)
            if partner:
                return UserSerializer(partner).data
        return None


class CouplingCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CouplingCode
        fields = ['id', 'code', 'expires_at', 'created_at']
        read_only_fields = ['id', 'code', 'expires_at', 'created_at']


class UserPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreferences
        fields = [
            'anniversary', 'is_private', 'notifications', 'vibe', 'updated_at'
        ]
        read_only_fields = ['updated_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class CoupleSerializer(serializers.ModelSerializer):
    user1 = UserSerializer(read_only=True)
    user2 = UserSerializer(read_only=True)
    partner = serializers.SerializerMethodField()
    
    class Meta:
        model = Couple
        fields = ['id', 'user1', 'user2', 'partner', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_partner(self, obj):
        """Return partner info based on current user"""
        request = self.context.get('request')
        if request and request.user:
            partner = obj.get_partner(request.user)
            if partner:
                return UserSerializer(partner).data
        return None


class CouplingCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CouplingCode
        fields = ['id', 'code', 'expires_at', 'created_at']
        read_only_fields = ['id', 'code', 'expires_at', 'created_at']


class AccountDeletionSerializer(serializers.Serializer):
    """Serializer for account deletion request"""
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    
    def validate_password(self, value):
        """Verify password is correct"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Password is incorrect.')
        return value
