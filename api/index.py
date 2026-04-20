"""
Vercel Python Serverless Function - GMC Platform API
Full feature parity with original GMC system
"""
import os
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta

# Fix path for Vercel serverless - we're in api/ directory
_api_dir = Path(__file__).parent.resolve()
_root_dir = _api_dir.parent
sys.path.insert(0, str(_root_dir))

from dotenv import load_dotenv
# Try loading .env from root (for local dev)
_dotenv_path = _root_dir / ".env"
if _dotenv_path.exists():
    load_dotenv(_dotenv_path)

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Depends, Form
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from bson import ObjectId
import bcrypt
import jwt
import pandas as pd
import io
import json
import uuid
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB connection - minimal configuration for Vercel
_client = None
_db = None

def get_db():
    global _client, _db
    mongo_url = os.environ.get("MONGO_URL", "")
    db_name = os.environ.get("DB_NAME", "goisure")
    
    if not mongo_url:
        logger.warning("MONGO_URL not set")
        return None
    
    # Reuse existing connection if available
    if _db is not None:
        try:
            # Quick ping to verify connection still works
            _client.admin.command('ping')
            return _db
        except Exception:
            # Connection stale, reset
            _client = None
            _db = None
    
    # Skip retry if we recently failed
    if _client is False:
        # Wait a bit before retrying
        import time
        time.sleep(1)
        
    try:
        # Minimal connection - let motor handle defaults
        client = AsyncIOMotorClient(
            mongo_url,
            serverSelectionTimeoutMS=15000, 
            connectTimeoutMS=15000,
            maxPoolSize=1,
            minPoolSize=0,
            maxIdleTimeMS=5000
        )
        # Verify connection
        client.admin.command('ping')
        _client = client
        _db = client[db_name]
        logger.info(f"Connected to MongoDB: {db_name}")
        return _db
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
        _client = False
        _db = None
        return None

JWT_ALGORITHM = "HS256"
SECRET_KEY = os.environ.get("JWT_SECRET", "fallback-secret-for-dev")

def get_jwt_secret() -> str:
    return SECRET_KEY

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

# ============ Pydantic Models ============
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
    business_type: str = "fresh"

class CaseUpdate(BaseModel):
    client_name: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class MappingOverride(BaseModel):
    source_column: str
    target_field: str

class CaseSubmit(BaseModel):
    corrected_data: Optional[List[Dict[str, Any]]] = None
    mapping_overrides: Optional[List[MappingOverride]] = None

class DataCorrection(BaseModel):
    corrections: List[Dict[str, Any]]

class UnderwriterDecision(BaseModel):
    decision: str  # approve, reject, request_fixes
    notes: Optional[str] = None
    risk_flags: Optional[List[str]] = None

# ============ Auth Helper ============
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

async def require_role(request: Request, roles: List[str]) -> dict:
    user = await get_current_user(request)
    if user.get("role") not in roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return user

# ============ Create App ============
app = FastAPI(title="GMC Platform API")
api_router = APIRouter(prefix="/api")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.netlify\.app|https://.*\.trycloudflare\.com|http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ Health ============
@api_router.get("/health")
async def health():
    db = get_db()
    return {"status": "healthy", "service": "gmc-platform", "db": "connected" if db is not None else "not_configured"}

# ============ Auth Endpoints ============
@api_router.post("/auth/register")
async def register(data: UserCreate, response: Response):
    try:
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
            "role": data.role if data.role in ["agent", "underwriter", "admin"] else "agent",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        result = await db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
        access_token = create_access_token(user_id, email)
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
        response.set_cookie(key="refresh_token", value=create_refresh_token(user_id), httponly=True, secure=True, samesite="none", max_age=604800, path="/")
        return {"id": user_id, "email": email, "name": data.name, "role": user_doc["role"], "access_token": access_token}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

@api_router.post("/auth/login")
async def login(data: UserLogin, response: Response):
    db = get_db()
    if db is None:
        return JSONResponse({"error": "Database not configured"}, status_code=503)
    email = data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is deactivated")
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=create_refresh_token(user_id), httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return {"id": user_id, "email": email, "name": user["name"], "role": user["role"], "access_token": access_token}

