# AI Field Mapping Engine - Technical Specification
## Detailed Technical Design Document

---

## 1. CRITICAL QUESTIONS FOR CLARIFICATION

### 1.1 Infrastructure & Deployment

| Question | Options | Impact |
|----------|---------|--------|
| **Where will AI run?** | Our server (Ubuntu) / Vercel serverless / External GPU cloud | Cost, latency, privacy |
| **What's your server specs?** | CPU only (~2 cores) / Has GPU / Can add GPU | Model choice, speed |
| **Data privacy requirement?** | All data stays in India / Cloud OK / No external API calls | Architecture |
| **What's your budget?** | $0/month (local) / <$50/month / <$200/month | Model selection |

### 1.2 Accuracy & Speed Requirements

| Question | Target |
|----------|--------|
| **Field detection accuracy goal?** | >90% / >95% / >99% |
| **Matching accuracy goal?** | >85% auto-match / >90% |
| **Max processing time per file?** | <10 seconds / <30 seconds / <60 seconds |
| **File size limits?** | Up to 5MB / Up to 50MB / No limit |

### 1.3 Use Cases & Edge Cases

| Question | Scenario |
|----------|----------|
| **Name variations?** | "John Doe", "John D", "J. Doe", "JOHN DOE" all same person? |
| **Missing data?** | What if DOB is missing? Still match? |
| **Duplicate claims?** | Same claim submitted multiple times? |
| **Family members?** | Match family with main policy holder? |

---

## 2. MODEL SELECTION ANALYSIS

### 2.1 Three Architecture Options

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    OPTION A: LOCAL SMALL MODEL                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  Models: TinyLlama 1.1B, Phi-2 2.7B, Qwen2-1.8B                    │
│  Hosting: Our Ubuntu server (or Modal/RunPod)                          │
│  Cost: ~$0/month (if CPU) or ~$50/month (GPU)                     │
│  Setup Time: 2-3 days                                          │
│                                                                     │
│  PROS:                              CONS:                          │
│  ✓ Complete data privacy                 ~Slower inference             │
│  ✓ No per-call costs                 ✓ Requires setup/maintenance       │
│  ✓ Customizable with insurance      ✓ Needs GPU for speed          │
│    domain knowledge                ✓ Fine-tuning complexity        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    OPTION B: HYBRID RULES + EMBEDDINGS                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                      │
│  • sentence-transformers for embeddings                          │
│  • scikit-learn for classification                             │
│  • TheFuzz (rapidfuzz) for fuzzy matching                     │
│  • spaCy for NER                                             │
│                                                                     │
│  PROS:                              CONS:                          │
│  ✓Extremely fast (<1 second)          ~Less "intelligent"         │
│  ✓High accuracy for structured data   ~Limited to trained patterns │
│  ✓Very low compute                  ~Needs regular updates        │
│  ✓No LLM hallucination             ~Can't handle novel formats    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    OPTION C: API-BASED (GPT-4o mini)                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  Provider: OpenAI / Anthropic / Google                           │
│  Model: gpt-4o-mini, claude-3-haiku, gemini-flash                 │
│  Cost: ~$0.001-0.005 per file                                 │
│  Setup Time: 1 day                                           │
│                                                                     │
│  PROS:                              CONS:                          │
│  ✓Best accuracy                    ✗Data leaves your server        │
│  ✓Handles any format               ✗Per-call costs               │
│  ✓No maintenance                 ✗Rate limits                 │
│  ✓Continuous improvements       ✗Privacy concerns           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 RECOMMENDED APPROACH: HYBRID (Option B + Option A fallback)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HYBRID ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   FILE INPUT                                                        │
│        │                                                            │
│        ▼                                                            │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐          │
│   │  EXCEL    │────▶│   COLUMN  │────▶│   CONFIDENCE│          │
│   │  PARSER   │     │  MATCHER  │     │   CALCULATOR│          │
│   └─────────────┘     └─────────────┘     └─────────────┘          │
│        │                  │                   │                    │
│        ▼                  ▼                   ▼                    │
│   ┌─────────────────────────────────────────────┐                │
│   │           DECISION ENGINE                  │                │
│   │  ┌─────────────────────────────────────┐   │                │
│   │  │ >85% confidence: AUTO-MAP            │   │                │
│   │  │ 70-85%: FLAG for review             │   │                │
│   │  │ <70%: REJECT + suggest re-upload    │   │                │
│   │  └─────────────────────────────────────┘   │                │
│   └─────────────────────────────────────────────┘                │
│        │                                                           │
│        ▼                                                           │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐          │
│   │  FUZZY    │────▶│  ANALYTICS │────▶│   OUTPUT   │          │
│   │ MATCHING  │     │  ENGINE   │     │   JSON    │          │
│   └─────────────┘     └─────────────┘     └─────────────┘          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. DETAILED COMPONENT SPECIFICATIONS

