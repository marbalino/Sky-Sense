from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('embud-map/', views.embud_map, name='embud_map'),
    path('api/creek-data/', views.creek_data_proxy, name='creek_data_proxy'),
]