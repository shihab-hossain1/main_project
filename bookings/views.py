from django.shortcuts import render

# Create your views here.
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Booking, Report
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from accounts.models import Profile

@login_required
def booking_detail(request, pk):
    booking = get_object_or_404(Booking, pk=pk)

    # TODO (optional): restrict so only the right patient/center can see
    # For now, we just require "logged in".

    return render(request, 'bookings/booking-detail.html', {
        'booking': booking,
    })
@login_required
def upload_report(request, pk):
    booking = get_object_or_404(Booking, pk=pk)

    # Optional: only center users can upload reports
    profile = getattr(request.user, 'profile', None)
    if not (profile and profile.role == 'center'):
        return JsonResponse({'error': 'Not allowed'}, status=403)

    if request.method == 'POST':
        uploaded_file = request.FILES.get('file')
        notes = request.POST.get('notes', '').strip()

        if not uploaded_file:
            return render(request, 'bookings/upload-report.html', {
                'booking': booking,
                'error': 'Please select a PDF file to upload.',
                'reports': booking.reports.order_by('-uploaded_at'),
            })

        Report.objects.create(
            booking=booking,
            file=uploaded_file,
            uploaded_by=request.user,
            notes=notes
        )

        return render(request, 'bookings/upload-report.html', {
            'booking': booking,
            'success': 'Report uploaded successfully.',
            'reports': booking.reports.order_by('-uploaded_at'),
        })

    # GET: show form + existing reports
    return render(request, 'bookings/upload-report.html', {
        'booking': booking,
        'reports': booking.reports.order_by('-uploaded_at'),
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
