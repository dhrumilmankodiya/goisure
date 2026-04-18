from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, UploadFile, File, Depends, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from bson import ObjectId
import pandas as pd
import io
import json
import secrets

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=60), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

# Pydantic Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "agent"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: str

class CaseCreate(BaseModel):
    client_name: str
    policy_type: str = "GMC"
    notes: Optional[str] = None

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

class TemplateCreate(BaseModel):
    name: str
    insurer: str
    mappings: Dict[str, str]

class UnderwriterDecision(BaseModel):
    decision: str  # approve, reject, request_fixes
    notes: Optional[str] = None
    risk_flags: Optional[List[str]] = None

class UserManagement(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    token: str
    new_password: str

# Auth Helper
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
    if user["role"] not in roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return user

# Create FastAPI app
app = FastAPI(title="GMC Platform API")
api_router = APIRouter(prefix="/api")

# CORS - use regex patterns to allow subdomains with credentials
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.netlify\.app|https://.*\.trycloudflare\.com|https://.*\.loca\.lt|http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint (public)
@api_router.get("/health")
async def health():
    return {"status": "healthy", "service": "gmc-platform"}

# ==================== AUTH ENDPOINTS ====================
@api_router.post("/auth/register")
async def register(data: UserCreate, response: Response):
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
    
    # Remove domain from cookie to work with any domain (cloudflare, localtunnel, etc.)
    # secure=True required when samesite=none for modern browsers
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    
    await log_audit("user_registered", user_id, {"email": email, "role": user_doc["role"]})
    
    return {"id": user_id, "email": email, "name": data.name, "role": user_doc["role"], "created_at": user_doc["created_at"], "access_token": access_token}

@api_router.post("/auth/login")
async def login(data: UserLogin, response: Response, request: Request):
    email = data.email.lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    
    # Check brute force
    attempts = await db.login_attempts.find_one({"identifier": identifier})
    if attempts and attempts.get("count", 0) >= 5:
        lockout_time = attempts.get("locked_until")
        if lockout_time and datetime.fromisoformat(lockout_time) > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Account temporarily locked. Try again later.")
    
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        # Increment failed attempts
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}},
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is deactivated")
    
    # Clear failed attempts on success
    await db.login_attempts.delete_one({"identifier": identifier})
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    
    await log_audit("user_login", user_id, {"email": email})
    
    # Also return token in response for API clients
    return {"id": user_id, "email": email, "name": user["name"], "role": user["role"], "created_at": user.get("created_at", ""), "access_token": access_token}

@api_router.post("/auth/logout")
async def logout(response: Response, request: Request):
    user = await get_current_user(request)
    # Remove cookies without domain to work with any domain
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    await log_audit("user_logout", user["id"], {})
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        user_id = str(user["_id"])
        access_token = create_access_token(user_id, user["email"])
        # Set cookie without domain to work with any domain
        # secure=True required when samesite=none for modern browsers
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
        return {"message": "Token refreshed", "access_token": access_token}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@api_router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPassword):
    email = data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user:
        return {"message": "If email exists, reset link will be sent"}
    
    token = secrets.token_urlsafe(32)
    await db.password_reset_tokens.insert_one({
        "token": token,
        "user_id": str(user["_id"]),
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
        "used": False
    })
    
    logger.info(f"Password reset link: /reset-password?token={token}")
    return {"message": "If email exists, reset link will be sent"}

@api_router.post("/auth/reset-password")
async def reset_password(data: ResetPassword):
    token_doc = await db.password_reset_tokens.find_one({"token": data.token, "used": False})
    if not token_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    if datetime.fromisoformat(str(token_doc["expires_at"])) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token expired")
    
    await db.users.update_one(
        {"_id": ObjectId(token_doc["user_id"])},
        {"$set": {"password_hash": hash_password(data.new_password)}}
    )
    await db.password_reset_tokens.update_one({"token": data.token}, {"$set": {"used": True}})
    
    return {"message": "Password reset successful"}

