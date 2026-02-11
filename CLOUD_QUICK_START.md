# Quick Start: Cloud Deployment Guide (Free Tier)

> ⚠️ **UPDATED Feb 11, 2026:** Environment variables simplified. Only `SECRET_KEY` is required. For Render/Vercel deployment, follow [DEPLOYMENT_NEXT_STEPS.md](./DEPLOYMENT_NEXT_STEPS.md) instead.

## 📦 Complete Stack (Zero Cost)

```
┌─────────────────────────────────────────────────────┐
│                  SYNK PRODUCTION                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Frontend          Backend           Database       │
│  ┌──────────┐    ┌──────────┐      ┌──────────┐   │
│  │ Vercel   │───▶│ Railway  │◀────▶│ Neon.tech│   │
│  │(Edge)    │    │(Node.js) │      │(PG 15)   │   │
│  └──────────┘    └──────────┘      └──────────┘   │
│   vercel.app     railway.app       neon.tech       │
│                                                     │
│  All HTTPS, Auto-scaling, $0/month                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## ✅ Deployment in 5 Simple Steps

### Step 1: Create Accounts (5 min)
```bash
# 1. Vercel Account
# Go to: https://vercel.com/signup
# Sign up with GitHub (easier)

# 2. Railway Account
# Go to: https://app.railway.app/new
# Sign up with GitHub

# 3. Neon.tech Account
# Go to: https://console.neon.tech
# Sign up with GitHub
```

---

### Step 2: Configure Environment Variables (5 min)

**Generate SECRET_KEY:**
```bash
python3 << 'EOF'
from django.core.management.utils import get_random_secret_key
print(f"SECRET_KEY={get_random_secret_key()}")
EOF
```

**Save this in a secure location** (you'll need it soon)

---

### Step 3: Deploy Frontend to Vercel (10 min)

```bash
# Install Vercel CLI
npm i -g vercel

# Go to frontend directory
cd frontend

# Deploy
vercel --prod

# Follow prompts:
# Project name: synk-frontend
# Framework preset: Vite
# Build command: npm run build
# Output directory: dist

# Get public URL (e.g., synk-frontend.vercel.app)
```

**Configure Environment Variables in Vercel Dashboard:**
- Go to Project Settings > Environment Variables
- Add `VITE_API_URL`: https://your-backend-url (you'll update this after backend is deployed)
- Add `VITE_WS_URL`: wss://your-backend-url

---

### Step 4: Deploy Backend to Railway (15 min)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Go to backend directory
cd backend

# Initialize project
railway init
# Select repository when prompted

# Add PostgreSQL
railway add
# Search for "postgresql"
# Select "postgres:15-alpine"

# Create Procfile
cat > Procfile <<'EOF'
web: gunicorn synk_backend.wsgi --bind 0.0.0.0:$PORT
release: python manage.py migrate
EOF

# Set environment variables
# NOTE: Only SECRET_KEY is required. ALLOWED_HOSTS, CORS, etc. have smart defaults now.
railway variables set \
  DEBUG=False \
  SECRET_KEY=<your-generated-key>

# Deploy
railway up
```

**Get Backend URL:** https://synk-backend.railway.app (or custom domain)

---

### Step 5: Run Migrations & Create Admin (5 min)

```bash
# Run migrations
railway exec python manage.py migrate

# Create superuser
railway exec python manage.py createsuperuser
# Follow prompts to create admin account

# Collect static files
railway exec python manage.py collectstatic --noinput
```

---

## 🔄 Update Vercel with Backend URL (3 min)

Go back to Vercel Project Settings and update:
- `VITE_API_URL`: https://synk-backend.railway.app (or your actual backend URL)  
- `VITE_WS_URL`: wss://synk-backend.railway.app

**Redeploy with new env vars:**
```bash
cd frontend
vercel --prod
```

---

## ✅ Verification Checklist

```bash
# 1. Check frontend is live
curl -I https://synk-frontend.vercel.app
# Expected: HTTP/2 200

# 2. Check backend is live
curl -I https://synk-backend.railway.app/health/
# Expected: HTTP/2 200

# 3. Test API call from frontend (check browser console at synk-frontend.vercel.app)
# Or via curl:
curl -X GET https://synk-backend.railway.app/api/teams/ \
  -H "Authorization: Bearer <your-token>"

# 4. Check database is connected
railway exec python manage.py dbshell <<'EOF'
SELECT COUNT(*) FROM auth_user;
EOF
# Expected: 1 (your admin user)

# 5. Verify HTTPS and security headers
curl -I https://synk-frontend.vercel.app | grep -i "strict-transport"
# Expected: Header present
```

