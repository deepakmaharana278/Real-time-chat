from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.urls import reverse
import secrets
from datetime import timedelta
from .models import CustomUser


def generate_verification_token():
    # Generate secure token for email verification
    return secrets.token_urlsafe(32)

def send_verification_email(user, request):
    # Send email verification link
    token = generate_verification_token()
    user.email_verification_token = token
    user.token_created_at = timezone.now()
    user.save()
    
    # Build verification URL
    verification_url = f"{request.scheme}://{request.get_host()}/user/verify-email/{token}/"
    
    subject = "Verify Your Email Address - Deepak Chat App"
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .button {{ background-color: #4CAF50; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block; }}
            .footer {{ margin-top: 30px; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Welcome to Deepak Chat App!</h2>
            <p>Hello {user.username or user.email},</p>
            <p>Please click the button below to verify your email address:</p>
            <p><a href="{verification_url}" class="button">Verify Email</a></p>
            <p>Or copy this link: <a href="{verification_url}">{verification_url}</a></p>
            <p>This link will expire in <strong>24 hours</strong>.</p>
            <div class="footer">
                <p>If you didn't create an account, please ignore this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    send_mail(
        subject=subject,
        message=f"Please verify your email: {verification_url}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )

def verify_email_token(token):
    # Verify email token and activate account

    
    try:
        user = CustomUser.objects.get(email_verification_token=token)
        
        # Check expiration (24 hours)
        if user.token_created_at:
            expiry = user.token_created_at + timedelta(hours=24)
            if timezone.now() > expiry:
                return None, "Verification link has expired. Please request a new one."
        
        user.is_email_verified = True
        user.email_verification_token = None
        user.save()
        return user, "Email verified successfully!"
        
    except CustomUser.DoesNotExist:
        return None, "Invalid verification token."