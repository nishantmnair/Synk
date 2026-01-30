"""
ASGI config for synk_backend project.
"""

import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'synk_backend.settings')

from django.core.asgi import get_asgi_application

# Initialize Django before importing app code that touches the ORM (e.g. api.routing -> consumers -> User).
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import api.routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(api.routing.websocket_urlpatterns)
    ),
})
