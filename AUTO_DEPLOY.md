# Auto-Deploy Script for Goisure

## Instructions for Dhrumil:

### Step 1: Deploy Frontend to Vercel (5 min)

1. Open: https://vercel.com/new/git/external?repository-url=https://github.com/dhrumilmankodiya/goisure
2. Click "Continue" → Select your GitHub account
3. Configure:
   - **Framework**: Create React App
   - **Build Command**: `cd frontend && npm install --legacy-peer-deps && npm run build`
   - **Output Directory**: `frontend/build`
4. Click **Deploy**

5. After deploy, go to **Settings → Environment Variables**
   Add: `REACT_APP_BACKEND_URL` = `https://your-backend.onrender.com`

---

### Step 2: Deploy Backend to Render (5 min)

1. Open: https://dashboard.render.com/web/new
2. Connect GitHub → Select `goisure` repo
3. Configure:
   - **Name**: goisure-backend
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   - `MONGO_URL` = (your MongoDB Atlas connection string)
   - `DB_NAME` = `goisure`
   - `JWT_SECRET` = (generate: `openssl rand -base64 32`)
   - `ADMIN_EMAIL` = `admin@goisure.com`
   - `ADMIN_PASSWORD` = `YourSecurePassword123`
5. Click **Create Web Service**

---

### Step 3: Connect Frontend to Backend

1. After backend deploys, copy the URL (e.g., `https://goisure-backend.onrender.com`)
2. In Vercel frontend settings, update:
   - `REACT_APP_BACKEND_URL` = your backend URL

---

## Quick MongoDB Setup (Free)

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create free cluster
3. Get connection string: `mongodb+srv://<user>:<pass>@cluster.xxx.mongodb.net/goisure`

---

## Test the App

- Frontend URL: `https://goisure-xxx.vercel.app`
- Backend URL: `https://goisure-backend.onrender.com`

Login with: `admin@goisure.com` / `YourSecurePassword123`

---

## Need Help?

If you face issues, share the error and I'll debug!