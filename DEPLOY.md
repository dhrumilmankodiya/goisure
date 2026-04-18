# Render/Railway Deployment Guide

## Option 1: Deploy to Render (Free)

### Backend Deployment
1. Go to [render.com](https://render.com) and sign up
2. Connect your GitHub account
3. Create a new "Web Service"
4. Select `goisure` repository
5. Configure:
   - Root directory: `backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
6. Add Environment Variables:
   - `MONGO_URL` - Your MongoDB connection string
   - `DB_NAME` - goisure
   - `JWT_SECRET` - Generate a secure random string
   - `ADMIN_EMAIL` - admin@goisure.com
   - `ADMIN_PASSWORD` - Your admin password

### Frontend Deployment
1. Go to [Vercel](https://vercel.com)
2. Import your `goisure` repository
3. Configure:
   - Framework: Create React App
   - Build Command: `npm run build`
   - Output Directory: `frontend/build`
4. Add Environment Variable:
   - `REACT_APP_BACKEND_URL` - Your backend URL (e.g., https://your-backend.onrender.com)

---

## Option 2: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Connect your GitHub repo
4. Add both frontend and backend services
5. Configure environment variables

---

## Quick Deploy (Vercel for Frontend)

Since code is pushed to GitHub:

1. **Frontend**: https://vercel.com/new/git/external?repository-url=https://github.com/dhrumilmankodiya/goisure
   - Select your GitHub account
   - Framework: Create React App
   - Build: `cd frontend && npm install && npm run build`
   - Output: `frontend/build`
   - Add `REACT_APP_BACKEND_URL` = your backend URL

2. **Backend**: Deploy to Render.com
   - Repository: https://github.com/dhrumilmankodiya/goisure
   - Root: `backend`