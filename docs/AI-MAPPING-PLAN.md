# AI-Powered Field Mapping & Analytics Platform
## MVP Phase 2: Core Feature Specification

---

## 1. PROBLEM STATEMENT

### The Challenge
Different Insurance Companies (Reliance, Kotak, Tata, HDFC, ICICI, etc.) provide enrollment and claims data in **completely different formats**:

| Company | Enrollment Columns | Claims Columns |
|---------|-------------------|----------------|
| **Reliance** | Member ID, Name, DOB, Sum Insured | Policy No, Claimant Name, Claim Amount, Diagnosis |
| **Kotan** | Emp Code, Employee Name, Date of Birth, SI | Ref No, Patient Name, Claim Amt, Illness |
| **Tata** | ID, Full Name, Birth Date, Coverage | Claim ID, Patient, Amount, Disease |
| **HDFC** | EmployeeID, MemberName, Age, Cover | ClaimNo, MemberName, Claimed, Ailment |

**Current State**: Manual mapping required for each upload - slow, error-prone, not scalable.

---

## 2. SOLUTION OVERVIEW

### Core AI Capabilities

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AI MAPPING ENGINE                      │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐  │
│  │   FIELD     │   │  CUSTOMER    │   │  ANALYTICS  │  │
│  │ DETECTION  │──▶│   MATCHING   │──▶│   ENGINE    │  │
│  │    AI      │   │      AI      │   │            │  │
│  └──────────────┘   └──────────────┘   └──────────────┘  │
│         │                 │                 │               │
│         ▼                 ▼                 ▼            │
│  ┌─────────────────────────────────────────────────────┐ │
│  │            STRUCTURED OUTPUT DATABASE               │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 3. TECHNICAL ARCHITECTURE

### 3.1 Field Detection AI

**Purpose**: Automatically identify what each column represents across different formats

**Approach**: 
- Use embedding-based classification (small LLM or rule-based with ML fallback)
- Pre-trained on common insurance field names

**Field Categories to Detect**:
```
IDENTITY_FIELDS:
  - name: [member_name, employee_name, patient_name, full_name, name]
  - id: [member_id, emp_code, employee_id, policy_member_id, id]
  - dob: [date_of_birth, dob, birth_date, birthdate, date_of_birth]

COVERAGE_FIELDS:
  - sum_insured: [sum_insured, si, coverage, cover_amount, sum_assured]
  - policy_number: [policy_no, policy_number, policy_ref, pol_no]

CLAIMS_FIELDS:
  - claim_amount: [claim_amount, claimed_amount, claim_amt, amount]
  - diagnosis: [diagnosis, illness, ailment, disease, condition]
  - claim_date: [claim_date, date_of_claim, submitted_on]
```

### 3.2 Customer Matching AI

**Purpose**: Match enrollment records to claims records (fuzzy matching)

**Matching Algorithm**:
```
1. EXACT MATCH (100% confidence)
   - Same Member ID in both files
   
2. FUZZY MATCH (70-99% confidence)
   - Name similarity (Levenshtein, Jaro-Winkler)
   - DOB matching
   - Policy number prefix matching
   
3. PARTIAL MATCH (50-70% confidence)
   - Name + partial DOB
   - Common prefix in policy numbers
   
4. NO MATCH (<50% confidence)
   - Flag for manual review / re-upload
```

**Confidence Thresholds**:
| Score | Action |
|-------|--------|
| ≥95% | Auto-map (Green) |
| 70-94% | Auto-map with warning (Yellow) |
| 50-69% | Manual review required (Orange) |
| <50% | Unmatched - require re-upload (Red) |

### 3.3 Analytics Engine

**Dashboard Metrics**:

```
ENROLLMENT ANALYTICS:
  ├── Total Enrolled Members
  ├── Active Members (current policy)
  ├── Family Size Distribution (Self/So/Self+Family)
  ├── Age Distribution
  ├── Sum Insured Distribution
  
CLAIMS ANALYTICS:
  ├── Total Claims Filed
  ├── Claims Frequency
  ├── Total Claim Amount
  ├── Average Claim per Member
  ├── Claim Amount Distribution
  
DISEASE/ILLNESS ANALYSIS:
  ├── Top 10 Diseases by Claim Volume
  ├── Top 10 Diseases by Claim Amount
  ├── Seasonal Trends
  ├── Pre-existing Conditions
  
MATCHING QUALITY:
  ├── Match Rate (% successfully matched)
  ├── Unmatched Records
  -需要 Re-upload 的 Records
```

---

## 4. USER INTERFACE SCREENS

### 4.1 Field Mapping Screen