### 3.1 Component 1: Field Detection Engine

```python
# Field Detection Pattern Library
# ==============================

FIELD_PATTERNS = {
    # IDENTITY FIELDS
    "name": {
        "patterns": [
            r"(employee|member|patient|policy|full|person)_?name",
            r"^(name|person_name|customer_name)$",
            r"(first.?name|last.?name)"
        ],
        "weight": 1.0,
        "fuzzy_threshold": 0.85
    },
    "member_id": {
        "patterns": [
            r"(employee|member|policy|customer|emp).?_?(id|no|number|ref)",
            r"^(member_id|emp_code|empid|policy_ref)$",
            r"^(id|memberno|custno)$"
        ],
        "weight": 1.2,
        "fuzzy_threshold": 0.95
    },
    "date_of_birth": {
        "patterns": [
            r"date.?of.?birth",
            r"^(dob|birth_?date|birthdate)$",
            r"^(age|dob)$"
        ],
        "weight": 1.0,
        "fuzzy_threshold": 0.90
    },
    
    # COVERAGE FIELDS
    "sum_insured": {
        "patterns": [
            r"(sum|cover|insurance).?_?insured",
            r"^(si|cover_?amount|coverage|sum_assured)$",
            r"(sum_insured|cover_amount)"
        ],
        "weight": 1.1,
        "fuzzy_threshold": 0.90
    },
    "policy_number": {
        "patterns": [
            r"policy.?number",
            r"^(policy_?no|ref_?no|pol_?no)$",
            r"^(policy_ref|pol_ref)$"
        ],
        "weight": 1.2,
        "fuzzy_threshold": 0.95
    },
    
    # CLAIMS FIELDS  
    "claim_amount": {
        "patterns": [
            r"claim.?amount",
            r"^(claimed_?amount|claim_?amt|amount_?claimed)$",
            r"^(claim_?value|amount)$"
        ],
        "weight": 1.0,
        "fuzzy_threshold": 0.90
    },
    "diagnosis": {
        "patterns": [
            r"(diagnosis|illness|ailment|disease|condition)",
            r"^(diagnosis|illness|ailment|disease)$",
            r"(medical_?condition|health_?issue)"
        ],
        "weight": 1.0,
        "fuzzy_threshold": 0.85
    },
    "claim_date": {
        "patterns": [
            r"claim.?date",
            r"^(date_?of_?claim|submitted_?on)$",
            r"^(claim_date|incident_date)$"
        ],
        "weight": 0.9,
        "fuzzy_threshold": 0.85
    },
    "hospital_name": {
        "patterns": [
            r"hospital",
            r"^(hospital_?name|clinic|medical_?center)$",
            r"(healthcare_?provider|network_?provider)"
        ],
        "weight": 0.8,
        "fuzzy_threshold": 0.80
    },
    "claim_type": {
        "patterns": [
            r"claim.?type",
            r"^(type_?of_?claim|claim_?category)$",
            r"(hospitalization|cashless|reimbursement)"
        ],
        "weight": 0.9,
        "fuzzy_threshold": 0.85
    }
}

# Confidence Calculation
# ====================
def calculate_field_confidence(column_name: str, detected_type: str) -> float:
    """Calculate confidence that a column matches a field type"""
    score = 0.0
    
    for pattern in FIELD_PATTERNS[detected_type]["patterns"]:
        if re.search(pattern, column_name, re.IGNORECASE):
            score = max(score, FIELD_PATTERNS[detected_type]["weight"])
    
    # Bonus for exact match
    if column_name.lower() == detected_type.lower():
        score = min(1.0, score + 0.15)
    
    # Bonus for common insurance abbreviations
    abbreviation_bonuses = {
        "si": "sum_insured",
        "dob": "date_of_birth",
        "pol": "policy_number"
    }
    if column_name.lower() in abbreviation_bonuses:
        if abbreviation_bonuses[column_name.lower()] == detected_type:
            score = min(1.0, score + 0.10)
    
    return min(1.0, score)
```

