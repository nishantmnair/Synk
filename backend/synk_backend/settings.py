"""
Django settings for synk_backend project.

SECURITY NOTES:
- Sensitive configuration is loaded from environment variables
- DEBUG is disabled by default in production (set via env)
- All sensitive keys are required in production, not hardcoded
"""

from pathlib import Path
from datetime import timedelta
import os
import sys

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env and .env.local (local overrides)
from dotenv import load_dotenv
load_dotenv(BASE_DIR / '.env')
load_dotenv(BASE_DIR / '.env.local', override=True)

# ============================================================================
# ENVIRONMENT VALIDATION - Catch configuration errors early
# ============================================================================

# Detect testing environment FIRST
IS_TESTING = any(arg in sys.argv for arg in ['pytest', 'test', 'runtests']) or 'pytest' in sys.modules

# Set DEBUG based on environment and testing
DEBUG = os.environ.get('DEBUG', 'False') == 'True' or IS_TESTING

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    if DEBUG or IS_TESTING:
        SECRET_KEY = 'django-insecure-development-only'
    else:
        raise ValueError('SECRET_KEY environment variable is required in production')

# ALLOWED_HOSTS: Restrict in production, permissive in development
if DEBUG:
    ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', 'localhost:8000']
else:
    # Production: Allow from environment variable, with sensible defaults
    default_hosts = 'localhost,127.0.0.1,*.onrender.com'
    hosts_str = os.environ.get('ALLOWED_HOSTS', default_hosts)
    ALLOWED_HOSTS = [host.strip() for host in hosts_str.split(',') if host.strip()]


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'channels',
    # Local apps
    'api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # Security middleware (rate limiting and security headers)
    'api.middleware.RateLimitMiddleware',
    'api.middleware.SecurityHeadersMiddleware',
    'api.middleware.InputValidationMiddleware',
    # Error handling and logging
    'api.error_handling.ErrorLoggingMiddleware',
]

ROOT_URLCONF = 'synk_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'synk_backend.wsgi.application'
ASGI_APPLICATION = 'synk_backend.asgi.application'


# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases

# Database configuration - uses PostgreSQL by default (Docker), falls back to SQLite for local dev
DB_HOST = os.environ.get('DB_HOST', 'localhost')

if DB_HOST and DB_HOST != 'localhost':
    # Use PostgreSQL (for Docker)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'synk_db'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', 'postgres'),
            'HOST': DB_HOST,
            'PORT': os.environ.get('DB_PORT', '5432'),
            'OPTIONS': {
                'connect_timeout': 10,
            },
        }
    }
else:
    # Use SQLite for local development (when DB_HOST is localhost or not set)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }


# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework settings
# OWASP ASVS compliance: Rate limiting, input validation, secure defaults
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 100,
    'EXCEPTION_HANDLER': 'api.error_handling.synk_exception_handler',
    # Rate limiting (throttling) for DRF
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',  # Unauthenticated users: 100 requests per hour
        'user': '300/hour',  # Authenticated users: 300 requests per hour
    }
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# CORS settings
# Default includes common development and deployment patterns
_default_cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",  # Vite default port
    "http://127.0.0.1:5173",
    "https://localhost",
    "http://0.0.0.0:3000",
    "http://0.0.0.0:8000",
]

# Add from environment if specified
_env_origins = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if _env_origins:
    _default_cors_origins.extend([o.strip() for o in _env_origins.split(',') if o.strip()])

CORS_ALLOWED_ORIGINS = _default_cors_origins

CORS_ALLOW_CREDENTIALS = True

# Channels settings
if DEBUG:
    # Development: Allow all origins and use in-memory channel layer
    CORS_ALLOW_ALL_ORIGINS = False  # Keep False for security, but add common dev ports above
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        },
    }
else:
    # Production: use Redis for multi-worker deployment
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {
                'hosts': [(os.environ.get('REDIS_HOST', 'localhost'), int(os.environ.get('REDIS_PORT', 6379)))],
            },
        },
    }

# ============================================================================
# PRODUCTION SECURITY SETTINGS (OWASP ASVS Compliance)
# ============================================================================
# Environment variable validation
if not DEBUG:
    if missing_vars := [var for var in ['SECRET_KEY', 'ALLOWED_HOSTS'] if not os.environ.get(var)]:
        raise ValueError(f'CRITICAL: Missing required production environment variables: {missing_vars}')

# Django URL configuration - Allow trailing slashes for DRF
APPEND_SLASH = True

# HTTPS/SSL Settings
# In production (DEBUG=False), enforce these settings
# Exclude testing environments from SSL redirect
if not DEBUG and not IS_TESTING:
    # Redirect all HTTP requests to HTTPS
    SECURE_SSL_REDIRECT = True
    
    # HSTS - Force HTTPS for 31536000 seconds (1 year)
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    
    # Use HTTPS for session and CSRF cookies
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    
    # Additional cookie security
    SESSION_COOKIE_HTTPONLY = True
    CSRF_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Strict'
    CSRF_COOKIE_SAMESITE = 'Strict'
    
    # Prevent browsers from caching responses with sensitive data
    SESSION_COOKIE_AGE = 3600  # 1 hour for security
    SESSION_EXPIRE_AT_BROWSER_CLOSE = True

# Development and testing environments
else:
    # In development and tests, allow HTTP for easier testing
    SECURE_SSL_REDIRECT = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False

# Security: Allowed Origins for CORS (configurable per environment)
PRODUCTION_ALLOWED_ORIGINS = os.environ.get('PRODUCTION_ALLOWED_ORIGINS', '').split(',') if os.environ.get('PRODUCTION_ALLOWED_ORIGINS') else []
if PRODUCTION_ALLOWED_ORIGINS and PRODUCTION_ALLOWED_ORIGINS[0]:
    CORS_ALLOWED_ORIGINS = PRODUCTION_ALLOWED_ORIGINS

# Gemini API Key (should only be server-side)
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')

# ============================================================================
# LOGGING CONFIGURATION - For production monitoring and security auditing
# ============================================================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'standard': {
            'format': '[%(asctime)s] %(levelname)s %(name)s: %(message)s',
            'datefmt': '%Y-%m-%d %H:%M:%S',
        },
        'verbose': {
            'format': '[%(asctime)s] %(levelname)s %(name)s [%(filename)s:%(lineno)d] %(message)s',
            'datefmt': '%Y-%m-%d %H:%M:%S',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'standard',
            'stream': 'ext://sys.stdout',
        },
        'console_verbose': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
            'stream': 'ext://sys.stdout',
            'level': 'DEBUG',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': os.getenv('LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['console'],
            'level': os.getenv('DB_LOG_LEVEL', 'WARNING'),  # Avoid spam
            'propagate': False,
        },
        'api': {
            'handlers': ['console'],
            'level': os.getenv('LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
        # Security-related logging
        'api.middleware': {
            'handlers': ['console'],
            'level': 'INFO',  # Always log rate limiting and security events
            'propagate': False,
        },
        'api.security': {
            'handlers': ['console'],
            'level': 'INFO',  # Always log security events
            'propagate': False,
        },
    },
    'root': {
        'handlers': ['console'],
        'level': os.getenv('LOG_LEVEL', 'INFO'),
    },
}
