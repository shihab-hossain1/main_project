from django.db import models

# Create your models here.
from django.db import models

class Booking(models.Model):
    COLLECTION_CHOICES = [
        ('center', 'Center'),
        ('home', 'Home'),
    ]

    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)

    test = models.CharField(max_length=100)

    date = models.DateField()
    time = models.TimeField()

    type = models.CharField(max_length=10, choices=COLLECTION_CHOICES)

    center = models.CharField(max_length=100, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=50, blank=True, null=True)
    postcode = models.CharField(max_length=20, blank=True, null=True)

    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} — {self.test} on {self.date}"