### 3.2 Component 2: Customer Matching Engine

```python
# Fuzzy Matching Algorithm
# =====================

from rapidfuzz import fuzz
from difflib import SequenceMatcher

# Match Types and Weights
MATCH_WEIGHTS = {
    "exact_id": {"threshold": 0.98, "weight": 2.0, "auto_confident": True},
    "name_exact": {"threshold": 0.98, "weight": 1.5, "auto_confident": True},
    "name_fuzzy": {"threshold": 0.85, "weight": 1.2, "auto_confident": False},
    "name_partial": {"threshold": 0.70, "weight": 0.8, "auto_confident": False},
    "dob_match": {"threshold": 1.0, "weight": 1.3, "auto_confident": True},
    "policy_prefix": {"threshold": 0.90, "weight": 1.0, "auto_confident": False},
    "phone_match": {"threshold": 0.98, "weight": 1.4, "auto_confident": True},
    "email_match": {"threshold": 0.98, "weight": 1.5, "auto_confident": True}
}

def calculate_match_score(enrollment_record: dict, claims_record: dict) -> dict:
    """Calculate overall match score between enrollment and claims record"""
    scores = {}
    weighted_sum = 0.0
    total_weight = 0.0
    
    # 1. ID Match
    if enrollment_record.get("member_id") and claims_record.get("policy_id"):
        id_score = fuzz.ratio(
            enrollment_record["member_id"],
            claims_record["policy_id"]
        ) / 100
        scores["id_match"] = id_score
        if id_score >= MATCH_WEIGHTS["exact_id"]["threshold"]:
            scores["id_match"]["confident"] = True
    
    # 2. Name Match (multiple algorithms)
    name_enroll = normalize_name(enrollment_record.get("name", ""))
    name_claim = normalize_name(claims_record.get("patient_name", ""))
    
    name_exact = fuzz.ratio(name_enroll, name_claim) / 100
    name_partial = fuzz.partial_ratio(name_enroll, name_claim) / 100
    name_token = fuzz.token_sort_ratio(name_enroll, name_claim) / 100
    name_set = fuzz.token_set_ratio(name_enroll, name_claim) / 100
    
    scores["name_exact"] = name_exact
    scores["name_fuzzy"] = max(name_partial, name_token, name_set)
    
    # 3. DOB Match
    if enrollment_record.get("dob") and claims_record.get("date_of_birth"):
        dob_enroll = parse_date(enrollment_record["dob"])
        dob_claim = parse_date(claims_record["date_of_birth"])
        if dob_enroll and dob_claim:
            scores["dob_match"] = 1.0 if dob_enroll == dob_claim else 0.0
    
    # 4. Calculate weighted score
    for match_type, match_score in scores.items():
        if match_score > 0:
            weight = MATCH_WEIGHTS.get(match_type, {}).get("weight", 1.0)
            weighted_sum += match_score * weight
            total_weight += weight
    
    # Calculate confidence category
    final_score = weighted_sum / total_weight if total_weight > 0 else 0.0
    
    if final_score >= 0.95:
        category = "AUTO_MATCH"
        action = "auto_map"
    elif final_score >= 0.85:
        category = "HIGH_CONFIDENCE"
        action = "auto_map_with_warning"
    elif final_score >= 0.70:
        category = "MEDIUM_CONFIDENCE"
        action = "review_required"
    else:
        category = "LOW_CONFIDENCE"
        action = "manual_review"
    
    return {
        "score": final_score,
        "category": category,
        "action": action,
        "breakdown": scores,
        "matched_fields": [k for k, v in scores.items() if v > 0]
    }

def normalize_name(name: str) -> str:
    """Normalize name for matching"""
    # Convert to lowercase
    name = name.lower()
    
    # Remove prefixes
    prefixes = ["mr.", "mrs.", "ms.", "dr.", "prof."]
    for prefix in prefixes:
        name = name.replace(prefix, "")
    
    # Standardize variations
    replacements = {
        "john": "jon",  # Common typo
        "philip": "phillip",
        "gopal": "gaurav",
        "sumit": "samit"
    }
    for old, new in replacements.items():
        name = name.replace(old, new)
    
    # Remove special characters
    name = re.sub(r"[^a-z\s]", "", name)
    
    # Normalize spacing
    name = " ".join(name.split())
    
    return name.strip()
```

