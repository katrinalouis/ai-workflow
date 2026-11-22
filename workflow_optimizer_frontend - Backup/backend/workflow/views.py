from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from .models import Workflow
import json

@login_required(login_url='/accounts/signin/')
@ensure_csrf_cookie
def dashboard(request):
    return render(request, 'workflow/index.html')

@login_required(login_url='/accounts/signin/')
def save_workflow(request):
    if request.method == 'GET':
        workflows = Workflow.objects.filter(
    user=request.user
).order_by('created_at', 'pk')
        return JsonResponse({
            'workflows': [
                {
                    'id': workflow.frontend_id,
                    'name': workflow.name,
                    'domain': workflow.domain,
                    'tasks': workflow.tasks,
                }
                for workflow in workflows
            ]
        })

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
        except (json.JSONDecodeError, UnicodeDecodeError):
            return JsonResponse({'error': 'Request body must contain valid JSON.'}, status=400)

        if not isinstance(data, dict):
            return JsonResponse({'error': 'Request body must be a JSON object.'}, status=400)

        workflow_id = str(data.get('id', '')).strip()
        name = data.get('name')
        domain = data.get('domain')
        tasks = data.get('tasks')

        if not workflow_id or len(workflow_id) > 50:
            return JsonResponse({'error': 'A workflow ID of at most 50 characters is required.'}, status=400)
        if not isinstance(domain, str) or not domain.strip() or len(domain) > 100:
            return JsonResponse({'error': 'A workflow domain of at most 100 characters is required.'}, status=400)
        if name is None:
            name = f'{domain.strip()} Workflow'
        if not isinstance(name, str) or not name.strip() or len(name) > 200:
            return JsonResponse({'error': 'A workflow name of at most 200 characters is required.'}, status=400)
        if not isinstance(tasks, list) or not all(isinstance(task, dict) for task in tasks):
            return JsonResponse({'error': 'Tasks must be a list of task objects.'}, status=400)

        workflow, created = Workflow.objects.update_or_create(
    user=request.user,
    frontend_id=workflow_id,
    defaults={
        'name': name.strip(),
        'domain': domain.strip(),
        'tasks': tasks,
    }
)
        return JsonResponse({
            'message': 'Workflow saved successfully.',
            'id': workflow.frontend_id,
            'created': created,
        }, status=201 if created else 200)

    if request.method == 'DELETE':
        workflow_id = request.GET.get('id', '').strip()
        if not workflow_id:
            return JsonResponse({'error': 'A workflow ID is required.'}, status=400)
        deleted, _ = Workflow.objects.filter(
    frontend_id=workflow_id,
    user=request.user
).delete()
        return JsonResponse({'deleted': deleted > 0})

    return JsonResponse({'error': 'Method not allowed.'}, status=405)