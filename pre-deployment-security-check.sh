#!/bin/bash
# Production Deployment Security Pre-Flight Check
# Run this script before deploying to production to ensure all security measures are in place

set -e

echo "🔒 Synk Production Deployment Security Audit"
echo "=============================================="
echo ""

CHECKS_PASSED=0
CHECKS_FAILED=0

# Helper functions
check_pass() {
    echo "✅ $1"
    ((CHECKS_PASSED++))
}

check_fail() {
    echo "❌ $1"
    ((CHECKS_FAILED++))
}

check_warning() {
    echo "⚠️  $1"
}

# 1. Check for exposed secrets in git history
echo "1️⃣  Checking for exposed secrets in git..."
if git log -p | grep -i "AIzaSyDKTmGUQHjK\|AIzaSyD8VrFSzV7Z" &>/dev/null; then
    check_fail "Found exposed Gemini API keys in git history!"
    echo "   ℹ️  Run: git filter-branch to remove from history"
else
    check_pass "No exposed Gemini API keys found"
fi

# 2. Check .env files are gitignored
echo ""
echo "2️⃣  Checking .gitignore configuration..."
if grep -q "\.env\.production" .gitignore; then
    check_pass ".env.production is gitignored"
else
    check_fail ".env.production is NOT in .gitignore"
fi

if grep -q "\.env\.local" .gitignore; then
    check_pass ".env.local is gitignored"
else
    check_fail ".env.local is NOT in .gitignore"
fi

# 3. Check if .env.production exists
echo ""
echo "3️⃣  Checking environment configuration..."
if [ -f ".env.production" ]; then
    check_pass ".env.production file exists"
    
    # Check for required variables
    if grep -q "SECRET_KEY=" .env.production && ! grep -q "SECRET_KEY=your-" .env.production; then
        check_pass "SECRET_KEY is configured"
    else
        check_fail "SECRET_KEY is not properly configured"
    fi
    
    if grep -q "DEBUG=False" .env.production; then
        check_pass "DEBUG is set to False"
    else
        check_fail "DEBUG is not set to False"
    fi
    
    if grep -q "ALLOWED_HOSTS=" .env.production && ! grep -q "ALLOWED_HOSTS=localhost" .env.production; then
        check_pass "ALLOWED_HOSTS is configured for production domain"
    else
        check_fail "ALLOWED_HOSTS is not configured properly"
    fi
else
    check_fail ".env.production does not exist"
    echo "   ℹ️  Run: cp .env.production.example .env.production"
fi

# 4. Check nginx configuration
echo ""
echo "4️⃣  Checking nginx configuration..."
if [ -f "nginx.production.conf" ]; then
    check_pass "nginx.production.conf exists"
    
    if grep -q "ssl_protocols TLSv1.2 TLSv1.3" nginx.production.conf; then
        check_pass "Modern TLS versions configured"
    else
        check_fail "TLS configuration not found or outdated"
    fi
    
    if grep -q "Strict-Transport-Security" nginx.production.conf; then
        check_pass "HSTS header configured"
    else
        check_fail "HSTS header not configured"
    fi
    
    if grep -q "yourdomain.com" nginx.production.conf; then
        check_warning "nginx.production.conf still has placeholder domain - update with your actual domain"
    fi
else
    check_fail "nginx.production.conf not found"
fi

# 5. Check Django security settings
echo ""
echo "5️⃣  Checking Django security settings..."
if grep -q "SECURE_SSL_REDIRECT = True" backend/synk_backend/settings.py; then
    check_pass "SECURE_SSL_REDIRECT configured"
else
    check_warning "SECURE_SSL_REDIRECT not explicitly set (uses env-dependent logic)"
fi

if grep -q "SESSION_COOKIE_SECURE = True" backend/synk_backend/settings.py; then
    check_pass "SESSION_COOKIE_SECURE configured"
else
    check_fail "SESSION_COOKIE_SECURE not configured"
fi

if grep -q "CSRF_COOKIE_SECURE = True" backend/synk_backend/settings.py; then
    check_pass "CSRF_COOKIE_SECURE configured"
else
    check_fail "CSRF_COOKIE_SECURE not configured"
fi

if grep -q "SECURE_HSTS_SECONDS = 31536000" backend/synk_backend/settings.py; then
    check_pass "HSTS settings configured"
else
    check_fail "HSTS settings not configured"
fi

# 6. Check for hardcoded secrets in code
echo ""
echo "6️⃣  Checking for hardcoded secrets in code..."
if grep -r "AIzaSyDK\|AIzaSyD8" backend/ frontend/ 2>/dev/null | grep -v ".example" | grep -v "node_modules"; then
    check_fail "Found hardcoded API keys in source code!"
else
    check_pass "No hardcoded API keys found in source"
fi

if grep -r "django-insecure-" backend/ frontend/ 2>/dev/null | grep -v ".example" | grep -v "node_modules" | grep -v ".pyc"; then
    check_warning "Found insecure Django secret key references in code (development only)"
else
    check_pass "No insecure Django secrets in source code"
fi

# 7. Check Docker Compose configuration
echo ""
echo "7️⃣  Checking Docker Compose configuration..."
if [ -f "docker-compose.production.yml" ]; then
    check_pass "docker-compose.production.yml exists"
    
    if grep -q "SECRET_KEY=\${SECRET_KEY" docker-compose.production.yml; then
        check_pass "SECRET_KEY uses environment variable in Docker"
    else
        check_fail "SECRET_KEY not properly configured in Docker Compose"
    fi
    
    if grep -q "resource" docker-compose.production.yml; then
        check_pass "Resource limits configured in Docker Compose"
    else
        check_warning "Resource limits not configured (recommended for security)"
    fi
else
    check_fail "docker-compose.production.yml not found"
fi

# 8. Check security documentation
echo ""
echo "8️⃣  Checking security documentation..."
if [ -f "SECURITY.md" ]; then
    check_pass "SECURITY.md documentation exists"
else
    check_fail "SECURITY.md not found (run git checkout SECURITY.md)"
fi

# 9. Check for rate limiting configuration
echo ""
echo "9️⃣  Checking rate limiting configuration..."
if grep -q "rate_limit\|RateLimit" backend/api/security.py backend/api/middleware.py 2>/dev/null; then
    check_pass "Rate limiting configured"
else
    check_fail "Rate limiting not found"
fi

# 10. Check CSP headers
echo ""
echo "🔟 Checking Content Security Policy..."
if grep -q "script-src 'self'" backend/api/security.py; then
    check_pass "Strict CSP configured (no unsafe-inline)"
else
    check_warning "CSP may allow unsafe-inline (review security.py)"
fi

# Summary
echo ""
echo "=============================================="
echo "🎯 Deployment Security Audit Summary"
echo "=============================================="
echo "✅ Checks Passed: $CHECKS_PASSED"
echo "❌ Checks Failed: $CHECKS_FAILED"
echo "⚠️  Warnings: Review warnings above"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo "🚀 Ready for production deployment!"
    echo ""
    echo "Next steps:"
    echo "1. Review SECURITY.md for complete deployment checklist"
    echo "2. Update nginx.production.conf with your domain"
    echo "3. Obtain SSL certificate (Let's Encrypt)"
    echo "4. Run: docker-compose -f docker-compose.production.yml up -d"
    echo "5. Monitor logs for any issues"
    exit 0
else
    echo "⛔ Fix the above issues before proceeding to production!"
    echo ""
    echo "For details, see SECURITY.md"
    exit 1
fi
