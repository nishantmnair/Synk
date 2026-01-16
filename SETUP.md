# Synk Setup Guide

This is a simplified setup guide. For detailed instructions, see [QUICK_START.md](./QUICK_START.md).

## Quick Setup

### Backend (Django)

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create test user
python manage.py create_test_user

# Start server (with WebSocket support)
pip install daphne
daphne synk_backend.asgi:application
```

Backend runs on `http://localhost:8000`

### Frontend

```bash
# Create .env file
cd frontend
echo "VITE_API_URL=http://localhost:8000" > .env
echo "VITE_WS_URL=ws://localhost:8000" >> .env

# Install dependencies (if not done)
npm install

# Start frontend
npm run dev
```

Frontend runs on `http://localhost:3000`

## Login Credentials

Default test user:
- **Username:** `testuser`
- **Password:** `testpass123`

## Documentation

- [QUICK_START.md](./QUICK_START.md) - Detailed setup guide
- [backend/README.md](./backend/README.md) - Backend API documentation
- [FRONTEND_DJANGO_SETUP.md](./FRONTEND_DJANGO_SETUP.md) - Frontend integration details
