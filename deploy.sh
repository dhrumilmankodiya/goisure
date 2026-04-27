#!/bin/bash
# Goisure Backend Deployment Script
# Usage: chmod +x deploy.sh && ./deploy.sh

set -e

echo "=== Goisure Backend Deployment ==="

# Start MongoDB
echo "[1/4] Starting MongoDB..."
sudo service mongodb start || sudo systemctl start mongodb || echo "MongoDB may already be running"

# Update systemd service (uses local MongoDB + CORS fix)
echo "[2/4] Installing systemd service..."
sudo cp deploy/goisure-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl restart goisure-api

# Verify
echo "[3/4] Verifying health..."
sleep 3
curl -s http://localhost:8000/api/health && echo ""

echo "[4/4] Done! Backend running on port 8000"