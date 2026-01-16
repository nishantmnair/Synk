# Test Suite - Quick Reference

## ✅ Test Files Created (9 total)

### Backend (4 files)
1. `backend/api/tests/test_models.py` - 280 lines - Model tests
2. `backend/api/tests/test_views.py` - 323 lines - ViewSet tests  
3. `backend/api/tests/test_serializers.py` - 185 lines - Serializer tests
4. `backend/api/tests/test_urls.py` - 73 lines - URL routing tests

### Frontend (5 files)
1. `frontend/utils/__tests__/avatar.test.ts` - Avatar utility tests
2. `frontend/services/__tests__/djangoAuth.test.ts` - Auth service tests
3. `frontend/services/__tests__/djangoApi.test.ts` - API service tests
4. `frontend/components/__tests__/Header.test.tsx` - Header component tests
5. `frontend/components/__tests__/LandingView.test.tsx` - Landing page tests

## 🚀 Running Tests

### Install Dependencies First

**Frontend:**
```bash
cd frontend
npm install
```

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

### Run Tests

```bash
# All tests
npm test
make test
./run-tests.sh

# Frontend only
npm run test:frontend
make test-frontend

# Backend only  
npm run test:backend
make test-backend
```

## 📊 Coverage Requirements

- **Target**: 90% minimum
- **Enforced**: Yes (tests fail if < 90%)
- **Reports**: Terminal, HTML, XML

## ✅ Zero Failures Policy

All tests must pass before proceeding. Exit code 1 = failure, blocks deployment.
