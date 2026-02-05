"""
Custom exception classes for standardized error handling
All exceptions follow the UC-012 error response format
"""
from rest_framework import status
from rest_framework.exceptions import APIException


class SynkException(APIException):
    """Base exception class for Synk API errors"""
    default_detail = "An error occurred"
    default_code = "error"
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    
    def __init__(self, detail=None, code=None, error_code=None, field_errors=None):
        """
        Initialize exception with optional custom details
        
        Args:
            detail: User-friendly error message
            code: Error code for frontend handling
            error_code: Specific error code (e.g., 'DUPLICATE_EMAIL')
            field_errors: Dict of field-level validation errors
        """
        self.detail = detail or self.default_detail
            
        self.code = code or self.default_code
        self.error_code = error_code or code or self.default_code
        self.field_errors = field_errors or {}


class ValidationError(SynkException):
    """Raised when validation fails"""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Validation failed"
    default_code = "validation_error"
    
    def __init__(self, detail=None, code=None, field_errors=None):
        super().__init__(
            detail=detail or "Please check the errors below",
            code=code or "validation_error",
            error_code=code or "validation_error",
            field_errors=field_errors
        )


class DuplicateEmailError(ValidationError):
    """Raised when email already exists"""
    default_detail = "Email already registered"
    default_code = "duplicate_email"
    
    def __init__(self):
        super().__init__(
            detail="A user with this email already exists",
            code="duplicate_email",
            error_code="duplicate_email",
            field_errors={"email": ["This email is already registered. Please use a different email or try logging in."]}
        )


class DuplicateUsernameError(ValidationError):
    """Raised when username already exists"""
    default_detail = "Username already taken"
    default_code = "duplicate_username"
    
    def __init__(self):
        super().__init__(
            detail="A user with this username already exists",
            code="duplicate_username",
            error_code="duplicate_username",
            field_errors={"username": ["This username is already taken. Please choose a different username."]}
        )


class InvalidCredentialsError(SynkException):
    """Raised when login credentials are invalid"""
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = "Invalid credentials"
    default_code = "invalid_credentials"
    
    def __init__(self):
        super().__init__(
            detail="Invalid username or password",
            code="invalid_credentials",
            error_code="invalid_credentials"
        )


class AuthenticationRequiredError(SynkException):
    """Raised when authentication is required"""
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = "Authentication required"
    default_code = "authentication_required"
    
    def __init__(self):
        super().__init__(
            detail="Authentication required. Please login.",
            code="authentication_required",
            error_code="authentication_required"
        )


class NotFoundError(SynkException):
    """Raised when resource is not found"""
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "Resource not found"
    default_code = "not_found"
    
    def __init__(self, resource="Resource"):
        super().__init__(
            detail=f"{resource} not found",
            code="not_found",
            error_code="not_found"
        )


class ServerError(SynkException):
    """Raised when server error occurs"""
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = "An internal server error occurred"
    default_code = "server_error"
    
    def __init__(self, detail=None):
        super().__init__(
            detail=detail or "An unexpected error occurred. Please try again later.",
            code="server_error",
            error_code="server_error"
        )


class PasswordMismatchError(ValidationError):
    """Raised when passwords don't match"""
    def __init__(self):
        super().__init__(
            detail="Passwords do not match",
            code="password_mismatch",
            error_code="password_mismatch",
            field_errors={"password": ["Passwords must match"]}
        )


class WeakPasswordError(ValidationError):
    """Raised when password doesn't meet strength requirements"""
    def __init__(self):
        super().__init__(
            detail="Password is too weak",
            code="weak_password",
            error_code="weak_password",
            field_errors={"password": ["Password must be at least 8 characters long"]}
        )
