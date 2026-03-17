from django.db import models

class Message(models.Model):

    STATUS_CHOICES = [
        ("sent", "Sent"),
        ("delivered", "Delivered"),
        ("read", "Read"),
    ]
    MSG_TYPES = [
        ("text", "Text"),
        ("audio", "Audio"),
    ]

    sender = models.CharField(max_length=100)
    receiver = models.CharField(max_length=100, null=True, blank=True)
    message = models.TextField()
    audio     = models.TextField(blank=True, null=True)  # ← base64 audio
    msg_type  = models.CharField(max_length=10, choices=MSG_TYPES, default="text")
    timestamp = models.DateTimeField(auto_now_add=True)

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="sent")

    def __str__(self):
        return f"{self.sender}: {self.message}"