from django.urls import path
from accounts.views import *

urlpatterns = [
    path('reg/',RegisterView.as_view()),
]
