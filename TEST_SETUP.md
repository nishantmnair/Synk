# Test Setup Instructions

## Overview

Comprehensive test suites have been created for both frontend and backend with a target of 90% code coverage. All tests must pass (zero failures) before proceeding.

## Test Files Created

### Backend Tests (`backend/api/tests/`)
- ✅ `test_models.py` - Comprehensive model tests (Task, Milestone, Activity, Suggestion, Collection, UserPreferences, Couple, CouplingCode)
- ✅ `test_views.py` - ViewSet tests covering all CRUD operations
- ✅ `test_serializers.py` - Serializer validation and transformation tests
- ✅ `test_urls.py` - URL routing tests

### Frontend Tests
- ✅ `utils/__tests__/avatar.test.ts` - Avatar generation utility tests
- ✅ `services/__tests__/djangoAuth.test.ts` - Authentication service tests
- ✅ `services/__tests__/djangoApi.test.ts` - API client service tests
- ✅ `components/__tests__/Header.test.tsx` - Header component tests
- ✅ `components/__tests__/LandingView.test.tsx` - Landing page tests

## Setup

### 1. Install Dependencies

#### Frontend
```bash
cd frontend
npm install
```

This will install:
- vitest
- @testing-library/react
- @testing-library/jest-dom
- @testing-library/user-event
- @vitest/coverage-v8
- @vitest/ui
- jsdom

#### Backend
```bash
cd backend
pip install -r requirements.txt
```

This will install:
- pytest
- pytest-django
- pytest-cov
- pytest-mock
- factory-boy

### 2. Run Tests

#### Option A: Using npm (Recommended)
```bash
# All tests
npm test

# Frontend only
npm run test:frontend

# Backend only
npm run test:backend
```

#### Option B: Using Makefile
```bash
# All tests
make test

# Frontend only
make test-frontend

# Backend only
make test-backend
```

#### Option C: Using test script
```bash
./run-tests.sh
```

#### Option D: Direct commands
```bash
# Frontend
cd frontend && npm run test:coverage

# Backend
cd backend && pytest --cov=api --cov-fail-under=90 -v
```

## Coverage Requirements

All test runs enforce **90% coverage minimum**:
- **Lines**: 90%
- **Functions**: 90%
- **Branches**: 90%
- **Statements**: 90%

Tests will **fail** if coverage drops below 90%.

## Coverage Reports

After running tests, coverage reports are generated:

- **Terminal**: Text report with line-by-line coverage
- **HTML**: `coverage/html/index.html` (open in browser)
- **XML**: `coverage.xml` (for CI/CD integration)

## Zero Failures Policy

**All tests must pass before proceeding.** The test runner exits with code 1 if any test fails.

```bash
# Check exit code
npm test
echo $?  # Should be 0 for success, 1 for failure
```

## Next Steps to Achieve 90% Coverage

Current test coverage includes:

### Backend (~80% estimated)
- ✅ All models tested
- ✅ Core viewsets tested
- ✅ Serializers tested
- ⏳ URL routing tests (partial)
- ⏳ Edge cases and error handling
- ⏳ Management commands

### Frontend (~60% estimated)
- ✅ Utility functions (avatar)
- ✅ Core services (auth, API)
- ✅ Key components (Header, LandingView)
- ⏳ Remaining components
- ⏳ Integration tests
- ⏳ Error boundaries

## Troubleshooting

### "Module not found" errors
Install dependencies:
```bash
cd frontend && npm install
cd backend && pip install -r requirements.txt
```

### "Django not configured" errors
Make sure you're in the backend directory or set DJANGO_SETTINGS_MODULE:
```bash
export DJANGO_SETTINGS_MODULE=synk_backend.settings
```

### Coverage below 90%
Run with coverage report to see what's missing:
```bash
cd backend && pytest --cov=api --cov-report=html
# Open coverage/html/index.html to see coverage report
```

### Tests timeout
Some tests may need longer timeout. Update `vitest.config.ts` or `pytest.ini` timeout settings.

## Continuous Integration

Tests are designed to run in CI/CD:
- Exit code 0 = success
- Exit code 1 = failure (blocks deployment)
- Coverage reports generated in multiple formats