### 3.3 Component 3: Analytics Engine

```python
# Analytics Generation
# ==================

def generate_analytics(enrollment_data: list, claims_data: list, matches: list) -> dict:
    """Generate comprehensive analytics"""
    
    analytics = {
        "enrollment": {},
        "claims": {},
        "matching": {},
        "diseases": {},
        "trends": {}
    }
    
    # ENROLLMENT ANALYTICS
    analytics["enrollment"] = {
        "total_members": len(enrollment_data),
        "unique_members": len(set(e["member_id"] for e in enrollment_data if e.get("member_id"))),
        "age_distribution": calculate_age_distribution(enrollment_data),
        "sum_insured_distribution": calculate_si_distribution(enrollment_data),
        "family_type_distribution": calculate_family_type(enrollment_data),
        "average_age": calculate_average_age(enrollment_data)
    }
    
    # CLAIMS ANALYTICS
    claims_by_date = group_by(claims_data, "claim_date")
    analytics["claims"] = {
        "total_claims": len(claims_data),
        "claimants_with_claims": len(set(c["member_id"] for c in claims_data if c.get("member_id"))),
        "total_claim_amount": sum(c["claim_amount"] for c in claims_data),
        "average_claim": calculate_average(claims_data, "claim_amount"),
        "median_claim": calculate_median(claims_data, "claim_amount"),
        "claim_rate": len(claims_data) / len(enrollment_data) if enrollment_data else 0,
        "monthly_trends": calculate_monthly_trends(claims_by_date),
        "claim_type_distribution": calculate_claim_type_dist(claims_data)
    }
    
    # DISEASE ANALYSIS
    all_diagnoses = [c.get("diagnosis", "") for c in claims_data]
    analytics["diseases"] = {
        "by_volume": Counter(all_diagnoses).most_common(15),
        "by_amount": aggregate_by_diagnosis_amount(claims_data),
        "category_breakdown": categorize_diseases(all_diagnoses)
    }
    
    # MATCHING QUALITY
    match_scores = [m["score"] for m in matches]
    analytics["matching"] = {
        "total_enrollment": len(enrollment_data),
        "total_claims": len(claims_data),
        "matched": len([m for m in match_scores if m >= 0.85]),
        "review_needed": len([m for m in match_scores if 0.70 <= m < 0.85]),
        "unmatched": len([m for m in match_scores if m < 0.70]),
        "auto_match_rate": len([m for m in match_scores if m >= 0.95]) / len(match_scores),
        "average_match_score": sum(match_scores) / len(match_scores) if match_scores else 0
    }
    
    return analytics

def calculate_age_distribution(enrollment_data: list) -> dict:
    """Calculate age distribution"""
    ages = []
    for record in enrollment_data:
        if record.get("date_of_birth"):
            try:
                dob = parse_date(record["date_of_birth"])
                age = (date.today() - dob).days // 365
                ages.append(age)
            except:
                pass
    
    if not ages:
        return {"18-25": 0, "26-35": 0, "36-45": 0, "46-55": 0, "55+": 0}
    
    return {
        "18-25": count_in_range(ages, 18, 25),
        "26-35": count_in_range(ages, 26, 35),
        "36-45": count_in_range(ages, 36, 45),
        "46-55": count_in_range(ages, 46, 55),
        "55+": count_in_range(ages, 55, 200)
    }

def categorize_diseases(diagnoses: list) -> dict:
    """Categorize diseases into groups"""
    categories = {
        "cardiac": ["heart", "cardiac", "cardiovascular", "hypertension", "bp"],
        "orthopedic": ["ortho", "bone", "fracture", "joint", "spine"],
        "cancer": ["cancer", "tumor", "malignant"],
        "respiratory": ["respiratory", "lung", "asthma", "copd"],
        "gastro": ["gastro", "stomach", "digestive", "liver"],
        "diabetes": ["diabetes", "sugar", "blood sugar"],
        "maternity": ["pregnancy", "maternity", "delivery"],
        "eyes": ["eye", "vision", "cataract"],
        "others": []
    }
    
    categorized = {k: [] for k in categories}
    categorized["others"] = []
    
    for diagnosis in diagnoses:
        diagnosis = diagnosis.lower()
        categorized_flag = False
        for category, keywords in categories.items():
            if any(kw in diagnosis for kw in keywords):
                categorized[category].append(diagnosis)
                categorized_flag = True
                break
        if not categorized_flag:
            categorized["others"].append(diagnosis)
    
    return {k: len(v) for k, v in categorized.items()}
```

