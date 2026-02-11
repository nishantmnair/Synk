# Security Hardening & Deployment Guide

## Overview
This document outlines all security measures implemented in Synk before production deployment. It covers threat mitigation, best practices, and deployment instructions.

---

## 🔒 Security Measures Implemented

### 1. Secrets Management
#### ✅ Implemented
- **API Key Rotation**: Removed hardcoded Gemini API key from git history
- **Environment Variables**: All secrets now use environment variables only
- **Environment Templates**: `.env.production.example` provided as template
- **Git Protection**: Updated .gitignore to prevent secret leaks

#### 📋 Deployment Checklist
- [ ] Generate new SECRET_KEY for production
- [ ] Create `.env.production` from `.env.production.example`
- [ ] Set all required environment variables
- [ ] Never commit `.env.production` to version control
- [ ] Rotate API keys if previously exposed
- [ ] Use secrets management service (AWS Secrets Manager, HashiCorp Vault, etc.)

**Command to generate SECRET_KEY:**
```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

---

### 2. HTTPS/TLS Encryption
#### ✅ Implemented
- **Automatic HTTP to HTTPS Redirect**: nginx redirects all HTTP to HTTPS
- **HSTS Header**: Forces HTTPS for 1 year + subdomains + preload
- **Modern TLS**: TLS 1.2+ only, strong ciphers
- **Certificate Pinning Ready**: Can be configured in nginx

#### 📋 Deployment Instructions
1. **Obtain SSL Certificate**:
   ```bash
   # Using Let's Encrypt with Certbot
   certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
   ```

2. **Configure nginx** (see `nginx.production.conf`):
   - Update `server_name` to your domain
   - Update certificate paths
   - Review and adjust allowed IPs for admin access

3. **Start services**:
   ```bash
   docker-compose -f docker-compose.production.yml up -d
   ```

---

### 3. Content Security Policy (CSP)
#### ✅ Implemented
- **Strict CSP**: Removed `unsafe-inline` for scripts and styles
- **Frame Busting**: `X-Frame-Options: DENY`
- **MIME Type Protection**: `X-Content-Type-Options: nosniff`
- **XSS Protection**: `X-XSS-Protection: 1; mode=block`

#### Headers Added
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: [strict policy - see below]
Permissions-Policy: [restrictive permissions]
```

---

### 4. Authentication & Session Security
#### ✅ Implemented
- **JWT Tokens**: 1-hour access token lifetime
- **Token Rotation**: Refresh tokens rotate automatically
- **Secure Cookies**: HTTPOnly, Secure, SameSite=Strict
- **Session Timeout**: 1 hour + close on browser exit (production)
- **CSRF Protection**: Enabled for all POST/PUT/DELETE requests

#### Token Configuration (`.env.production`)
```env
# JWT Settings
ACCESS_TOKEN_LIFETIME=3600  # 1 hour
REFRESH_TOKEN_LIFETIME=604800  # 7 days
```

---

### 5. Rate Limiting
#### ✅ Implemented
- **Endpoints**: 300 requests/hour (general), 10 requests/5min (auth)
- **Registration**: 5 attempts/hour per IP
- **Account Deletion**: 1 attempt/day
- **Rate Limit Headers**: Includes `Retry-After` header

#### Limits Enforced by Endpoint
```python
'/api/register/': 5 per hour
'/api/auth/': 10 per 5 minutes
'/api/users/delete_account/': 1 per day
'/api/': 300 per hour (default)
```

#### Additional nginx Limits (`.nginx.production.conf`)
```nginx
/api/auth/: 10 requests/minute
/api/register/: 5 requests/hour
/admin/: 10 requests/minute
```

---

### 6. Input Validation & Sanitization
#### ✅ Implemented
- **Early Validation**: Middleware validates requests before reaching views
- **Size Limits**: Max 10MB request body
- **Suspicious Pattern Detection**: SQL injection, XSS patterns blocked
- **HTML Sanitization**: Bleach library for HTML content
- **Email Validation**: RFC 5321 compliance

#### Validation Examples
```python
# Suspicious patterns detected and logged
'union select', 'drop table', 'exec(', '<script', 'javascript:', 'onerror=', 'onclick='
```

---

### 7. Admin Panel Protection
#### ✅ Implemented
- **Path Obfuscation**: Admin path configurable via `ADMIN_PATH` env var
- **IP Whitelisting**: nginx restricts admin to trusted IPs only
- **HTTPS Enforced**: Admin always uses HTTPS
- **Rate Limiting**: Admin endpoints have stricter limits (10 req/min)

#### Configuration
```nginx
# In nginx.production.conf, uncomment and set your IP ranges:
# allow 203.0.113.0/24;    # Your office IP
# allow 198.51.100.0/24;   # Your VPN IP
# deny all;
```

#### Change Default Admin Path
```bash
# Set in .env.production
ADMIN_PATH=yoursecureadminpath

# Access at: https://yourdomain.com/yoursecureadminpath/
```

---

### 8. Database Security
#### ✅ Implemented
- **PostgreSQL**: Production database (not SQLite)
- **Separate Credentials**: Different DB user/password
- **Not Exposed**: DB port not exposed to internet in production
- **Encrypted Connections**: SSL can be enforced

#### Connection String (Production)
```env
DB_HOST=your-secure-db-host
DB_USER=synk_prod_user
DB_PASSWORD=your-secure-db-password
DB_PORT=5432
```

---

