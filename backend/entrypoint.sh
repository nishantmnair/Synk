#!/bin/bash
set -e

echo "🚀 Starting Synk Backend..."

# Check if using PostgreSQL (Docker) or SQLite (local)
if [ -n "$DB_HOST" ] && [ "$DB_HOST" != "localhost" ]; then
  # Using PostgreSQL - wait for it to be ready using TCP connection test
  echo "⏳ Waiting for PostgreSQL database to be ready..."
  MAX_WAIT=30
  WAITED=0
  until (echo > /dev/tcp/"$DB_HOST"/"$DB_PORT") 2>/dev/null; do
    if [ $WAITED -ge $MAX_WAIT ]; then
      echo "⚠️  Database connection timeout, but continuing anyway..."
      break
    fi
    echo "   Database is unavailable - sleeping ($WAITED/$MAX_WAIT)"
    sleep 1
    WAITED=$((WAITED + 1))
  done
  if [ $WAITED -lt $MAX_WAIT ]; then
    echo "✅ Database is ready!"
  fi
else
  echo "✅ Using SQLite database"
fi

# Run migrations
echo "🗄️  Running migrations..."
python manage.py migrate --noinput

# Create test user if it doesn't exist
echo "👤 Setting up test user..."
python manage.py shell << 'PYTHON_EOF'
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='testuser').exists():
    print("   Creating test user...")
    from django.core.management import call_command
    call_command('create_test_user')
else:
    print("   Test user already exists")
PYTHON_EOF

# Collect static files (if needed)
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput --clear || true

echo "✅ Backend setup complete!"
echo "📡 Starting server..."

# Execute the main command (from CMD in Dockerfile or docker-compose)
exec "$@"