---

## 4. HANDLING DIFFERENT INSURER FORMATS

### 4.1 Known Format Templates

```python
# Pre-defined format adapters
# =========================

FORMAT_ADAPTERS = {
    "reliance_gmc": {
        "enrollment": {
            "member_name": "name",
            "member_id": "emp_code", 
            "date_of_birth": "dob",
            "sum_insured": "si",
            "policy_number": "policy_no"
        },
        "claims": {
            "patient_name": "claimant_name",
            "claim_amount": "claim_amt",
            "diagnosis": "illness",
            "claim_date": "claim_date",
            "hospital": "hospital_name"
        },
        "detection": "regex for column headers"
    },
    "kotak_gmc": {
        "enrollment": {
            "name": "employee_name", 
            "member_id": "emp_code",
            "date_of_birth": "date_of_birth",
            "sum_insured": "coverage",
            "policy_number": "pol_no"
        },
        "claims": {
            "name": "patient_name", 
            "amount": "claim_amount",
            "diagnosis": "ailment",
            "date": "claim_date"
        }
    },
    "tata_gmc": {
        "enrollment": {
            "name": "full_name",
            "member_id": "member_id",
            "dob": "birth_date",
            "si": "sum_insured",
            "policy": "policy_number"
        },
        "claims": {
            "patient": "claimant",
            "claim_amt": "amount", 
            "disease": "diagnosis"
        }
    },
    "hdfc_gmc": {
        "enrollment": {
            "member_name": "MemberName",
            "member_id": "EmployeeID",
            "date_of_birth": "Age",  # Calculate DOB from age
            "sum_insured": "Cover",
            "policy_number": "PolicyNo"
        },
        "claims": {
            "name": "MemberName",
            "amount": "Claimed",
            "diagnosis": "Ailment"
        }
    },
    "icici_gmc": {
        "enrollment": {
            "name": "Name",
            "id": "MemberID",
            "dob": "BirthDate",
            "si": "SumInsured",
            "policy": "PolicyNo"
        },
        "claims": {
            "patient": "Name",
            "claim": "ClaimAmount",
            "illness": "Illness"
        }
    }
}

# Format Detection
# ==============

def detect_format(headers: list) -> str:
    """Detect which insurer format this matches"""
    headers_lower = [h.lower().strip() for h in headers]
    
    for format_name, format_spec in FORMAT_ADAPTERS.items():
        matches = 0
        required_fields = list(format_spec["enrollment"].keys())
        
        for field in required_fields:
            for header in headers_lower:
                if field.replace("_", " ") in header or field in header:
                    matches += 1
                    break
        
        if matches >= len(required_fields) * 0.7:
            return format_name
    
    return "unknown"

def apply_format_adapter(records: list, format_name: str) -> list:
    """Apply format adapter to normalize data"""
    if format_name == "unknown" or format_name not in FORMAT_ADAPTERS:
        return records  # Keep as-is, use AI detection
    
    adapter = FORMAT_ADAPTERS[format_name]
    normalized = []
    
    for record in records:
        new_record = {}
        for standard_field, original_field in adapter["enrollment"].items():
            if original_field in record:
                new_record[standard_field] = record[original_field]
        normalized.append(new_record)
    
    return normalized
```

### 4.2 Learning System (Auto-improve)

```python
# Learning System - Save user corrections
# ================================

class MappingLearner:
    """Learn from user corrections to improve mappings"""
    
    def __init__(self):
        self.mappings = {}  # column_name -> field_type
        self corrections = []  # Store corrections
    
    def save_correction(self, column: str, correct_field: str):
        """Save user correction"""
        self.mappings[column.lower()] = correct_field
        self.corrections.append({
            "column": column,
            "corrected_to": correct_field,
            "timestamp": datetime.now()
        })
    
    def get_learned_mapping(self, column: str) -> str:
        """Get learned mapping for column"""
        return self.mappings.get(column.lower())
    
    def suggest_mappings(self, columns: list) -> dict:
        """Suggest mappings including learned"""
        suggestions = {}
        for column in columns:
            # Check learned first
            learned = self.get_learned_mapping(column)
            if learned:
                suggestions[column] = {
                    "field": learned,
                    "confidence": 0.99,
                    "source": "learned"
                }
            else:
                # Use rules
                suggestions[column] = {
                    "field": detect_field_type(column),
                    "confidence": calculate_confidence(column),
                    "source": "rules"
                }
        return suggestions
    
    def export(self) -> dict:
        """Export learned mappings for persistence"""
        return {
            "mappings": self.mappings,
            "total_corrections": len(self.corrections)
        }
```

