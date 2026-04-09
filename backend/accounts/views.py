from rest_framework import  generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from accounts.serializers import RegisterSerializer, UserSerializer
from accounts.utils import send_verification_email, verify_email_token
from accounts.models import CustomUser


class RegisterView(generics.CreateAPIView):
    # User registration with email verification
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Send verification email
            try:
                send_verification_email(user, request)
                print(f"Verification email sent to {user.email}")
            except Exception as e:
                print(f"Email error: {e}")
                return Response({
                    'error': 'Failed to send verification email. Please try again.'
                }, status=500)
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'success': True,
                'message': 'Registration successful! Please check your email for verification link.',
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'user': UserSerializer(user).data
            }, status=201)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=400)