# ==================== CASE MANAGEMENT ====================
@api_router.post("/cases")
async def create_case(data: CaseCreate, request: Request):
    user = await get_current_user(request)
    
    case_id = f"GMC-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    case_doc = {
        "case_id": case_id,
        "client_name": data.client_name,
        "policy_type": data.policy_type,
        "notes": data.notes,
        "status": "draft",
        "agent_id": user["id"],
        "agent_name": user["name"],
        "member_count": 0,
        "sum_insured": 0,
        "raw_data": None,
        "mapped_data": None,
        "corrected_data": None,
        "mapping_suggestions": None,
        "ai_confidence": None,
        "risk_flags": [],
        "underwriter_notes": None,
        "underwriter_id": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.cases.insert_one(case_doc)
    await log_audit("case_created", user["id"], {"case_id": case_id})
    
    case_doc.pop("_id", None)
    return case_doc

@api_router.get("/cases")
async def get_cases(request: Request, status: Optional[str] = None, search: Optional[str] = None, page: int = 1, limit: int = 20):
    user = await get_current_user(request)
    
    query = {}
    if user["role"] == "agent":
        query["agent_id"] = user["id"]
    elif user["role"] == "underwriter":
        query["status"] = {"$in": ["submitted", "under_review", "approved", "rejected"]}
    
    if status:
        query["status"] = status
    if search:
        query["$or"] = [
            {"case_id": {"$regex": search, "$options": "i"}},
            {"client_name": {"$regex": search, "$options": "i"}}
        ]
    
    total = await db.cases.count_documents(query)
    cases = await db.cases.find(query, {"_id": 0}).sort("created_at", -1).skip((page - 1) * limit).limit(limit).to_list(limit)
    
    return {"cases": cases, "total": total, "page": page, "limit": limit}

