from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Profile

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'role', 'center_name')
    list_filter = ('role',)
    search_fields = ('user__username', 'user__email', 'center_name')
