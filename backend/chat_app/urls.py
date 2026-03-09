from django.urls import path
from chat_app.views import *

urlpatterns = [
    path('', hello),
]
