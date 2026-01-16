# Docker Setup Guide

This project is containerized with Docker and Docker Compose for easy development and deployment.

## Quick Start

### Production Build

```bash
# Build and start all services
docker compose up -d --build

# Run migrations
docker compose exec backend python manage.py migrate

# Create superuser
docker compose exec backend python manage.py createsuperuser

# Create test user
docker compose exec backend python manage.py create_test_user
```

### Development Mode

```bash
# Use development compose file
docker compose -f docker-compose.dev.yml up -d --build

# Run migrations
docker compose -f docker-compose.dev.yml exec backend python manage.py migrate
```

## Services

- **db** - PostgreSQL database (port 5432)
- **backend** - Django API server (port 8000)
- **frontend** - React frontend (port 3000)

## Common Commands

### Start Services
```bash
docker compose up -d
```

### Stop Services
```bash
docker compose down
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
```

### Django Management Commands
```bash
# Run migrations
docker compose exec backend python manage.py migrate

# Create migrations
docker compose exec backend python manage.py makemigrations

# Create superuser
docker compose exec backend python manage.py createsuperuser

# Create test user
docker compose exec backend python manage.py create_test_user

# Django shell
docker compose exec backend python manage.py shell

# Collect static files
docker compose exec backend python manage.py collectstatic --noinput
```

### Database Access
```bash
# PostgreSQL shell
docker compose exec db psql -U postgres -d synk_db

# Or connect from host
psql -h localhost -U postgres -d synk_db
```

### Rebuild Services
```bash
# Rebuild specific service
docker compose build backend

# Rebuild all services
docker compose build

# Rebuild and restart
docker compose up -d --build
```

### Access Container Shell
```bash
# Backend shell
docker compose exec backend bash

# Frontend shell
docker compose exec frontend sh
```

## Environment Variables

Create a `.env` file in the project root:

```env
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key-here

# Database Settings
DB_NAME=synk_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db
DB_PORT=5432

# Frontend Settings
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

## Development vs Production

### Development (`docker-compose.dev.yml`)
- Hot reload for frontend and backend
- Volume mounts for live code changes
- Development server for Django
- Vite dev server for frontend

### Production (`docker-compose.yml`)
- Optimized production builds
- Nginx for frontend
- Daphne ASGI server for Django
- Static file serving

## Troubleshooting

### Database Connection Issues
```bash
# Check if database is healthy
docker compose ps

# Restart database
docker compose restart db

# Check database logs
docker compose logs db
```

### Port Already in Use
```bash
# Change ports in docker-compose.yml
ports:
  - "8001:8000"  # Change host port
```

### Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
```

### Clear Everything and Start Fresh
```bash
# Stop and remove containers, networks, volumes
docker compose down -v

# Remove images
docker compose down --rmi all

# Start fresh
docker compose up -d --build
```

### View Container Status
```bash
docker compose ps
```

### Access Running Containers
```bash
# Backend
docker compose exec backend bash

# Database
docker compose exec db psql -U postgres
```

## Production Deployment

1. Set `DEBUG=False` in `.env`
2. Set a strong `SECRET_KEY`
3. Use production database credentials
4. Configure proper `ALLOWED_HOSTS` in Django settings
5. Set up SSL/HTTPS
6. Use production compose file:
   ```bash
   docker compose -f docker-compose.yml up -d --build
   ```

## Volumes

- `postgres_data` - Persistent database storage
- `backend_static` - Django static files

Data persists even when containers are stopped/removed (unless you use `docker compose down -v`).
