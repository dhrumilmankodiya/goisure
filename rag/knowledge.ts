// RAG Knowledge Base for Goisure GMC AI Underwriting System
// Provides structured context for Gemma 4 analysis of enrollment and claims data
// UPDATED: Field mapping instructions based on QA test results (May 8, 2026)
//
// IMPORTANT FIELD MAPPING NOTES:
// 1. Enrollment records may NOT have an Employee_ID/EmployeeCode field.
//    When absent, match claims to enrollment using NAME + DOB + Relationship (not just name alone).
//    Claims often have: EMPLOYEE_NO, INSURED_OR_EMPLOYEE_NAME, Patient_name
//    Fallback matching order: EMPLOYEE_NO (exact) → Patient_name + AGE (fuzzy) → INSURED_OR_EMPLOYEE_NAME (fuzzy)
//
// 2. Claim amounts — use TOTAL_AMOUNT_APPROVED as the primary amount field.
//    DO NOT use AMOUNT_CLAIMED_AL_REQUESTED (includes rejected/deducted amounts).
//    Fields to check in order: TOTAL_AMOUNT_APPROVED → Net_Amount_paid_Including_GST_After_TDS → Total_Amount_Claimed
//    Treat '-' (dash) as 0. Strip commas, ₹ symbols, and whitespace before parsing.
//
// 3. Gender normalization: accept Male/MALE/male, FEMALE/Female/female, Other.
//    DO NOT treat case differences as new genders — normalize to title case.
//
// 4. Sum_Insured may be called "Sum Insured", "BASICS_SUM_INSURED", "SumInsured", or "BALANCE_SI".
//    Use the first non-zero, non-empty value found.

export interface ClaimRecord {
  ClaimID: string;
  EmployeeCode: number;
  ClaimAmount: number;
  ClaimDate: string;
  ClaimStatus: string;
  Diagnosis: string;
  Hospital: string;
}

export interface EnrollmentRecord {
  EmployeeCode: number;
  MemberName: string;
  Age: number;
  AgeBand: string;
  SumInsured: number;
  Relation: string;
  Gender: string;
  Department: string;
  PreExistingConditions?: string;
  ChronicCondition?: boolean;
}

export interface MatchResult {
  claim_index: number;
  matched_enrollment_id: number;
  match_method: string;
  confidence: number;
}

// Risk assessment criteria
export const RISK_CRITERIA = {
  HIGH_CLAIM_AMOUNT: 100000,
  HIGH_CLAIM_FREQUENCY: 5,
  HIGH_LOSS_RATIO: 60,
  AGE_HIGH_RISK: 55,
  AGE_LOW_RISK: 25,
  CHRONIC_CONDITION_PENALTY: 0.15,
  CONCENTRATION_THRESHOLD: 0.5
};

// Coverage tiers for recommendations
export const COVERAGE_TIERS = {
  ESSENTIAL: {
    name: 'Essential Plan',
    tier: 'Entry Level',
    premiumPerLac: 1814,
    features: [
      'Base sum insured coverage',
      'Standard exclusions',
      'No additional loadings',
      'Basic hospitalization cover'
    ],
    recommended: false
  },
  STANDARD: {
    name: 'Standard Plan',
    tier: 'Mid-Market',
    premiumPerLac: 2284,
    features: [
      'Full sum insured coverage',
      'Maternity benefit',
      'Day care procedures',
      'Ambulance cover'
    ],
    recommended: false
  },
  ENHANCED: {
    name: 'Enhanced Plan',
    tier: 'Premium Protection',
    premiumPerLac: 2398,
    features: [
      'Enhanced sum insured',
      'No co-pay for 60+ age',
      'International second opinion',
      'Annual health checkup'
    ],
    recommended: true
  }
};

