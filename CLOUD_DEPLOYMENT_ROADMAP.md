# Cloud Deployment Roadmap - 12 Use Cases

## 📊 Status Overview

| UC | Title | Status | Priority | Effort |
|---|-------|--------|----------|--------|
| UC-129 | Production Environment Setup (Free-Tier) | 📋 Planned | 🔴 Critical | 4h |
| UC-130 | Database Migration to Production | 📋 Planned | 🔴 Critical | 2h |
| UC-131 | Environment Configuration Management | ✅ 80% Done | 🟠 High | 30m |
| UC-132 | CI/CD Pipeline Configuration | 📋 Planned | 🔴 Critical | 3h |
| UC-133 | Production Monitoring and Logging | ✅ 70% Done | 🟠 High | 2h |
| UC-134 | Production Performance Optimization | 📋 Planned | 🟠 High | 3h |
| UC-135 | Production Security Hardening | ✅ 100% Done | 🔴 Critical | ✅ Complete |
| UC-136 | Scalability and Resource Management | 📋 Planned | 🟡 Medium | 2h |
| UC-137 | Backup and Disaster Recovery | ✅ 100% Done | 🔴 Critical | ✅ Complete |
| UC-138 | Production Documentation | ✅ 100% Done | 🔴 Critical | ✅ Complete |
| UC-139 | Domain and DNS Configuration | 📋 Planned | 🟠 High | 1h |

**Total Effort:** ~18 hours
**Already Completed:** 5 hours
**Remaining:** 13 hours

---

## ✅ COMPLETED Use Cases

### UC-135: Production Security Hardening ✅
- ✅ CSRF protection enabled
- ✅ XSS prevention (bleach sanitization)
- ✅ SQL injection prevention (ORM + parameterized queries)
- ✅ Secure session management (HTTPOnly, Secure, SameSite=Strict)
- ✅ HTTP security headers (CSP, HSTS, X-Frame-Options)
- ✅ Rate limiting configured
- ✅ Admin panel IP whitelisting
- ✅ Environment variable validation
- ✅ Non-root Docker containers

**Reference:** [SECURITY.md](./SECURITY.md)

### UC-137: Backup and Disaster Recovery ✅
- ✅ Daily automated backups (backup.sh)
- ✅ Backup integrity verification
- ✅ 30-day retention policy
- ✅ Restore procedures documented
- ✅ Multiple storage options (local, S3, external drive)
- ✅ Disaster recovery runbook
- ✅ Post-incident procedures

**Reference:** [BACKUP_SETUP.md](./BACKUP_SETUP.md), [INCIDENTS.md](./INCIDENTS.md)

### UC-138: Production Documentation ✅
- ✅ Architecture diagrams in SECURITY.md
- ✅ Deployment runbooks (DEPLOY.md, DEPLOYMENT_READY.md)
- ✅ Environment variable documentation (.env.production.example)
- ✅ Troubleshooting guides (INCIDENTS.md)
- ✅ Change log (PRE_DEPLOYMENT_ITEMS.md updated)
- ✅ On-call procedures and escalation (INCIDENTS.md)
- ✅ Monitoring and alerting setup (OPERATIONS.md)

**Reference:** [SECURITY.md](./SECURITY.md), [DEPLOY.md](./DEPLOY.md), [OPERATIONS.md](./OPERATIONS.md), [INCIDENTS.md](./INCIDENTS.md)

---

## 🟨 PARTIALLY COMPLETED Use Cases

### UC-131: Environment Configuration Management (80% Done)
**Completed:**
- ✅ .env files created for each environment
- ✅ Different database connections per environment
- ✅ Logging levels configurable (LOG_LEVEL env var)
- ✅ .env.example template provided
- ✅ .env.production.example template provided

**Remaining (20%):**
- ⏳ Feature flags for gradual rollout (TODO)
- ⏳ Secrets management tool integration (TODO - consider HashiCorp Vault or similar)

