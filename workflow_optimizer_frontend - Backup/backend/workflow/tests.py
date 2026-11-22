from django.test import TestCase
from django.urls import reverse

from .models import Workflow


class WorkflowApiTests(TestCase):
    def setUp(self):
        self.url = reverse('save_workflow')
        self.payload = {
            'id': 'frontend-123',
            'name': 'Operations Workflow',
            'domain': 'Operations',
            'tasks': [
                {'id': 'T1', 'name': 'Intake', 'time': 10, 'dependencies': []},
            ],
        }

    def test_dashboard_sets_csrf_cookie_and_static_asset_urls(self):
        response = self.client.get(reverse('dashboard'))

        self.assertEqual(response.status_code, 200)
        self.assertIn('csrftoken', response.cookies)
        self.assertContains(response, '/static/workflow/chart.umd.min.js')
        self.assertContains(response, '/static/workflow/script.js')

    def test_post_creates_and_updates_workflow(self):
        response = self.client.post(self.url, self.payload, content_type='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.json()['created'])

        self.payload['tasks'][0]['time'] = 15
        response = self.client.post(self.url, self.payload, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()['created'])
        self.assertEqual(Workflow.objects.get(frontend_id='frontend-123').tasks[0]['time'], 15)

    def test_get_returns_saved_workflows(self):
        self.client.post(self.url, self.payload, content_type='application/json')

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['workflows'][0]['id'], 'frontend-123')
        self.assertEqual(response.json()['workflows'][0]['tasks'], self.payload['tasks'])

    def test_delete_removes_workflow(self):
        self.client.post(self.url, self.payload, content_type='application/json')

        response = self.client.delete(f'{self.url}?id=frontend-123')

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['deleted'])
        self.assertFalse(Workflow.objects.filter(frontend_id='frontend-123').exists())

    def test_post_rejects_invalid_tasks(self):
        self.payload['tasks'] = 'not-a-list'

        response = self.client.post(self.url, self.payload, content_type='application/json')

        self.assertEqual(response.status_code, 400)
