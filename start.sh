#!/bin/bash

echo "🚀 Starting Activity App with Docker Compose..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Using defaults..."
fi

# Build and start services
echo "📦 Building and starting services (PostgreSQL, Redis, Django, Celery, React)..."
docker-compose up -d --build

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "✅ All services started!"
echo ""
echo "🌐 Access your app:"
echo "   Frontend:    http://localhost:5173"
echo "   Backend API: http://localhost:8000/api/v1/"
echo "   Admin Panel: http://localhost:8000/admin/"
echo "   Swagger:     http://localhost:8000/swagger/"
echo ""
echo "👤 Default Admin Credentials:"
echo "   Email:    admin@example.com"
echo "   Password: admin"
echo ""
echo "📝 Useful Commands:"
echo "   View logs:        docker-compose logs -f"
echo "   Stop services:    docker-compose down"
echo "   Restart:          docker-compose restart"
echo "   Run migrations:   docker-compose exec backend python manage.py migrate"
echo ""
echo "📚 Documentation:"
echo "   Docker Guide: DOCKER.md"
echo "   Development:  DEVELOPMENT.md"
echo "   Full Stack:   README_FULLSTACK.md"
echo ""