### 9. Framework Security Settings
#### ✅ Implemented

**Secure by Default:**
- `DEBUG=False` (required in production)
- `SESSION_COOKIE_SECURE=True`
- `SESSION_COOKIE_HTTPONLY=True`
- `CSRF_COOKIE_SECURE=True`
- `CSRF_COOKIE_HTTPONLY=True`
- `SESSION_COOKIE_SAMESITE='Strict'`
- `CSRF_COOKIE_SAMESITE='Strict'`
- `SECURE_SSL_REDIRECT=True`
- `SECURE_HSTS_SECONDS=31536000`
- `SECURE_HSTS_INCLUDE_SUBDOMAINS=True`
- `SECURE_HSTS_PRELOAD=True`

---

### 10. Dependency Security
#### ✅ Current Dependencies
```
Django==5.0.1                    ✅ Current
djangorestframework==3.14.0      ✅ Current
djangorestframework-simplejwt    ✅ Current
django-cors-headers==4.3.1       ✅ Current
channels==4.0.0                  ✅ Current
bleach==6.1.0                    ✅ Current (HTML sanitization)
```

#### 📋 Deployment Checklist
- [ ] Run `pip audit` to check for vulnerabilities
  ```bash
  pip install pip-audit
  pip-audit
  ```
- [ ] Update all dependencies to latest stable versions
  ```bash
  pip list --outdated
  ```
- [ ] Set up automated dependency scanning (GitHub Dependabot, etc.)
- [ ] Review and approve all dependency updates before deployment

---

### 11. CORS Configuration
#### ✅ Implemented
```env
# Development (default)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Production (set via .env.production)
PRODUCTION_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

### 12. Error Handling & Logging
#### ✅ Implemented
- **Custom Exception Handler**: Prevents info disclosure
- **Security Logging**: Rate limit violations, suspicious patterns logged
- **No Stack Traces in Production**: DEBUG=False hides implementation details
- **Centralized Logging**: All errors logged for monitoring

#### Log Sensitive Information
- Failed authentication attempts
- Rate limit violations
- Admin access attempts
- Suspicious input patterns
- Database connection issues

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Audit code for hardcoded secrets
  ```bash
  git log -p | grep -i "password\|secret\|key\|token" | head -20
  ```
- [ ] Update dependencies and scan for vulnerabilities
- [ ] Run all security tests
- [ ] Review admin IP whitelist in nginx config
- [ ] Generate strong SECRET_KEY
- [ ] Create `.env.production` with all required values
- [ ] Test HTTPS certificate installation
- [ ] Set up log aggregation (e.g., ELK, Datadog, Sentry)
- [ ] Set up monitoring and alerting

### Deployment
- [ ] Deploy using `docker-compose.production.yml`
- [ ] Verify HTTPS is working and redirecting HTTP
- [ ] Test admin panel access (should be IP-restricted)
- [ ] Verify rate limiting is working
- [ ] Check security headers are present
  ```bash
  curl -I https://yourdomain.com | grep -i "strict-transport\|x-frame\|x-content"
  ```
- [ ] Monitor error logs for any issues
- [ ] Perform security scan (OWASP ZAP, etc.)

### Post-Deployment
- [ ] Monitor logs for suspicious activity
- [ ] Set up automated backups
- [ ] Enable 2FA for admin accounts
- [ ] Schedule regular security audits
- [ ] Keep dependencies updated
- [ ] Monitor for CVEs in used packages

---

## 🔧 Environment Setup

### Generate Production Environment File
```bash
# Copy template
cp .env.production.example .env.production

# Generate SECRET_KEY
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())' > SECRET_KEY.txt

# Edit .env.production with your values
nano .env.production

# Verify no secrets in git
git status  # Should NOT show .env.production
```

### Docker Deployment
```bash
# Build and start services
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d

# Verify services are running
docker-compose -f docker-compose.production.yml ps

# Run migrations
docker-compose -f docker-compose.production.yml exec backend python manage.py migrate

# Create superuser
docker-compose -f docker-compose.production.yml exec backend python manage.py createsuperuser

# Collect static files
docker-compose -f docker-compose.production.yml exec backend python manage.py collectstatic --noinput
```

---

## 🔍 Security Scanning

### OWASP ZAP Scanning
```bash
# Docker image for OWASP ZAP
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://yourdomain.com
```

### Dependency Audit
```bash
# Check for known vulnerabilities
pip-audit

# Or use Safety
pip install safety
safety check
```

### SSL/TLS Configuration Test
```bash
# Test SSL configuration
openssl s_client -connect yourdomain.com:443 -tls1_2

# Or use online tools
# https://www.ssllabs.com/ssltest/
# https://www.testssl.sh/
```

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Django Security Documentation](https://docs.djangoproject.com/en/5.0/topics/security/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)

---

## 🆘 Incident Response

### If You Suspect a Compromise
1. Stop services immediately
2. Preserve logs for forensic analysis
3. Review all recent access logs
4. Check for unusual database queries
5. Rotate all credentials
6. Notify affected users if data was exposed
7. Conduct security audit
8. Deploy fixes before restarting

### Key Contacts
- Security Team: [Your Team Email]
- Incident Hotline: [Your Hotline Number]
- External Security Firm: [Contact Info]

---

## 🔄 Version History

- **v1.0** (2026-02-11): Initial security hardening for production

---

**Last Updated**: February 11, 2026
**Review Schedule**: Quarterly or after any security incidents
**Next Review**: May 11, 2026
