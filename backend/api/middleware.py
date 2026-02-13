"""
Rate limiting and security middleware for OWASP compliance.
Handles request throttling, security headers, and input validation.
"""

import logging
import json
from contextlib import suppress
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from django.core.cache import cache
from django.conf import settings
from .security import RateLimiter, SecurityHeaders

logger = logging.getLogger(__name__)

# Default rate limits for different endpoint patterns
ENDPOINT_RATE_LIMITS = {
    '/api/register/': {'rate': 5, 'interval': 3600},  # 5 registrations per hour per IP
    '/api/auth/': {'rate': 10, 'interval': 300},  # 10 auth attempts per 5 minutes
    '/api/users/delete_account/': {'rate': 1, 'interval': 86400},  # 1 per day
    '/api/': {'rate': 300, 'interval': 3600},  # 300 general requests per hour (default)
}


class RateLimitMiddleware(MiddlewareMixin):
    """
    Middleware for IP-based rate limiting on public endpoints.
    Implements graceful 429 responses with Retry-After headers.
    
    OWASP ASV Requirements:
    - V11.1.1: Verify that the TLS version, hash function, and cipher suites are configured to prevent known attacks.
    - Rate limiting prevents brute force attacks and DoS.
    """
    
    @staticmethod
    def _get_client_ip(request) -> str:
        """Extract client IP from request, handling proxies."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')
    
    @staticmethod
    def _get_email_from_request(request) -> str | None:
        """Extract email from JSON request body."""
        email = None
        with suppress(json.JSONDecodeError, ValueError, TypeError):
            if request.content_type == 'application/json':
                email = json.loads(request.body).get('email', '').lower().strip()
        return email or None
    
    @staticmethod
    def _rate_limit_response(detail: str, retry_after: int) -> JsonResponse:
        """Create a standard rate limit response."""
        return JsonResponse(
            {
                'status': 'error',
                'detail': detail,
                'error_code': 'RATE_LIMIT_EXCEEDED'
            },
            status=429,
            headers={'Retry-After': str(retry_after)}
        )
    
    def process_request(self, request):
        """
        Check if request exceeds rate limit before processing.
        Uses email-based limiting for registration, IP-based for other endpoints.
        """
        # Skip rate limiting in DEBUG mode (development and tests)
        if settings.DEBUG:
            return None
        
        # Skip rate limiting for health checks and static files
        if request.path.startswith('/static/') or request.path == '/health/':
            return None
        
        # Determine rate limit for this endpoint
        rate, interval = 300, 3600  # Default: 300 requests per hour
        
        for endpoint_pattern, limits in ENDPOINT_RATE_LIMITS.items():
            if request.path.startswith(endpoint_pattern):
                rate = limits['rate']
                interval = limits['interval']
                break
        
        # Check rate limit (IP-based for unauthenticated requests)
        limiter = RateLimiter(rate=rate, interval=interval)
        
        # Special handling for registration: use email-based rate limiting
        if request.path.startswith('/api/register/') and request.method == 'POST':
            email = self._get_email_from_request(request)
            
            if email and limiter.is_rate_limited(request, email=email):
                retry_after = limiter.get_retry_after(request, email=email)
                logger.warning(f"Email {email} rate limited for registration")
                return self._rate_limit_response(
                    'Too many registration attempts for this email. Please try again later.',
                    retry_after
                )
        
        # For authenticated users, also check user-based limits (higher limits)
        if request.user and request.user.is_authenticated:
            limiter = RateLimiter(rate=rate * 2, interval=interval)
            if limiter.is_rate_limited(request, user_based=True):
                retry_after = limiter.get_retry_after(request, user_based=True)
                logger.warning(f"User {request.user.id} rate limited: {request.path}")
                return self._rate_limit_response(
                    'Too many requests. Please try again later.',
                    retry_after
                )
        elif not (request.path.startswith('/api/register/') and request.method == 'POST'):
            # IP-based rate limit for other unauthenticated requests (not registration)
            if limiter.is_rate_limited(request, user_based=False):
                client_ip = self._get_client_ip(request)
                retry_after = limiter.get_retry_after(request, user_based=False)
                logger.warning(f"IP {client_ip} rate limited: {request.path}")
                return self._rate_limit_response(
                    'Too many requests. Please try again later.',
                    retry_after
                )
        
        return None


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Middleware to add OWASP-recommended security headers to all responses.
    
    OWASP ASVS Requirements:
    - V14.4: Verify that the application sets and validates appropriate HTTP security headers.
    - V14.4.4: Verify that the application sets appropriate referrer policy.
    """
    
    def process_response(self, request, response):
        """Add security headers to response."""
        return SecurityHeaders.add_security_headers(response)


class InputValidationMiddleware(MiddlewareMixin):
    """
    Middleware for early-stage input validation.
    Logs suspicious input patterns and oversized requests.
    
    OWASP ASVS Requirements:
    - V5.1: Verify that all input is validated on both client and server side.
    - V5.3: Verify that input validation failures result in request rejection.
    """
    
    MAX_REQUEST_SIZE = 10 * 1024 * 1024  # 10 MB
    SUSPICIOUS_PATTERNS = [
        'union select',
        'drop table',
        'exec(',
        '<script',
        'javascript:',
        'onerror=',
        'onclick=',
    ]
    
    def process_request(self, request):
        """
        Validate request early in the middleware chain.
        """
        # Check Content-Length header
        with suppress(ValueError):
            if (size := int(request.META.get('CONTENT_LENGTH', 0))) > self.MAX_REQUEST_SIZE:
                logger.warning(
                    f"Oversized request from {request.META.get('REMOTE_ADDR')}: "
                    f"{size} bytes (max: {self.MAX_REQUEST_SIZE})"
                )
                return JsonResponse(
                    {
                        'status': 'error',
                        'detail': 'Request body is too large.',
                        'error_code': 'REQUEST_TOO_LARGE'
                    },
                    status=413  # Payload Too Large
                )
        
        # Check for suspicious patterns in query string
        if query_string := (request.GET.urlencode().lower() if request.GET else None):
            for pattern in self.SUSPICIOUS_PATTERNS:
                if pattern in query_string:
                    logger.warning(
                        f"Suspicious pattern detected in query string from "
                        f"{request.META.get('REMOTE_ADDR')}: {pattern}"
                    )
                    break
        
        return None