// Analysis prompts for Gemma 4
export const GEMMA4_PROMPTS = {
  CLAIM_MATCHING: `Analyze enrollment and claims data to identify matching candidates.
  
  Input: Enrollment records with Name, Age, DOB, Gender, Relationship (Employee_ID may be EMPTY)
  Input: Claims records with EMPLOYEE_NO, INSURED_OR_EMPLOYEE_NAME, Patient_name, AGE, AMOUNT_CLAIMED_AL_REQUESTED, TOTAL_AMOUNT_APPROVED, Net_Amount_paid_Including_GST_After_TDS
  
  CRITICAL: Use TOTAL_AMOUNT_APPROVED for claim amounts (NOT AMOUNT_CLAIMED_AL_REQUESTED which includes rejected amounts).
  If TOTAL_AMOUNT_APPROVED is empty/'-', fall back to Net_Amount_paid_Including_GST_After_TDS.
  
  Task:
  1. Match claims to enrollment records using EMPLOYEE_NO → EmployeeCode (exact match preferred)
  2. If EmployeeCode unavailable (empty in enrollment), use NAME + AGE + DOB fuzzy matching
  3. Return confidence score (0-100) for each match
  4. Identify unmatched claims that may belong to dependents (matched by name prefix/suffix)
  
  Output format:
  {
    "matches": [
      {
        "claim_index": number,
        "matched_enrollment_id": number,
        "confidence": number,
        "match_method": "EMPLOYEE_ID|NAME_MATCH|PARTIAL"
      }
    ],
    "unmatched_claims": number[]
  }`,

  RISK_ANALYSIS: `Perform comprehensive risk analysis on enrollment and claims data.
  
  Input: Matched enrollment + claims data with member-level aggregation
  
  Analyze:
  1. Loss ratio (claims/premium)
  2. Claims frequency per member
  3. Average claim size
  4. High-cost claims (>₹100,000)
  5. Age distribution risk
  6. Gender distribution
  7. Department concentration
  8. Chronic conditions (if diagnosed in claims)
  
  Calculate:
  - Base premium (sum_insured × rate)
  - Burn cost premium (total_claims × 1.2)
  - Recommended adjustment percentage
  - Risk factors and loadings
  
  Output format:
  {
    "loss_ratio": number,
    "premium_recommendation": {
      "base": number,
      "adjusted": number,
      "change_percent": number,
      "recommendation": "Increase|Decrease|Maintain"
    },
    "risk_factors": string[],
    "loadings": {
      "factor": string,
      "percentage": number,
      "severity": "low|medium|high"
    }[]
  }`,

  INSIGHT_GENERATION: `Generate actionable underwriting insights.
  
  Analyze patterns and provide recommendations:
  1. Identify high-risk members (frequent claims, high amounts)
  2. Detect department-level patterns
  3. Flag concentration risks (top 3 members %)
  4. Age/gender-based observations
  5. Seasonal or temporal patterns in claims
  6. Hospital preference patterns
  7. Diagnosis category trends
  8. Pre-existing condition indicators
  
  Output format:
  {
    "insights": [
      {
        "type": "risk|opportunity|pattern",
        "title": string,
        "description": string,
        "severity": "high|medium|low",
        "affected_members": number,
        "financial_impact": number
      }
    ]
  }`
};

// Validation rules for Gemma 4 output
export const VALIDATION_RULES = {
  REQUIRED_FIELDS: {
    enrollment: ['EmployeeCode', 'MemberName', 'Age', 'SumInsured'],
    claims: ['ClaimID', 'ClaimAmount', 'ClaimDate'],
    match: ['claim_index', 'matched_enrollment_id', 'confidence']
  },
  RANGE_CHECKS: {
    age: { min: 18, max: 100 },
    sum_insured: { min: 50000, max: 10000000 },
    claim_amount: { min: 0, max: 5000000 },
    confidence: { min: 0, max: 100 }
  },
  MANDATORY_CALCULATIONS: [
    'total_enrolled',
    'total_claims',
    'total_claimed',
    'loss_ratio',
    'estimated_premium',
    'average_claim_size'
  ]
};

// Error recovery templates for Gemma 4
export const ERROR_RECOVERY = {
  MISSING_DATA: `If enrollment or claims data is missing required fields:
  1. Attempt to infer missing values from available data
  2. Use defaults: Age=35, SumInsured=500000
  3. Flag records with "needs_review": true
  4. Continue analysis with available data`,
  
  PARSE_ERROR: `If JSON parsing fails:
  1. Check for unescaped characters in string fields
  2. Ensure all numeric fields are properly formatted
  3. Validate that arrays contain objects with correct structure
  4. Use try-catch for field-level validation`,
  
  CALCULATION_ERROR: `If calculations produce invalid results:
  1. Verify divisor is not zero
  2. Check for null/undefined values
  3. Use safe defaults: rate=0.0, count=0
  4. Flag calculation as "estimated" if based on incomplete data`
};

