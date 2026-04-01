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
        ("file", "File"),
    ]

    sender = models.CharField(max_length=100)
    receiver = models.CharField(max_length=100, null=True, blank=True)
    message = models.TextField()
    audio = models.TextField(blank=True, null=True)  # ← base64 audio
    file = models.FileField(upload_to="chat_files/", null=True, blank=True) 
    file_name = models.CharField(max_length=255, blank=True, null=True) 
    msg_type  = models.CharField(max_length=10, choices=MSG_TYPES, default="text")
    timestamp = models.DateTimeField(auto_now_add=True)

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="sent")

    reactions = models.ManyToManyField('MessageReaction', related_name='messages', blank=True)
    is_edited = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    parent_message = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies')

    def __str__(self):
        return f"{self.sender}: {self.message}"
    

class MessageReaction(models.Model):
    EMOJI_CHOICES = [
        ("👍", "Thumbs Up"),
        ("❤️", "Heart"),
        ("😂", "Laugh"),
        ("😮", "Surprised"),
        ("😢", "Sad"),
        ("👏", "Clap"),
    ]
    
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reaction_set')
    user = models.CharField(max_length=100)
    emoji = models.CharField(max_length=10, choices=EMOJI_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['message', 'user', 'emoji']
    
    def __str__(self):
        return f"{self.user} reacted {self.emoji} to {self.message.id}"