**Reference:** [.env files](./), [backend/synk_backend/settings.py](./backend/synk_backend/settings.py#L1-L100)

---

### UC-133: Production Monitoring and Logging (70% Done)
**Completed:**
- ✅ Django LOGGING configured (console handlers)
- ✅ Structured JSON logging with python-json-logger
- ✅ Security event tracking (rate limits, auth failures)
- ✅ Configurable log levels
- ✅ Logging to stdout (Docker-friendly)

**Remaining (30%):**
- ⏳ Sentry integration for error tracking (TODO)
- ⏳ UptimeRobot setup for uptime monitoring (TODO)
- ⏳ Performance dashboard (TODO)
- ⏳ Alert configuration (TODO)

**Reference:** [backend/synk_backend/settings.py](./backend/synk_backend/settings.py#L150-L220) (LOGGING dict)

---

## 📋 TODO Use Cases

### UC-129: Production Environment Setup (Free-Tier Cloud Platform)
**Recommended Stack:**
- **Frontend:** Vercel (Next.js optimized, free tier includes edge functions)
- **Backend:** Railway.app or Render.com (free tier with custom domains)
- **Database:** Neon.tech PostgreSQL (free tier with 2GB storage, auto-scaling)
- **Domain:** Freenom (free .tk/.ml) or use GitHub Pages for static demos

**Implementation Steps:**

#### Step 1: Frontend Deployment to Vercel (0.5h)
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Configure vercel.json
cat > frontend/vercel.json <<'EOF'
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_URL": "@vite-api-url",
    "VITE_WS_URL": "@vite-ws-url"
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "${VITE_API_URL}/api/:path*"
    }
  ]
}
EOF

# 3. Deploy
vercel --prod

# 4. Set environment variables in Vercel dashboard
# VITE_API_URL=https://backend.railway.app
# VITE_WS_URL=wss://backend.railway.app
```

#### Step 2: Backend Deployment to Railway.app (1h)
```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Initialize and link project
railway init
railway login

# 3. Add PostgreSQL plugin
railway add --plugin custom --name postgres-synk --image postgres:15-alpine

# 4. Configure environment variables
railway variables set \
  DEBUG=False \
  SECRET_KEY=<generated-key> \
  ALLOWED_HOSTS=backend.railway.app \
  DB_HOST=$DATABASE_URL_HOST \
  DB_PORT=$DATABASE_URL_PORT \
  DB_NAME=$DATABASE_NAME \
  DB_USER=$DATABASE_USER \
  DB_PASSWORD=$DATABASE_PASSWORD

# 5. Create Procfile for Railway
cat > backend/Procfile <<'EOF'
web: gunicorn synk_backend.wsgi --bind 0.0.0.0:$PORT
release: python manage.py migrate
EOF

# 6. Deploy
railway up
```

#### Step 3: Database Setup on Neon.tech (0.5h)
```bash
# 1. Sign up at neon.tech
# 2. Create new project
# 3. Copy connection string
# 4. Configure in Railway environment variables
# - DATABASE_URL=postgresql://user:pass@host/dbname

# 5. Run migrations
railway exec python manage.py migrate
railway exec python manage.py createsuperuser
```

#### Step 4: Configure CORS (15m)
```python
# backend/synk_backend/settings.py
CORS_ALLOWED_ORIGINS = [
    'https://synk.vercel.app',
    'https://backend.railway.app',
]

CSRF_TRUSTED_ORIGINS = [
    'https://synk.vercel.app',
]
```

**Acceptance Criteria Checklist:**
- [ ] Frontend accessible via public URL
- [ ] Backend API responds from public URL
- [ ] Database migrations completed
- [ ] HTTPS enabled automatically
- [ ] CORS configured correctly
- [ ] Custom domain (optional) configured
- [ ] All features tested in production

---

### UC-130: Database Migration to Production
**Step-by-Step:**

```bash
# 1. Create backup of development database
pg_dump --host=localhost --user=postgres --password synk_db > backup_before_migration.sql

# 2. Connect to production database (Neon.tech)
# Use connection string from Neon dashboard

# 3. Run migrations on production
railway exec python manage.py migrate

# 4. Verify tables created
railway exec python manage.py dbshell <<'EOF'
\dt
SELECT COUNT(*) FROM auth_user;
SELECT COUNT(*) FROM api_user;
EOF

# 5. Seed reference data (if needed)
railway exec python manage.py shell <<'EOF'
from api.models import TeamRole, SkillCategory
# Create default roles/categories
TeamRole.objects.get_or_create(name='Manager', defaults={...})
EOF

# 6. Test connectivity
python manage.py shell
from django.db import connection
print("Connected:", cursor.connection.get_dsn_parameters())

