from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Booking

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'phone', 'date', 'time', 'type', 'test', 'created_at')
    search_fields = ('name', 'phone', 'email', 'test')
    list_filter = ('type', 'date', 'created_at')