---

## 5. EDGE CASES HANDLING

### 5.1 Common Edge Cases & Solutions

| Edge Case | Scenario | Solution |
|----------|---------|---------|
| **Empty cells** | DOB missing | Use name-only matching + flag for review |
| **Name variations** | "John Doe" vs "John D" | Fuzzy match with threshold |
| **Duplicate claims** | Same claim 2x | Dedupe by claim_id + amount |
| **Family members** | Child without own ID | Match to parent's policy |
| **Special characters** | Name with unicode | Normalize before matching |
| **Case differences** | JOHN vs john | Convert to lowercase |
| **Spelling errors** | "Phohilp" vs "Philip" | Fuzzy matching |
| **Missing claims** | No claims for member | Create empty match record |
| **Extra spaces** | "John " vs "John" | Strip whitespace |
| **Nicknames** | "William" vs "Bill" | Name synonym mapping |

### 5.2 Error Handling Flow

```python
ERROR_HANDLERS = {
    "empty_dob": {
        "description": "Date of birth missing",
        "impact": "Cannot do DOB matching",
        "handler": lambda e, c: use_name_only_matching(e, c),
        "fallback_confidence": 0.75
    },
    "empty_name": {
        "description": "Name field empty", 
        "impact": "Cannot match at all",
        "handler": lambda e, c: flag_for_manual_review(e, c),
        "fallback_confidence": 0.0
    },
    "duplicate_claim": {
        "description": "Same claim appears twice",
        "impact": "Double counting",
        "handler": lambda e, c: deduplicate_and_notify(c),
        "fallback_confidence": 1.0
    },
    "no_matching_possible": {
        "description": "Low confidence matches",
        "impact": "Requires manual review",
        "handler": lambda e, c: suggest_reupload(e),
        "fallback_confidence": 0.3
    }
}
```

---

## 6. INFRASTRUCTURE & DEPLOYMENT

### 6.1 Backend API Service

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    API SERVICE ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐         │
│  │  FastAPI   │────▶│   FIELD     │────▶│  MATCHING   │         │
│  │  ENDPOINTS │     │  DETECTION │     │   ENGINE    │         │
│  └──────────────┘     └──────────────┘     └──────────────┘         │
│        │                                              │            │
│        ▼                                              ▼            │
│  ┌──────────────┐     ┌──────��─��─────┐     ┌──────────────┐         │
│  │    FILE    │     │  ANALYTICS  │     │   OUTPUT   │         │
│  │   UPLOAD  │     │   ENGINE   │     │   FORMAT  │         │
│  └──────────────┘     └──────────────┘     └──────────────┘         │
│                                                                     │
│  ENDPOINTS:                                                          │
│  POST /api/map/fields    - Detect and map field types                 │
│  POST /api/map/match   - Match enrollment to claims                  │
│  POST /api/map/analyze - Generate analytics                          │
│  POST /api/map/full    - Full pipeline (fields + match + analyze)     │
│  GET  /api/map/status/{job_id} - Check processing status            │
│  POST /api/map/review - Submit manual corrections                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Python Dependencies

```txt
# requirements.txt
# ==============

# Core
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
pydantic>=2.5.0
python-multipart>=0.0.6

# Excel Processing
openpyxl>=3.1.0
pandas>=2.1.0
xlrd>=2.0.0

# Fuzzy Matching
rapidfuzz>=3.5.0
python-Levenshtein>=0.21.0

# NLP (optional, for advanced matching)
spacy>=3.7.0
# python -m spacy download en_core_web_sm

# Caching
redis>=5.0.0
orjson>=3.9.0

# If using local model (Option A)
# transformers>=4.35.0
# torch>=2.1.0
# accelerate>=0.25.0

# If using API (Option C)
# openai>=1.3.0
```

### 6.3 API Endpoints

