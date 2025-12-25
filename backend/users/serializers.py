from rest_framework import serializers
from .models import User, Profile, Couple


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'firebase_uid', 'email', 'full_name', 'name', 'photo_url', 'created_at']
        read_only_fields = ['id', 'firebase_uid', 'created_at']


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Profile
        fields = ['id', 'user', 'full_name', 'bio', 'timezone', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CoupleSerializer(serializers.ModelSerializer):
    user1 = UserSerializer(read_only=True)
    user2 = UserSerializer(read_only=True)
    
    class Meta:
        model = Couple
        fields = ['id', 'user1', 'user2', 'anniversary_date', 'invite_code', 'created_at', 'updated_at']
        read_only_fields = ['id', 'invite_code', 'created_at', 'updated_at']
