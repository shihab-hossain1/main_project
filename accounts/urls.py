from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),          # new landing page
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('signup/', views.signup_view, name='signup'),
    path('patient/dashboard/', views.patient_dashboard, name='patient-dashboard'),
    path('center/dashboard/', views.center_dashboard, name='center-dashboard'),
    path('admin/dashboard/', views.admin_dashboard, name='admin-dashboard'),
]

