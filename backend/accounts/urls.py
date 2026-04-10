from django.urls import path
from accounts.views import *

urlpatterns = [
    path('reg/',RegisterView.as_view()),
    path('login/',LoginView.as_view()),
    path('verify-email/<str:token>/', VerifyEmailView.as_view()),
]
