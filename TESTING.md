# Testing Guide

This project uses comprehensive test suites for both frontend and backend with a target of 90% code coverage.

## Test Infrastructure

### Frontend (Vitest + React Testing Library)
- **Framework**: Vitest (Vite-compatible test runner)
- **Testing Library**: React Testing Library
- **Coverage**: @vitest/coverage-v8
- **Configuration**: `frontend/vitest.config.ts`
- **Setup**: `frontend/src/test/setup.ts`

### Backend (Pytest + Django)
- **Framework**: Pytest with pytest-django
- **Coverage**: pytest-cov
- **Configuration**: `backend/pytest.ini`
- **Fixtures**: `backend/conftest.py`
- **Test Directory**: `backend/api/tests/`

## Running Tests

### All Tests
```bash
# Using npm
npm test

# Using Makefile
make test
```

### Frontend Tests Only
```bash
cd frontend
npm run test              # Run tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
npm run test:ui           # Vitest UI

# Or using Makefile
make test-frontend
```

### Backend Tests Only
```bash
cd backend
pytest                    # Run all tests
pytest --cov=api          # With coverage
pytest -v                 # Verbose output
pytest api/tests/test_models.py  # Specific test file

# Or using Makefile
make test-backend
```

## Coverage Requirements

- **Target**: 90% code coverage
- **Enforced**: Yes (tests fail if coverage < 90%)
- **Reports**: 
  - Terminal output (text)
  - HTML report (`coverage/html/index.html`)
  - XML report (for CI/CD)

## Test Structure

### Frontend Tests
```
frontend/
├── src/
│   ├── test/
│   │   ├── setup.ts              # Test setup
│   │   └── __mocks__/            # Mock files
│   ├── utils/
│   │   └── __tests__/
│   │       └── avatar.test.ts
│   ├── services/
│   │   └── __tests__/
│   │       ├── djangoAuth.test.ts
│   │       └── djangoApi.test.ts
│   └── components/
│       └── __tests__/
│           ├── Header.test.tsx
│           └── ...
```

### Backend Tests
```
backend/
├── api/
│   └── tests/
│       ├── __init__.py
│       ├── test_models.py        # Model tests
│       ├── test_views.py         # ViewSet tests
│       ├── test_serializers.py   # Serializer tests
│       └── test_urls.py          # URL routing tests
├── conftest.py                   # Shared fixtures
└── pytest.ini                    # Pytest configuration
```

## Writing Tests

### Frontend Test Example
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Header } from '../Header'

describe('Header', () => {
  it('renders correctly', () => {
    render(<Header />)
    expect(screen.getByText('Synk')).toBeInTheDocument()
  })
})
```

### Backend Test Example
```python
import pytest
from django.contrib.auth.models import User

@pytest.mark.django_db
def test_create_user(user):
    assert user.username == 'testuser'
    assert user.email == 'test@example.com'
```

## Pre-commit Checks

All tests must pass before proceeding:
```bash
# Run all tests with coverage
npm test

# Ensure zero failures
# Exit code 0 = success
# Exit code 1 = failure (fix before proceeding)
```

## Continuous Integration

Tests are run in CI/CD pipelines with:
- Zero failures requirement
- 90% coverage minimum
- Both frontend and backend suites