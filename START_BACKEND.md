# Quick Fix: Start Backend Server

## Issue: Dependencies Not Installed

Run these commands to install dependencies and start the server:

```bash
cd /Users/nishantnair/Downloads/Synk/backend

# Install dependencies
pip3 install -r requirements.txt

# If that fails with permission errors, use:
pip3 install --user -r requirements.txt

# OR use a virtual environment (recommended):
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Issue: PostgreSQL Not Running

You have two options:

### Option 1: Use SQLite (Easiest - No Database Setup)

Edit `backend/synk_backend/settings.py`:
- Comment out the PostgreSQL DATABASES config (lines 79-91)
- Uncomment the SQLite config (lines 93-99)

Then run:
```bash
cd /Users/nishantnair/Downloads/Synk/backend
python3 manage.py migrate
python3 manage.py runserver
```

### Option 2: Use Docker Compose (Starts PostgreSQL + Backend)

In your terminal:
```bash
cd /Users/nishantnair/Downloads/Synk
docker compose up -d
```

This will start both PostgreSQL and Django on port 8000.

## Quick Start After Fixes

```bash
cd /Users/nishantnair/Downloads/Synk/backend

# Make migrations (if using SQLite or first time)
python3 manage.py migrate

# Create a test user
python3 manage.py create_test_user

# Start server
python3 manage.py runserver
```

Server will be available at: http://localhost:8000