# 7. Configure connection pooling (optional but recommended)
# Install pgBouncer or use PgBouncer in Neon dashboard
```

**Acceptance Criteria Checklist:**
- [ ] All tables created in production database
- [ ] Indexes created correctly
- [ ] Constraints applied successfully
- [ ] Reference data seeded
- [ ] Backups configured
- [ ] Connection pooling enables
- [ ] Backend can connect and query
- [ ] User registration works end-to-end

---

### UC-132: CI/CD Pipeline Configuration (GitHub Actions)
**Create `.github/workflows/deploy.yml`:**

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [develop, main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: synk_test
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Set up Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install backend dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      
      - name: Run backend tests
        env:
          DEBUG: 'False'
          SECRET_KEY: 'test-secret-key-12345'
          ALLOWED_HOSTS: 'localhost,127.0.0.1'
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: synk_test
          DB_USER: postgres
          DB_PASSWORD: postgres
        run: |
          cd backend
          python manage.py test
      
      - name: Install frontend dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Run frontend tests
        run: |
          cd frontend
          npm test -- --run
      
      - name: Build frontend
        run: |
          cd frontend
          npm run build
      
      - name: Check build size
        run: |
          SIZE=$(du -sh frontend/dist | cut -f1)
          echo "Build size: $SIZE"
          if [[ $(du -sb frontend/dist | cut -f1) -gt 5242880 ]]; then
            echo "ERROR: Build exceeds 5MB limit"
            exit 1
          fi

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy frontend to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
        run: |
          npm i -g vercel
          vercel --prod --token=$VERCEL_TOKEN
      
      - name: Deploy backend to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          npm i -g @railway/cli
          railway up --token=$RAILWAY_TOKEN
      
      - name: Run migrations
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          railway exec python manage.py migrate
      
      - name: Send deployment notification
        if: success()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Deployment to production successful!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
      
      - name: Notify on failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment failed! Check logs.'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

**Setup GitHub Secrets:**
```bash
# In GitHub repo settings > Secrets and variables > Actions
VERCEL_TOKEN=<your-token>
VERCEL_PROJECT_ID=<project-id>
VERCEL_ORG_ID=<org-id>
RAILWAY_TOKEN=<your-token>
SLACK_WEBHOOK=<webhook-url>  # Optional, for notifications
```

**Acceptance Criteria Checklist:**
- [ ] Tests run on every push
- [ ] Tests run on pull requests
- [ ] Deployment only happens on main branch merge
- [ ] Deployment notifications sent to team
- [ ] Failed deployments prevent merge
- [ ] Build size monitored
- [ ] Rollback accessible from GitHub Actions UI

---

### UC-134: Production Performance Optimization

#### Frontend Optimization:
```typescript
// vite.config.ts - Already configured, but can enhance:
import { visualizer } from 'rollup-plugin-visualizer';

export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react': ['react', 'react-dom'],
          'vendor': ['axios', 'date-fns'],
        }
      }
    },
    plugins: [visualizer()],  // Analyze bundle
    minify: 'terser',
    cssCodeSplit: true,
  },
  ssr: false,
}
```

#### Implement Code Splitting:
```typescript
// Use dynamic imports for route-based splitting
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'));

<Suspense fallback={<LoadingSpinner />}>
  <Dashboard />
</Suspense>
```

#### Optimize Images:
```bash
# Install image optimizer
npm install squoosh sharp

# Add to build step in vite.config.ts
// Automatically optimize images during build
```

#### Enable Compression (nginx):
```nginx
# nginx.conf
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
gzip_min_length 1000;
gzip_comp_level 6;
gzip_vary on;

# Add cache headers
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### Implement Lazy Loading:
```html
<!-- Frontend images -->
<img src="image.jpg" loading="lazy" />

<!-- React components via code splitting -->
import { lazy } from 'react';
const Details = lazy(() => import('./Details'));
```

#### Performance Budgets:
```json
{
  "bundles": [
    {
      "name": "main",
      "maxSize": "250kb"
    },
    {
      "name": "vendor",
      "maxSize": "200kb"
    }
  ]
}
```

**Lighthouse Audit:**
```bash
npm install -g lighthouse

# Run lighthouse audit
lighthouse https://synk.vercel.app --view

# Expected scores:
# Performance: 90+
# Accessibility: 95+
# Best Practices: 90+
# SEO: 100
```

