#!/bin/bash
set -e

echo "Waiting for PostgreSQL..."
until PGPASSWORD=postgres psql -h postgres -U postgres -d activity_app -c '\q' 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done
echo "PostgreSQL is ready!"

echo "Generating migrations..."
python manage.py makemigrations users activities --noinput

echo "Running migrations..."
python manage.py migrate --noinput

echo "Creating superuser if needed..."
python manage.py shell << END
from users.models import User
import os
if not User.objects.filter(email='admin@example.com').exists():
    User.objects.create_superuser(
        email='admin@example.com', 
        password='admin', 
        firebase_uid='admin-local-dev'
    )
    print('✓ Superuser created (admin@example.com / admin)')
else:
    print('✓ Superuser already exists')
END

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting server..."
exec "$@"
