# Development Guide

## Setting up the Development Environment

### 1. Backend Setup

#### Install Python Dependencies
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### Configure Environment
```bash
cp ../.env.example .env
# Edit .env with your credentials
```

#### Setup Database
```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d postgres redis

# Run migrations
python manage.py makemigrations users
python manage.py makemigrations activities
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

#### Firebase Setup
1. Create Firebase project at https://console.firebase.google.com
2. Enable Authentication → Google sign-in
3. Go to Project Settings → Service Accounts
4. Generate new private key (JSON)
5. Save as `serviceAccountKey.json` in backend/
6. Update `FIREBASE_CREDENTIALS_PATH` in .env

#### Run Development Server
```bash
# Terminal 1: Django
python manage.py runserver

# Terminal 2: Celery Worker
celery -A config worker -l info

# Terminal 3: Celery Beat
celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

### 2. Frontend Setup

#### Install Dependencies
```bash
npm install
```

#### Configure Firebase Client
Create `src/lib/firebase.ts` with your Firebase config:
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  // ... other config
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

#### Run Development Server
```bash
npm run dev
```

Visit http://localhost:5173

### 3. Database Management

#### Create Migration
```bash
python manage.py makemigrations
python manage.py migrate
```

#### Reset Database
```bash
python manage.py flush
python manage.py migrate
```

#### Import Data from Firestore
```bash
python manage.py migrate_from_firestore
```

### 4. Testing

#### Backend Tests
```bash
# Run all tests
pytest

# Run specific test file
pytest users/tests.py

# With coverage
pytest --cov

# Generate HTML coverage report
pytest --cov --cov-report=html
open htmlcov/index.html
```

#### Frontend Tests
```bash
# Run tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm run test:coverage
```

### 5. Code Quality

#### Backend Linting
```bash
# Install dev dependencies
pip install black flake8 isort

# Format code
black .

# Sort imports
isort .

# Check linting
flake8
```

#### Frontend Linting
```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

### 6. Docker Development

#### Build and Run
```bash
docker-compose -f docker-compose.prod.yml up --build
```

#### View Logs
```bash
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f celery
```

#### Execute Commands in Container
```bash
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
docker-compose -f docker-compose.prod.yml exec backend python manage.py shell
```

#### Stop Services
```bash
docker-compose -f docker-compose.prod.yml down
```

### 7. Common Tasks

#### Add New Model Field
```bash
# 1. Edit models.py
# 2. Create migration
python manage.py makemigrations

# 3. Review migration file
cat activities/migrations/0002_*.py

# 4. Apply migration
python manage.py migrate
```

#### Add New API Endpoint
```bash
# 1. Add method to viewset in views.py
# 2. Add @action decorator
# 3. Update serializer if needed
# 4. Test endpoint
curl -X POST http://localhost:8000/api/v1/activities/activities/1/mark_complete/ \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

#### Schedule New Celery Task
```bash
# 1. Add task to activities/tasks.py with @shared_task
# 2. Restart Celery worker
# 3. Test task
python manage.py shell
>>> from activities.tasks import your_task
>>> your_task.delay()
```

## Troubleshooting

### Backend Issues

#### Port 8000 Already in Use
```bash
lsof -ti:8000 | xargs kill -9
```

#### Database Connection Error
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres
```

#### Firebase Authentication Error
- Verify `FIREBASE_CREDENTIALS_PATH` is correct
- Check service account JSON is valid
- Ensure Firebase Auth is enabled in console

### Frontend Issues

#### Module Not Found
```bash
rm -rf node_modules package-lock.json
npm install
```

#### Port 5173 Already in Use
```bash
lsof -ti:5173 | xargs kill -9
```

#### CORS Error
- Check `CORS_ALLOWED_ORIGINS` in backend/.env
- Ensure frontend URL is listed
- Restart Django server

### Docker Issues

#### Container Exits Immediately
```bash
docker-compose -f docker-compose.prod.yml logs backend
```

#### Database Not Ready
```bash
# Wait for postgres healthcheck
docker-compose -f docker-compose.prod.yml ps

# Run migrations manually
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

## Best Practices

### Django
- Use model managers for complex queries
- Add indexes for frequently queried fields
- Use select_related/prefetch_related to avoid N+1 queries
- Write comprehensive tests for all endpoints
- Use DRF serializers for validation

### React
- Keep components small and focused
- Use TypeScript for type safety
- Implement error boundaries
- Memoize expensive computations
- Use React Query for API calls

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push and create PR
git push origin feature/new-feature
```

### Environment Variables
- Never commit `.env` files
- Use `.env.example` as template
- Rotate secrets regularly
- Use different values for dev/staging/prod

## Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/)
- [Material UI](https://mui.com/)
- [Celery Documentation](https://docs.celeryproject.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
