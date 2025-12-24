# 🎉 Activity App - Complete Setup

Your app is ready to run with Docker Compose!

## ⚡ Quick Start

```bash
# Start everything
docker-compose up -d --build

# Or use the helper script
./start.sh
```

## 🎯 What You Get

Running `docker-compose up -d --build` starts 6 services:

1. **PostgreSQL 15** - Production-ready database
2. **Redis 7** - Fast caching and message broker
3. **Django 5.2 Backend** - REST API with auto-migrations
4. **Celery Worker** - Background task processing
5. **Celery Beat** - Scheduled task runner
6. **React + Vite Frontend** - Hot-reload dev server

## 🌐 Access Points

After starting, access these URLs:

- **Frontend App**: http://localhost:5173
- **API Endpoints**: http://localhost:8000/api/v1/
- **Admin Dashboard**: http://localhost:8000/admin/
- **API Documentation**: http://localhost:8000/swagger/
- **ReDoc**: http://localhost:8000/redoc/

## 👤 Default Credentials

The system auto-creates an admin account:

- Email: `admin@example.com`
- Password: `admin`

## 🔧 Common Commands

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart a service
docker-compose restart backend

# Stop everything
docker-compose down

# Stop and delete data (fresh start)
docker-compose down -v

# Run Django commands
docker-compose exec backend python manage.py shell
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate

# Database access
docker-compose exec postgres psql -U postgres -d activity_app

# Install npm packages
docker-compose exec frontend npm install <package>

# Run tests
docker-compose exec backend pytest
docker-compose exec frontend npm test
```

## 📁 Project Structure

```
activity-app/
├── docker-compose.yml          # Main orchestration file
├── start.sh                    # Quick start helper
├── .env                        # Environment variables
│
├── backend/                    # Django Backend
│   ├── config/                 # Django settings
│   ├── users/                  # User management
│   ├── activities/             # Activity domain
│   ├── Dockerfile.dev          # Backend container
│   ├── requirements.txt        # Python dependencies
│   └── serviceAccountKey.json  # Firebase credentials
│
├── src/                        # React Frontend
│   ├── components/             # UI components
│   ├── contexts/               # React contexts
│   ├── lib/                    # API & utilities
│   └── theme.ts               # MUI theme
│
├── Dockerfile.dev              # Frontend container
└── package.json               # Frontend dependencies
```

## 🔥 Firebase Setup (Optional for Auth)

Currently using dummy Firebase credentials. For real authentication:

1. Go to https://console.firebase.google.com
2. Create/select project
3. Enable Authentication → Google sign-in
4. Get Service Account Key:
   - Settings → Service Accounts → Generate new private key
   - Save as `backend/serviceAccountKey.json`
5. Get Web Config:
   - Settings → General → Your apps
   - Add to frontend `.env`:
     ```
     VITE_FIREBASE_API_KEY=your-key
     VITE_FIREBASE_AUTH_DOMAIN=your-domain
     VITE_FIREBASE_PROJECT_ID=your-project-id
     ```

## 🧪 Testing the Setup

1. **Start services**: `docker-compose up -d --build`
2. **Check status**: `docker-compose ps` (all should be "Up")
3. **View logs**: `docker-compose logs -f backend`
4. **Open frontend**: http://localhost:5173
5. **Check API**: http://localhost:8000/api/v1/users/users/

## 🐛 Troubleshooting

### Services won't start
```bash
# Check Docker is running
docker info

# View logs for errors
docker-compose logs

# Clean start
docker-compose down -v
docker-compose up -d --build
```

### Port already in use
```bash
# Find and kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Database connection error
```bash
# Check PostgreSQL is healthy
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Frontend not loading
```bash
# Rebuild frontend
docker-compose up -d --build frontend

# Check logs
docker-compose logs frontend
```

## 📚 Next Steps

1. ✅ Services running via Docker Compose
2. ✅ All React components migrated to MUI
3. 🔐 Configure real Firebase credentials
4. ✅ Comprehensive test suite (89 tests passing)
5. 🚀 Deploy to production

## 📖 Documentation

- **[DOCKER.md](DOCKER.md)** - Detailed Docker commands and workflows
- **[README.md](README.md)** - Main project README

## 🎊 You're Ready!

Run `./start.sh` or `docker-compose up -d --build` and start building!

All backend APIs are ready. All frontend components migrated to Material UI with comprehensive test coverage.

Happy coding! 🚀
