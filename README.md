# Synk - Couple's Planning App

A beautiful, private space for couples to plan adventures, track milestones, and build their future together.

## 🚀 Quick Start with Docker

The easiest way to get started is with Docker Compose:

```bash
# Start all services
docker compose up -d --build

# Run migrations
docker compose exec backend python manage.py migrate

# Create test user
docker compose exec backend python manage.py create_test_user

# Access the app
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
```

### Login Credentials
- **Username:** `testuser`
- **Password:** `testpass123`

## 📚 Documentation

- [DOCKER.md](./DOCKER.md) - Complete Docker setup guide
- [backend/README.md](./backend/README.md) - Backend API documentation

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Django + Django REST Framework + Django Channels
- **Database:** PostgreSQL
- **Real-time:** WebSocket via Django Channels
- **Containerization:** Docker + Docker Compose

## 📁 Project Structure

```
synk 2/
├── backend/          # Django backend
│   ├── api/          # REST API app
│   ├── synk_backend/ # Django project settings
│   └── manage.py
├── frontend/         # React frontend
│   ├── components/   # React components
│   ├── services/     # API clients
│   └── ...
├── docker-compose.yml        # Production compose
├── docker-compose.dev.yml    # Development compose
└── Makefile          # Convenience commands
```

## 🐳 Docker Commands

```bash
# Start services
docker compose up -d

# View logs
docker compose logs -f

# Run Django commands
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py create_test_user

# Stop services
docker compose down
```

Or use the Makefile:
```bash
make up          # Start services
make migrate     # Run migrations
make testuser    # Create test user
make logs        # View logs
make down        # Stop services
```

## 🔧 Development

### With Docker (Recommended)
```bash
# Development mode with hot reload
docker compose -f docker-compose.dev.yml up -d
```

### Without Docker
See [DOCKER.md](./DOCKER.md) for setup instructions, or check the `backend/README.md` for backend-specific documentation.

## 📝 Environment Variables

Create a `.env` file in the project root:

```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DB_NAME=synk_db
DB_USER=postgres
DB_PASSWORD=postgres
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

## 🎯 Features

- ✅ Task management with kanban board
- ✅ Milestone tracking
- ✅ Activity feed
- ✅ Date suggestions inbox
- ✅ Custom collections
- ✅ Real-time updates
- ✅ User preferences
- ✅ Beautiful, modern UI

## 📖 API Documentation

Once the backend is running, visit:
- API Root: http://localhost:8000/api/
- Admin Panel: http://localhost:8000/admin/
- Health Check: http://localhost:8000/health/

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

Private project - All rights reserved
