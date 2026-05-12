// RAG Knowledge Base for Goisure GMC AI Underwriting System
// Provides structured context for Gemma 4 analysis of enrollment and claims data
// UPDATED: Field mapping instructions based on QA test results (May 8, 2026)
//
// IMPORTANT FIELD MAPPING NOTES:
// UPDATED: May 11-12, 2026 — Amount Field Constraints, Text Field Exclusions, Diagnosis Rules
//
// CRITICAL AMOUNT FIELD CONSTRAINTS (S23, S48 — Preventing hallucinated amounts):
// Gemma 4 MUST ONLY read amounts from these EXACT field names (in priority order):
//   1. Amount_Approved / AMOUNT_APPROVED / APPROVED_AMOUNT / amount_approved
//   2. Net_Amount_Paid / NET_AMOUNT_PAID / Net_Amount_Paid_Including_GST_After_TDS
//   3. Amount_Paid / Claim_Paid / Settled_Amount
//   4. INCURREDAMOUNT / Incurred_Amount / Incurred Amount / incurred_amount
//   5. AMOUNT_CLAIMED_AL_REQUESTED / AMOUNT_CLAIMED / CLAIMEDAMOUNT
//   6. Net_Amount_paid_Including_GST_After_TDS (note: lowercase 'paid')
//   7. ChequeAmt / cheque_amt / CHEQUE_AMT
//   8. Amount_Claimed / amount_claimed / Claimed_Amount / claimed_amount / CLAIMED_AMOUNT
//   9. Billed_Amount / GROSS_AMOUNT / gross_amount
//   10. TOTAL_AMOUNT_APPROVED / total_amount_approved / Total_Amount_Claimed
// Treat '-' (dash), 'N/A', 'TBD', 'Claim Pending', empty strings as 0.
// Strip commas, ₹ symbols, Rs, and whitespace before parsing.
//
// FIELDS THAT ARE NEVER AMOUNTS (S23 — These are identifiers, NOT financial data):
//   - Any field with: ID, Code, Number, Policy, Member, Employee, Serial, Ref, Claim#, Invoice
//   - Example: POLICY_NUMBER, MEMBER_ID, EMPLOYEE_NO, CLAIM_NO, POLICY_SERIAL, MEMBER_CODE
//   - Example: AGE, AGE_OF_PATIENT, Serial_No, Ref_No, Invoice_No, Claim_ID, Member_Number
//   - If the field name contains a NUMBER pattern (like "15" in POLICY_15) it is STILL an ID
//   - If the field looks like it could be a count or code (6+ digits, repeating pattern), it is NOT an amount
//
// TEXT FIELDS TO NEVER READ AS AMOUNTS (S48 — Free-text fields with embedded numbers):
//   - Remarks / Note / Description / Comment / Instruction / Reason / Memo
//   - Text / Narrative / Admin / Status_text / Claim_Notes / Doctor_Notes / Observations
//   - Example: "Remarks: Please approve" — the "Please approve" is NOT an amount
//   - Example: "Description: Claim settled for 50000" — only 50000 is the amount (from Amount field)
//   - NEVER extract numbers from text fields. Text fields contain narrative, not financial data.
//
// DIAGNOSIS FIELD EXCLUSIONS (S47 — No fabricated diagnosis codes):
//   - Only cite ICD10 codes, diagnosis names, or procedure codes if the claims file has a column
//     explicitly named: Diagnosis / ICD_CODE / ICD10 / Procedure_Code / Diagnosis_Code
//   - Do NOT generate or infer medical codes. "J18.9" or "Pneumonia" only if column exists.
//   - Fabricated diagnosis codes could justify wrong claim denials — this is a legal liability.
//
// 1. Enrollment records may NOT have an Employee_ID/EmployeeCode field.
//    When absent, match claims to enrollment using NAME + DOB + Relationship (not just name alone).
//    Claims often have: EMPLOYEE_NO, INSURED_OR_EMPLOYEE_NAME, Patient_name
//    Fallback matching order: EMPLOYEE_NO (exact) -> Patient_name + AGE (fuzzy) -> INSURED_OR_EMPLOYEE_NAME (fuzzy)
//
// 2. Claim amounts — use the following priority order:
//    a) Amount_Approved / AMOUNT_APPROVED / APPROVED_AMOUNT (BEST — approved amount)
//    b) NET_AMOUNT_PAID / Net_Amount_Paid (paid amount)
//    c) INCURREDAMOUNT / Incurred_Amount (incurred liability)
//    d) CLAIMEDAMOUNT / AMOUNT_CLAIMED / Claimed Amount (claimed — use when no approved/paid)
//    e) TOTAL_AMOUNT_APPROVED (legacy fallback)
//    Treat '-' (dash) as 0. Strip commas, ₹ symbols, and whitespace before parsing.
//    NEVER use as amounts: employee IDs, policy numbers, claim numbers, hospital codes.
//
// 3. Gender normalization (CRITICAL — enrollment often lacks gender, use claims_data):
//    - The GENDER field exists in claims_data, NOT in enrollment (raw_data).
//    - Values: 'M'/'F' (single uppercase letter), or 'Male'/'Female'/'male'/'female'.
//    - Always normalize: M/m/Male/male -> 'Male', F/f/Female/female -> 'Female'.
//    - Gender distribution must be computed from claims_data GENDER, not structured_data.
//    - Output as PERCENTAGE of claims (not raw counts): Male 47%, Female 53%, Other 0%.
//
// 4. Date parsing for quarterly trends:
//    - DOA field format: "3/25/2026 12:00:00 AM" (MM/DD/YYYY with time)
//    - INWARD_DATE format: "06-APR-2026" (DD-MMM-YYYY)
//    - POLICY_START_DATE format: "2025-05-13T00:00:00" (ISO 8601)
//    - Parse all formats to YYYY-MM before quarter bucketing.
//    - Buckets: Q1 FY24-25 (2024-04 to 2024-06), Q2 FY24-25 (2024-07 to 2024-09),
//               Q3 FY24-25 (2024-10 to 2024-12), Q4 FY24-25 (2025-01 to 2025-03),
//               Q1 FY25-26 (2025-04 to 2025-06)
//
// 5. Sum_Insured may be called "Sum Insured", "BASICS_SUM_INSURED", "SumInsured", or "BALANCE_SI".
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
  
  IMPORTANT AMOUNT FIELD CONSTRAINTS (must follow exactly):
  ONLY use these fields for claim amounts (in priority order):
    1. Amount_Approved / AMOUNT_APPROVED / APPROVED_AMOUNT
    2. Net_Amount_Paid / NET_AMOUNT_PAID / Net_Amount_Paid_Including_GST_After_TDS
    3. INCURREDAMOUNT / Incurred_Amount
    4. AMOUNT_CLAIMED_AL_REQUESTED / AMOUNT_CLAIMED / CLAIMEDAMOUNT
    5. TOTAL_AMOUNT_APPROVED / Total_Amount_Claimed
  Treat '-' (dash), 'N/A', 'TBD' as 0. Strip commas, Rs, symbols before parsing.
  
  NEVER use as amounts: Any field with ID/Code/Number/Policy/Member/Employee in name.
  Examples to NEVER read as amounts: POLICY_NUMBER, MEMBER_ID, EMPLOYEE_NO, AGE_OF_PATIENT, Serial_No.
  
  NEVER extract numbers from text fields (Remarks, Note, Description, Comment, Memo, etc.)
  Example: "Remarks: Please approve 50000" — the 50000 is NOT a claim amount.
  
  Input: Enrollment records with Name, Age, DOB, Gender, Relationship (Employee_ID may be EMPTY)
  Input: Claims records with EMPLOYEE_NO, INSURED_OR_EMPLOYEE_NAME, Patient_name, AGE, and AMOUNT fields above
  
  Task:
  1. Match claims to enrollment records using EMPLOYEE_NO -> EmployeeCode (exact match preferred)
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
  
  IMPORTANT: Only calculate totals from the AUTHORIZED amount fields listed above.
  If you see a field with ID/Code/Number in the name — it is NOT a financial amount.
  Only fields named: Amount_Approved, NET_AMOUNT_PAID, CLAIMEDAMOUNT, TOTAL_AMOUNT_APPROVED are valid.
  
  Input: Matched enrollment + claims data with member-level aggregation
  
  Analyze:
  1. Loss ratio (claims/premium)
  2. Claims frequency per member
  3. Average claim size
  4. High-cost claims (>100000)
  5. Age distribution risk
  6. Gender distribution
  7. Department concentration
  8. Chronic conditions (if diagnosed in claims)
  
  Only cite ICD10 codes, diagnosis names, or procedure codes if a Diagnosis/ICD_CODE/Procedure_Code column exists in the data.
  Do NOT fabricate medical codes.
  
  Calculate:
  - Base premium (sum_insured x rate)
  - Burn cost premium (total_claims x 1.2)
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
  
  IMPORTANT: Only generate insights from actual data fields.
  Only cite diagnosis codes or medical descriptions if the claims file has a column explicitly
  named: Diagnosis / ICD_CODE / ICD10 / Procedure_Code / Diagnosis_Code.
  Do NOT fabricate or infer medical information.
  
  Analyze patterns and provide recommendations:
  1. Identify high-risk members (frequent claims, high amounts)
  2. Detect department-level patterns
  3. Flag concentration risks (top 3 members %)
  4. Age/gender-based observations
  5. Seasonal or temporal patterns in claims
  6. Hospital preference patterns
  7. Diagnosis category trends (only if Diagnosis column exists)
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

