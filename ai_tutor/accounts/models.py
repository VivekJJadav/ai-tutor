from django.db import models
from django.contrib.auth.models import User

class StudentProfile(models.Model):
    STANDARD_CHOICES = [
        ('8th', 'Standard 8'),
        ('9th', 'Standard 9'),
        ('10th', 'Standard 10'),
    ]

    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('hi', 'Hindi'),
        ('gu', 'Gujarati'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    standard = models.CharField(max_length=4, choices=STANDARD_CHOICES, null=True, blank=True)
    standard_selected = models.BooleanField(default=False)
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default='en')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - Standard {self.standard}"