```python
# api/routes/mapping.py
# ==================

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import pandas as pd

router = APIRouter(prefix="/api/map", tags=["mapping"])

# Request/Response Models
class FieldMappingRequest(BaseModel):
    case_id: str
    enrollment_columns: List[str]
    claims_columns: List[str]

class FieldMappingResponse(BaseModel):
    status: str
    mappings: dict
    confidence_scores: dict
    suggestions: dict

class MatchRequest(BaseModel):
    case_id: str
    enrollment_data: List[dict]
    claims_data: List[dict]
    confidence_threshold: float = 0.85

class MatchResponse(BaseModel):
    matched: List[dict]
    unmatched: List[dict]
    review_needed: List[dict]
    match_rate: float

class AnalyticsResponse(BaseModel):
    enrollment: dict
    claims: dict
    matching: dict
    diseases: dict
    risks: dict

# Full Pipeline Request
class FullMapRequest(BaseModel):
    case_id: str
    enrollment_file: UploadFile  # Will be handled separately
    claims_file: UploadFile
    format_hint: Optional[str] = None

# Endpoints
@router.post("/fields", response_model=FieldMappingResponse)
async def detect_fields(
    enrollment_columns: List[str] = Form(...),
    claims_columns: List[str] = Form(...)
):
    """Detect field types from column headers"""
    # Implementation
    pass

@router.post("/match", response_model=MatchResponse)
async def match_records(request: MatchRequest):
    """Match enrollment to claims records"""
    # Implementation
    pass

@router.post("/analyze", response_model=AnalyticsResponse)
async def generate_analytics(
    enrollment_data: List[dict],
    claims_data: List[dict],
    matches: List[dict]
):
    """Generate analytics from processed data"""
    # Implementation
    pass

@router.post("/full")
async def full_mapping_pipeline(
    case_id: str,
    enrollment_file: UploadFile = File(...),
    claims_file: UploadFile = File(...),
    format_hint: Optional[str] = None
):
    """Full pipeline: field detection + matching + analytics"""
    
    # Step 1: Parse files
    enrollment_df = pd.read_excel(enrollment_file)
    claims_df = pd.read_excel(claims_file)
    
    # Step 2: Detect fields
    field_mappings = detect_all_fields(
        enrollment_df.columns.tolist(),
        claims_df.columns.tolist()
    )
    
    # Step 3: Normalize data
    enrollment_records = normalize(enrollment_df, field_mappings["enrollment"])
    claims_records = normalize(claims_df, field_mappings["claims"])
    
    # Step 4: Match
    matches = match_all_records(enrollment_records, claims_records)
    
    # Step 5: Analytics
    analytics = generate_analytics(enrollment_records, claims_records, matches)
    
    return {
        "status": "success",
        "field_mappings": field_mappings,
        "matches": matches,
        "analytics": analytics,
        "stats": {
            "total_enrollment": len(enrollment_records),
            "total_claims": len(claims_records),
            "matched": len([m for m in matches if m["score"] >= 0.85]),
            "unmatched": len([m for m in matches if m["score"] < 0.70])
        }
    }
```

---

## 7. FRONTEND INTEGRATION

### 7.1 Mapping Screen UI Components

