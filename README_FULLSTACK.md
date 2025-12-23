# Activity App - Full Stack Architecture

A modern full-stack application for managing couple activities with Django REST Framework backend, PostgreSQL database, React frontend with Material UI, and Firebase authentication.

## Tech Stack

### Backend
- **Django 5.2** - Web framework
- **Django REST Framework 3.14** - REST API
- **PostgreSQL 15** - Primary database
- **Redis 7** - Caching & message broker
- **Celery** - Async task queue
- **Gunicorn** - WSGI HTTP server
- **Firebase Admin SDK** - Authentication integration

### Frontend
- **React 19** - UI library
- **Material UI (MUI) 5** - Component library
- **React Router DOM 6** - Routing
- **Axios** - HTTP client
- **Vite** - Build tool

### DevOps
- **Docker & Docker Compose** - Containerization
- **Nginx** - Reverse proxy
- **PostgreSQL 15** - Database
- **Redis 7** - Cache/queue

### Testing
- **pytest** - Backend testing
- **pytest-django** - Django-specific tests
- **factory_boy** - Test fixtures
- **Jest** - Frontend testing
- **React Testing Library** - Component tests

## Architecture Overview

```
┌─────────────────┐
│   React + MUI   │
│   Frontend      │
└────────┬────────┘
         │
    ┌────▼────┐
    │  Nginx  │
    └────┬────┘
         │
    ┌────▼─────────┐
    │  Django DRF  │
    │   Backend    │
    └──┬───────┬───┘
       │       │
   ┌───▼──┐ ┌─▼──────┐
   │ PG   │ │ Redis  │
   │ SQL  │ │ Celery │
   └──────┘ └────────┘
```

## Project Structure

```
activity-app/
├── backend/              # Django backend
│   ├── config/          # Project settings
│   ├── users/           # User management
│   ├── activities/      # Activity domain
│   ├── requirements.txt
│   ├── Dockerfile
│   └── entrypoint.sh
├── src/                 # React frontend
│   ├── components/      # React components
│   ├── contexts/        # React contexts
│   └── lib/            # Utilities
├── nginx/              # Nginx configuration
├── docker-compose.prod.yml
└── package.json
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- Python 3.12+
- PostgreSQL 15+
- Redis 7+

### Local Development

1. **Clone and setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase credentials and settings
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Run migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   python manage.py createsuperuser
   ```

4. **Start backend services**
   ```bash
   # Terminal 1: Django
   python manage.py runserver
   
   # Terminal 2: Celery Worker
   celery -A config worker -l info
   
   # Terminal 3: Celery Beat
   celery -A config beat -l info
   ```

5. **Install frontend dependencies**
   ```bash
   npm install
   ```

6. **Start frontend**
   ```bash
   npm run dev
   ```

### Production Deployment with Docker

1. **Build and start all services**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

2. **Run migrations**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
   ```

3. **Create superuser**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
   ```

4. **Access the application**
   - Frontend: http://localhost
   - API: http://localhost/api/v1/
   - Admin: http://localhost/admin/

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/swagger/
- ReDoc: http://localhost:8000/redoc/

## Database Migrations

### Migrate from Firestore to PostgreSQL

```bash
python manage.py migrate_from_firestore
```

This will:
1. Migrate users and profiles
2. Migrate couples and relationships
3. Migrate sections and activities
4. Preserve all activity history

## Environment Variables

See `.env.example` for required configuration:

- `DEBUG` - Debug mode (True/False)
- `SECRET_KEY` - Django secret key
- `POSTGRES_*` - Database credentials
- `REDIS_URL` - Redis connection
- `FIREBASE_CREDENTIALS_PATH` - Firebase service account JSON
- `CORS_ALLOWED_ORIGINS` - Frontend URLs

## Testing

### Backend Tests
```bash
cd backend
pytest
pytest --cov  # With coverage report
```

### Frontend Tests
```bash
npm test
npm run test:coverage
```

## API Endpoints

### Users
- `GET /api/v1/users/users/` - List users
- `GET /api/v1/users/profiles/` - List profiles
- `GET /api/v1/users/couples/` - List couples
- `POST /api/v1/users/couples/join/` - Join couple with invite code

### Activities
- `GET /api/v1/activities/sections/` - List sections
- `POST /api/v1/activities/sections/` - Create section
- `GET /api/v1/activities/activities/` - List activities
- `POST /api/v1/activities/activities/` - Create activity
- `POST /api/v1/activities/activities/{id}/mark_complete/` - Mark complete
- `POST /api/v1/activities/activities/{id}/restore/` - Restore deleted
- `GET /api/v1/activities/reminders/` - List reminders
- `POST /api/v1/activities/reminders/{id}/dismiss/` - Dismiss reminder

## Scheduled Tasks

Celery Beat runs these tasks:
- **Daily**: Check for activity reminders (overdue recurring activities)
- **Weekly**: Cleanup old dismissed reminders and deleted activities

## Security

- Firebase token authentication for all API endpoints
- CORS configuration for frontend origins
- Couple membership verification on all endpoints
- PostgreSQL with proper user permissions
- Redis password protection in production

## Performance

- Redis caching for frequently accessed data
- PostgreSQL connection pooling
- Nginx static file serving
- Gzip compression
- Django static file optimization with WhiteNoise

## Monitoring

- Django Admin for data management
- Celery Flower for task monitoring (optional)
- PostgreSQL query logging
- Nginx access logs

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
