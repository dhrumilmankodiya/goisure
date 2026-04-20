"""
Vercel Python Serverless Function - GMC Platform API
"""
import os
import sys
from pathlib import Path

_backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(_backend_path))
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from bson import ObjectId
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_client = None
_db = None

def get_db():
    global _client, _db
    if _db is None:
        mongo_url = os.environ.get("MONGO_URL", "")
        db_name = os.environ.get("DB_NAME", "goisure")
        if not mongo_url:
            logger.warning("MONGO_URL not set")
            return None
        _client = AsyncIOMotorClient(mongo_url)
        _db = _client[db_name]
    return _db

JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ.get("JWT_SECRET", "fallback-secret")

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=60), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "agent"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class CaseCreate(BaseModel):
    client_name: str
    policy_type: str = "GMC"
    notes: Optional[str] = None

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        db = get_db()
        if db is None:
            raise HTTPException(status_code=503, detail="Database not configured")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["id"] = str(user["_id"])
        user.pop("_id", None)
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

app = FastAPI(title="GMC Platform API")
api_router = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.netlify\.app|https://.*\.trycloudflare\.com|http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@api_router.get("/health")
async def health():
    db = get_db()
    return {"status": "healthy", "service": "gmc-platform", "db": "connected" if db is not None else "not_configured"}

@api_router.post("/auth/register")
async def register(data: UserCreate, response: Response):
    db = get_db()
    if db is None:
        return JSONResponse({"error": "Database not configured"}, status_code=503)
    email = data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_doc = {
        "email": email,
        "password_hash": hash_password(data.password),
        "name": data.name,
        "role": data.role if data.role in ["agent", "underwriter"] else "agent",
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return {"id": user_id, "email": email, "name": data.name, "role": user_doc["role"], "access_token": access_token}

@api_router.post("/auth/login")
async def login(data: UserLogin, response: Response):
    db = get_db()
    if db is None:
        return JSONResponse({"error": "Database not configured"}, status_code=503)
    email = data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return {"id": user_id, "email": email, "name": user["name"], "role": user["role"], "access_token": access_token}

@api_router.get("/auth/me")
async def get_me(request: Request):
    return await get_current_user(request)

@api_router.get("/cases")
async def list_cases(request: Request):
    user = await get_current_user(request)
    db = get_db()
    if db is None:
        return {"cases": [], "total": 0}
    cursor = db.cases.find({"created_by": user["id"]}).sort("created_at", -1).limit(50)
    cases = []
    async for case in cursor:
        case["id"] = str(case.pop("_id"))
        cases.append(case)
    return {"cases": cases, "total": len(cases)}

@api_router.post("/cases")
async def create_case(data: CaseCreate, request: Request):
    user = await get_current_user(request)
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    case_doc = {
        "client_name": data.client_name,
        "policy_type": data.policy_type,
        "notes": data.notes,
        "status": "draft",
        "created_by": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.cases.insert_one(case_doc)
    return {"id": str(result.inserted_id), **case_doc}

@api_router.get("/dashboard/stats")
async def dashboard_stats(request: Request):
    user = await get_current_user(request)
    db = get_db()
    if db is None:
        return {"total_cases": 0, "pending": 0, "approved": 0, "rejected": 0}
    total = await db.cases.count_documents({"created_by": user["id"]})
    pending = await db.cases.count_documents({"created_by": user["id"], "status": "pending"})
    approved = await db.cases.count_documents({"created_by": user["id"], "status": "approved"})
    rejected = await db.cases.count_documents({"created_by": user["id"], "status": "rejected"})
    return {"total_cases": total, "pending": pending, "approved": approved, "rejected": rejected}

app.include_router(api_router)

try:
    from mangum import Mangum
    handler = Mangum(app, lifespan="off")
except ImportError:
    def handler(event, context):
        return {"statusCode": 503, "body": "Mangum not available", "headers": {"Content-Type": "application/json"}}