**Backend Optimization:**
```python
# settings.py
# Caching
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
        'KEY_PREFIX': 'synk',
        'TIMEOUT': 300,
    }
}

# Database query optimization
from django.db import connection
from django.test.utils import CaptureQueriesContext

with CaptureQueriesContext(connection) as ctx:
    # View code
    pass
print(len(ctx))  # Number of queries

# Add select_related, prefetch_related
User.objects.select_related('profile').prefetch_related('teams')
```

**Acceptance Criteria Checklist:**
- [ ] Bundle size < 250kb (main)
- [ ] Lighthouse Performance score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Code splitting implemented
- [ ] Images optimized
- [ ] Caching headers configured
- [ ] TTFB < 600ms

---

### UC-136: Scalability and Resource Management

#### Database Connection Pooling:
```python
# backend/requirements.txt - Add:
psycopg2-binary==2.9.9
django-db-geventpool==4.0.1  # Connection pooling

# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django_db_geventpool.backends.postgresql_psycopg2',
        'POOL': {
            'MaxOverflow': 10,
            'PoolSize': 10,
        }
    }
}
```

#### Redis Caching Layer:
```python
# requirements.txt - Add:
redis==5.0.0
django-redis==5.4.0

# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Use decorators to cache views
from django.views.decorators.cache import cache_page

@cache_page(60 * 15)  # Cache for 15 minutes
def expensive_view(request):
    pass
```

#### Database Query Optimization:
```python
# api/views.py - Optimize N+1 queries
from django.db.models import Prefetch

# Before: N+1 queries
users = User.objects.all()
for user in users:
    print(user.profile.bio)  # Extra query for each user

# After: 2 queries
users = User.objects.select_related('profile').all()

# For reverse relationships
from django.db.models import Prefetch
users = User.objects.prefetch_related(
    Prefetch('teams', queryset=Team.objects.filter(active=True))
)
```

#### Pagination:
```python
# views.py
from django.core.paginator import Paginator

def list_users(request):
    users = User.objects.all()
    paginator = Paginator(users, 20)  # 20 per page
    page = request.GET.get('page', 1)
    users_page = paginator.get_page(page)
    return render(request, 'users.html', {'users': users_page})
```

#### Monitor Resource Usage:
```bash
# Check container stats
docker stats synk_backend synk_frontend synk_db

# Monitor in production (Railway/Render dashboard)
# Alert if:
# - CPU > 80%
# - Memory > 85%
# - Database connections > max_connections * 0.9
```

#### Auto-Scaling (if available):
- Vercel: Automatic
- Railway: Manual scaling via dashboard or API
- Render.com: Auto-scaling available on paid tiers

**Scaling Decision Tree:**
```
Users > 100?
├─ Yes: Add database connection pooling
└─ No: Continue monitoring

Response time > 1s?
├─ Yes: Add Redis caching
└─ No: Continue monitoring

CPU > 80%?
├─ Yes: Horizontal scaling (multiple instances)
└─ No: Continue monitoring

Database CPU > 80%?
├─ Yes: Add read replicas or optimize queries
└─ No: Continue monitoring
```

**Acceptance Criteria Checklist:**
- [ ] Connection pooling configured
- [ ] Redis caching deployed
- [ ] N+1 queries eliminated
- [ ] Pagination implemented
- [ ] Resource limits set
- [ ] Monitoring dashboard operational
- [ ] Load test shows < 2s response time under 1000 concurrent users

---

### UC-139: Domain and DNS Configuration

#### Option 1: Free Subdomain
```bash
# Vercel: synk.vercel.app (automatic)
# Railway: synk.railway.app (automatic)
# No DNS configuration needed
```

#### Option 2: Custom Domain (Freenom - Free)
```bash
# 1. Go to freenom.com
# 2. Register: yourdomain.tk (free for 1 year)
# 3. Get nameservers from Vercel/Railway
# 4. Update DNS at Freenom dashboard

# Vercel nameservers:
# ns1.vercel-dns.com
# ns2.vercel-dns.com
```

#### Option 3: Custom Domain (Namecheap/GoDaddy - Cheap)
```bash
# 1. Register domain: ~$2-5/year
# 2. Point to Vercel via A/CNAME records:

# A Record:
# Host: @
# Value: 76.75.126.130 (Vercel's IP)

# CNAME Record (for www):
# Host: www
# Value: cname.vercel-dns.com.

# TXT Record (for verification):
# Host: _vercelDomainVerification
# Value: <verification-code-from-Vercel>
```

