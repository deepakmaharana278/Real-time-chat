from django.db import models

class Message(models.Model):

    STATUS_CHOICES = [
        ("sent", "Sent"),
        ("delivered", "Delivered"),
        ("read", "Read"),
    ]

    sender = models.CharField(max_length=100)
    receiver = models.CharField(max_length=100, null=True, blank=True)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="sent")

    def __str__(self):
        return f"{self.sender}: {self.message}"