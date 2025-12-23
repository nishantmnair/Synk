# Activity App - Django + React Full Stack

## Overview

Full-stack couple's activity tracking app with Django backend, PostgreSQL database, React + Material UI frontend, and Firebase authentication.

## Stack

- **Backend:** Django 5.2 + DRF + PostgreSQL 15 + Redis 7 + Celery
- **Frontend:** React 18 + Material UI 5 + Axios + React Router
- **Auth:** Firebase Auth (OAuth 2.0)
- **DevOps:** Docker + Docker Compose + Nginx

## 🚀 Quick Start (Docker - Recommended)

### One-Command Setup

```bash
# Start everything (PostgreSQL, Redis, Django, Celery, React)
docker-compose up -d --build
```

**That's it!** Everything is now running:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/v1/
- Admin Panel: http://localhost:8000/admin/
- Swagger Docs: http://localhost:8000/swagger/

Default admin credentials:
- Email: `admin@example.com`
- Password: `admin`

### View Logs

```bash
docker-compose logs -f
```

### Stop All Services

```bash
docker-compose down
```

See [DOCKER.md](DOCKER.md) for detailed Docker commands.

## Local Development (Without Docker)

```bash
# 1. Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# 2. Frontend setup (new terminal)
npm install
npm run dev
```

Visit http://localhost:5173

## Firebase Setup

1. Create project at https://console.firebase.google.com
2. Enable Google authentication
3. Get client config (Frontend .env)
4. Download service account JSON (Backend)
5. Update environment files

## API Endpoints

- `POST /api/v1/users/profiles/` - Create profile
- `POST /api/v1/users/couples/` - Create couple
- `POST /api/v1/users/couples/join/` - Join with code
- `GET /api/v1/activities/activities/` - List activities
- `POST /api/v1/activities/activities/{id}/mark_complete/` - Complete activity
- `GET /api/v1/activities/reminders/` - Get reminders

Full docs: http://localhost:8000/swagger/

## Testing

```bash
# Backend
cd backend && pytest --cov

# Frontend
npm test
```

## Documentation

- [Development Guide](DEVELOPMENT.md) - Detailed setup and troubleshooting
- [Full Stack Architecture](README_FULLSTACK.md) - Complete system overview

## License

MIT
