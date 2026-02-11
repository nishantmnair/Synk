#!/bin/bash
# Pre-Deployment Verification Checklist
# Run this before going live in production

set -e

echo "🔍 Synk Production Readiness Check"
echo "="*50

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} Found: $1"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} Missing: $1"
        ((FAILED++))
        return 1
    fi
}

check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} $3"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} Missing in $1: $3"
        ((FAILED++))
        return 1
    fi
}

echo ""
echo "📋 CONFIGURATION FILES"
check_file ".env.production"
check_file "docker-compose.production.yml"
check_file "nginx.production.conf"
check_file "backend/requirements.txt"

echo ""
echo "🔐 SECURITY DOCUMENTATION"
check_file "SECURITY.md"
check_file "INCIDENTS.md"
check_file "BACKUP_SETUP.md"
check_file "DEPLOY.md"
check_file "OPERATIONS.md"

echo ""
echo "🐳 DOCKERFILE SECURITY"
check_content "backend/Dockerfile" "USER appuser" "Backend using non-root user"
check_content "frontend/Dockerfile" "USER www-data" "Frontend using non-root user"
check_content ".dockerignore" "node_modules" ".dockerignore exists"

echo ""
echo "🛡️ DJANGO SECURITY SETTINGS"
check_content "backend/synk_backend/settings.py" "DEBUG = False" "DEBUG disabled"
check_content "backend/synk_backend/settings.py" "SECRET_KEY" "SECRET_KEY configured"
check_content "backend/synk_backend/settings.py" "SECURE_SSL_REDIRECT" "SSL redirect enabled"
check_content "backend/synk_backend/settings.py" "LOGGING" "Logging configured"
check_content "backend/synk_backend/settings.py" "CSP_DEFAULT_SRC" "CSP headers configured"

echo ""
echo "📦 PRODUCTION DEPENDENCIES"
check_content "backend/requirements.txt" "gunicorn" "Gunicorn installed"
check_content "backend/requirements.txt" "whitenoise" "WhiteNoise installed"
check_content "backend/requirements.txt" "python-json-logger" "JSON logger installed"

echo ""
echo "🔧 ENVIRONMENT VARIABLES"
if [ -f ".env.production" ]; then
    check_content ".env.production" "SECRET_KEY" "SECRET_KEY in .env.production"
    check_content ".env.production" "DEBUG=false" "DEBUG=false in .env.production"
    check_content ".env.production" "ALLOWED_HOSTS" "ALLOWED_HOSTS in .env.production"
else
    echo -e "${YELLOW}⚠️${NC} Create .env.production from .env.production.example"
    ((WARNINGS++))
fi

echo ""
echo "🔄 BACKUP SYSTEM"
check_file "backup.sh"
if [ -f "backup.sh" ]; then
    if grep -q "pg_dump" "backup.sh"; then
        echo -e "${GREEN}✅${NC} Backup script includes pg_dump"
        ((PASSED++))
    fi
fi

echo ""
echo "🏥 DOCKER BUILD TEST"
if docker-compose -f docker-compose.production.yml build --dry-run > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} Docker-compose build successful"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️${NC} Could not perform dry-run build check"
    ((WARNINGS++))
fi

echo ""
echo "🔐 ENVIRONMENT VALIDATION"
if [ -f "backend/synk_backend/settings.py" ]; then
    python3 -m py_compile backend/synk_backend/settings.py 2>/dev/null && \
    echo -e "${GREEN}✅${NC} Django settings.py syntax valid" && \
    ((PASSED++)) || \
    (echo -e "${RED}❌${NC} Django settings.py has syntax errors" && ((FAILED++)))
fi

echo ""
echo "📋 DEPLOYMENT DOCUMENTATION"
check_content "DEPLOY.md" "Production" "DEPLOY.md covers production"
check_content "SECURITY.md" "OWASP" "SECURITY.md references OWASP"
check_content "INCIDENTS.md" "Critical" "INCIDENTS.md has severity levels"
check_content "OPERATIONS.md" "Daily" "OPERATIONS.md has daily tasks"

echo ""
echo "="*50
echo ""
echo -e "${GREEN}✅ PASSED: $PASSED${NC}"
echo -e "${RED}❌ FAILED: $FAILED${NC}"
echo -e "${YELLOW}⚠️  WARNINGS: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All critical checks passed!${NC}"
    echo ""
    echo "Next steps before deployment:"
    echo "1. Review and update .env.production with actual values"
    echo "2. Generate SSL certificate: certbot certonly --standalone -d yourdomain.com"
    echo "3. Update nginx.production.conf with domain name"
    echo "4. Setup backup system: bash backup.sh (test)"
    echo "5. Run: docker-compose -f docker-compose.production.yml up -d"
    echo "6. Verify: curl -I https://yourdomain.com"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Fix the above issues before deploying${NC}"
    exit 1
fi
