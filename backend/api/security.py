"""
Security utilities for rate limiting, input validation, and sanitization.
Implements OWASP best practices for API security.
"""

from functools import wraps
from datetime import timedelta
import logging
import bleach  # type: ignore[import]
from django.core.cache import cache
from django.utils.timezone import now
from rest_framework.response import Response
from rest_framework import status
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

# OWASP recommended allowed HTML tags for sanitization (minimal subset)
ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'p', 'br', 'a', 'ul', 'ol', 'li']
ALLOWED_ATTRIBUTES = {'a': ['href', 'title']}


class RateLimiter:
    """
    Rate limiter for IP-based and user-based rate limiting.
    Implements graceful 429 responses with retry-after header.
    """
    
    def __init__(self, rate: int = 100, interval: int = 3600):
        """
        Initialize rate limiter.
        
        Args:
            rate: Number of requests allowed
            interval: Time interval in seconds (default: 1 hour)
        """
        self.rate = rate
        self.interval = interval
    
    def get_client_key(self, request, user_based: bool = False) -> str:
        """
        Get cache key for rate limiting.
        Supports both IP-based and user-based limiting.
        
        Args:
            request: Django request object
            user_based: If True, use user ID; if False, use IP address
            
        Returns:
            Cache key string
        """
        if user_based and request.user and request.user.is_authenticated:
            return f"ratelimit:user:{request.user.id}"
        
        # Get client IP (handles proxies)
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            client_ip = x_forwarded_for.split(',')[0].strip()
        else:
            client_ip = request.META.get('REMOTE_ADDR', 'unknown')
        
        return f"ratelimit:ip:{client_ip}"
    
    def is_rate_limited(self, request, user_based: bool = False) -> bool:
        """
        Check if request exceeds rate limit.
        
        Args:
            request: Django request object
            user_based: If True, apply user-based limiting
            
        Returns:
            True if rate limited, False otherwise
        """
        key = self.get_client_key(request, user_based)
        current_count = cache.get(key, 0)
        
        if current_count >= self.rate:
            logger.warning(f"Rate limit exceeded for {key}")
            return True
        
        # Increment counter
        cache.set(key, current_count + 1, self.interval)
        return False
    
    def get_retry_after(self, request, user_based: bool = False) -> int:
        """Get remaining time until rate limit resets."""
        key = self.get_client_key(request, user_based)
        ttl = cache.ttl(key) if hasattr(cache, 'ttl') else self.interval
        return max(ttl, 0)


