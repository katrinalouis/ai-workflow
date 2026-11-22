
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User


def signup(request):
    if request.method == 'POST':
        email = request.POST.get('email', '').strip().lower()
        password = request.POST.get('password', '')
        confirm_password = request.POST.get('confirm_password', '')

        if not email or not password:
            return render(request, 'accounts/signup.html',
                          {'error': 'Please fill all fields.'})

        if User.objects.filter(email=email).exists():
            return render(request, 'accounts/signup.html',
                          {'error': 'Email already registered.'})

        if password != confirm_password:
            return render(request, 'accounts/signup.html',
                          {'error': 'Passwords do not match.'})

        if len(password) < 8:
            return render(request, 'accounts/signup.html',
                          {'error': 'Password must contain at least 8 characters.'})

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password
        )

        login(request, user)
        return redirect('dashboard')

    return render(request, 'accounts/signup.html')


def signin(request):
    if request.method == 'POST':
        email = request.POST.get('email', '').strip().lower()
        password = request.POST.get('password', '')

        user = authenticate(
            request,
            username=email,
            password=password
        )

        if user is not None:
            login(request, user)
            return redirect('dashboard')

        return render(request, 'accounts/signin.html',
                      {'error': 'Invalid email or password.'})

    return render(request, 'accounts/signin.html')


def signout(request):
    if request.method == 'POST':
        logout(request)

    return redirect('signin')
