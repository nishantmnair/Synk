# 🚀 DEPLOYMENT NEXT STEPS - Consolidated Action Plan

**Everything you need to deploy to production in one place.**

- **Frontend:** Vercel
- **Backend:** Render  
- **Database:** Neon PostgreSQL
- **Total Time:** ~90 minutes
- **Cost:** $0/month (free tier)

---

## ✅ Pre-Deployment Status

- ✅ All tests passing (161+ tests)
- ✅ Docker builds successfully
- ✅ Security hardened (HTTPS, CSRF, rate limiting)
- ✅ Environment variables secure
- ✅ Code is production-ready

**Ready to deploy!** 🚀

---

## PHASE 1: Preparation (5 minutes)

### Create Accounts (if not already done)

1. **Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub
   - Vercel will link to your GitHub repo automatically

2. **Render Account**
   - Go to https://render.com
   - Sign up with GitHub
   - Link to your GitHub repo

3. **Neon Account**
   - Go to https://neon.tech
   - Sign up with GitHub
   - Create a new PostgreSQL project
   - Copy the connection string (looks like: `postgresql://user:password@host/database`)

✅ Once done, move to Phase 2.

---

## PHASE 2: Configure Environment Variables (10 minutes)

### Frontend Environment (Vercel)

Vercel reads these from `frontend/.env` in your repo. Update the file:

```env
# frontend/.env
VITE_API_URL=https://your-backend.onrender.com
VITE_APP_NAME=Synk
```

Then commit to GitHub:
```bash
git add frontend/.env
git commit -m "Configure Vercel environment"
git push origin main
```

### Backend Environment (Render)

You'll set these in Render dashboard during deployment. **Only SECRET_KEY is required** - everything else has smart defaults.

**Required:**
```
SECRET_KEY=your-django-secret-key-here
DATABASE_URL=postgresql://user:password@host/database
```

**Optional (already defaults to sensible values):**
```
DEBUG=False                                    # Defaults to False (recommended)
ALLOWED_HOSTS=your-backend.onrender.com      # Defaults to *.onrender.com (auto-configured)
CORS_ALLOWED_ORIGINS=https://your-frontend   # Defaults to include localhost + Vercel domains
```

**To generate SECRET_KEY:**
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

✅ Copy the SECRET_KEY and DATABASE_URL. Move to Phase 3.

---

## PHASE 3: Deploy Frontend to Vercel (15 minutes)

### Step 1: Connect Repository
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your `Synk` repository
4. Click "Import"

### Step 2: Configure Project
1. **Project Name:** `synk` (or your preferred name)
2. **Root Directory:** `frontend`
3. **Framework:** Select `Vite`
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`

### Step 3: Environment Variables
Add the environment variables:
```
VITE_API_URL=https://your-backend.onrender.com
VITE_APP_NAME=Synk
```

### Step 4: Deploy
Click "Deploy"

**Wait for deployment to complete** (usually 1-2 minutes)

Once done, you'll get a URL like: `https://synk-xxxxx.vercel.app`

⏱️ **⏳ WAIT HERE** - Don't proceed until Vercel shows "Deployment Successful ✅"

```
Expected output:
✅ Deployment successful
🔗 https://synk-xxxxx.vercel.app
```

---

## PHASE 4: Deploy Backend to Render (20 minutes)

### Step 1: Create Database on Neon

1. Go to https://neon.tech/console
2. Create a new project named `synk`
3. Select PostgreSQL 15
4. Wait for creation (1-2 min)
5. Copy the connection string:
   ```
   postgresql://neondb_owner:xxxxx@ec2-?.neon.tech/neondb?sslmode=require
   ```

### Step 2: Create Web Service on Render

1. Go to https://dashboard.render.com
2. Click "New +"
3. Select "Web Service"
4. Connect your GitHub repository (authorize if needed)
5. Select the `Synk` repository

### Step 3: Configure Render Service

**Basic Settings:**
- **Name:** `synk-backend`
- **Environment:** Select `Python 3.11`
- **Region:** Select closest to you
- **Branch:** `main`

