# Deployment Quick Start Guide

## 🚀 5-Minute Deployment Setup

### Step 1: Generate Production Secrets
```bash
# Generate a strong Django SECRET_KEY
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'

# Generate a strong database password (use this or a password manager)
# Example: openssl rand -base64 32
```

### Step 2: Create Production Environment File
```bash
# Copy the template
cp .env.production.example .env.production

# Edit with your values
nano .env.production

# Required values to set:
# - SECRET_KEY (generated in step 1)
# - DB_PASSWORD (secure random password)
# - ALLOWED_HOSTS (your domain)
# - FRONTEND_URL (your domain with https://)
# - PRODUCTION_ALLOWED_ORIGINS (your domain)
# - GEMINI_API_KEY (if using AI features)
# - EMAIL_* settings (for password resets)
```

### Step 3: Setup SSL Certificate
```bash
# Install Certbot if needed
brew install certbot  # macOS
# or: apt-get install certbot  # Linux

# Get certificate from Let's Encrypt
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Update paths in nginx.production.conf:
# ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
```

### Step 4: Configure nginx
```bash
# Update nginx.production.conf with your settings:
# 1. server_name yourdomain.com www.yourdomain.com
# 2. Certificate paths (from step 3)
# 3. Admin IP whitelist (uncomment and add your IPs)

# Copy to nginx config
cp nginx.production.conf /etc/nginx/sites-available/yourdomain.com
ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/
nginx -t  # Test config
systemctl reload nginx
```

### Step 5: Deploy Services
```bash
# Build and start Docker containers
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# Initialize database
docker-compose -f docker-compose.production.yml exec backend python manage.py migrate

# Create admin user
docker-compose -f docker-compose.production.yml exec backend python manage.py createsuperuser

# Collect static files
docker-compose -f docker-compose.production.yml exec backend python manage.py collectstatic --noinput
```

### Step 6: Verify Deployment
```bash
# Test HTTPS
curl -I https://yourdomain.com

# Check security headers
curl -I https://yourdomain.com | grep -E "Strict-Transport|X-Frame|X-Content"

# Verify admin access (should be IP-restricted)
curl https://yourdomain.com/admin/  # May return 403 if not from allowed IP

# Check API
curl https://yourdomain.com/api/
```

### Step 7: Run Security Audit
```bash
./pre-deployment-security-check.sh

# Should pass all checks before considering production-ready
```

---

## 📋 Pre-Deployment Checklist

- [ ] Created `.env.production` with all required values
- [ ] Generated strong `SECRET_KEY`
- [ ] Set `DEBUG=False` in production env
- [ ] Configured `ALLOWED_HOSTS` for your domain
- [ ] Obtained SSL certificate
- [ ] Updated nginx configuration with domain and certificates
- [ ] Set admin IP whitelist in nginx
- [ ] Created superuser account
- [ ] Verified HTTPS is working
- [ ] Verified security headers are present
- [ ] Ran `./pre-deployment-security-check.sh` and passed all checks
- [ ] Reviewed SECURITY.md for additional hardening
- [ ] Set up log aggregation/monitoring
- [ ] Set up automated backups
- [ ] Set up uptime monitoring/alerting

---

## 🔄 Daily Operations

### Monitor Logs
```bash
# View Docker logs
docker-compose -f docker-compose.production.yml logs -f backend
docker-compose -f docker-compose.production.yml logs -f frontend

# View nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/admin_access.log  # Admin panel access
```

### Regular Maintenance
```bash
# Update dependencies (monthly)
docker-compose -f docker-compose.production.yml exec backend pip install --upgrade -r requirements.txt

# Backup database (daily recommended)
docker-compose -f docker-compose.production.yml exec db pg_dump -U synk_prod_user synk_db_prod > backup_$(date +%Y%m%d).sql

# Restart services if needed
docker-compose -f docker-compose.production.yml restart

# Check certificate expiration
certbot certificates

# Renew certificate before expiration (auto with certbot renewal service)
certbot renew --dry-run  # Test renewal
```

---

## ⚠️ Security Reminders

1. **Never commit `.env.production`** to git
2. **Never expose admin panel URL** (use IP whitelisting)
3. **Rotate secrets regularly** (quarterly minimum)
4. **Keep dependencies updated** (check monthly)
5. **Monitor logs for suspicious activity** (daily)
6. **Test disaster recovery** (quarterly)
7. **Perform security audits** (annually)
8. **Review access logs** (weekly)
9. **Enforce strong admin passwords** (2FA recommended)
10. **Keep backups encrypted** and tested

---

## 🆘 Troubleshooting

### Services not starting?
```bash
docker-compose -f docker-compose.production.yml logs backend
# Check: SECRET_KEY is set and valid
# Check: Database credentials are correct
# Check: DEBUG=False
```

### SSL certificate issues?
```bash
# Check certificate
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem -text -noout

# Test with openssl
openssl s_client -connect yourdomain.com:443

# Nginx test
nginx -t
```

### Admin panel not accessible?
```bash
# Check nginx IP whitelist is configured correctly
grep -A 3 "/admin/" /etc/nginx/sites-enabled/yourdomain.com

# Check your IP
curl https://whatismyipaddress.com
```

### High CPU/Memory usage?
```bash
# Check resource limits
docker stats

# Check running processes
docker-compose -f docker-compose.production.yml exec backend ps aux

# Check database connections
docker-compose -f docker-compose.production.yml exec db psql -U synk_prod_user -d synk_db_prod -c "SELECT * FROM pg_stat_activity;"
```

---

## 📞 Support

For security issues, see contact information in SECURITY.md

For general issues, review deployment logs and check documentation in README.md

---

**Last Updated**: February 11, 2026
**Deployment Type**: Docker Compose + nginx + Let's Encrypt
