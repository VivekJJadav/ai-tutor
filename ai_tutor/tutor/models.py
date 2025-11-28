# tutor/models.py
from django.db import models

class Subject(models.Model):
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Chapter(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='chapters')
    title = models.CharField(max_length=200)
    standard = models.CharField(max_length=2)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'title']

    def __str__(self):
        return f"{self.subject.name} - {self.title} (Std {self.standard})"

class ChatMessage(models.Model):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('ai', 'AI'),
    ]
    
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='chat_messages')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='chat_messages', null=True)
    chapter_index = models.IntegerField(default=0)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.user.username} - {self.subject.name if self.subject else 'Unknown'} Ch{self.chapter_index} - {self.role}"