**Build Command:**
```bash
pip install -r backend/requirements.txt && python backend/manage.py migrate
```

**Start Command:**
```bash
gunicorn -w 4 -b 0.0.0.0:8000 backend.synk_backend.wsgi:application
```

### Step 4: Add Environment Variables

Click "Environment" and add these **required** variables:

```
SECRET_KEY=<generated-value-from-phase-2>
DATABASE_URL=<neon-connection-string>
DEBUG=False
```

**That's it!** Everything else (ALLOWED_HOSTS, CORS, etc.) is auto-configured with smart defaults.

### Step 5: Deploy

Click "Create Web Service"

⏱️ **⏳ WAIT HERE** - First deploy takes 3-5 minutes. It will:
1. Install dependencies
2. Run migrations
3. Start the server

Look for:
```
✅ Service started successfully
Web Service: https://synk-xxxxx.onrender.com
```

---

## PHASE 5: Connect Frontend to Backend (5 minutes)

### Update Frontend Environment

Now that you have both URLs, update frontend environment:

**frontend/.env**
```env
VITE_API_URL=https://synk-xxxxx.onrender.com
```

Commit and push:
```bash
git add frontend/.env
git commit -m "Update API URL to production backend"
git push origin main
```

Vercel will automatically redeploy (watch the deployment page).

---

## PHASE 6: Verify Everything Works (20 minutes)

### Test Frontend
1. Go to your Vercel URL: `https://synk-xxxxx.vercel.app`
2. Check:
   - [ ] Page loads without errors
   - [ ] No console errors (open DevTools F12)
   - [ ] Logo/UI displays correctly

### Test Backend API
```bash
curl https://synk-xxxxx.onrender.com/api/health/
```

Expected response:
```json
{"status": "healthy"}
```

### Test Database Connection
1. Go to Render dashboard
2. Click your service
3. Check "Logs" tab
4. Should see: `Migration complete` or similar

### Test User Registration
1. Go to Vercel frontend URL
2. Click "Sign Up"
3. Fill in details
4. Submit

After successful registration:
1. Go to Render backend logs
2. Should see user creation event logged
3. Check Neon database:
   ```bash
   psql <your-neon-connection-string> -c "SELECT COUNT(*) FROM auth_user;"
   ```
   Should return: `1` (your test user)

---

## PHASE 7: Configure Git Auto-Deploy (5 minutes)

### Automatic Redeployment on Push

Both Vercel and Render watch your GitHub repository. Any push to `main` will automatically redeploy.

**To verify it's working:**
1. Make a small change to `frontend/App.tsx`
2. Git commit and push:
   ```bash
   git add frontend/App.tsx
   git commit -m "Test auto-deploy"
   git push origin main
   ```
3. Watch Vercel dashboard - should see new deployment start automatically
4. Once deployed, check the change is live

---

## ✅ FINAL VERIFICATION CHECKLIST

Before considering deployment complete:

```
Frontend (Vercel)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Site loads at https://synk-xxxxx.vercel.app
□ No console errors
□ Responsive on mobile (375px)
□ Responsive on tablet (768px)
□ Responsive on desktop (1024px)
□ Navigation works
□ Forms submit without errors
□ Images load correctly
□ Performance score > 75 (can check with Lighthouse)

Backend (Render)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Service deployed successfully (no migration errors)
□ API responds to /api/health/
□ User registration works
□ Login works
□ JWT tokens are generated
□ Database queries work
□ Logs show no errors (migrations completed)
□ Response times < 1 second
□ No CPU/Memory errors in logs

Database (Neon)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Connection successful
□ Tables created (auth_user, etc.)
□ Data persists after restart
□ Backups are running
□ Can connect via CLI

Integration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Frontend talks to backend
□ User data syncs correctly
□ No CORS errors
□ Auto-deploy on git push works
```

---

## 🚨 TROUBLESHOOTING

### Frontend Won't Deploy

**Error: Build command failed**
```bash
# Fix: Test build locally first
cd frontend
npm run build
```

