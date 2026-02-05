from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Task, Milestone, Activity, Suggestion, Collection, UserPreferences,
    Couple, CouplingCode, UserProfile, Employment, Education, Skill, Project
)


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
        
        # Note: Django User model doesn't allow null values for first_name and last_name,
        # so we keep them as empty strings if not provided
        
        # Normalize email to lowercase
        email = validated_data.get('email', '').lower()
        validated_data['email'] = email
        
        # create_user already hashes the password with bcrypt/PBKDF2, so we pass it directly
        # The post_save signal will automatically create the UserProfile
        # Validation methods above already check for duplicates, but keep try/except as safety net
        try:
            user = User.objects.create_user(password=password, **validated_data)
        except Exception as e:
            # Additional safety net for database-level constraints
            error_str = str(e).lower()
            if 'username' in error_str or 'unique constraint' in error_str:
                raise serializers.ValidationError({'username': 'A user with this username already exists.'}) from e
            elif 'email' in error_str:
                raise serializers.ValidationError({'email': 'A user with this email already exists.'}) from e
            raise serializers.ValidationError({'detail': 'Failed to create user. Please try again.'}) from e
        
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
