"""
URL configuration for synk_backend project.

SECURITY:
- Admin panel paths are intentionally not documented in this root file
- Admin access should be restricted at the reverse proxy level (nginx)
- See nginx.production.conf for admin path protection
"""
import os
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

def api_root(request):
    """API root endpoint - provides version and available endpoints"""
    return JsonResponse({
        'message': 'Synk API',
        'version': '1.0.0',
        'endpoints': {
            'health': '/health/',
            'api': '/api/',
            'token': '/api/token/',
            'token_refresh': '/api/token/refresh/',
        }
    })

# Admin panel path obfuscation for security (not security through obscurity, but defense in depth)
# In production, further protect with nginx IP whitelisting
admin_path = os.environ.get('ADMIN_PATH', 'admin/').rstrip('/')

urlpatterns = [
    path('', api_root, name='api_root'),
    path(f'{admin_path}/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('api.urls')),
    path('health/', lambda request: JsonResponse({'status': 'ok'})),
]
