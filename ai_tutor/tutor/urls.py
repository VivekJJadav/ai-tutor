# tutor/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('subjects/', views.subjects_view, name='subjects'),
    path('chapters/<int:subject_id>/', views.chapters_view, name='chapters'),
    path('chat/', views.chat_view, name='chat'),
    path('chat/history/', views.get_chat_history, name='chat_history'),
]