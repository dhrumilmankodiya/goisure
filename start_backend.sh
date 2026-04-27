#!/bin/bash
# Goisure Backend Startup Script
# Always use local MongoDB
export MONGO_URL="mongodb://127.0.0.1:27017/"
export DB_NAME="goisure"

cd /home/ubuntu/goisure/api
exec /home/ubuntu/.hermes/hermes-agent/venv/bin/python3 -m uvicorn index:app --host 0.0.0.0 --port 8000 --workers 2