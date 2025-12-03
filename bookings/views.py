from django.shortcuts import render

# Create your views here.
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Booking
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import Booking

@login_required
def booking_detail(request, pk):
    booking = get_object_or_404(Booking, pk=pk)

    # TODO (optional): restrict so only the right patient/center can see
    # For now, we just require "logged in".

    return render(request, 'bookings/booking-detail.html', {
        'booking': booking,
    })


def booking_page(request):
    return render(request, 'bookings/book.html')

@csrf_exempt  # for testing; later we can use proper CSRF handling
def create_booking(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST allowed'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))

        booking = Booking.objects.create(
            name=data.get('name', '').strip(),
            phone=data.get('phone', '').strip(),
            email=data.get('email', '').strip() or None,
            test=data.get('test', ''),
            date=data.get('date', None),
            time=data.get('time', None),
            type=data.get('type', 'center'),
            center=data.get('center') or None,
            address=data.get('address') or None,
            city=data.get('city') or None,
            postcode=data.get('postcode') or None,
            notes=data.get('notes', '').strip(),
        )

        return JsonResponse({'message': 'Booking saved', 'id': booking.id}, status=201)

    except Exception as e:
        print("Error:", e)
        return JsonResponse({'error': 'Something went wrong'}, status=400)
