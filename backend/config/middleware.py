"""Custom middleware for the application"""
from django.utils.deprecation import MiddlewareMixin


class DisableCSRFForAPIMiddleware(MiddlewareMixin):
    """
    Disable CSRF checks for API endpoints since they use token authentication.
    This middleware should be placed before CsrfViewMiddleware in MIDDLEWARE.
    """
    def process_request(self, request):
        if request.path.startswith('/api/'):
            setattr(request, '_dont_enforce_csrf_checks', True)
