from rest_framework import  generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from accounts.serializers import RegisterSerializer, UserSerializer
from accounts.utils import send_verification_email, verify_email_token
from accounts.models import CustomUser
from rest_framework.views import APIView


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


class VerifyEmailView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    
    def get(self, request, token):
        user, message = verify_email_token(token)
        
        # Always return 200 if user exists OR token was valid
        if user:
            return Response({
                'success': True,
                'message': 'Email verified successfully!',
                'email': user.email,
            }, status=200)
        
        # If user already verified, return success
        if "already" in message.lower():
            return Response({
                'success': True,
                'message': 'Email already verified!',
            }, status=200)
        
        return Response({
            'success': False,
            'error': message
        }, status=400)
    

class LoginView(APIView):  
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({
                'error': 'Email and password are required'
            }, status=400)
        
        user = authenticate(request, username=email, password=password)
        
        if user is None:
            return Response({
                'error': 'Invalid credentials'
            }, status=401)
        
        if not user.is_email_verified:
            return Response({
                'error': 'Please verify your email before logging in. Check your inbox for the verification link.'
            }, status=403)
        
        if user.is_account_locked():
            return Response({
                'error': 'Account is temporarily locked. Try again later.'
            }, status=423)
        
        # Reset failed login attempts on successful login
        user.reset_failed_login()
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'success': True,
            'message': 'Login successful!',
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'user': UserSerializer(user).data
        })