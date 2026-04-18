# Goisure - GMC Insurance Underwriting Platform

## Phase 1 Setup

This repository contains:
- **Frontend**: React + Tailwind + Shadcn UI components
- **Backend**: FastAPI (Python) - to be integrated with legacy .NET logic

### Project Structure
```
goisure/
├── frontend/          # React application
├── backend/           # FastAPI backend (existing)
├── docs/             # Documentation
└── README.md
```

### Quick Start

**Frontend:**
```bash
cd frontend
npm install
npm start
```

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload
```

### Phase 1 Goals
1. ✅ Frontend-Backend integration working
2. ✅ Core case management flow
3. ✅ Authentication system
4. ⏳ Premium calculator integration (Phase 2)

### Tech Stack
- **Frontend**: React 19, Tailwind CSS, Shadcn UI, Recharts
- **Backend**: FastAPI, MongoDB, JWT Auth

---
*Created: April 2026*