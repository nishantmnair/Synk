"""
Configuration for the API app
"""
from django.apps import AppConfig


class ApiConfig(AppConfig):
    """Configuration for API app"""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
    
    def ready(self):
        """Import signals when app is ready"""
        import api.signals  # noqa
