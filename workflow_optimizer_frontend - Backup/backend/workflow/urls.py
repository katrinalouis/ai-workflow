
from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('save-workflow/', views.save_workflow, name='save_workflow'),
]