```react
// frontend/src/pages/FieldMappingPage.jsx
// ===================================

export default function FieldMappingPage() {
  const [step, setStep] = useState(1); // 1: detect, 2: review, 3: final
  
  // Step 1: Show AI-detected fields
  const FieldMappingView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Enrollment Columns */}
        <div className="space-y-3">
          <h3>Enrollment File Columns</h3>
          {enrollmentColumns.map((col, idx) => (
            <MappingRow 
              key={idx}
              original={col}
              detected={detectedFields.enrollment[col]}
              confidence={confidence.enrollment[col]}
              onCorrect={(field) => manualOverride(col, field)}
            />
          ))}
        </div>
        
        {/* Claims Columns */}
        <div className="space-y-3">
          <h3>Claims File Columns</h3>
          {claimsColumns.map((col, idx) => (
            <MappingRow 
              key={idx}
              original={col}
              detected={detectedFields.claims[col]}
              confidence={confidence.claims[col]}
              onCorrect={(field) => manualOverride(col, field)}
            />
          ))}
        </div>
      </div>
    </div>
  );
  
  // Step 2: Review matches
  const MatchReviewView = () => (
    <div className="space-y-6">
      {/* Match Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatBox label="Enrolled" value={stats.totalEnrolled} />
        <StatBox label="Claims" value={stats.totalClaims} />
        <StatBox label="Matched" value={stats.matched} color="green" />
        <StatBox label="Review" value={stats.reviewNeeded} color="orange" />
      </div>
      
      {/* Matched Records Table */}
      <DataTable 
        data={matches}
        filter="auto"
        columns={["name", "claims", "amount", "confidence"]}
      />
      
      {/* Unmatched Records Table */}
      <DataTable 
        data={unmatched}
        filter="unmatched"
        columns={["name", "possibleMatch", "confidence"]}
        actions={[
          { label: "Accept Match", onClick: acceptMatch },
          { label: "Re-upload", onClick: requestReupload }
        ]}
      />
    </div>
  );
  
  // Step 3: Analytics
  const AnalyticsView = () => (
    <div className="space-y-6">
      <Charts.Row>
        <Charts.Pie data={ageDistribution} title="Age Distribution" />
        <Charts.Bar data={diseaseDistribution} title="Top Diseases" />
        <Charts.Pie data={claimTypeDistribution} title="Claim Types" />
      </Charts.Row>
      
      <div className="grid grid-cols-2 gap-6">
        <InsightsCard title="Key Insights" insights={insights} />
        <RiskCard title="Risk Assessment" risks={risks} />
      </div>
    </div>
  );
}
```

---

## 8. TESTING STRATEGY

### 8.1 Test Data Requirements

```python
TEST_CASES = {
    "reliance_format": {
        "description": "Standard Reliance GMC format",
        "file": "test_data/reliance_gmc.xlsx",
        "expected_accuracy": 0.98
    },
    "kotak_format": {
        "description": "Kotak format with different headers",
        "file": "test_data/kotak_gmc.xlsx", 
        "expected_accuracy": 0.95
    },
    "mixed_format": {
        "description": "Mixed保险公司 data",
        "file": "test_data/mixed_insurer.xlsx",
        "expected_accuracy": 0.90
    },
    "messy_data": {
        "description": "With typos, missing data",
        "file": "test_data/messy_gmc.xlsx",
        "expected_accuracy": 0.80
    },
    "empty_fields": {
        "description": "Missing DOB, partial names",
        "file": "test_data/gaps_gmc.xlsx", 
        "expected_accuracy": 0.75
    }
}
```

### 8.2 Performance Benchmarks

```python
BENCHMARKS = {
    "field_detection": {
        "target_time": "<100ms per file",
        "target_accuracy": ">95%"
    },
    "matching": {
        "target_time": "<5 seconds for 1000 records",
        "target_auto_match_rate": ">85%"
    },
    "analytics": {
        "target_time": "<2 seconds", 
        "target_metrics": ["age_dist", "disease_dist", "claims_trend"]
    },
    "full_pipeline": {
        "target_time": "<30 seconds for 5000 records",
        "target_accuracy": ">90%"
    }
}
```

---

## 9. QUESTIONS FOR PRODUCT/MVP CLARITY

Before finalizing the implementation plan, please clarify:

### Must Answer Questions

1. **Data Flow**: Should we process locally or upload to processing service?
2. **Model Preference**: Rules-based (fast/free) or AI-powered (accurate)?
3. **Offline Required**: Must work without internet? (affects model choice)
4. **Scale**: Max file size and concurrent users expected?
5. **Customization**: Need to add new insurer formats over time?
6. **Existing Data**: Any historical data to train/learn from?
7. **Integrations**: Need to connect to existing CRM/databases?
8. **Compliance**: Any data handling regulations?

### Nice to Have Answers

1. **UI Preference**: Detailed mapping review or auto-approve?
2. **Manual Override**: Allow user to correct AI mappings?
3. **Export**: Need CSV/Excel export of results?
4. **Alerts**: Notify for high-risk matches?
5. **Audit Trail**: Log all manual corrections?

---

## 10. NEXT STEPS

1. **Approve Architecture** - Choose option (A/B/C or hybrid)
2. **Confirm Requirements** - Answer key questions above
3. **Setup Dev Environment** - Build the engine
4. **Gather Test Data** - Get sample files from insurers
5. **Iterate Development** - Build → Test → Improve
6. **User Testing** - Get underwriter feedback

---

**Document Status**: SPECIFICATION - AWAITING APPROVAL
**Version**: 1.0
**Last Updated**: April 2026