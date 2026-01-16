# Quick Start Guide - Django Backend

## 🚀 Get Started in 5 Minutes

### Step 1: Setup Django Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create a test user
python manage.py create_test_user
# Or use custom credentials:
# python manage.py create_test_user --username myuser --password mypass123
```

### Step 2: Start Django Server

```bash
# Option A: Regular HTTP server (for testing)
python manage.py runserver

# Option B: With WebSocket support (recommended)
pip install daphne
daphne synk_backend.asgi:application
```

Django will run on `http://localhost:8000`

### Step 3: Setup Frontend

```bash
# From project root
cd frontend

# Create .env file
echo "VITE_API_URL=http://localhost:8000" > .env
echo "VITE_WS_URL=ws://localhost:8000" >> .env

# Install dependencies (if not already done)
npm install

# Start frontend
npm run dev
```

Frontend will run on `http://localhost:3000`

### Step 4: Login

1. Open `http://localhost:3000`
2. Click "Sign In" or "Get Started for Free"
3. Enter credentials:
   - **Username:** `testuser`
   - **Password:** `testpass123`
4. You're in! 🎉

## 📝 Default Test User

- **Username:** `testuser`
- **Password:** `testpass123`
- **Email:** `test@example.com`

## 🔧 Create Custom User

```bash
cd backend
python manage.py create_test_user --username myusername --password mypassword --email my@email.com
```

## 🗄️ Database Options

### SQLite (Easiest - No Setup Required)
Edit `synk_backend/settings.py`:
- Uncomment SQLite config (lines 60-64)
- Comment out PostgreSQL config (lines 52-59)

### PostgreSQL (Recommended for Production)
1. Install PostgreSQL
2. Create database:
   ```sql
   CREATE DATABASE synk_db;
   ```
3. Update `.env` with database credentials

## ✅ Verify Everything Works

1. **Backend Health Check:**
   ```bash
   curl http://localhost:8000/health/
   ```
   Should return: `{"status": "ok"}`

2. **Login Test:**
   ```bash
   curl -X POST http://localhost:8000/api/token/ \
     -H "Content-Type: application/json" \
     -d '{"username": "testuser", "password": "testpass123"}'
   ```
   Should return JWT tokens

3. **Frontend:**
   - Open `http://localhost:3000`
   - Login should work
   - Data should load from Django

## 🐛 Troubleshooting

**"No module named 'django'"**
- Make sure virtual environment is activated
- Run `pip install -r requirements.txt`

**"Database doesn't exist"**
- For SQLite: Just run migrations, it will create the file
- For PostgreSQL: Create database first

**"401 Unauthorized"**
- Check username/password are correct
- Verify user exists: `python manage.py shell` then `User.objects.all()`

**WebSocket not connecting**
- Make sure you're using `daphne` (not just `runserver`)
- Check WebSocket URL in frontend `.env`

**CORS errors**
- Check `CORS_ALLOWED_ORIGINS` in `synk_backend/settings.py`
- Make sure frontend URL is included

## 📚 Next Steps

- Create more users via Django admin
- Customize models and API endpoints
- Set up production database
- Deploy to production

## 🎯 What's Working

✅ User authentication with JWT
✅ REST API for all data (tasks, milestones, activities, etc.)
✅ Real-time updates via WebSocket
✅ Data persistence in database
✅ Frontend integration complete