@api_router.get("/cases/{case_id}")
async def get_case(case_id: str, request: Request):
    user = await get_current_user(request)
    
    case = await db.cases.find_one({"case_id": case_id}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    if user["role"] == "agent" and case["agent_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return case

@api_router.put("/cases/{case_id}")
async def update_case(case_id: str, data: CaseUpdate, request: Request):
    user = await get_current_user(request)
    
    case = await db.cases.find_one({"case_id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    if user["role"] == "agent" and case["agent_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.cases.update_one({"case_id": case_id}, {"$set": update_data})
    await log_audit("case_updated", user["id"], {"case_id": case_id, "updates": list(update_data.keys())})
    
    updated_case = await db.cases.find_one({"case_id": case_id}, {"_id": 0})
    return updated_case

@api_router.delete("/cases/{case_id}")
async def delete_case(case_id: str, request: Request):
    user = await get_current_user(request)
    
    case = await db.cases.find_one({"case_id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    if user["role"] not in ["admin"] and (user["role"] == "agent" and case["agent_id"] != user["id"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.cases.delete_one({"case_id": case_id})
    await log_audit("case_deleted", user["id"], {"case_id": case_id})
    
    return {"message": "Case deleted"}

# ==================== FILE UPLOAD & AI MAPPING ====================
@api_router.post("/cases/{case_id}/upload")
async def upload_file(case_id: str, file: UploadFile = File(...), request: Request = None):
    user = await get_current_user(request)
    
    case = await db.cases.find_one({"case_id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    if user["role"] == "agent" and case["agent_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Read file
    content = await file.read()
    filename = file.filename.lower()
    
    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Use CSV or Excel.")
        
        # Convert to records
        raw_data = df.fillna("").to_dict(orient="records")
        columns = list(df.columns)
        
        # Get AI mapping suggestions
        mapping_suggestions = await get_ai_mapping_suggestions(columns, raw_data[:5])
        
        # Calculate stats
        member_count = len(raw_data)
        sum_insured = 0
        for row in raw_data:
            for key, value in row.items():
                if any(term in key.lower() for term in ["sum", "insured", "cover", "amount"]):
                    try:
                        sum_insured += float(str(value).replace(",", ""))
                    except:
                        pass
        
        # Update case
        await db.cases.update_one(
            {"case_id": case_id},
            {"$set": {
                "raw_data": raw_data,
                "mapping_suggestions": mapping_suggestions,
                "member_count": member_count,
                "sum_insured": sum_insured,
                "status": "mapping_review",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        await log_audit("file_uploaded", user["id"], {"case_id": case_id, "filename": file.filename, "rows": member_count})
        
        return {
            "message": "File uploaded successfully",
            "columns": columns,
            "row_count": member_count,
            "mapping_suggestions": mapping_suggestions
        }
    except Exception as e:
        logger.error(f"File processing error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

async def get_ai_mapping_suggestions(columns: List[str], sample_data: List[Dict]) -> List[Dict]:
    """Use Gemini 3 Flash to suggest column mappings"""
    
    standard_fields = [
        "employee_id", "employee_name", "date_of_birth", "gender", "relationship",
        "sum_insured", "email", "phone", "address", "department", "designation",
        "date_of_joining", "salary", "policy_start_date", "policy_end_date",
        "nominee_name", "nominee_relationship", "pre_existing_conditions"
    ]
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        chat = LlmChat(
            api_key=os.environ.get("EMERGENT_LLM_KEY", ""),
            session_id=f"mapping-{uuid.uuid4()}",
            system_message="You are a data mapping expert for insurance GMC files. Map source columns to standard fields accurately."
        ).with_model("gemini", "gemini-3-flash-preview")
        
        prompt = f"""Analyze these Excel columns and map them to standard GMC fields.

Source Columns: {json.dumps(columns)}
Sample Data (first 5 rows): {json.dumps(sample_data[:5])}

Standard Fields: {json.dumps(standard_fields)}

For each source column, provide:
1. Best matching standard field (or "unmapped" if no match)
2. Confidence score (high/medium/low/uncertain)
3. Brief reasoning

Return JSON array format:
[{{"source_column": "col1", "suggested_field": "employee_name", "confidence": "high", "reasoning": "..."}}]

Return ONLY valid JSON, no other text."""

        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse response
        try:
            # Clean response - extract JSON
            response_text = response.strip()
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
            mappings = json.loads(response_text)
            return mappings
        except:
            # Fallback to basic matching
            return basic_mapping_suggestions(columns)
            
    except Exception as e:
        logger.error(f"AI mapping error: {str(e)}")
        return basic_mapping_suggestions(columns)

def basic_mapping_suggestions(columns: List[str]) -> List[Dict]:
    """Fallback basic mapping without AI"""
    mappings = []
    field_patterns = {
        "employee_id": ["id", "emp", "employee", "staff"],
        "employee_name": ["name", "employee", "member"],
        "date_of_birth": ["dob", "birth", "born"],
        "gender": ["gender", "sex"],
        "relationship": ["relation", "type", "member"],
        "sum_insured": ["sum", "insured", "cover", "amount", "si"],
        "email": ["email", "mail"],
        "phone": ["phone", "mobile", "contact"],
        "address": ["address", "addr"],
        "department": ["dept", "department"],
        "designation": ["designation", "title", "position"],
        "date_of_joining": ["joining", "doj", "join"],
        "salary": ["salary", "ctc", "compensation"],
    }
    
    for col in columns:
        col_lower = col.lower()
        matched_field = "unmapped"
        confidence = "uncertain"
        
        for field, patterns in field_patterns.items():
            if any(p in col_lower for p in patterns):
                matched_field = field
                confidence = "medium"
                break
        
        mappings.append({
            "source_column": col,
            "suggested_field": matched_field,
            "confidence": confidence,
            "reasoning": "Pattern matching" if matched_field != "unmapped" else "No matching pattern found"
        })
    
    return mappings

@api_router.post("/cases/{case_id}/apply-mapping")
async def apply_mapping(case_id: str, overrides: List[MappingOverride], request: Request):
    user = await get_current_user(request)
    
    case = await db.cases.find_one({"case_id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    if user["role"] == "agent" and case["agent_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    raw_data = case.get("raw_data", [])
    mapping_suggestions = case.get("mapping_suggestions", [])
    
    # Build final mapping
    final_mapping = {}
    for suggestion in mapping_suggestions:
        final_mapping[suggestion["source_column"]] = suggestion["suggested_field"]
    
    # Apply overrides
    for override in overrides:
        final_mapping[override.source_column] = override.target_field
    
    # Transform data
    mapped_data = []
    errors = []
    
    for idx, row in enumerate(raw_data):
        mapped_row = {"_row_index": idx, "_errors": []}
        for source_col, target_field in final_mapping.items():
            if target_field != "unmapped" and source_col in row:
                value = row[source_col]
                mapped_row[target_field] = value
                
                # Validate
                if target_field == "date_of_birth" and value:
                    try:
                        pd.to_datetime(value)
                    except:
                        mapped_row["_errors"].append({"field": target_field, "message": "Invalid date format"})
                elif target_field == "sum_insured" and value:
                    try:
                        float(str(value).replace(",", ""))
                    except:
                        mapped_row["_errors"].append({"field": target_field, "message": "Invalid number"})
                elif target_field == "email" and value:
                    if "@" not in str(value):
                        mapped_row["_errors"].append({"field": target_field, "message": "Invalid email format"})
        
        if mapped_row["_errors"]:
            errors.append({"row": idx, "errors": mapped_row["_errors"]})
        mapped_data.append(mapped_row)
    
    # Calculate AI confidence
    high_confidence = sum(1 for s in mapping_suggestions if s.get("confidence") == "high")
    ai_confidence = round((high_confidence / len(mapping_suggestions)) * 100) if mapping_suggestions else 0
    
    # Update case
    new_status = "data_correction" if errors else "review"
    await db.cases.update_one(
        {"case_id": case_id},
        {"$set": {
            "mapped_data": mapped_data,
            "ai_confidence": ai_confidence,
            "status": new_status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await log_audit("mapping_applied", user["id"], {"case_id": case_id, "errors_count": len(errors)})
    
    return {
        "message": "Mapping applied",
        "mapped_rows": len(mapped_data),
        "errors": errors,
        "ai_confidence": ai_confidence,
        "status": new_status
    }

@api_router.post("/cases/{case_id}/correct")
async def correct_data(case_id: str, data: CaseSubmit, request: Request):
    user = await get_current_user(request)
    
    case = await db.cases.find_one({"case_id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    if user["role"] == "agent" and case["agent_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.cases.update_one(
        {"case_id": case_id},
        {"$set": {
            "corrected_data": data.corrected_data,
            "status": "review",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await log_audit("data_corrected", user["id"], {"case_id": case_id})
    
    return {"message": "Data corrections saved", "status": "review"}

@api_router.post("/cases/{case_id}/submit")
async def submit_case(case_id: str, request: Request):
    user = await get_current_user(request)
    
    case = await db.cases.find_one({"case_id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    if user["role"] == "agent" and case["agent_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.cases.update_one(
        {"case_id": case_id},
        {"$set": {
            "status": "submitted",
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await log_audit("case_submitted", user["id"], {"case_id": case_id})
    
    # Create notification for underwriters
    await db.notifications.insert_one({
        "type": "new_submission",
        "title": "New Case Submitted",
        "message": f"Case {case_id} from {user['name']} is ready for review",
        "case_id": case_id,
        "target_role": "underwriter",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Case submitted for underwriting", "status": "submitted"}

# ==================== UNDERWRITER ENDPOINTS ====================
@api_router.get("/underwriter/queue")
async def get_underwriter_queue(request: Request, status: Optional[str] = None):
    user = await require_role(request, ["underwriter", "admin"])
    
    query = {"status": {"$in": ["submitted", "under_review"]}}
    if status:
        query["status"] = status
    
    cases = await db.cases.find(query, {"_id": 0}).sort("submitted_at", 1).to_list(100)
    return {"cases": cases}

@api_router.post("/cases/{case_id}/review")
async def start_review(case_id: str, request: Request):
    user = await require_role(request, ["underwriter", "admin"])
    
    case = await db.cases.find_one({"case_id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    await db.cases.update_one(
        {"case_id": case_id},
        {"$set": {
            "status": "under_review",
            "underwriter_id": user["id"],
            "underwriter_name": user["name"],
            "review_started_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await log_audit("review_started", user["id"], {"case_id": case_id})
    
    return {"message": "Review started", "status": "under_review"}

@api_router.post("/cases/{case_id}/decision")
async def make_decision(case_id: str, decision: UnderwriterDecision, request: Request):
    user = await require_role(request, ["underwriter", "admin"])
    
    case = await db.cases.find_one({"case_id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    status_map = {
        "approve": "approved",
        "reject": "rejected",
        "request_fixes": "needs_correction"
    }
    
    new_status = status_map.get(decision.decision, "under_review")
    
    await db.cases.update_one(
        {"case_id": case_id},
        {"$set": {
            "status": new_status,
            "underwriter_notes": decision.notes,
            "risk_flags": decision.risk_flags or [],
            "decision_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await log_audit("decision_made", user["id"], {"case_id": case_id, "decision": decision.decision})
    
    # Notify agent
    await db.notifications.insert_one({
        "type": f"case_{decision.decision}",
        "title": f"Case {decision.decision.replace('_', ' ').title()}",
        "message": f"Case {case_id} has been {new_status}. {decision.notes or ''}",
        "case_id": case_id,
        "target_user_id": case["agent_id"],
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": f"Case {new_status}", "status": new_status}

# ==================== ADMIN ENDPOINTS ====================
@api_router.get("/admin/stats")
async def get_admin_stats(request: Request):
    user = await require_role(request, ["admin"])
    
    # Get case stats
    total_cases = await db.cases.count_documents({})
    draft_cases = await db.cases.count_documents({"status": "draft"})
    mapping_cases = await db.cases.count_documents({"status": "mapping_review"})
    correction_cases = await db.cases.count_documents({"status": "data_correction"})
    review_cases = await db.cases.count_documents({"status": "review"})
    submitted_cases = await db.cases.count_documents({"status": "submitted"})
    under_review_cases = await db.cases.count_documents({"status": "under_review"})
    approved_cases = await db.cases.count_documents({"status": "approved"})
    rejected_cases = await db.cases.count_documents({"status": "rejected"})
    needs_correction = await db.cases.count_documents({"status": "needs_correction"})
    
    # Get user stats
    total_users = await db.users.count_documents({})
    agents = await db.users.count_documents({"role": "agent"})
    underwriters = await db.users.count_documents({"role": "underwriter"})
    admins = await db.users.count_documents({"role": "admin"})
    
    # Calculate avg AI confidence
    pipeline = [{"$group": {"_id": None, "avg_confidence": {"$avg": "$ai_confidence"}}}]
    ai_stats = await db.cases.aggregate(pipeline).to_list(1)
    avg_ai_confidence = ai_stats[0]["avg_confidence"] if ai_stats and ai_stats[0].get("avg_confidence") else 0
    
    return {
        "cases": {
            "total": total_cases,
            "draft": draft_cases,
            "mapping_review": mapping_cases,
            "data_correction": correction_cases,
            "review": review_cases,
            "submitted": submitted_cases,
            "under_review": under_review_cases,
            "approved": approved_cases,
            "rejected": rejected_cases,
            "needs_correction": needs_correction
        },
        "users": {
            "total": total_users,
            "agents": agents,
            "underwriters": underwriters,
            "admins": admins
        },
        "ai": {
            "avg_confidence": round(avg_ai_confidence, 1) if avg_ai_confidence else 0
        }
    }

@api_router.get("/admin/users")
async def get_users(request: Request, role: Optional[str] = None, page: int = 1, limit: int = 20):
    await require_role(request, ["admin"])
    
    query = {}
    if role:
        query["role"] = role
    
    total = await db.users.count_documents(query)
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).skip((page - 1) * limit).limit(limit).to_list(limit)
    
    # Add id field
    for user in users:
        if "id" not in user:
            user_doc = await db.users.find_one({"email": user["email"]})
            if user_doc:
                user["id"] = str(user_doc["_id"])
    
    return {"users": users, "total": total, "page": page, "limit": limit}

@api_router.put("/admin/users/{user_id}")
async def update_user(user_id: str, data: UserManagement, request: Request):
    await require_role(request, ["admin"])
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No updates provided")
    
    result = await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User updated"}

# ==================== TEMPLATES ====================
@api_router.post("/templates")
async def create_template(data: TemplateCreate, request: Request):
    await require_role(request, ["admin"])
    
    template_doc = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "insurer": data.insurer,
        "mappings": data.mappings,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.templates.insert_one(template_doc)
    template_doc.pop("_id", None)
    return template_doc

@api_router.get("/templates")
async def get_templates(request: Request):
    await get_current_user(request)
    templates = await db.templates.find({}, {"_id": 0}).to_list(100)
    return {"templates": templates}

@api_router.get("/templates/{template_id}")
async def get_template(template_id: str, request: Request):
    await get_current_user(request)
    template = await db.templates.find_one({"id": template_id}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@api_router.put("/templates/{template_id}")
async def update_template(template_id: str, data: TemplateCreate, request: Request):
    await require_role(request, ["admin"])
    
    result = await db.templates.update_one(
        {"id": template_id},
        {"$set": {"name": data.name, "insurer": data.insurer, "mappings": data.mappings, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {"message": "Template updated"}

@api_router.delete("/templates/{template_id}")
async def delete_template(template_id: str, request: Request):
    await require_role(request, ["admin"])
    
    result = await db.templates.delete_one({"id": template_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {"message": "Template deleted"}

# ==================== NOTIFICATIONS ====================
@api_router.get("/notifications")
async def get_notifications(request: Request, unread_only: bool = False):
    user = await get_current_user(request)
    
    query = {"$or": [{"target_user_id": user["id"]}, {"target_role": user["role"]}]}
    if unread_only:
        query["read"] = False
    
    notifications = await db.notifications.find(query, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    unread_count = await db.notifications.count_documents({**query, "read": False})
    
    return {"notifications": notifications, "unread_count": unread_count}

@api_router.post("/notifications/mark-read")
async def mark_notifications_read(request: Request, notification_ids: Optional[List[str]] = None):
    user = await get_current_user(request)
    
    query = {"$or": [{"target_user_id": user["id"]}, {"target_role": user["role"]}]}
    
    await db.notifications.update_many(query, {"$set": {"read": True}})
    return {"message": "Notifications marked as read"}

# ==================== AUDIT TRAIL ====================
async def log_audit(action: str, user_id: str, details: Dict):
    await db.audit_logs.insert_one({
        "action": action,
        "user_id": user_id,
        "details": details,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

@api_router.get("/audit-logs")
async def get_audit_logs(request: Request, action: Optional[str] = None, user_id: Optional[str] = None, page: int = 1, limit: int = 50):
    await require_role(request, ["admin"])
    
    query = {}
    if action:
        query["action"] = action
    if user_id:
        query["user_id"] = user_id
    
    total = await db.audit_logs.count_documents(query)
    logs = await db.audit_logs.find(query, {"_id": 0}).sort("timestamp", -1).skip((page - 1) * limit).limit(limit).to_list(limit)
    
    return {"logs": logs, "total": total, "page": page, "limit": limit}

# ==================== DASHBOARD ====================
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(request: Request):
    user = await get_current_user(request)
    
    if user["role"] == "agent":
        query = {"agent_id": user["id"]}
    else:
        query = {}
    
    total = await db.cases.count_documents(query)
    in_progress = await db.cases.count_documents({**query, "status": {"$in": ["draft", "mapping_review", "data_correction", "review"]}})
    needs_review = await db.cases.count_documents({**query, "status": {"$in": ["needs_correction"]}})
    failed = await db.cases.count_documents({**query, "status": "failed"})
    ready_uw = await db.cases.count_documents({**query, "status": "submitted"})
    completed = await db.cases.count_documents({**query, "status": "approved"})
    
    return {
        "total_uploads": total,
        "in_progress": in_progress,
        "needs_review": needs_review,
        "failed": failed,
        "ready_for_uw": ready_uw,
        "completed": completed
    }

@api_router.get("/dashboard/recent-activity")
async def get_recent_activity(request: Request):
    user = await get_current_user(request)
    
    if user["role"] == "agent":
        query = {"user_id": user["id"]}
    else:
        query = {}
    
    activities = await db.audit_logs.find(query, {"_id": 0}).sort("timestamp", -1).limit(10).to_list(10)
    return {"activities": activities}

# Include router
app.include_router(api_router)

# Startup events
@app.on_event("startup")
async def startup():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.cases.create_index("case_id", unique=True)
    await db.cases.create_index("agent_id")
    await db.cases.create_index("status")
    await db.login_attempts.create_index("identifier")
    await db.notifications.create_index("target_user_id")
    await db.notifications.create_index("target_role")
    await db.audit_logs.create_index("timestamp")
    
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@gmc.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@123")
    
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin user created: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password updated")
    
    # Write test credentials
    creds_dir = Path("./memory")
    creds_dir.mkdir(exist_ok=True)
    with open(creds_dir / "test_credentials.md", "w") as f:
        f.write(f"""# Test Credentials

## Admin Account
- Email: {admin_email}
- Password: {admin_password}
- Role: admin

## Auth Endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- POST /api/auth/refresh
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
""")

@app.on_event("shutdown")
async def shutdown():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
