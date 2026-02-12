# 🚀 Detailed Deployment Tutorials

Complete step-by-step guides for deploying Synk to Vercel, Render, and Neon.

---

## 📑 Table of Contents

1. [Neon PostgreSQL Setup](#neon-postgresql-setup)
2. [Render Backend Deployment](#render-backend-deployment)
3. [Vercel Frontend Deployment](#vercel-frontend-deployment)
4. [Verification & Testing](#verification--testing)
5. [Troubleshooting](#troubleshooting)

---

## Neon PostgreSQL Setup

**What is Neon?** A PostgreSQL database hosting service. Perfect for production databases with free tier support.

### Step 1: Create Neon Account

1. Go to https://neon.tech
2. Click **"Sign up"** button (top right)
3. **Choose sign-up method:**
   - GitHub (easiest - click "Continue with GitHub")
   - Email
4. Fill in any required information
5. Verify email if needed

### Step 2: Create PostgreSQL Project

1. After login, you'll see the Neon Console
2. Click **"Create project"** button (usually top right)
3. Fill in project details:
   - **Name:** `synk` (or any project name)
   - **Database name:** `synk_db` (default is fine)
   - **Region:** Choose closest to you (e.g., us-east-1 for USA)
4. Click **"Create project"**
5. Wait 30 seconds for database to be created

### Step 3: Get Connection String

1. Project is created - you'll see a green checkmark
2. Click on the project name to open it
3. You'll see **"Connection string"** section
4. There are two important pieces:

   **Option A: Full Connection URL (easiest)**
   - Look for connection string that starts with `postgresql://`
   - It looks like: `postgresql://user:password@host/database`
   - **Copy this entire string** - you'll need it for Render

   **Option B: Individual Connection Details (if needed)**
   - **Host:** `your-host.neon.tech`
   - **Database:** `synk_db` (or whatever you named it)
   - **User:** `owner` (or username shown)
   - **Password:** Click the eye icon to reveal
   - **Port:** `5432`

### Step 4: Save Connection Details

Create a text file with these details:
```
NEON_CONNECTION_URL=postgresql://user:password@your-host.neon.tech/synk_db
NEON_HOST=your-host.neon.tech
NEON_DATABASE=synk_db
NEON_USER=owner
NEON_PASSWORD=your-password
```

**Keep this file safe!** You'll need it soon.

### ✅ Neon Setup Complete!

You now have a production PostgreSQL database ready. Move to [Render Backend Deployment](#render-backend-deployment).

---

## Render Backend Deployment

**What is Render?** A cloud platform that runs your Django backend server. Perfect for deploying Python applications.

### Step 1: Create Render Account

1. Go to https://render.com
2. Click **"Get Started"** button
3. **Sign up with GitHub:**
   - Click "Continue with GitHub"
   - Click "Authorize render"
   - GitHub will ask for permissions - click "Authorize"
4. Complete any profile setup

### Step 2: Connect GitHub Repository

1. After login, you'll see Render dashboard
2. Click **"New +"** button (top right) → select **"Web Service"**
3. You'll see "Connect a repository" section
4. Click **"Connect account"** next to GitHub
5. Select your GitHub account
6. **Authorize Render** to access your repositories
7. You'll see list of your repos
8. Find and click **"Synk"** repository
9. Click **"Connect"** button

### Step 3: Configure Web Service

After connecting, fill in the settings:

```
Name: synk-backend
Environment: Python 3
Region: Oregon (us-west-1) - or closest to you
Branch: main
```

**Build Command:**
```
pip install -r requirements.txt
```

**Start Command:**
```
daphne -b 0.0.0.0 -p 10000 synk_backend.asgi:application 2>&1
```

(Note: Render uses dynamic port, so we use $PORT in next step, but 10000 is what it uses)

### Step 4: Add Environment Variables

This is the most important part! These tell your app how to connect to the database.

1. Scroll down to **"Environment"** section
2. Click **"Add Environment Variable"**
3. Add each variable (click + to add more):

```
DEBUG=False
SECRET_KEY=<your-generated-secret-key>
ALLOWED_HOSTS=<your-render-url>,yourdomain.com
DATABASE_URL=<your-neon-connection-url>
REDIS_URL=redis://default:your-password@redis-host:6379
GEMINI_API_KEY=<optional-your-gemini-key>
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://your-vercel-url.vercel.app
```

**Where to get each:**

- **DEBUG:** Enter `False` (not True - that's for dev only)
- **SECRET_KEY:** Generate one:
  ```bash
  python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
  ```
- **ALLOWED_HOSTS:** Your production domain(s). Example: `synk.yourdomain.com,www.yourdomain.com`
- **DATABASE_URL:** The Neon connection string from previous step
- **REDIS_URL:** Set to `redis://default:eyfkaXNudC1yZWRpcw==@redis-18-redis-instance.render.com:10750` (or Render's Redis if you add it)
- **GEMINI_API_KEY:** Optional - only if you use Plan Date AI
- **CORS_ALLOWED_ORIGINS:** Your frontend URL

### Step 5: Add PostgreSQL Database

You have two options:

**Option A: Use Neon (Recommended)**
- Keep the DATABASE_URL you already added
- Skip this step - just use the Neon database

**Option B: Add Render PostgreSQL**
- Click **"New +"** → **"PostgreSQL"**
- Set name: `synk-db`
- Keep defaults
- It will auto-populate DATABASE_URL env var

### Step 6: Deploy Backend

1. Scroll to top of page
2. Click **"Create Web Service"** button
3. Render will start building:
   - Installing dependencies
   - Building Docker image
   - Starting service
4. Watch the logs - takes 2-3 minutes
5. When you see ✅ **"Service is live"**, deployment is complete!
6. You'll get a URL like: `https://synk-backend.onrender.com`

### Step 7: Verify Backend is Running

1. Copy your backend URL
2. Open in browser: `https://synk-backend.onrender.com/health/`
3. Should see JSON response with status
4. If you see "Hello from health endpoint", backend is working!

### ✅ Render Backend Complete!

Your Django backend is now running! Next: [Vercel Frontend Deployment](#vercel-frontend-deployment)

---

## Vercel Frontend Deployment

**What is Vercel?** A platform optimized for deploying frontend apps. Super fast, comes with CDN, auto-deploys on git push.

### Step 1: Create Vercel Account

1. Go to https://vercel.com
2. Click **"Sign Up"** button
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access GitHub
5. You might see project import - close for now

### Step 2: Import GitHub Repository

1. After login, you'll see Vercel dashboard
2. Click **"Add New..."** button (top) → **"Project"**
3. You'll see "Import Git Repository" section
4. Your GitHub account should be connected
5. **Find Synk repository:**
   - Search for "Synk" in search box
   - Or scroll to find it
6. Click **"Import"** button next to Synk

### Step 3: Configure Project Settings

After importing, Vercel shows configuration page:

```
Project Name: synk (or your preferred name)
Framework Preset: Vite
Root Directory: ./frontend
```

The framework should auto-detect as Vite. If not, click dropdown and select Vite.

### Step 4: Add Environment Variables

This is crucial! Your frontend needs to know where the backend is.

1. Scroll down to **"Environment Variables"** section
2. Add these variables:

```
VITE_API_URL=https://synk-backend.onrender.com
VITE_WS_URL=wss://synk-backend.onrender.com
```

Replace `synk-backend.onrender.com` with your actual Render URL.

- **VITE_API_URL:** Where your React app sends API requests
- **VITE_WS_URL:** Where WebSocket connections go (for real-time features)

### Step 5: Deploy Frontend

1. Click **"Deploy"** button
2. Vercel starts building:
   - Installing npm dependencies
   - Running `npm run build`
   - Uploading to CDN
3. Takes 1-2 minutes
4. When complete, you'll see ✅ **"Congratulations"** message
5. You get a URL like: `https://synk.vercel.app`

### Step 6: Verify Frontend is Deployed

1. Copy your Vercel URL
2. Open in browser: `https://synk.vercel.app`
3. You should see the Synk login page
4. The UI should load with styling
5. If you see login page with proper styling, frontend is working!

### Step 7: Configure Auto-Deploy

Great news! Vercel auto-deploys on every git push:

1. Every time you push to main branch
2. Vercel automatically rebuilds and deploys
3. New version goes live in 1-2 minutes
4. No need to manually deploy again

To test:
1. Make a small change to code
2. Push to GitHub: `git push`
3. Watch Vercel dashboard - it auto-deploys!

### ✅ Vercel Frontend Complete!

Your React app is now live! 

---

## Verification & Testing

### Test Full Application

1. **Open Frontend:**
   - Go to your Vercel URL
   - Should see login page
   - Try typing - should be responsive

2. **Test Login:**
   - Username: `testuser`
   - Password: `testpass123`
   - Click login
   - Should redirect to dashboard

3. **Test API Connection:**
   - Open browser DevTools (F12 → Network tab)
   - Click a button or navigate
   - You should see API requests going to your Render backend
   - Requests should come back with 200 status

4. **Test Real-time Features:**
   - If WebSocket indicator shows ✅ connected, it's working
   - Any real-time updates should appear immediately

### Check Backend Logs (in Render)

1. Go to Render dashboard
2. Click your synk-backend service
3. Click **"Logs"** tab
4. Should see requests coming in from frontend
5. Watch for any errors in red

### Check Database (in Neon)

1. Go to Neon dashboard
2. Click your project
3. Click **"SQL Editor"** tab
4. Run query: `SELECT * FROM api_user;`
5. Should show your test user exists
6. This confirms database is connected!

---

## Troubleshooting

### Frontend shows blank page or errors

**Problem:** Frontend loads but shows errors

**Solutions:**
```
1. Check Vercel environment variables:
   - Go to Vercel dashboard
   - Click project settings
   - Check VITE_API_URL points to correct Render URL
   
2. Clear browser cache:
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or open in incognito/private window
   
3. Check Vercel logs:
   - Click "Deployments" tab in Vercel
   - Click latest deployment
   - Click "Logs" - look for build errors
```

### Backend returns 502 or timeout

**Problem:** Backend URL responds with 502 error

**Solutions:**
```
1. Check Render service is running:
   - Go to Render dashboard
   - Look for green "Live" indicator
   - If red/yellow, service is down - restart it
   
2. Check environment variables:
   - Go to Render service settings
   - Verify DATABASE_URL is correct
   - Run migrations: see next section
   
3. View Render logs:
   - Click service in Render
   - Click "Logs" tab
   - Look for error messages
```

### Database connection errors

**Problem:** Backend can't connect to Neon database

**Solutions:**
```
1. Verify DATABASE_URL:
   - Get fresh connection string from Neon
   - Copy entire URL
   - Paste into Render environment variable
   
2. Check IP whitelist:
   - Neon allows all IPs by default
   - If blocked, go to Neon project settings
   - Check firewall rules
   
3. Restart Render service:
   - Go to Render service
   - Click "Restart service" button
   - Wait for restart to complete
```

### Login doesn't work

**Problem:** Can log in but get wrong credential error

**Solutions:**
```
1. Create test user again:
   - In Render, click "Shell" tab
   - Run: python manage.py create_test_user
   - Try login again
   
2. Run migrations:
   - Click "Shell" tab
   - Run: python manage.py migrate
   - This fixes database schema issues
```

### Real-time features not working (WebSocket)

**Problem:** Activities don't update in real-time

**Solutions:**
```
1. Check VITE_WS_URL is set correctly:
   - Should use wss:// (not ws://)
   - Should point to your Render backend
   - Example: wss://synk-backend.onrender.com
   
2. Check Redis connection in backend logs:
   - Look for "Redis connected" message
   - If not there, Redis might be down
   
3. Restart backend:
   - Go to Render service
   - Click "Restart service"
```

### "Service Suspended" on Render

**Problem:** Backend service shows as suspended

**Solutions:**
```
1. Render free tier limitations:
   - Services go to sleep after 15 mins of inactivity
   - First request takes longer (30-60 secs)
   - This is normal!
   
2. To keep service always running:
   - Upgrade to paid tier ($7/month)
   - Or use another provider that doesn't sleep
```

### Still having issues?

**Debug checklist:**

```
☐ Frontend loads (even if with errors)
☐ Backend responds to requests  
☐ Can login (testuser/testpass123)
☐ API requests show in DevTools Network tab
☐ Backend logs don't show errors
☐ Database has data (checked SQL query)
☐ Environment variables are all set
```

If still stuck:
1. Check exact error message
2. Search the error on Google
3. Check platform documentation (Vercel, Render, Neon)
4. Ask in deployment forums

---

## Production Checklist

Before going live with real users:

- [ ] Update ALLOWED_HOSTS with your real domain
- [ ] Set up SSL certificate (Vercel/Render do this automatically)
- [ ] Backup database regularly (Neon provides backups)
- [ ] Monitor logs for errors
- [ ] Set up error tracking (Sentry.io - optional)
- [ ] Test all features thoroughly
- [ ] Set strong SECRET_KEY (don't reuse)
- [ ] Enable HTTPS everywhere
- [ ] Test on mobile devices
- [ ] Verify performance is acceptable

---

## Auto-Deployment Setup

### On Every Git Push, Your App Updates

Vercel and Render watch your GitHub repo:

1. You push to main: `git push origin main`
2. GitHub notifies Vercel/Render
3. They automatically rebuild and deploy
4. New version is live in 1-2 minutes

**To test auto-deploy:**
```bash
# Make a small change
echo "# Test" >> README.md

# Push to GitHub
git add README.md
git commit -m "test: auto deploy"
git push origin main

# Watch Vercel/Render dashboard - it auto-deploys!
```

---

## Cost Summary (Free Tier)

| Service | Free Tier | Cost |
|---------|-----------|------|
| **Vercel** | Unlimited deployments | $0/month* |
| **Render** | 750 service hours/month | $0/month* |
| **Neon** | 5GB database | $0/month* |

*Render free tier service sleeps after 15 min inactivity (normal). Upgrade to paid for always-on.

---

## Next Steps

1. ✅ Create Neon database
2. ✅ Deploy backend to Render
3. ✅ Deploy frontend to Vercel
4. ✅ Test everything works
5. 📧 Consider setting up email alerts for errors (Render settings)
6. 📊 Monitor performance on dashboards
7. 🚀 Share your app with users!

---

**Congratulations! Your app is now live on the internet!** 🎉

Any questions? Check the troubleshooting section above or reach out to the platform support:
- Vercel: https://vercel.com/support
- Render: https://render.com/support
- Neon: https://neon.tech/support
