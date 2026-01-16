# 🚀 Quick Start - Automatic Setup

Everything is now set up to start automatically! Just run:

```bash
./start.sh
```

Or use npm:

```bash
npm start
```

This will automatically:
- ✅ Create virtual environment (if needed)
- ✅ Install all Python dependencies
- ✅ Set up SQLite database
- ✅ Run migrations
- ✅ Create test user
- ✅ Start Django backend on port 8000
- ✅ Install frontend dependencies (if needed)
- ✅ Start frontend on port 5173

## 📍 URLs

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000

## 👤 Test Credentials

- **Username**: `testuser`
- **Password**: `testpass123`

## 🛑 Stopping

Press `Ctrl+C` to stop all servers.

## 📝 Manual Start (if needed)

### Backend only:
```bash
./start_backend.sh
# or
npm run start:backend
```

### Frontend only:
```bash
cd frontend && npm run dev
# or
npm run start:frontend
```