```
┌─────────────────────────────────────────────────────────────────────┐
│  CASE: TechCorp Industries  |  Policy: POL-2024-001  │
├─────────────────────────────────────────────────────────────────────┤
│  Step 1: Upload  →  Step 2: AI Mapping  →  Step 3: Review  │
├─────────────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              AI MAPPING RESULTS                     │  │
│  │                                                     │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │  ENROLLED   │  │   CLAIMS    │  │   MATCHED   │  │  │
│  │  │    487     │  │     156    │  │   142      │  │  │
│  │  │  members   │  │   claims   │  │   (91%)    │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  FIELD MAPPING DETECTED                              │  │
│  │                                                     │  │
│  │  Enrollment:          Claims:                        │  │
│  │  ─────────────────    ───────────────���─           │  │
│  │  Member ID    →  Policy No (95%)                   │  │
│  │  Name        →  Patient Name (98%)                  │  │
│  │  DOB         →  Date of Birth (92%)                 │  │
│  │  Sum Insured →  Coverage (89%)                      │  │
│  │                                                     │  │
│  │  [Regenerate Mapping]  [Manual Override]            │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  ANALYTICS DASHBOARD                                │  │
│  │                                                     │  │
│  │  [Pie: Claims by Type]  [Bar: Top Diseases]         │  │
│  │                                                     │  │
│  │  Key Insights:                                      │  │
│  │  • 23% claim rate (above industry avg of 18%)       │  │
│  │  • Top claim: Orthopedic (34%)                      │  │
│  │  • Avg claim: ₹45,000                               │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  MATCHED RECORDS (142)    SEARCH: [___________]    │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │ Member      │ Claims  │ Amount  │ Status      │   │  │
│  │  ├──────────────────────────────────────────────┤   │  │
│  │  │John Doe    │ 3       │ ₹1.2L   │ ✓ Mapped    │   │  │
│  │  │Priya Singh│ 1       │ ₹45K    │ ✓ Mapped    │   │  │
│  │  │Rahul M.   │ 2       │ ₹89K    │ ⚠ Warning  │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  UNMATCHED RECORDS (14)    ACTION: [Re-upload Excel] │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │ Name          │ Possible Match │ Confidence    │   │  │
│  │  ├──────────────────────────────────────────────┤   │  │
│  │  │ Amit Kumar   │ Amit K.       │ 68%  [Accept] │   │  │
│  │  │ Sarah J.    │ -             │ -    [Ignore]│   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └──────────���─���────────────────────────────────────────┘  │
│                                                             │
│            [Save & Continue to Underwriting]             │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Analytics Panel (Expandable)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DETAILED ANALYTICS                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                             │
│  ENROLLMENT INSIGHTS          CLAIMS INSIGHTS              │
│  ┌──────────────────────┐    ┌──────────────────────┐    │
│  │ Total: 487 members   │    │ Claims: 156 filed     │    │
│  │ Avg Age: 34 years    │    │ Claim Rate: 32%       │    │
│  │ Families: 67%       │    │ Total: ₹45,00,000     │    │
│  └──────────────────────┘    └──────────────────────┘    │
│                                                             │
│  AGE DISTRIBUTION            TOP DISEASES                     │
│  ████████░░ 18-25 (15%)     ████████████ Ortho (34%)        │
│  ████████████ 26-35 (38%)  ████████ Cardiac (18%)         │
│  █████████░░ 36-45 (32%)   ██████ Cancer (12%)              │
│  ███████░░░░ 46+ (15%)      ████ Others (36%)              │
│                                                             │
│  SUM INSURED DISTRIBUTION   CLAIM TRENDS                    │
│  ██████████ ₹5L (23%)       Jan ████████ (23%)             │
│  ████████████████████ ₹10L  Feb ██████████ (31%)           │
│  (45%)                       Mar ███████████ (26%)         │
│  ████████ ₹15L+ (32%)       Apr ██████ (20%)              │
│                                                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. DATA PIPELINE

### 5.1 Processing Flow

```
UPLOAD EXCEL FILES
       │
       ▼
┌──────────────┐
│  EXCEL      │
│  PARSER    │
└──────────────┘
       │
       ▼
┌──────────────┐
│  FIELD     │◀─── AI detects column meanings
│  DETECTION │
└──────────────┘
       │
       ▼
┌──────────────┐
│  NORMALIZE  │─── Standardize column names
│   DATA     │
└──────────────┘
       │
       ▼
┌──────────────┐
│  CUSTOMER   │◀─── Fuzzy matching algorithm
│  MATCHING  │
└──────────────┘
       │
       ▼
┌──────────────┐
│  ANALYTICS  │─── Generate metrics & insights
│   ENGINE   │
└──────────────┘
       │
       ▼
