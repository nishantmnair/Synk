#!/bin/bash
# Test runner script for Synk project
# Ensures zero failures before proceeding

set -e  # Exit on error

echo "🧪 Running Synk Test Suite"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILED=0

# Run frontend tests
echo "📱 Running Frontend Tests..."
echo "----------------------------"
cd frontend
if npm run test:coverage; then
    echo -e "${GREEN}✅ Frontend tests passed!${NC}"
else
    echo -e "${RED}❌ Frontend tests failed!${NC}"
    FAILED=1
fi
cd ..

echo ""

# Run backend tests
echo "🔧 Running Backend Tests..."
echo "---------------------------"
cd backend
if pytest --cov=api --cov-fail-under=90 -v; then
    echo -e "${GREEN}✅ Backend tests passed!${NC}"
else
    echo -e "${RED}❌ Backend tests failed!${NC}"
    FAILED=1
fi
cd ..

echo ""

# Summary
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Ready to proceed.${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please fix failures before proceeding.${NC}"
    exit 1
fi