#### Configure in Code:
```python
# backend/synk_backend/settings.py
ALLOWED_HOSTS = [
    'yourdomain.tk',
    'www.yourdomain.tk',
    'api.yourdomain.tk',
]

# frontend needs to know backend URL
VITE_API_URL=https://api.yourdomain.tk
VITE_WS_URL=wss://api.yourdomain.tk/ws
```

#### SSL Certificate (Automatic):
- Vercel: Automatic SSL (free)
- Railway: Automatic SSL (free)
- Render.com: Automatic SSL (free)
- Custom domain: Let's Encrypt (free via platform)

**Test DNS:**
```bash
# Verify DNS resolution
nslookup yourdomain.tk
dig yourdomain.tk

# Test HTTPS
curl -I https://yourdomain.tk

# Check certificate validity
openssl s_client -connect yourdomain.tk:443 -servername yourdomain.tk
```

**Acceptance Criteria Checklist:**
- [ ] Domain registered and DNS configured
- [ ] A/CNAME records pointing correctly
- [ ] SSL certificate valid (HTTPS working)
- [ ] www redirect configured
- [ ] Email forwarding configured (if needed)
- [ ] Domain verification complete
- [ ] Accessible from multiple locations

---

## 🎯 Implementation Priority

### Phase 1: Critical (Week 1) - ~8h
1. UC-129: Cloud Deployment Setup
2. UC-130: Database Migration
3. UC-132: CI/CD Pipeline

### Phase 2: Important (Week 2) - ~5h
4. UC-134: Performance Optimization
5. UC-136: Scalability Setup
6. UC-139: Domain Configuration

### Phase 3: Enhancement (Week 3+) - ~5h
7. UC-131: Feature Flags (complete remaining)
8. UC-133: Sentry + Monitoring (complete remaining)

---

## 📋 Free-Tier Comparison

| Component | Option 1 | Option 2 | Option 3 | Best For |
|-----------|----------|----------|----------|----------|
| **Frontend** | Vercel | Netlify | GitHub Pages | Vercel (Edge, best DX) |
| **Backend** | Railway | Render | Fly.io | Railway (most generous) |
| **Database** | Neon | Supabase | PlanetScale | Neon (PostgreSQL native) |
| **Cost** | Free | Free | Free | All equal |
| **Sleep Time** | None | After 15 min | 30 min | Vercel/Railway |

### Recommended Stack:
- **Frontend:** Vercel (free, optimized for React/Vite)
- **Backend:** Railway (free tier $5/month credit)
- **Database:** Neon (free tier 2GB PostgreSQL)
- **Domain:** Freenom (free) or custom ($2-5/year)

---

## 📝 Deployment Checklist

- [ ] All 12 use cases reviewed and understood
- [ ] Free-tier accounts created (Vercel, Railway, Neon)
- [ ] UC-129: Frontend deployed to Vercel
- [ ] UC-129: Backend deployed to Railway
- [ ] UC-130: Database created and migrations run
- [ ] UC-132: GitHub Actions workflow created
- [ ] UC-134: Lighthouse score verified > 90
- [ ] UC-136: Database pooling configured
- [ ] UC-139: Custom domain configured
- [ ] All features tested in cloud environment
- [ ] Backups configured ([BACKUP_SETUP.md](./BACKUP_SETUP.md))
- [ ] Incidents procedures ready ([INCIDENTS.md](./INCIDENTS.md))
- [ ] Monitoring configured ([OPERATIONS.md](./OPERATIONS.md))

---

## 📞 Next Steps

1. **Start with UC-129:** Deploy frontend to Vercel (30 min)
2. **Then UC-129:** Deploy backend to Railway.app (1 hour)
3. **Then UC-130:** Run migrations and test (30 min)
4. **Then UC-132:** Configure CI/CD (1 hour)
5. **Test end-to-end:** All features work in production
6. **Configure UC-139:** Add custom domain
7. **Monitor and iterate:** Use OPERATIONS.md checklist

---

**Status:** Ready to start Phase 1 implementation
**Estimated Time to Production:** 8-10 hours
**Risk Level:** Low (all components are free tier and well-tested)

For detailed deployment steps, see [DEPLOYMENT_READY.md](./DEPLOYMENT_READY.md)
