# Synk Django Backend

Django REST Framework backend for the Synk app with PostgreSQL database and real-time WebSocket support.

## Features

- ✅ Django REST Framework API
- ✅ PostgreSQL database (SQLite for development)
- ✅ JWT Authentication
- ✅ Real-time updates via Django Channels (WebSocket)
- ✅ All CRUD operations for Tasks, Milestones, Activities, Suggestions, Collections
- ✅ User preferences management

## Setup

### 1. Install Python Dependencies

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Database Setup

**Option A: SQLite (Easiest for development)**
- Edit `synk_backend/settings.py`
- Uncomment the SQLite database configuration
- Comment out the PostgreSQL configuration

**Option B: PostgreSQL (Recommended for production)**
- Install PostgreSQL: `brew install postgresql` (Mac) or download from postgresql.org
- Create database:
  ```sql
  CREATE DATABASE synk_db;
  CREATE USER synk_user WITH PASSWORD 'your_password';
  GRANT ALL PRIVILEGES ON DATABASE synk_db TO synk_user;
  ```
- Update `.env` with database credentials

### 3. Environment Variables

Create a `.env` file in `backend/`:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DB_NAME=synk_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
```

### 4. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

### 6. Run Development Server

```bash
# Regular Django server (HTTP only)
python manage.py runserver

# Or with Channels (HTTP + WebSocket)
daphne synk_backend.asgi:application
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/token/` - Get JWT token (username + password)
- `POST /api/token/refresh/` - Refresh JWT token

### Tasks
- `GET /api/tasks/` - List all tasks
- `POST /api/tasks/` - Create task
- `GET /api/tasks/{id}/` - Get task
- `PUT /api/tasks/{id}/` - Update task
- `DELETE /api/tasks/{id}/` - Delete task

### Milestones
- `GET /api/milestones/` - List all milestones
- `POST /api/milestones/` - Create milestone
- `GET /api/milestones/{id}/` - Get milestone
- `PUT /api/milestones/{id}/` - Update milestone
- `DELETE /api/milestones/{id}/` - Delete milestone

### Activities
- `GET /api/activities/?limit=50` - List activities
- `POST /api/activities/` - Create activity

### Suggestions
- `GET /api/suggestions/` - List suggestions
- `POST /api/suggestions/` - Create suggestion
- `DELETE /api/suggestions/{id}/` - Delete suggestion

### Collections
- `GET /api/collections/` - List collections
- `POST /api/collections/` - Create collection
- `PUT /api/collections/{id}/` - Update collection
- `DELETE /api/collections/{id}/` - Delete collection

### User Preferences
- `GET /api/preferences/` - Get preferences
- `PUT /api/preferences/{id}/` - Update preferences

### Health Check
- `GET /health/` - Server health

## Authentication

The API uses JWT (JSON Web Tokens) for authentication.

1. **Get Token:**
   ```bash
   curl -X POST http://localhost:8000/api/token/ \
     -H "Content-Type: application/json" \
     -d '{"username": "your_username", "password": "your_password"}'
   ```

2. **Use Token:**
   ```bash
   curl -X GET http://localhost:8000/api/tasks/ \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

## Real-Time WebSocket

Connect to WebSocket at: `ws://localhost:8000/ws/{user_id}/`

The backend automatically broadcasts events when data changes:
- `task:created`, `task:updated`, `task:deleted`
- `milestone:created`, `milestone:updated`, `milestone:deleted`
- `activity:created`
- `suggestion:created`, `suggestion:deleted`
- `collection:created`, `collection:updated`, `collection:deleted`
- `preferences:updated`

## Frontend Integration

Update your frontend API service to point to Django backend:

```typescript
const API_BASE_URL = 'http://localhost:8000';
```

For authentication, you'll need to:
1. Create user accounts in Django (or use Django admin)
2. Get JWT token from `/api/token/`
3. Include token in `Authorization: Bearer <token>` header

## Production Deployment

1. Set `DEBUG=False` in settings
2. Use PostgreSQL database
3. Use Redis for Channels (update `CHANNEL_LAYERS` in settings)
4. Set proper `ALLOWED_HOSTS`
5. Use environment variables for secrets
6. Run with `daphne` or `gunicorn` + `uvicorn`

## Differences from Express Backend

- Uses Django User model instead of Firebase Auth
- JWT tokens instead of Firebase tokens
- PostgreSQL/SQLite instead of Firestore
- Django Channels instead of Socket.IO
- REST Framework viewsets instead of Express routes
