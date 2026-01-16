# 🐳 Docker Quick Start

Start everything with a single command!

## 🚀 Start Everything (Development Mode - Recommended)

```bash
make dev
```

Or using Docker Compose directly:

```bash
docker compose -f docker-compose.dev.yml up -d
```

This will automatically:
- ✅ Build all Docker images
- ✅ Start PostgreSQL database
- ✅ Run database migrations
- ✅ Create test user (`testuser` / `testpass123`)
- ✅ Start Django backend on port 8000
- ✅ Start frontend with hot reload on port 3000

## 🎯 Start Everything (Production Mode)

```bash
make up
```

Or:

```bash
docker compose up -d
```

## 📍 URLs

After starting, access:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Backend Health**: http://localhost:8000/health/

## 👤 Test Credentials

- **Username**: `testuser`
- **Password**: `testpass123`

## 📋 Other Useful Commands

```bash
# View logs
make logs

# Stop all services
make down

# Rebuild images
make build

# Open backend shell
make shell

# Run migrations manually (if needed)
make migrate

# Create another test user
make testuser
```

## 🛑 Stop Everything

```bash
make down
```

## 🧹 Clean Everything (Remove volumes and containers)

```bash
make clean
```

## 📝 What Happens Automatically

When you run `make dev` or `make up`:

1. **PostgreSQL** starts and waits for connections
2. **Backend** entrypoint script:
   - Waits for database to be ready
   - Runs migrations automatically
   - Creates test user if it doesn't exist
   - Starts Django server
3. **Frontend** builds and starts with hot reload (dev mode) or serves built files (prod mode)

Everything is automated! Just run `make dev` and you're ready to go! 🎉
