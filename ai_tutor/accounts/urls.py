# accounts/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('select-standard/', views.select_standard_view, name='select_standard'),
    path('user-info/', views.user_info_view, name='user_info'),
    path('update-settings/', views.update_settings_view, name='update_settings'),
]