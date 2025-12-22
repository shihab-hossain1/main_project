from django.urls import path
from .views import booking_page, create_booking, booking_detail, upload_report

urlpatterns = [
    path('book/', booking_page, name='booking-page'),
    path('bookings/', create_booking, name='create-booking'),
    path('booking/<int:pk>/', booking_detail, name='booking-detail'),  # ← NEW
    path('booking/<int:pk>/upload-report/', upload_report, name='upload-report'),
]
