#!/bin/bash
# Goisure Quick Deploy Script
# Run this on your local machine

echo "🚀 Goisure Deployment Script"
echo "=============================="

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "Error: npm not found. Install Node.js first."
    exit 1
fi

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "Error: git not found. Install git first."
    exit 1
fi

echo ""
echo "Step 1: Clone the repository"
echo "-----------------------------"
read -p "Press Enter to clone..."
git clone https://github.com/dhrumilmankodiya/goisure.git
cd goisure

echo ""
echo "Step 2: Deploy to Vercel (Frontend)"
echo "-------------------------------------"
echo "1. Go to: https://vercel.com/new/git/external?repository-url=https://github.com/dhrumilmankodiya/goisure"
echo "2. Import the repo"
echo "3. Set: Framework = Create React App"
echo "4. Set: Build Command = npm run build"
echo "5. Set: Output Directory = frontend/build"
echo "6. Deploy!"
echo ""
read -p "Press Enter after deploying frontend..."

echo ""
echo "Step 3: Deploy Backend to Render"
echo "---------------------------------"
echo "1. Go to: https://dashboard.render.com/web/new"
echo "2. Connect GitHub and select 'goisure' repo"
echo "3. Settings:"
echo "   - Name: goisure-backend"
echo "   - Root: backend"
echo "   - Build: pip install -r requirements.txt"
echo "   - Start: uvicorn server:app --host 0.0.0.0 --port \$PORT"
echo "4. Add env vars: MONGO_URL, DB_NAME, JWT_SECRET"
echo "5. Deploy!"
echo ""
read -p "Press Enter after deploying backend..."

echo ""
echo "Step 4: Configure Environment"
echo "-------------------------------"
echo "Copy your backend URL (e.g., https://goisure-backend.onrender.com)"
echo "Add to Vercel frontend env vars: REACT_APP_BACKEND_URL=your-backend-url"

echo ""
echo "✅ Done! Access your app at the Vercel URL."
echo "Login: admin@goisure.com / Admin@123