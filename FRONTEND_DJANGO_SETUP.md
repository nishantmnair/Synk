# Frontend Setup for Django Backend

The frontend has been updated to work with Django JWT authentication instead of Firebase.

## What Changed

### New Services Created:
1. **`frontend/services/djangoAuth.ts`** - Django JWT authentication service
2. **`frontend/services/djangoApi.ts`** - API client for Django backend
3. **`frontend/services/djangoRealtime.ts`** - WebSocket client for Django Channels

### Updated Files:
- **`frontend/App.tsx`** - Now uses Django auth service
- **`frontend/components/LandingView.tsx`** - Now has a login form instead of Google Sign-In

## Environment Variables

Update your `.env` file (or create one in `frontend/`):

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

## How It Works

### Authentication Flow:
1. User enters username and password in login form
2. Frontend sends credentials to Django `/api/token/` endpoint
3. Django returns JWT access and refresh tokens
4. Frontend stores tokens in localStorage
5. All API requests include `Authorization: Bearer <token>` header
6. Tokens are automatically refreshed when they expire

### API Calls:
- All API endpoints now use Django REST Framework format
- Endpoints: `/api/tasks/`, `/api/milestones/`, etc. (note the trailing slash)
- IDs are numbers instead of strings
- No need for `userId` query params (Django uses authenticated user)

### Real-Time Updates:
- Uses Django Channels WebSocket instead of Socket.IO
- Connects to `ws://localhost:8000/ws/{user_id}/`
- Receives same events: `task:created`, `milestone:updated`, etc.

## Creating User Accounts

You need to create user accounts in Django. Options:

### Option 1: Django Admin (Recommended)
1. Start Django server: `python manage.py runserver`
2. Go to `http://localhost:8000/admin/`
3. Login with superuser account
4. Go to "Users" section
5. Click "Add user"
6. Create username and password

### Option 2: Django Shell
```bash
python manage.py shell
```

```python
from django.contrib.auth.models import User
user = User.objects.create_user('username', 'email@example.com', 'password')
user.save()
```

### Option 3: Django Management Command
Create a custom command or use:
```bash
python manage.py createsuperuser
```

## Testing

1. **Start Django backend:**
   ```bash
   cd backend
   python manage.py runserver
   # Or with WebSocket support:
   daphne synk_backend.asgi:application
   ```

2. **Start frontend:**
   ```bash
   npm run dev
   ```

3. **Test login:**
   - Open `http://localhost:3000`
   - Click "Sign In" or "Get Started for Free"
   - Enter username and password
   - You should be logged in!

## API Differences from Express Backend

| Express | Django |
|---------|--------|
| `/api/tasks?userId=default` | `/api/tasks/` |
| `/api/tasks/:id` | `/api/tasks/{id}/` |
| String IDs | Number IDs |
| Manual userId | Auto from auth token |
| Socket.IO | Django Channels |

## Troubleshooting

**"Invalid credentials" error:**
- Make sure user exists in Django
- Check username/password are correct
- Verify Django server is running

**"401 Unauthorized" errors:**
- Token might be expired, try logging in again
- Check that token is being sent in headers
- Verify Django CORS settings allow your frontend URL

**WebSocket not connecting:**
- Make sure you're using `daphne` (not just `runserver`)
- Check WebSocket URL is correct
- Verify user ID matches authenticated user

## Next Steps

1. Create user accounts in Django
2. Test login flow
3. Update components to use `djangoApi` instead of old `api` service
4. Test real-time updates
