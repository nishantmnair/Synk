.PHONY: help up down build logs shell migrate createsuperuser testuser restart clean dev test test-frontend test-backend

help:
	@echo "Available commands:"
	@echo "  make up          - Start all services (production mode)"
	@echo "  make dev         - Start all services (development mode with hot reload)"
	@echo "  make down        - Stop all services"
	@echo "  make build       - Build all services"
	@echo "  make logs        - View logs"
	@echo "  make shell       - Open backend shell"
	@echo "  make migrate     - Run database migrations"
	@echo "  make createsuperuser - Create Django superuser"
	@echo "  make testuser    - Create test user"
	@echo "  make restart     - Restart all services"
	@echo "  make clean       - Stop and remove everything"
	@echo "  make test        - Run all tests (frontend + backend)"
	@echo "  make test-frontend - Run frontend tests"
	@echo "  make test-backend  - Run backend tests"

# Start everything - production mode
up:
	docker compose up -d
	@echo ""
	@echo "✅ All services started!"
	@echo "📡 Backend: http://localhost:8000"
	@echo "🎨 Frontend: http://localhost:3000"
	@echo "👤 Test user: testuser / testpass123"

# Start everything - development mode (recommended)
dev:
	docker compose -f docker-compose.dev.yml up -d
	@echo ""
	@echo "✅ All services started in development mode!"
	@echo "📡 Backend: http://localhost:8000"
	@echo "🎨 Frontend: http://localhost:3000"
	@echo "👤 Test user: testuser / testpass123"
	@echo ""
	@echo "Run 'make logs' to see live logs"

down:
	docker compose down
	docker compose -f docker-compose.dev.yml down

build:
	docker compose build
	docker compose -f docker-compose.dev.yml build

logs:
	docker compose logs -f
	docker compose -f docker-compose.dev.yml logs -f

shell:
	docker compose exec backend bash
	docker compose -f docker-compose.dev.yml exec backend bash

migrate:
	docker compose exec backend python manage.py migrate
	docker compose -f docker-compose.dev.yml exec backend python manage.py migrate

makemigrations:
	docker compose exec backend python manage.py makemigrations
	docker compose -f docker-compose.dev.yml exec backend python manage.py makemigrations

createsuperuser:
	docker compose exec backend python manage.py createsuperuser
	docker compose -f docker-compose.dev.yml exec backend python manage.py createsuperuser

testuser:
	docker compose exec backend python manage.py create_test_user
	docker compose -f docker-compose.dev.yml exec backend python manage.py create_test_user

restart:
	docker compose restart
	docker compose -f docker-compose.dev.yml restart

clean:
	docker compose down -v
	docker compose -f docker-compose.dev.yml down -v
	docker compose rm -f
	docker compose -f docker-compose.dev.yml rm -f

test:
	@echo "🧪 Running all tests..."
	@echo ""
	@echo "📱 Frontend Tests..."
	@cd frontend && npm run test || (echo "❌ Frontend tests failed!" && exit 1)
	@echo ""
	@echo "🔧 Backend Tests..."
	@cd backend && pytest --cov=api -v || (echo "❌ Backend tests failed!" && exit 1)
	@echo ""
	@echo "✅ All tests passed!"

test-frontend:
	@echo "📱 Running frontend tests..."
	@cd frontend && npm run test

test-backend:
	@echo "🔧 Running backend tests..."
	@cd backend && pytest --cov=api -v
