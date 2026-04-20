"""
Vercel Python Serverless Function Handler
Wraps the FastAPI backend app and handles ASGI for Vercel.
"""
import os
import sys

# Ensure backend is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Load env vars BEFORE importing server (server.py accesses os.environ at module level)
# This prevents 500 crashes when env vars are missing during cold start
from dotenv import load_dotenv
load_dotenv()

# Now safe to import - missing env vars won't crash at module load
# The app will return a 503/500 when env vars are truly needed
from backend.server import app

# Wrap with Mangum for Vercel AWS Lambda compatibility
try:
    from mangum import Mangum
    handler = Mangum(app, lifespan="off")
except ImportError:
    # mangum not available - this shouldn't happen in Vercel but helps local dev
    handler = None

def handler(event, context):
    """
    Vercel Python Function handler entry point.
    Proxies requests to the FastAPI app.
    """
    if handler is not None:
        return handler(event, context)
    
    # Fallback if mangum is missing
    return {
        "statusCode": 503,
        "body": "Mangum library not available",
        "headers": {"Content-Type": "application/json"}
    }