┌──────────────┐
│  UI RENDER  │─── Display results to user
│   SCREEN    │
└──────────────┘
```

### 5.2 Data Schema

```javascript
// Case Record
{
  case_id: "CASE-001",
  client_name: "TechCorp Industries",
  enrollment: {
    total_records: 487,
    fields_mapped: {
      name: "Member Name",
      id: "Member ID", 
      dob: "Date of Birth"
    }
  },
  claims: {
    total_records: 156,
    fields_mapped: {
      name: "Patient Name",
      amount: "Claim Amount",
      diagnosis: "Illness"
    }
  },
  matches: {
    matched: 142,
    unmatched: 14,
    confidence_threshold: 0.70
  },
  analytics: {
    enrollment_insights: { /* ... */ },
    claims_insights: { /* ... */ },
    disease_breakdown: { /* ... */ }
  }
}

// Matched Record
{
  id: "MATCH-001",
  enrollment_record: {
    member_id: "EMP001",
    name: "John Doe",
    dob: "1990-05-15",
    sum_insured: 500000
  },
  claim_records: [
    {
      claim_id: "CLM001",
      amount: 45000,
      diagnosis: "Orthopedic",
      date: "2024-03-15"
    }
  ],
  match_confidence: 0.95
}
```

---

## 6. AI MODEL APPROACH

### 6.1 Option A: Local Small Model (Recommended for MVP)

**Model**: TinyLlama or similar small instruction-tuned model
**Size**: ~1-2B parameters
**Deployment**: Run locally on server (no API costs)

**Pros**:
- No per-call API costs
- Complete data privacy (data stays in India)
- Customizable with insurance domain knowledge
- Works offline

**Cons**:
- Initial setup time
- Requires model hosting infrastructure

### 6.2 Option B: Embedding + Rules Hybrid

**Approach**:
1. Use sentence-transformers for embeddings
2. Classification rules for field detection
3. Fuzzy matching with TF-IDF

**Pros**:
- Fast, no LLM inference needed
- High accuracy for structured data
- Low compute requirements

**Cons**:
- Less flexible than LLM

### 6.3 Implementation Plan

```
WEEK 1-2: Data Pipeline
├── Build Excel parser
├── Create field detection rules
├── Implement normalization layer

WEEK 3-4: Matching Algorithm
├── Implement fuzzy matching
├── Build confidence scoring
├── Create re-match workflow

WEEK 5-6: Analytics Engine
├── Build metric calculations
├── Create visualization components
├── Design dashboard UI

WEEK 7-8: Integration & Testing
├── End-to-end testing with real data
├── User acceptance testing
├── Bug fixes & refinements
```

---

## 7. HANDLING DIFFERENT INSURER FORMATS

### 7.1 Format Adapter System

```javascript
// Known format templates
const FORMAT_TEMPLATES = {
  reliance: {
    name_mapping: { member_name: 'name', emp_code: 'id', dob: 'dob' },
    claims_mapping: { policy_no: 'policy_id', claimant: 'name', claim_amt: 'amount' }
  },
  kotak: {
    name_mapping: { employee_name: 'name', emp_code: 'id', date_of_birth: 'dob' },
    claims_mapping: { ref_no: 'claim_id', patient: 'name', illness: 'diagnosis' }
  },
  // ... add more as needed
};

// AI detects format first, then applies template
// Falls back to generic field detection if unknown
```

### 7.2 Learning System

```
First Upload → AI detects fields → User confirms/corrects → Save as Template
                                    ↓
                           Future uploads → Auto-match template
```

---

## 8. SUCCESS METRICS

### MVP Goals

| Metric | Target |
|--------|--------|
| Field Detection Accuracy | >90% |
| Auto-Match Rate | >85% |
| User Manual Corrections | <15% |
| Processing Time | <30 seconds per file |
| Unmatched Records | <10% |

### Differentiation vs Competitors

| Feature | Our Platform | Competitors |
|--------|-------------|------------|
| AI Auto-Mapping | ✅ | ❌ Manual |
| Multi-format Support | ✅ | ❌ Fixed format |
| Real-time Analytics | ✅ | ❌ Post-upload |
| Fuzzy Matching | ✅ | ❌ Exact only |
| Local Data Processing | ✅ | ❌ Cloud only |

---

## 9. RISKS & MITIGATION

| Risk | Impact | Mitigation |
|------|--------|------------|
| Poor Excel quality | High | Data validation + re-upload flow |
| New format not detected | Medium | Manual Override + learn |
| Matching confidence low | Medium | Clear UI for manual review |
| Performance issues | Medium | Optimize algorithm, pagination |

---

## 10. NEXT STEPS

1. **Approve this plan** - Product + Engineering alignment
2. **Setup AI environment** - Choose model approach
3. **Gather sample data** - Get real files from each insurer
4. **Build MVP** - Iterative development
5. **Test with real users** - Underwriter feedback

---

**Document Status**: PLANNING
**Created**: April 2026
**Version**: 1.0