---

## 📊 Architecture Diagram

```
Users (Browser)
       │
       ▼
┌─────────────────────┐
│  CDN/Cache (Edge)   │ ◀─ Vercel Edge Network
└─────────────────────┘
       │
       ▼
┌──────────────────────┐
│ React SPA (HTML/JS)  │
│ vercel.app (Vercel)  │
└──────────────────────┘
       │
       │ HTTPS
       ▼
┌──────────────────────┐
│  Django Backend      │
│  railway.app (Rail)  │
└──────────────────────┘
       │
       ▼
┌──────────────────────┐
│  PostgreSQL 15       │
│  Neon.tech (Neon)    │
└──────────────────────┘
```

---

## 🔐 Security Features (All Included)

✅ HTTPS/TLS (automatic)
✅ CORS configured 
✅ CSRF protection enabled
✅ Rate limiting active
✅ Admin IP whitelisting (configure for your IP)
✅ Non-root Docker containers
✅ Secure session cookies
✅ Input validation & sanitization
✅ Environment variables secured

---

## 📱 Free Tier Limits

| Service | Limit | Solution |
|---------|-------|----------|
| Vercel | 100GB bandwidth/month | Sufficient for small apps |
| Railway | $5/month free credit | ~15,000 request/month |
| Neon | 2GB storage | Sufficient for initial data |
| Database backups | Manual | See [BACKUP_SETUP.md](./BACKUP_SETUP.md) |

All limits are sufficient for launching and testing. Upgrade only if you exceed them.

---

## 🆘 Troubleshooting

### Frontend Won't Load
```bash
# 1. Check Vercel deployment status
vercel projects

# 2. Check build logs in Vercel dashboard
# Look for: error, failed, warnings

# 3. Verify environment variables are set
# Vercel Project Settings > Environment Variables

# 4. Redeploy
vercel --prod
```

### Backend API Not Responding
```bash
# 1. Check Railway health
railway logs

# 2. Check if service is running
railway ps

# 3. Check environment variables
railway variables

# 4. Check migrations ran
railway exec python manage.py migrate --plan

# 5. Restart service
railway restart
```

### Database Connection Error
```bash
# 1. Check connection string in Railway
railway variables | grep DATABASE_URL

# 2. Test connection
railway exec python manage.py dbshell

# 3. Check database is running
# Neon dashboard > Project > Details

# 4. Recreate connection (last resort)
# Neon dashboard > Connection string (copy new one)
```

### CORS/CSP Errors
Edit `backend/synk_backend/settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "https://synk-frontend.vercel.app",
]

CSRF_TRUSTED_ORIGINS = [
    "https://synk-frontend.vercel.app",
]
```
Redeploy backend.

---

## 📞 Support Links

- **Vercel Docs:** https://vercel.com/docs
- **Railway Docs:** https://docs.railway.app
- **Neon Docs:** https://neon.tech/docs
- **Synk Docs:** This repository
  - Security: [SECURITY.md](./SECURITY.md)
  - Operations: [OPERATIONS.md](./OPERATIONS.md)
  - Incidents: [INCIDENTS.md](./INCIDENTS.md)
  - Backups: [BACKUP_SETUP.md](./BACKUP_SETUP.md)

---

## 🚀 What's Next?

After deployment:
1. Test all features thoroughly
2. Monitor logs daily ([check OPERATIONS.md](./OPERATIONS.md))
3. Setup backup procedure ([BACKUP_SETUP.md](./BACKUP_SETUP.md))
4. Add custom domain (see [CLOUD_DEPLOYMENT_ROADMAP.md](./CLOUD_DEPLOYMENT_ROADMAP.md) UC-139)
5. Configure CI/CD pipeline ([CLOUD_DEPLOYMENT_ROADMAP.md](./CLOUD_DEPLOYMENT_ROADMAP.md) UC-132)

---

**Total Time: ~40 minutes**
**Cost: $0/month**
**Uptime SLA: 99.9% (most providers)**

Ready to launch? 🚀 Follow the 5 steps above!
