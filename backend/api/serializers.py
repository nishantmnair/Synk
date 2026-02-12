from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Task, Milestone, Activity, Suggestion, Collection, UserPreferences,
    Couple, CouplingCode, UserProfile, Employment, Education, Skill, Project,
    DailyConnection, DailyConnectionAnswer, InboxItem, Memory
)
from .security import InputValidator, sanitize_input
import logging

logger = logging.getLogger(__name__)

# Field length constraints (OWASP: Validate all inputs)
MAX_FIELD_LENGTHS = {
    'username': 150,
    'email': 254,
    'first_name': 150,
    'last_name': 150,
    'password': 128,
    'title': 500,
    'description': 5000,
    'code': 50,
}


class BaseModelSerializer(serializers.ModelSerializer):
    """Base serializer with common validation and sanitization."""
    
    def validate_string_field(self, field_name: str, value: str, max_length: int = None) -> str:
        """
        Validate and sanitize a string field.
        OWASP requirement: All user input must be validated and sanitized.
        """
        if not isinstance(value, str):
            raise serializers.ValidationError(f'{field_name} must be a string.')
        
        # Get max length from class attribute or parameter
        max_len = max_length or MAX_FIELD_LENGTHS.get(field_name, 1000)
        
        try:
            value = InputValidator.sanitize_string(value, max_length=max_len)
        except ValueError as e:
            raise serializers.ValidationError(str(e)) from e
        
        return value


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']
    
    def validate_first_name(self, value):
        """Validate first name."""
        return self.validate_string_field('first_name', value) if value else value
    
    def validate_last_name(self, value):
        """Validate last name."""
        return self.validate_string_field('last_name', value) if value else value


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    id_uuid = serializers.UUIDField(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['id_uuid', 'user', 'email_normalized', 'created_at', 'updated_at', 'last_login_at']
        read_only_fields = ['id_uuid', 'created_at', 'updated_at', 'email_normalized']



class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        max_length=128,
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        min_length=8,
        max_length=128,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name']
        extra_kwargs = {
            'email': {'required': True, 'max_length': 254},
            'username': {'required': True, 'max_length': 150},
            'first_name': {'max_length': 150, 'allow_blank': True},
            'last_name': {'max_length': 150, 'allow_blank': True},
        }
    
    def validate_username(self, value):
        """Validate username per OWASP input validation rules."""
        if not value or not value.strip():
            raise serializers.ValidationError('Username cannot be empty.')
        
        value = value.strip()
        
        if len(value) < 3:
            raise serializers.ValidationError('Username must be at least 3 characters long.')
        
        if len(value) > 150:
            raise serializers.ValidationError('Username must not exceed 150 characters.')
        
        # Only alphanumeric, underscore, hyphen, and dot
        import re
        if not re.match(r'^[a-zA-Z0-9._-]+$', value):
            raise serializers.ValidationError('Username can only contain letters, numbers, dot, hyphen, and underscore.')
        
        # Check if username already exists
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('A user with this username already exists.')
        
        return value
    
    def validate_email(self, value):
        """Validate email per OWASP input validation rules."""
        if not value or not value.strip():
            raise serializers.ValidationError('Email is required.')
        
        try:
            value = InputValidator.validate_email(value)
        except ValueError as e:
            raise serializers.ValidationError(str(e)) from e
        
        # Check if email already exists
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        
        return value
    
    def validate_password(self, value):
        """Validate password strength per OWASP requirements."""
        if len(value) < 8:
            raise serializers.ValidationError('Password must be at least 8 characters long.')
        
        if len(value) > 128:
            raise serializers.ValidationError('Password must not exceed 128 characters.')
        
        if not any(char.isupper() for char in value):
            raise serializers.ValidationError('Password must contain at least one uppercase letter.')
        
        if not any(char.islower() for char in value):
            raise serializers.ValidationError('Password must contain at least one lowercase letter.')
        
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError('Password must contain at least one number.')
        
        # Check for at least one special character
        import re
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise serializers.ValidationError('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>).')
        
        return value
    
    def validate_first_name(self, value):
        """Validate first name."""
        return self.validate_string_field('first_name', value) if value else value
    
    def validate_last_name(self, value):
        """Validate last name."""
        return self.validate_string_field('last_name', value) if value else value
    
    def validate_string_field(self, field_name: str, value: str) -> str:
        """Validate and sanitize a string field."""
        if not isinstance(value, str):
            raise serializers.ValidationError(f'{field_name} must be a string.')
        
        max_len = MAX_FIELD_LENGTHS.get(field_name, 500)
        try:
            value = InputValidator.sanitize_string(value, max_length=max_len)
        except ValueError as e:
            raise serializers.ValidationError(str(e)) from e
        
        return value
    
    def validate(self, attrs):
        """Validate the entire registration payload."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        
        # Additional check: password should not contain username
        if attrs['username'].lower() in attrs['password'].lower():
            raise serializers.ValidationError({'password': 'Password must not contain username.'})
        
        return attrs
    
    def create(self, validated_data):
        """Create user with validated data."""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        # Normalize email to lowercase
        email = validated_data.get('email', '').lower()
        validated_data['email'] = email
        
        try:
            user = User.objects.create_user(password=password, **validated_data)
            logger.info(f'New user registered: {user.username}')
        except Exception as e:
            # Additional safety net for database-level constraints
            error_str = str(e).lower()
            if 'username' in error_str or 'unique constraint' in error_str:
                raise serializers.ValidationError({'username': 'A user with this username already exists.'}) from e
            elif 'email' in error_str:
                raise serializers.ValidationError({'email': 'A user with this email already exists.'}) from e
            logger.error(f'User registration failed: {e}')
            raise serializers.ValidationError({'detail': 'Failed to create user. Please try again.'}) from e
        
        return user




class TaskSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)  # Convert to string for frontend
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'category', 'priority', 'status', 'liked', 'fired',
            'progress', 'alex_progress', 'sam_progress', 'description', 'date',
            'location', 'avatars', 'created_at', 'updated_at', 'user'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']
        extra_kwargs = {
            'title': {'max_length': 500, 'required': True},
            'description': {'max_length': 5000, 'allow_blank': True},
            'location': {'max_length': 500, 'allow_blank': True},
        }
    
    def validate_title(self, value):
        """Validate and sanitize task title."""
        if not value or not value.strip():
            raise serializers.ValidationError('Title cannot be empty.')
        
        try:
            value = InputValidator.sanitize_string(value, max_length=500)
        except ValueError as e:
            raise serializers.ValidationError(str(e)) from e
        
        return value
    
    def validate_description(self, value):
        """Validate and sanitize task description."""
        if not value:
            return value
        try:
            return InputValidator.sanitize_string(value, max_length=5000, allow_html=True)
        except ValueError as e:
            raise serializers.ValidationError(str(e)) from e
    
    def validate_location(self, value):
        """Validate and sanitize location."""
        if not value:
            return value
        try:
            return InputValidator.sanitize_string(value, max_length=500)
        except ValueError as e:
            raise serializers.ValidationError(str(e)) from e
    
    def validate_priority(self, value):
        """Validate priority is within allowed values."""
        allowed = ['low', 'medium', 'high']
        if value and value not in allowed:
            raise serializers.ValidationError(f'Priority must be one of: {", ".join(allowed)}')
        return value
    
    def validate_status(self, value):
        """Validate status is within allowed values."""
        allowed = ['Backlog', 'Planning', 'Upcoming', 'Completed']
        if value and value not in allowed:
            raise serializers.ValidationError(f'Status must be one of: {", ".join(allowed)}')
        return value
    
    def validate_progress(self, value):
        """Validate progress is between 0 and 100."""
        if value is None:
            return value
        try:
            value = int(value)
            if not (0 <= value <= 100):
                raise serializers.ValidationError('Progress must be between 0 and 100.')
            return value
        except (TypeError, ValueError) as e:
            raise serializers.ValidationError('Progress must be a number.') from e
    
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
        request = self.context.get('request')
        if request and request.user and (partner := obj.get_partner(request.user)):
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
            'id', 'name', 'date', 'status', 'icon', 'created_at', 'updated_at', 'user'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = str(data['id'])
        return data
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


# (pruned duplicate CoupleSerializer/CouplingCodeSerializer definitions)


class ActivitySerializer(serializers.ModelSerializer):
    """
    Serializes Activity model with field mapping for frontend compatibility.
    
    Field Mapping:
        Request: 'user' field → Model: 'activity_user' field
            (The name of the person who performed the action, e.g., "Sam" or "Alex")
        Response: Model 'activity_user' → Response 'user' field
            (For consistent frontend API - clients always use 'user' field)
    
    This allows the frontend to use 'user' consistently, while the model stores
    it as 'activity_user' to avoid confusion with the ForeignKey 'user' field.
    
    Example:
        Frontend sends: {"user": "Sam", "action": "added", "item": "Task Title"}
        Stored in DB as: Activity(activity_user="Sam", action="added", item="Task Title", user=<User object>)
        Frontend receives: {"user": "Sam", "action": "added", "item": "Task Title"}
    """
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


# (pruned duplicate CoupleSerializer/CouplingCodeSerializer definitions)


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
        # Always set the user from the request context
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['user'] = request.user
        elif 'user' not in validated_data:
            raise serializers.ValidationError("User is required to create a collection")
        return super().create(validated_data)


# (pruned duplicate CoupleSerializer/CouplingCodeSerializer definitions)


class UserPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreferences
        fields = [
            'id', 'anniversary', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']
    
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
        if request and request.user and (partner := obj.get_partner(request.user)):
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


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing user password"""
    current_password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    new_password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    new_password_confirm = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    
    def validate_current_password(self, value):
        """Verify current password is correct"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value
    
    def validate_new_password(self, value):
        """Validate new password strength"""
        if len(value) < 8:
            raise serializers.ValidationError('Password must be at least 8 characters long.')
        return value
    
    def validate(self, attrs):
        """Validate that new passwords match"""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password': 'New passwords do not match.'})
        if attrs['current_password'] == attrs['new_password']:
            raise serializers.ValidationError({'new_password': 'New password must be different from current password.'})
        return attrs


class EmploymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employment
        fields = ['id', 'company', 'position', 'start_date', 'end_date', 'description', 'is_current', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = ['id', 'school', 'degree', 'field_of_study', 'start_date', 'end_date', 'description', 'is_current', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name', 'proficiency', 'endorsements', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'title', 'description', 'technologies', 'link', 'image_url', 'start_date', 'end_date', 'is_featured', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserDetailSerializer(serializers.ModelSerializer):
    """Detailed user profile serializer with all sections"""
    profile = UserProfileSerializer(read_only=True)
    preferences = UserPreferencesSerializer(read_only=True)
    employment_history = EmploymentSerializer(many=True, read_only=True)
    education_history = EducationSerializer(many=True, read_only=True)
    skills = SkillSerializer(many=True, read_only=True)
    projects = ProjectSerializer(many=True, read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'profile', 'preferences', 'employment_history', 'education_history',
            'skills', 'projects'
        ]
        read_only_fields = ['id', 'username']


class DailyConnectionAnswerSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = DailyConnectionAnswer
        fields = ['id', 'connection', 'user_id', 'user_name', 'answer_text', 'answered_at', 'updated_at']
        read_only_fields = ['id', 'connection', 'answered_at', 'updated_at']


class DailyConnectionSerializer(serializers.ModelSerializer):
    answers = DailyConnectionAnswerSerializer(many=True, read_only=True)
    
    class Meta:
        model = DailyConnection
        fields = ['id', 'date', 'prompt', 'answers', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class InboxItemSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    connection_answer = DailyConnectionAnswerSerializer(read_only=True)
    
    class Meta:
        model = InboxItem
        fields = ['id', 'item_type', 'title', 'description', 'content', 'sender_name', 
                  'connection_answer', 'is_read', 'has_reacted', 'response', 'responded_at',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'sender_name', 'connection_answer']

class MemorySerializer(serializers.ModelSerializer):
    milestone_name = serializers.CharField(source='milestone.name', read_only=True)
    
    class Meta:
        model = Memory
        fields = ['id', 'title', 'description', 'date', 'milestone', 'milestone_name', 
                  'photos', 'tags', 'is_favorite', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


