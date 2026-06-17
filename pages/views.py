import json
from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from .models import Todo


def home(request):
    todos = Todo.objects.filter(user=request.user).order_by('time')
    return render(request, 'pages/index.html', {'todos': todos})


def register_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password1 = request.POST.get('password1')
        password2 = request.POST.get('password2')
        if password1 != password2:
            return render(request, 'pages/register.html', {'error': 'Passwords do not match'})
        if User.objects.filter(username=username).exists():
            return render(request, 'pages/register.html', {'error': 'Username already taken'})
        user = User.objects.create_user(username=username, password=password1)
        login(request, user)
        return redirect('home')
    return render(request, 'pages/register.html')


def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            return redirect('home')
        return render(request, 'pages/login.html', {'error': 'Wrong username or password'})
    return render(request, 'pages/login.html')


def logout_view(request):
    logout(request)
    return redirect('login')


@login_required
@require_http_methods(["GET", "POST"])
def api_tasks(request):
    if request.method == 'GET':
        todos = Todo.objects.filter(user=request.user).order_by('time').values('id', 'title', 'is_done', 'time')
        data = [
            {
                'id': t['id'],
                'text': t['title'],
                'done': t['is_done'],
                'time': str(t['time'])[:5] if t['time'] else ''
            }
            for t in todos
        ]
        return JsonResponse(data, safe=False)

    if request.method == 'POST':
        body = json.loads(request.body)
        todo = Todo.objects.create(
            user=request.user,
            title=body.get('text', ''),
            time=body.get('time') or None
        )
        return JsonResponse({'id': todo.id, 'text': todo.title, 'done': todo.is_done}, status=201)


@login_required
@require_http_methods(["PATCH", "DELETE"])
def api_task_detail(request, pk):
    todo = get_object_or_404(Todo, pk=pk, user=request.user)

    if request.method == 'PATCH':
        body = json.loads(request.body)
        todo.is_done = body.get('done', todo.is_done)
        todo.save()
        return JsonResponse({'id': todo.id, 'done': todo.is_done})

    if request.method == 'DELETE':
        todo.delete()
        return JsonResponse({'deleted': True})