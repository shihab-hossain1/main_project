from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.http import HttpResponseForbidden
from .models import Profile
from django.utils import timezone
from bookings.models import Booking
from django.db.models import Q


def home(request):
    return render(request, 'accounts/home.html')

def login_view(request):
    if request.method == 'POST':
        # we treat this field as USERNAME (not email to keep it simple)
        username = request.POST.get('login-email')
        password = request.POST.get('login-password')
        role = request.POST.get('login-role', 'patient')

        user = authenticate(request, username=username, password=password)
        if user is None:
            return render(request, 'accounts/login.html', {
                'error': 'Invalid username or password.'
            })

        login(request, user)

        # ADMIN role: use Django staff/superuser flags
        if role == 'admin':
            if user.is_staff or user.is_superuser:
                return redirect('admin-dashboard')
            logout(request)
            return render(request, 'accounts/login.html', {
                'error': 'You are not allowed to log in as admin.'
            })

        # Get or create Profile for non-admin roles
        profile, created = Profile.objects.get_or_create(
            user=user,
            defaults={'role': 'patient'}
        )

        # CENTER role
        if role == 'center':
            if profile.role == 'center':
                return redirect('center-dashboard')
            logout(request)
            return render(request, 'accounts/login.html', {
                'error': 'This account is not a center user.'
            })

        # PATIENT role
        if role == 'patient':
            if profile.role == 'patient':
                return redirect('patient-dashboard')
            logout(request)
            return render(request, 'accounts/login.html', {
                'error': 'This account is not a patient user.'
            })

        # fallback (should not happen)
        logout(request)
        return render(request, 'accounts/login.html', {
            'error': 'Role mismatch.'
        })

    # GET -> show page
    return render(request, 'accounts/login.html')




def signup_view(request):
    if request.method == 'POST':
        name = request.POST.get('signup-name', '').strip()
        username = request.POST.get('signup-username', '').strip()  # user will log in with this
        password = request.POST.get('signup-password', '').strip()

        # Basic validation
        if not username or not password:
            return render(request, 'accounts/login.html', {
                'signup_error': 'Username and password are required.'
            })

        if User.objects.filter(username=username).exists():
            return render(request, 'accounts/login.html', {
                'signup_error': 'This username is already taken.'
            })

        # Create user
        user = User.objects.create_user(
            username=username,
            password=password,
            first_name=name
        )

        # New signups are PATIENTS by default
        Profile.objects.create(user=user, role='patient')

        # Auto-login after signup
        login(request, user)
        return redirect('patient-dashboard')

    # If GET /signup, just show login page with signup block
    return redirect('login')



def logout_view(request):
    logout(request)
    return redirect('login')


@login_required
def patient_dashboard(request):
    profile = getattr(request.user, 'profile', None)
    if profile and profile.role == 'patient':

        # Try to match bookings by name / username / email
        name = (request.user.first_name or '').strip()
        username = request.user.username
        email = (request.user.email or '').strip()

        q = Q()
        if name:
            q |= Q(name__iexact=name)
        if username:
            q |= Q(name__iexact=username)
        if email:
            q |= Q(email__iexact=email)

        if q:
            bookings = Booking.objects.filter(q).order_by('-date', '-time')
        else:
            bookings = Booking.objects.none()

        return render(request, 'accounts/patient-dashboard.html', {
            'bookings': bookings,
            'profile': profile,
        })

    return HttpResponseForbidden('Not allowed.')



@login_required


@login_required
def center_dashboard(request):
    profile = getattr(request.user, 'profile', None)
    if not (profile and profile.role == 'center'):
        return HttpResponseForbidden('Not allowed.')

    center_name = (profile.center_name or '').strip()

    # Base queryset: bookings for THIS center only
    if center_name:
        base_qs = Booking.objects.filter(center__iexact=center_name)
    else:
        # fallback: if no center_name set, show nothing (or all)
        base_qs = Booking.objects.none()

    today = timezone.localdate()

    bookings_today = base_qs.filter(date=today).order_by('time')
    bookings_all   = base_qs.order_by('-date', '-time')
    bookings_upcoming = base_qs.filter(date__gte=today).order_by('date', 'time')

    total_count   = base_qs.count()
    today_count   = bookings_today.count()
    upcoming_count = bookings_upcoming.count()
    home_count    = base_qs.filter(type='home').count()
    center_count  = base_qs.filter(type='center').count()

    context = {
        'profile': profile,
        'bookings': bookings_today,      # used in "Today’s Orders" section
        'total_count': total_count,
        'today_count': today_count,
        'upcoming_count': upcoming_count,
        'home_count': home_count,
        'center_count': center_count,
    }
    return render(request, 'accounts/center-dashboard.html', context)




@login_required
def admin_dashboard(request):
    if request.user.is_staff or request.user.is_superuser:
        return render(request, 'accounts/admin-dashboard.html')
    return HttpResponseForbidden('Not allowed.')
