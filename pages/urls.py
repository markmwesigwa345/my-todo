from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('api/tasks/', views.api_tasks, name='api_tasks'),
    path('api/tasks/<int:pk>/', views.api_task_detail, name='api_task_detail'),
]