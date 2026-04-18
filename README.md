# Goisure - GMC Insurance Underwriting Platform

## Overview
Goisure is a modern insurance underwriting platform that combines a React frontend with a FastAPI backend for processing Group Corporate Medicare (GMC) insurance quotes.

## Tech Stack

### Frontend
- **React 19** with functional components and hooks
- **Tailwind CSS** for styling
- **Shadcn UI** for components
- **Recharts** for data visualization
- **React Router** for navigation
- **Axios** for API calls

### Backend
- **FastAPI** (Python)
- **Motor** (async MongoDB driver)
- **JWT** authentication
- **Pandas** for Excel processing

## Project Structure

```
goisure/
├── frontend/           # React application
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── pages/      # Page components
│   │   ├── contexts/   # React contexts
│   │   ├── lib/        # API and utilities
│   │   └── hooks/      # Custom hooks
│   ├── public/         # Static assets
│   └── package.json    # Dependencies
│
├── backend/            # FastAPI application
│   ├── server.py       # Main application
│   ├── requirements.txt
│   └── memory/         # Bot memory
│
└── vercel.json         # Vercel configuration
```

## Getting Started

### Frontend Setup
```bash
cd frontend
cp .env.example .env
npm install
npm start
```

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload
```

## Environment Variables

### Frontend (.env)
```
REACT_APP_BACKEND_URL=http://localhost:8000
```

### Backend (.env)
```
MONGO_URL=your_mongodb_url
DB_NAME=goisure
JWT_SECRET=your_jwt_secret
```

## Features (Phase 1)

- ✅ User Authentication (Login/Register)
- ✅ Dashboard with Statistics
- ✅ Case Management (CRUD)
- ✅ File Upload for Cases
- ✅ Case Workflow (Draft → Review → Decision)
- ✅ User Role Management (Agent, Underwriter, Admin)
- ✅ Notifications System
- ✅ Audit Logging
- ✅ Premium Calculator with 15+ factors

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Cases
- `GET /api/cases` - List cases
- `POST /api/cases` - Create case
- `GET /api/cases/{id}` - Get case
- `PUT /api/cases/{id}` - Update case
- `POST /api/cases/{id}/upload` - Upload file
- `POST /api/cases/{id}/submit` - Submit case
- `POST /api/cases/{id}/decision` - Make decision

### Calculator
- `POST /api/calculator/calculate` - Calculate premium with all factors
- `POST /api/calculator/factor` - Calculate single factor

### Dashboard
- `GET /api/dashboard/stats` - Get statistics
- `GET /api/dashboard/recent-activity` - Get activity

## License
MIT

---
*Created: April 2026*