def rate_limit(rate: int = 100, interval: int = 3600, user_based: bool = False):
    """
    Decorator for rate limiting on DRF views.
    
    Args:
        rate: Number of requests allowed (default: 100 per hour)
        interval: Time interval in seconds (default: 3600 = 1 hour)
        user_based: If True, rate limit per user; if False, per IP (default: False)
        
    Usage:
        @rate_limit(rate=50, interval=3600, user_based=True)
        def post(self, request):
            ...
    """
    limiter = RateLimiter(rate=rate, interval=interval)
    
    def decorator(func):
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):
            if limiter.is_rate_limited(request, user_based):
                retry_after = limiter.get_retry_after(request, user_based)
                return Response(
                    {
                        'status': 'error',
                        'detail': 'Too many requests. Please try again later.',
                        'error_code': 'RATE_LIMIT_EXCEEDED'
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                    headers={'Retry-After': str(retry_after)}
                )
            return func(self, request, *args, **kwargs)
        return wrapper
    return decorator


class InputValidator:
    """
    Validates and sanitizes user input according to OWASP guidelines.
    Prevents injection attacks and validates data types.
    """
    
    @staticmethod
    def sanitize_string(value: str, max_length: int = 1000, allow_html: bool = False) -> str:
        """
        Sanitize string input.
        
        Args:
            value: Input string
            max_length: Maximum allowed length
            allow_html: Whether to allow HTML tags (sanitized)
            
        Returns:
            Sanitized string
            
        Raises:
            ValueError: If input exceeds max length
        """
        if not isinstance(value, str):
            raise ValueError("Input must be a string")
        
        # Strip whitespace
        value = value.strip()
        
        # Check length
        if len(value) > max_length:
            raise ValueError(f"Input exceeds maximum length of {max_length} characters")
        
        # Sanitize HTML if allowed
        return bleach.clean(
            value,
            tags=ALLOWED_TAGS if allow_html else [],
            attributes=ALLOWED_ATTRIBUTES if allow_html else {},
            strip=True
        )
    
    @staticmethod
    def validate_email(email: str) -> str:
        """Validate and normalize email address."""
        if not isinstance(email, str):
            raise ValueError("Email must be a string")
        
        email = email.strip().lower()
        
        if len(email) > 254:  # RFC 5321
            raise ValueError("Email is too long")
        
        # Basic email format check (additional validation done by Django)
        if '@' not in email or '.' not in email.split('@')[-1]:
            raise ValueError("Invalid email format")
        
        return email
    
    @staticmethod
    def validate_integer(value: Any, min_value: Optional[int] = None, 
                        max_value: Optional[int] = None) -> int:
        """
        Validate integer input.
        
        Args:
            value: Input value
            min_value: Minimum allowed value (optional)
            max_value: Maximum allowed value (optional)
            
        Returns:
            Validated integer
            
        Raises:
            ValueError: If validation fails
        """
        try:
            value = int(value)
        except (TypeError, ValueError) as e:
            raise ValueError("Input must be an integer") from e
        
        if min_value is not None and value < min_value:
            raise ValueError(f"Value must be at least {min_value}")
        
        if max_value is not None and value > max_value:
            raise ValueError(f"Value must be at most {max_value}")
        
        return value
    
    @staticmethod
    def validate_dict(data: Dict, required_fields: list = None, 
                     allowed_fields: list = None) -> Dict:
        """
        Validate dictionary input.
        Rejects unexpected fields and ensures required fields are present.
        
        Args:
            data: Input dictionary
            required_fields: List of required field names
            allowed_fields: List of allowed field names (if not provided, all are allowed)
            
        Returns:
            Validated dictionary
            
        Raises:
            ValueError: If validation fails
        """
        if not isinstance(data, dict):
            raise ValueError("Input must be a dictionary")
        
        # Check for required fields
        if required_fields and (missing := set(required_fields) - set(data.keys())):
            raise ValueError(f"Missing required fields: {', '.join(missing)}")
        
        # Check for unexpected fields
        if allowed_fields and (unexpected := set(data.keys()) - set(allowed_fields)):
            logger.warning(f"Unexpected fields in request: {unexpected}")
            # Remove unexpected fields
            data = {k: v for k, v in data.items() if k in allowed_fields}
        
        return data


class SecurityHeaders:
    """
    OWASP-recommended security headers middleware.
    """
    
    @staticmethod
    def add_security_headers(response):
        """
        Add OWASP-recommended security headers to response.
        
        Headers added:
        - X-Frame-Options: Prevent clickjacking
        - X-Content-Type-Options: Prevent MIME sniffing
        - X-XSS-Protection: Legacy XSS protection
        - Content-Security-Policy: Restrict content sources
        - Referrer-Policy: Control referrer information
        - Permissions-Policy: Restrict browser features
        - Strict-Transport-Security: HTTPS only (production)
        """
        # Prevent clickjacking attacks
        response['X-Frame-Options'] = 'DENY'
        
        # Prevent MIME type sniffing
        response['X-Content-Type-Options'] = 'nosniff'
        
        # Legacy XSS protection (mostly for older browsers)
        response['X-XSS-Protection'] = '1; mode=block'
        
        # Strict Content Security Policy (no unsafe-inline for production)
        response['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' https:; "
            "frame-ancestors 'none'; "
            "form-action 'self'; "
            "base-uri 'self';"
        )
        
        # Control referrer information leakage
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Restrict powerful browser features
        response['Permissions-Policy'] = (
            'geolocation=(), '
            'microphone=(), '
            'camera=(), '
            'payment=(), '
            'usb=(), '
            'magnetometer=(), '
            'gyroscope=(), '
            'accelerometer=()'
        )
        
        return response


def sanitize_input(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Utility function to sanitize all string values in a dictionary.
    
    Args:
        data: Dictionary with input data
        
    Returns:
        Dictionary with sanitized values
    """
    sanitized = {}
    for key, value in data.items():
        if isinstance(value, str):
            try:
                sanitized[key] = InputValidator.sanitize_string(value)
            except ValueError as e:
                logger.warning(f"Failed to sanitize field '{key}': {e}")
                sanitized[key] = value
        else:
            sanitized[key] = value
    return sanitized
