# Activity App - Docker Development Setup

## Quick Start

Start all services with one command:

```bash
docker-compose up -d --build
```

This will start:
- **PostgreSQL** (port 5432) - Database
- **Redis** (port 6379) - Cache & message broker
- **Django Backend** (port 8000) - API server
- **Celery Worker** - Background tasks
- **Celery Beat** - Task scheduler
- **React Frontend** (port 5173) - Development server

## First Time Setup

### 1. Configure Firebase

```bash
# 1. Get Firebase service account JSON from Firebase Console
# 2. Save it as backend/serviceAccountKey.json
# 3. Update frontend .env with Firebase client config
```

### 2. Run Migrations

```bash
# The containers auto-run migrations on startup, but you can run manually:
docker-compose exec backend python manage.py migrate
```

### 3. Create Superuser (Optional)

```bash
docker-compose exec backend python manage.py createsuperuser
```

A default superuser is auto-created:
- Email: `admin@example.com`
- Password: `admin`

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **API**: http://localhost:8000/api/v1/
- **Admin Panel**: http://localhost:8000/admin/
- **API Docs**: http://localhost:8000/swagger/

## Development Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f celery
```

### Run Django Commands

```bash
# Shell
docker-compose exec backend python manage.py shell

# Create migrations
docker-compose exec backend python manage.py makemigrations

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser
```

### Database Access

```bash
# PostgreSQL shell
docker-compose exec postgres psql -U postgres -d activity_app

# Django dbshell
docker-compose exec backend python manage.py dbshell
```

### Redis Access

```bash
# Redis CLI
docker-compose exec redis redis-cli
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
```

### Stop Services

```bash
# Stop all
docker-compose down

# Stop and remove volumes (WARNING: deletes database)
docker-compose down -v
```

### Rebuild After Code Changes

```bash
# Rebuild all
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build backend
```

## Frontend Development

The React app runs with Vite's dev server with hot reload enabled.

```bash
# Install new npm packages
docker-compose exec frontend npm install <package-name>

# Run npm commands
docker-compose exec frontend npm run lint
docker-compose exec frontend npm test
```

## Backend Development

Django runs with auto-reload enabled. Code changes are reflected immediately.

```bash
# Install new Python packages
docker-compose exec backend pip install <package-name>

# Update requirements.txt
docker-compose exec backend pip freeze > requirements.txt
```

## Testing

```bash
# Backend tests
docker-compose exec backend pytest
docker-compose exec backend pytest --cov

# Frontend tests
docker-compose exec frontend npm test
```

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres

# View PostgreSQL logs
docker-compose logs postgres
```

### Port Already in Use

```bash
# Find process using port 8000
lsof -ti:8000 | xargs kill -9

# Find process using port 5173
lsof -ti:5173 | xargs kill -9
```

### Reset Database

```bash
# Stop and remove volumes
docker-compose down -v

# Start fresh
docker-compose up -d --build
```

### View Service Status

```bash
docker-compose ps
```

### Execute Commands in Containers

```bash
# Backend shell
docker-compose exec backend bash

# Frontend shell
docker-compose exec frontend sh
```

## Environment Variables

Edit `.env` file to configure:
- Database credentials
- Django secret key
- CORS settings
- Firebase path

## File Structure

```
activity-app/
├── docker-compose.yml       # Main compose file
├── .env                     # Environment variables
├── Dockerfile.dev           # Frontend dev image
├── backend/
│   ├── Dockerfile.dev       # Backend dev image
│   ├── docker-entrypoint.sh # Backend startup script
│   └── serviceAccountKey.json  # Firebase admin SDK (add this)
└── src/                     # React source
```

## Production Deployment

For production, use:

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

See [README_FULLSTACK.md](README_FULLSTACK.md) for production setup.

## Next Steps

1. Configure Firebase (see section above)
2. Start services: `docker-compose up -d --build`
3. Visit http://localhost:5173
4. Sign in with Google
5. Create your couple profile

## Support

- [Development Guide](DEVELOPMENT.md)
- [Full Stack Docs](README_FULLSTACK.md)
- [Main README](README.md)
