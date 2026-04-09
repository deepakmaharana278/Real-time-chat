from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.validators import validate_email
from accounts.models import CustomUser
import re

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'username', 'password', 'password2']
    
    def validate_email(self, value):
        # Validate email format and uniqueness
        try:
            validate_email(value)
        except:
            raise serializers.ValidationError("Invalid email format")
        
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered")
        return value
    
    def validate_username(self, value):
        # Validate username format
        if len(value) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters")
        
        if len(value) > 150:
            raise serializers.ValidationError("Username too long")
        
        if not re.match(r'^[\w.@+-]+$', value):
            raise serializers.ValidationError("Username contains invalid characters")
        
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken")
        return value
    
    def validate(self, attrs):
        # Validate password match
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords don't match"})
        return attrs
    
    def create(self, validated_data):
        # Create user with hashed password
        validated_data.pop('password2')
        user = CustomUser.objects.create_user(**validated_data)
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'username', 'first_name', 'last_name',      'is_email_verified', 'date_joined']
        read_only_fields = ['id', 'is_email_verified', 'date_joined']