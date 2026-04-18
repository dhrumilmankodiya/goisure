# 🚀 Goisure - One-Click Deploy

## Ready to Deploy Right Now!

### Option A: Vercel (Frontend) + Render (Backend)

**Frontend → Vercel:**
1. Click: https://vercel.com/new/git/external?repository-url=https://github.com/dhrumilmankodiya/goisure
2. Click "Continue"
3. Settings:
   - Framework: Create React App
   - Build Command: `npm run build`
   - Output Directory: `frontend/build`
4. Click **Deploy** 🚀
5. After deploy → Settings → Environment Variables → Add:
   - `REACT_APP_BACKEND_URL` = (your backend URL after Step 2)

**Backend → Render:**
1. Click: https://dashboard.render.com/web/new
2. Connect GitHub → Select `goisure` repo
3. Settings:
   - Name: `goisure-backend`
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
4. Environment Variables:
   - `MONGO_URL` = `mongodb+srv://demo:demo@cluster0.mongodb.net/goisure`
   - `DB_NAME` = `goisure`
   - `JWT_SECRET` = `goisure-secret-key-2024`
   - `ADMIN_EMAIL` = `admin@goisure.com`
   - `ADMIN_PASSWORD` = `Admin@123`
5. Click **Create Web Service** 🚀

---

## What's Deployed:

✅ **Frontend**: React 19 + Tailwind + Shadcn UI
   - Login/Register pages
   - Dashboard with stats
   - Case Management (CRUD)
   - Premium Calculator with 15+ factors

✅ **Backend**: FastAPI
   - JWT Authentication
   - Case workflow APIs
   - Premium Calculator endpoints
   - MongoDB integration

---

## Test Credentials:
- **Email**: admin@goisure.com
- **Password**: Admin@123

---

## Questions?
Just let me know if you hit any issues!