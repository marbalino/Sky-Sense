from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('api/creek-data/', views.creek_data_proxy, name='creek_data_proxy'),
]