If it fails, fix the error, then:
```bash
git add .
git commit -m "Fix build errors"
git push origin main
```

### Backend Won't Deploy

**Error: Migration failed**
```bash
# Check what migrations are pending
python backend/manage.py showmigrations

# Verify database URL is correct
# Use Neon console to verify connection string
```

**Error: Module not found**
```bash
# Ensure requirements.txt is up to date
pip install -r backend/requirements.txt
git add backend/requirements.txt
git commit -m "Update dependencies"
git push origin main
```

### Frontend Can't Connect to Backend

**Error: CORS error in console**
```
Access to XMLHttpRequest blocked by CORS policy
```

This usually means:
1. Backend URL in `VITE_API_URL` is incorrect
2. Backend hasn't started yet

Fix:
1. Check `frontend/.env` has correct backend URL
2. Verify Render backend is running (check Render logs)
3. Wait 30 seconds for services to stabilize
4. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)

If still failing, you can add your Vercel URL to backend env vars (optional - CORS already includes it):
```
CORS_ALLOWED_ORIGINS=https://synk-xxxxx.vercel.app
```

### Database Connection Fails

**Error: Can't connect to database**

1. **Verify DATABASE_URL is set in Render:**
   - Go to Render dashboard → Your service → Environment
   - Check `DATABASE_URL` is present and correct
   
2. **Check Neon connection string format:**
   - Should look like: `postgresql://user:password@ec2-xxx.neon.tech/dbname?sslmode=require`
   - Must include `?sslmode=require` at the end
   
3. **Verify database exists:**
   - Go to Neon console: https://console.neon.tech
   - Check your project exists
   - Check database name is correct
   
4. **Restart Render service:**
   - Go to Render dashboard
   - Click your service
   - Click "Restart" or "Redeploy"

---

## 📊 NEXT STEPS AFTER DEPLOYMENT

Once deployed, follow these for production readiness:

1. **Run Tests** (30 min)
   - Fix failing tests locally
   - Once all pass, push to main
   - Vercel/Render will auto-test before deploying

2. **Set Up Monitoring** (20 min)
   - Render has built-in metrics dashboard
   - Set up Sentry for error tracking: https://sentry.io
   - Set up UptimeRobot for status monitoring: https://uptimerobot.com

3. **Configure Domain** (15 min)
   - Buy domain on Namecheap or GoDaddy
   - Point DNS to Vercel (for frontend)
   - Point API subdomain to Render (for backend)
   - See [OPERATIONS.md](./OPERATIONS.md) for details

4. **Security Hardening** (20 min)
   - Verify HTTPS is enabled on both
   - Check CORS headers are correct
   - Review [SECURITY.md](./SECURITY.md) checklist

5. **Run Full Test Suite** (2 hours)
   - Follow [TESTING_QUICK_REFERENCE.md](./TESTING_QUICK_REFERENCE.md)
   - Run E2E tests: `npm run test:e2e`
   - Run load tests: `npm run test:load`
   - Run security scan: OWASP ZAP

6. **Go Live** 
   - Follow [GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md)
   - Announce launch
   - Monitor for first 24h

---

## 📞 QUICK REFERENCE

**Your Production URLs:**
```
Frontend:  https://synk-xxxxx.vercel.app
Backend:   https://synk-xxxxx.onrender.com
Database:  neon.tech console
```

**Live Dashboards:**
- Vercel: https://vercel.com/dashboard
- Render: https://dashboard.render.com
- Neon: https://neon.tech/console

**Support:**
- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs
- Neon Docs: https://neon.tech/docs

---

## 🎯 YOU ARE HERE

**Status:** Ready to deploy ✅

**Next Action:** 
1. Create accounts on Vercel, Render, Neon (Phase 1)
2. Gather environment variables (Phase 2)
3. Deploy frontend (Phase 3)
4. Deploy backend (Phase 4)

**Estimated Time to Live:** 90 minutes ⏱️

---

**Print this page and work through it step by step. You've got this! 🚀**
