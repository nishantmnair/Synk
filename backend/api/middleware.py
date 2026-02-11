"""
Rate limiting and security middleware for OWASP compliance.
Handles request throttling, security headers, and input validation.
"""

import logging
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
    
    def process_request(self, request):
        """
        Check if request exceeds rate limit before processing.
        """
        # Skip rate limiting in DEBUG mode (development and tests)
        if settings.DEBUG:
            return None
        
        # Skip rate limiting for health checks and static files
        if request.path.startswith('/static/') or request.path == '/health/':
            return None
        
        # Get client IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            client_ip = x_forwarded_for.split(',')[0].strip()
        else:
            client_ip = request.META.get('REMOTE_ADDR', 'unknown')
        
        # Determine rate limit for this endpoint
        rate, interval = 300, 3600  # Default: 300 requests per hour
        
        for endpoint_pattern, limits in ENDPOINT_RATE_LIMITS.items():
            if request.path.startswith(endpoint_pattern):
                rate = limits['rate']
                interval = limits['interval']
                break
        
        # Check rate limit (IP-based for unauthenticated requests)
        limiter = RateLimiter(rate=rate, interval=interval)
        
        # For authenticated users, also check user-based limits (higher limits)
        if request.user and request.user.is_authenticated:
            # User-based rate limit is typically higher
            limiter = RateLimiter(rate=rate * 2, interval=interval)
            if limiter.is_rate_limited(request, user_based=True):
                retry_after = limiter.get_retry_after(request, user_based=True)
                logger.warning(f"User {request.user.id} rate limited: {request.path}")
                return JsonResponse(
                    {
                        'status': 'error',
                        'detail': 'Too many requests. Please try again later.',
                        'error_code': 'RATE_LIMIT_EXCEEDED'
                    },
                    status=429,
                    headers={'Retry-After': str(retry_after)}
                )
        elif limiter.is_rate_limited(request, user_based=False):
            # IP-based rate limit for unauthenticated requests
            retry_after = limiter.get_retry_after(request, user_based=False)
            logger.warning(f"IP {client_ip} rate limited: {request.path}")
            return JsonResponse(
                {
                    'status': 'error',
                    'detail': 'Too many requests. Please try again later.',
                    'error_code': 'RATE_LIMIT_EXCEEDED'
                },
                status=429,
                headers={'Retry-After': str(retry_after)}
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
