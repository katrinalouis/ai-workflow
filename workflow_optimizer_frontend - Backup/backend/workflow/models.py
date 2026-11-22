
from django.db import models
from django.contrib.auth.models import User


class Workflow(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='workflows',
        null=True,
        blank=True
    )

    frontend_id = models.CharField(
        max_length=50,
        unique=True,
        null=True,
        blank=True
    )

    name = models.CharField(max_length=200)
    domain = models.CharField(max_length=100)
    tasks = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