@api_router.get("/auth/me")
async def get_me(request: Request):
    return await get_current_user(request)

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return {"message": "Logged out successfully"}

# ============ Case Endpoints ============
@api_router.get("/cases")
async def list_cases(request: Request, status: Optional[str] = None):
    user = await get_current_user(request)
    db = get_db()
    if db is None:
        return {"cases": [], "total": 0}
    query = {"created_by": user["id"]}
    if status:
        query["status"] = status
    cursor = db.cases.find(query).sort("created_at", -1).limit(100)
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
        "business_type": data.business_type,
        "notes": data.notes,
        "status": "draft",
        "created_by": user["id"],
        "created_by_name": user.get("name", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.cases.insert_one(case_doc)
    case_id = str(result.inserted_id)
    return {"case_id": case_id, "id": case_id, **case_doc}

@api_router.get("/cases/{case_id}")
async def get_case(case_id: str, request: Request):
    user = await get_current_user(request)
    db = get_db()
    if db is None:
        raise HTTPException(status_code=404, detail="Case not found")
    case = await db.cases.find_one({"_id": ObjectId(case_id), "created_by": user["id"]})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    case["id"] = str(case.pop("_id"))
    return case

@api_router.put("/cases/{case_id}")
async def update_case(case_id: str, data: CaseUpdate, request: Request):
    user = await get_current_user(request)
    db = get_db()
    if db is None:
        raise HTTPException(status_code=404, detail="Case not found")
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.cases.update_one({"_id": ObjectId(case_id), "created_by": user["id"]}, {"$set": update_data})
    return {"message": "Case updated"}

@api_router.delete("/cases/{case_id}")
async def delete_case(case_id: str, request: Request):
    user = await get_current_user(request)
    db = get_db()
    await db.cases.delete_one({"_id": ObjectId(case_id), "created_by": user["id"]})
    return {"message": "Case deleted"}

@api_router.post("/cases/{case_id}/upload")
async def upload_file(case_id: str, request: Request, file: UploadFile = File(...)):
    user = await get_current_user(request)
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    # Read file content
    content = await file.read()
    
    # Parse Excel/CSV
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
        
        # Convert to records
        records = df.to_dict(orient="records")
        columns = list(df.columns)
        
        # Clean NaN values
        cleaned_records = []
        for r in records:
            cleaned = {k: ('' if pd.isna(v) else v) for k, v in r.items()}
            cleaned_records.append(cleaned)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")
    
    # Store upload data
    upload_doc = {
        "case_id": case_id,
        "filename": file.filename,
        "columns": columns,
        "record_count": len(cleaned_records),
        "records": cleaned_records,
        "uploaded_by": user["id"],
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    await db.uploads.insert_one(upload_doc)
    
    # Update case status
    await db.cases.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": {"status": "uploaded", "filename": file.filename, "record_count": len(cleaned_records), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {
        "case_id": case_id,
        "filename": file.filename,
        "columns": columns,
        "record_count": len(cleaned_records),
        "status": "uploaded"
    }

@api_router.get("/cases/{case_id}/mapping")
async def get_mapping(case_id: str, request: Request):
    user = await get_current_user(request)
    db = get_db()
    
    # Get upload data
    upload = await db.uploads.find_one({"case_id": case_id})
    if not upload:
        raise HTTPException(status_code=404, detail="No upload found for this case")
    
    columns = upload.get("columns", [])
    
    # Default mapping for common column names
    default_mapping = {}
    for col in columns:
        col_lower = col.lower().replace(" ", "_")
        if "employee" in col_lower or "emp" in col_lower:
            default_mapping[col] = "employee_id"
        elif "name" in col_lower and "employee" in col_lower:
            default_mapping[col] = "employee_name"
        elif "name" in col_lower:
            default_mapping[col] = "name"
        elif "age" in col_lower:
            default_mapping[col] = "age"
        elif "sum insured" in col_lower or "si" in col_lower:
            default_mapping[col] = "sum_insured"
        elif "premium" in col_lower:
            default_mapping[col] = "premium"
        elif "gender" in col_lower or "sex" in col_lower:
            default_mapping[col] = "gender"
        elif "relation" in col_lower:
            default_mapping[col] = "relationship"
    
    return {
        "case_id": case_id,
        "columns": columns,
        "mapping": default_mapping,
        "records": upload.get("records", [])[:10]  # Return first 10 for preview
    }

@api_router.post("/cases/{case_id}/apply-mapping")
async def apply_mapping(case_id: str, request: Request):
    user = await get_current_user(request)
    db = get_db()
    
    # Get mapping from request
    body = await request.json()
    mapping = body.get("mapping", {})
    
    # Get upload data
    upload = await db.uploads.find_one({"case_id": case_id})
    if not upload:
        raise HTTPException(status_code=404, detail="No upload found")
    
    records = upload.get("records", [])
    mapped_records = []
    
    for record in records:
        mapped = {}
        for source_col, target_field in mapping.items():
            if source_col in record:
                mapped[target_field] = record[source_col]
        mapped_records.append(mapped)
    
    # Store mapped data
    await db.mapped_data.update_one(
        {"case_id": case_id},
        {"$set": {"records": mapped_records, "mapping": mapping, "applied_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    # Update case status
    await db.cases.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": {"status": "mapping_applied", "mapping": mapping, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"case_id": case_id, "mapped_count": len(mapped_records), "status": "mapping_applied"}

@api_router.get("/cases/{case_id}/data")
async def get_case_data(case_id: str, request: Request):
    user = await get_current_user(request)
    db = get_db()
    
    # Try mapped data first, then raw upload
    mapped = await db.mapped_data.find_one({"case_id": case_id})
    if mapped:
        return {"case_id": case_id, "records": mapped.get("records", []), "source": "mapped"}
    
    upload = await db.uploads.find_one({"case_id": case_id})
    if upload:
        return {"case_id": case_id, "records": upload.get("records", []), "source": "raw"}
    
    raise HTTPException(status_code=404, detail="No data found for this case")

@api_router.post("/cases/{case_id}/correct")
async def correct_data(case_id: str, request: Request):
    user = await get_current_user(request)
    db = get_db()
    
    body = await request.json()
    corrections = body.get("corrections", [])
    
    # Get existing data
    mapped = await db.mapped_data.find_one({"case_id": case_id})
    if not mapped:
        raise HTTPException(status_code=404, detail="No data found")
    
    records = mapped.get("records", [])
    
    # Apply corrections
    for correction in corrections:
        row_index = correction.get("row_index")
        field = correction.get("field")
        value = correction.get("value")
        if row_index is not None and row_index < len(records):
            records[row_index][field] = value
    
    # Save corrected data
    await db.mapped_data.update_one(
        {"case_id": case_id},
        {"$set": {"records": records, "corrected_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Update case status
    await db.cases.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": {"status": "data_corrected", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"case_id": case_id, "corrected_count": len(corrections), "status": "data_corrected"}

@api_router.post("/cases/{case_id}/submit")
async def submit_case(case_id: str, request: Request):
    user = await get_current_user(request)
    db = get_db()
    
    # Verify data exists
    mapped = await db.mapped_data.find_one({"case_id": case_id})
    if not mapped:
        raise HTTPException(status_code=400, detail="No data to submit")
    
    # Update case status
    await db.cases.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": {"status": "pending", "submitted_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"case_id": case_id, "status": "pending", "message": "Case submitted for review"}

@api_router.post("/cases/{case_id}/review")
async def start_review(case_id: str, request: Request):
    user = await require_role(request, ["underwriter", "admin"])
    db = get_db()
    
    await db.cases.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": {"status": "in_review", "reviewed_by": user["id"], "reviewed_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"case_id": case_id, "status": "in_review"}

@api_router.post("/cases/{case_id}/decision")
async def make_decision(case_id: str, data: UnderwriterDecision, request: Request):
    user = await require_role(request, ["underwriter", "admin"])
    db = get_db()
    
    valid_decisions = ["approved", "rejected", "request_fixes"]
    if data.decision not in valid_decisions:
        raise HTTPException(status_code=400, detail=f"Invalid decision. Must be one of: {valid_decisions}")
    
    update_data = {
        "status": data.decision,
        "decision": data.decision,
        "decision_notes": data.notes,
        "decided_by": user["id"],
        "decided_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if data.risk_flags:
        update_data["risk_flags"] = data.risk_flags
    
    await db.cases.update_one({"_id": ObjectId(case_id)}, {"$set": update_data})
    
    return {"case_id": case_id, "status": data.decision, "decision": data.decision}

# ============ Dashboard Endpoints ============
@api_router.get("/dashboard/stats")
async def dashboard_stats(request: Request):
    user = await get_current_user(request)
    db = get_db()
    if db is None:
        return {"total_cases": 0, "pending": 0, "approved": 0, "rejected": 0, "in_progress": 0}
    
    base_query = {"created_by": user["id"]}
    if user.get("role") in ["underwriter", "admin"]:
        base_query = {}
    
    total = await db.cases.count_documents(base_query)
    pending = await db.cases.count_documents({**base_query, "status": "pending"})
    in_progress = await db.cases.count_documents({**base_query, "status": {"$in": ["draft", "uploaded", "mapping_applied", "data_corrected"]}})
    approved = await db.cases.count_documents({**base_query, "status": "approved"})
    rejected = await db.cases.count_documents({**base_query, "status": "rejected"})
    
    return {"total_cases": total, "pending": pending, "in_progress": in_progress, "approved": approved, "rejected": rejected}

@api_router.get("/dashboard/recent-activity")
async def recent_activity(request: Request):
    user = await get_current_user(request)
    db = get_db()
    if db is None:
        return {"activities": []}
    
    cursor = db.cases.find({"created_by": user["id"]}).sort("created_at", -1).limit(10)
    activities = []
    async for case in cursor:
        activities.append({
            "id": str(case["_id"]),
            "action": f"Case {case.get('client_name', '')} - {case.get('status', '')}",
            "timestamp": case.get("created_at", ""),
            "case_id": str(case["_id"])
        })
    
    return {"activities": activities}

# ============ Underwriter Queue ============
@api_router.get("/underwriter/queue")
async def underwriter_queue(request: Request):
    user = await require_role(request, ["underwriter", "admin"])
    db = get_db()
    if db is None:
        return {"cases": []}
    
    cursor = db.cases.find({"status": "pending"}).sort("created_at", 1).limit(50)
    cases = []
    async for case in cursor:
        case["id"] = str(case.pop("_id"))
        cases.append(case)
    
    return {"cases": cases, "total": len(cases)}

# ============ Admin Endpoints ============
@api_router.get("/admin/users")
async def list_users(request: Request):
    user = await require_role(request, ["admin"])
    db = get_db()
    if db is None:
        return {"users": []}
    
    cursor = db.users.find({}).sort("created_at", -1).limit(50)
    users = []
    async for u in cursor:
        u["id"] = str(u.pop("_id"))
        u.pop("password_hash", None)
        users.append(u)
    
    return {"users": users, "total": len(users)}

@api_router.put("/admin/users/{user_id}")
async def update_user(user_id: str, request: Request):
    user = await require_role(request, ["admin"])
    db = get_db()
    
    body = await request.json()
    update_data = {k: v for k, v in body.items() if k in ["role", "is_active", "name"]}
    
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
    
    return {"message": "User updated"}

# ============ Include Router ============
app.include_router(api_router)

# ============ Mangum Handler ============
try:
    from mangum import Mangum
    handler = Mangum(app, lifespan="off")
except ImportError:
    def handler(event, context):
        return {"statusCode": 503, "body": "Mangum not available", "headers": {"Content-Type": "application/json"}}