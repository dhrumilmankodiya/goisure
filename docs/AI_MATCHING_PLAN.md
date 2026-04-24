# Goisure AI Matching System - Implementation Plan

## 🎯 Project Overview
**Goal:** Embed automatic enrollment-to-claims AI matching directly into Goisure platform

**Current State:**
- ✅ Excel matching logic: Working at 100% (standalone Python)
- ✅ Platform: https://43.153.173.156 (FastAPI + React)
- ✅ Existing endpoints: `/cases/{id}/upload-claims`, `/cases/{id}/apply-mapping`

**Target:** When user uploads enrollment + claims → automatic match → structured output for pricing

---

## 📐 Architecture

### Data Flow
```
1. User creates NEW CASE (fresh/renewal)
2. Uploads ENROLLMENT Excel → parsed → stored in MongoDB (collection: uploads)
3. Uploads CLAIMS Excel → parsed → stored in MongoDB  
4. User clicks "RUN AI MATCH"
5. Backend runs matching algorithm → match_results collection
6. Frontend displays: matched/unmatched with confidence scores
7. User can override uncertain matches
8. Structured data → pricing engine
```

### Backend Changes Required

**New Endpoints:**
| Endpoint | Method | Description |
|----------|-------|-------------|
| `/api/cases/{case_id}/match-ai` | POST | Run AI matching |
| `/api/cases/{case_id}/match-results` | GET | Get matching results |
| `/api/cases/{case_id}/match-override` | POST | Override a match |
| `/api/cases/{case_id}/export-matched` | GET | Export matched dataset |

**New MongoDB Collections:**
```python
match_results = {
    "case_id": str,
    "matches": [
        {
            "claim_name": str,
            "matched_enrollment": str,
            "match_score": float,  # 0-100
            "match_method": str,   # EXACT, FUZZY, MEMBER_ID, NO_MATCH
            "is_verified": bool
        }
    ],
    "stats": {
        "total_claims": int,
        "matched": int,
        "unmatched": int,
        "match_rate": float
    },
    "created_at": datetime
}
```

---

## 🔧 Implementation Phases

### Phase 1: Backend AI Matching Service
**Location:** `/home/ubuntu/goisure/api/services/ai_matcher.py`

```python
class AIMatcher:
    """Multi-strategy matching engine"""
    
    def match(self, claims_df: pd.DataFrame, enrollment_df: pd.DataFrame) -> List[MatchResult]:
        # Strategy 1: Exact name match
        # Strategy 2: First name fuzzy (threshold 80%)
        # Strategy 3: Employee number via member_id
        # Strategy 4: Substring matching
```

**Files to create:**
1. `api/services/__init__.py`
2. `api/services/ai_matcher.py` - Core matching logic
3. `api/services/file_parser.py` - Excel parsing utility

### Phase 2: New API Endpoints
**Add to `api/index.py`:**

```python
@api_router.post("/cases/{case_id}/match-ai")
async def run_ai_match(case_id: str, request: Request):
    """Run AI matching on uploaded files"""
    # 1. Get enrollment from uploads collection
    # 2. Get claims from uploads collection  
    # 3. Run AIMatcher.match()
    # 4. Save to match_results collection
    # 5. Return results with stats
```

### Phase 3: Frontend UI
**Location:** `/home/ubuntu/goisure/frontend/src/pages/MatchingPage.js`

**Components:**
1. `Run AI Match` button (appears after both files uploaded)
2. Match Results table (claims → enrollment → confidence)
3. Manual override dropdown for uncertain matches
4. Export button

**Files to modify:**
1. `NewCasePage.js` - Add matching section
2. `api.js` - Add matching API calls

---

## 📋 GitHub Codespace Workflow

### Setup
```bash
# Open in Codespace
cd /home/ubuntu/goisure

# Backend
cd api && pip install -r requirements.txt

# Frontend  
cd ../frontend && npm install
```

### Development Cycle
1. Make changes in Codespace
2. Test locally
3. Push to GitHub
4. Auto-deploy to server OR manual sync

---

## 🚀 Deployment

### Server (already running)
```bash
# SSH to server
ssh ubuntu@43.153.173.156

# Pull latest
cd /home/ubuntu/goisure
git pull

# Restart backend
sudo systemctl restart goisure-api

# Rebuild frontend (if changed)
cd frontend && npm run build
```

---

## ✅ Acceptance Criteria

1. [ ] User can upload enrollment Excel
2. [ ] User can upload claims Excel  
3. [ ] Click "Run AI Match" triggers matching
4. [ ] Results show match confidence (0-100%)
5. [ ] Unmatched records highlighted for manual review
6. [ ] User can override matches manually
7. [ ] Matched data exports to structured format
8. [ ] Data flows to pricing engine

---

## 📊 Match Strategy (from analysis)

| Method | Threshold | Priority |
|--------|-----------|----------|
| EXACT name | 100% | 1st |
| MEMBER_ID | 95% | 2nd |
| FIRST_NAME fuzzy | 80% | 3rd |
| SUBSTRING | 70% | 4th |
| NO_MATCH | <70% | Manual |

**Current Performance:** 100% match rate (31/31 claims matched)

---

*Generated: April 24, 2026*