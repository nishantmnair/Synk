#!/bin/bash

# Backend Tests
echo "====================================="
echo "Running Backend Tests"
echo "====================================="

cd backend

# Install test dependencies if needed
echo "Installing test dependencies..."
pip install pytest pytest-django pytest-cov factory-boy

# Run tests with coverage
echo "Running pytest with coverage..."
pytest --cov=. --cov-report=term-missing --cov-report=html --cov-config=pytest.ini

# Check coverage thresholds
pytest --cov=. --cov-fail-under=90

echo ""
echo "Backend test coverage report generated in backend/htmlcov/"
echo ""

# Frontend Tests
echo "====================================="
echo "Running Frontend Tests"
echo "====================================="

cd ../frontend

# Install test dependencies
echo "Installing test dependencies..."
npm install

# Run tests with coverage
echo "Running vitest with coverage..."
npm run test:coverage

echo ""
echo "Frontend test coverage report generated in frontend/coverage/"
echo ""

echo "====================================="
echo "All Tests Complete"
echo "====================================="
