"""
Error handling utilities and middleware for standardized error responses
Implements UC-012 error response standardization
"""
import logging
from rest_framework import status
from rest_framework.response import Response
from rest_framework.exceptions import (
    APIException, ValidationError as DRFValidationError, 
    AuthenticationFailed, NotAuthenticated, NotFound
)
from django.http import JsonResponse, Http404
from .exceptions import SynkException


logger = logging.getLogger(__name__)


def format_error_response(error_code, message, field_errors=None, status_code=400):
    """
    Format error response according to UC-012 standard
    
    Args:
        error_code: Machine-readable error code (e.g., 'DUPLICATE_EMAIL')
        message: User-friendly error message
        field_errors: Optional dict of field-level validation errors
        status_code: HTTP status code
        
    Returns:
        Dict with standardized error format
    """
    response = {
        'status': 'error',
        'error_code': error_code,
        'message': message,
    }
    
    if field_errors:
        response['errors'] = field_errors
    
    return response, status_code


def synk_exception_handler(exc, context):
    """
    Custom exception handler for all API errors
    Returns standardized error response format
    
    Implements UC-012 requirements:
    - Consistent JSON format for all errors
    - Error codes and user-friendly messages
    - Field-level validation errors
    - Server-side logging for 500 errors
    - Generic message to client for 500 errors
    """
    
    # Log the exception
    logger.error(
        f"API Error: {exc.__class__.__name__}",
        exc_info=True,
        extra={
            'path': context.get('request').path if context.get('request') else 'unknown',
            'method': context.get('request').method if context.get('request') else 'unknown',
        }
    )
    
    # Handle Django Http404 as 404 error
    if isinstance(exc, Http404):
        response_data, status_code = format_error_response(
            error_code='not_found',
            message='The requested resource was not found.',
            status_code=status.HTTP_404_NOT_FOUND
        )
        return Response(response_data, status=status_code)
    
    # Handle custom Synk exceptions
    if isinstance(exc, SynkException):
        response_data, status_code = format_error_response(
            error_code=exc.error_code,
            message=str(exc.detail),
            field_errors=exc.field_errors if exc.field_errors else None,
            status_code=exc.status_code
        )
        return Response(response_data, status=status_code)
    
    # Handle authentication failures (invalid credentials)
    if isinstance(exc, AuthenticationFailed):
        response_data, status_code = format_error_response(
            error_code='invalid_credentials',
            message='Invalid credentials provided.',
            status_code=status.HTTP_401_UNAUTHORIZED
        )
        return Response(response_data, status=status_code)
    
    # Handle missing authentication
    if isinstance(exc, NotAuthenticated):
        response_data, status_code = format_error_response(
            error_code='authentication_required',
            message='Authentication credentials were not provided.',
            status_code=status.HTTP_401_UNAUTHORIZED
        )
        return Response(response_data, status=status_code)
    
    # Handle 404 not found
    if isinstance(exc, NotFound):
        response_data, status_code = format_error_response(
            error_code='not_found',
            message='The requested resource was not found.',
            status_code=status.HTTP_404_NOT_FOUND
        )
        return Response(response_data, status=status_code)
    
    # Handle DRF validation errors
    if isinstance(exc, DRFValidationError):
        # Validation errors are always 400, even for token endpoint
        response_data, status_code = format_error_response(
            error_code='validation_error',
            message='Validation failed. Please check the errors below.',
            field_errors=exc.detail if isinstance(exc.detail, dict) else None,
            status_code=status.HTTP_400_BAD_REQUEST
        )
        return Response(response_data, status=status_code)
    
    # Handle standard DRF API exceptions
    if isinstance(exc, APIException):
        status_code = exc.status_code or status.HTTP_500_INTERNAL_SERVER_ERROR
        
        # Map common error codes
        error_code_map = {
            status.HTTP_400_BAD_REQUEST: 'bad_request',
            status.HTTP_401_UNAUTHORIZED: 'unauthorized',
            status.HTTP_403_FORBIDDEN: 'forbidden',
            status.HTTP_404_NOT_FOUND: 'not_found',
            status.HTTP_405_METHOD_NOT_ALLOWED: 'method_not_allowed',
            status.HTTP_500_INTERNAL_SERVER_ERROR: 'server_error',
        }
        
        error_code = error_code_map.get(status_code, 'api_error')
        
        response_data, _ = format_error_response(
            error_code=error_code,
            message=str(exc.detail),
            status_code=status_code
        )
        return Response(response_data, status=status_code)
    
    # Handle generic exceptions as server errors
    response_data, status_code = format_error_response(
        error_code='server_error',
        message='An unexpected error occurred. Please try again later.',
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
    return Response(response_data, status=status_code)


class ErrorLoggingMiddleware:
    """
    Middleware to log HTTP errors
    Helps with debugging and monitoring UC-012 error handling
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Log error responses
        if response.status_code >= 400:
            logger.warning(
                f"HTTP {response.status_code}: {request.method} {request.path}",
                extra={
                    'status_code': response.status_code,
                    'path': request.path,
                    'method': request.method,
                    'user': str(request.user) if request.user else 'anonymous',
                }
            )
        
        return response
