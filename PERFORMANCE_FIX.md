# Performance Fix: App Load Time Optimization

## Issues Identified

Your app was loading slowly (29.99 seconds) due to multiple performance bottlenecks:

### 1. **Token Verification on Every Request** (FIXED ✅)
- **Problem:** The `getAccessToken()` function was calling `/api/users/` to verify token validity on every single API request
- **Impact:** With 8+ parallel API calls at app startup, this created 40+ total requests, many timing out
- **Solution:** Decode JWT tokens locally to check expiration instead of making API calls

### 2. **CORS Configuration Missing Production Domain** (FIXED ✅)
- **Problem:** `synk-main.vercel.app` wasn't in the backend's `CORS_ALLOWED_ORIGINS`
- **Impact:** CORS preflight failures causing requests to fail or timeout
- **Solution:** Added Vercel production domains to the backend CORS config

### 3. **Frontend Not Configured for Production Backend** (FIXED ✅)
- **Problem:** Frontend defaulted to `http://localhost:8000` without `VITE_API_URL` environment variable
- **Impact:** Frontend couldn't reach the backend on Vercel
- **Solution:** Created `.env.production` and `vercel.json` configuration files

### 4. **Concurrent Token Refresh Cascade** (FIXED ✅)
- **Problem:** Multiple failed requests could trigger multiple concurrent refresh attempts
- **Impact:** Thundering herd problem causing additional delays
- **Solution:** Added promise-based deduplication for concurrent refresh attempts

## Changes Made

### Backend (`backend/synk_backend/settings.py`)
```python
# Added production Vercel domains to CORS_ALLOWED_ORIGINS
_default_cors_origins = [
    # ... existing dev origins ...
    "https://synk-main.vercel.app",
    "https://synk.vercel.app",
]
```

### Frontend Auth Service (`frontend/services/djangoAuth.ts`)
1. Added JWT token expiration checking without API calls
2. Removed the `/api/users/` verification call
3. Added concurrent refresh attempt prevention
4. Added proper error handling for token refresh

### Frontend Environment (`frontend/.env.production`)
```
VITE_API_URL=https://synk-qa88.onrender.com
```

### Vercel Configuration (`vercel.json`)
```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist",
  "env": {
    "VITE_API_URL": "@vite_api_url"
  }
}
```

## Deployment Instructions

### Step 1: Deploy Backend Changes
```bash
cd backend
git add synk_backend/settings.py
git commit -m "feat: add Vercel frontend domains to CORS_ALLOWED_ORIGINS"
git push
```

The backend will automatically redeploy on Render.

### Step 2: Configure Vercel Environment Variables
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `synk-main` project
3. Go to Settings → Environment Variables
4. Add or update:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://synk-qa88.onrender.com`
   - **Environments:** Production, Preview, Development

### Step 3: Deploy Frontend Changes
```bash
cd frontend
git add .env.production services/djangoAuth.ts
git commit -m "perf: optimize token verification and add production backend URL"
git push
```

Vercel will automatically trigger a deployment.

### Step 4: Clear Browser Cache
After deployment, clear your browser's cache or do a hard refresh (Ctrl+Shift+R on Windows/Linux, Cmd+Shift+R on Mac) to ensure you get the new version.

## Expected Performance Improvements

### Before
- App load time: **29.99 seconds**
- 68 requests triggered (40+ duplicates for token verification)
- Multiple 401 errors with 3-second timeouts
- Network transfer: 52.8 kB / 1,576 kB

### After
- App load time: **~3-5 seconds** (estimated)
- 8-10 requests (only actual API calls)
- No token verification timeouts
- Network transfer: ~50-100 kB

## Technical Details

### JWT Token Expiration Check
The fixed code now:
1. Decodes JWT locally to extract the `exp` claim
2. Checks if token expires within 30 seconds
3. Only calls refresh endpoint if token is actually expired
4. No extra API calls for verification

### Token Refresh Deduplication
If multiple requests get 401s simultaneously:
1. First request triggers refresh
2. Other requests wait for the same refresh to complete
3. Prevents N requests from causing N refresh attempts
4. All requests reuse the single refresh result

## Troubleshooting

### If app still loads slowly:
1. **Check VITE_API_URL is set:** Open browser DevTools → Network tab → look for API calls
   - Should go to `https://synk-qa88.onrender.com/api/...`
   - NOT to `http://localhost:8000/api/...`

2. **Verify CORS is working:**
   - Open DevTools → Network tab
   - Look for 401 errors → check headers for `Access-Control-Allow-Origin`
   - Should include `https://synk-main.vercel.app`

3. **Check backend is responsive:**
   ```bash
   curl -I https://synk-qa88.onrender.com/api/token/
   ```
   Should return 200/400, not timeout

4. **Monitor token refresh:**
   - Open browser DevTools → Console
   - Look for console messages from token operations
   - Should NOT see repeated `/api/users/` calls

### If you get 401 errors after deployment:
1. Clear browser cache: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. Clear localStorage:
   ```javascript
   localStorage.clear()
   ```
3. Log out and log back in

## Additional Recommendations

### 1. Add Response Caching
To further reduce requests, add HTTP caching headers in the backend:
```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 100,
}
```

### 2. Implement Data Prefetching
Load only essential data on initial page load, lazy-load other data:
```typescript
// Example: Load tasks and milestones immediately, postpone suggestions
const [tasksData, milestonesData] = await Promise.all([
  tasksApi.getAll(),
  milestonesApi.getAll(),
]);
// Load remaining data later
setTimeout(async () => {
  const suggestions = await suggestionsApi.getAll();
  setSuggestions(suggestions);
}, 2000);
```

### 3. Enable Compression
Add gzip compression in the backend:
```python
# settings.py - add middleware
MIDDLEWARE = [
    'django.middleware.gzip.GZipMiddleware',
    # ... rest of middleware
]
```

### 4. Use CDN
Consider using Cloudflare's CDN to cache static assets and reduce latency to your backend.

## Monitoring

After deployment, monitor these metrics:
1. **App Load Time:** How long until page is interactive
2. **Time to First Byte (TTFB):** How long until first API response
3. **Network requests:** Should be ~8-10 for initial load (down from 68)
4. **API response times:** Should be 200-500ms (down from 3+ seconds)

Track these in:
- Browser DevTools → Network tab
- Vercel Analytics (if enabled)
- Render dashboard for backend metrics
