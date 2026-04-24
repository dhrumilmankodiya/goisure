# Goisure AI Model Training - Data Sets 0
## Improved Field Mapping & Matching Guidelines

---

## Matching Strategy (Priority Order)

### 1. EXACT MATCH (Score: 100%)
- Clean both names (uppercase, remove special chars)
- Compare cleaned strings exactly

### 2. FIRST NAME MATCH (Score: 92%)
- Extract first word from claim name
- Match against enrollment name
- Example: "AKSHAY KADAM" → "AKSHAY" ✓

### 3. FUZZY MATCH (Score: 80-85%)
- Use SequenceMatcher for string similarity
- Threshold: ≥80% similarity
- Apply 0.90 multiplier for confidence

---

## Name Cleaning Rules

```python
def clean_name(name):
    # 1. Uppercase
    name = str(name).upper()
    # 2. Remove special characters
    name = re.sub(r'[^A-Z\s]', '', name)
    # 3. Strip whitespace
    name = name.strip()
    return name
```

---

## Match Confidence Thresholds

| Score | Action | Color |
|-------|--------|-------|
| ≥85% | Auto-map | 🟢 GREEN |
| 70-84% | Flag for review | 🟡 YELLOW |
| <70% | Unmatched | 🔴 RED |

---

## Field Detection Patterns

### Enrollment Fields
```python
ENROLLMENT_FIELDS = {
    'name': ['Name', 'member_name', 'employee_name'],
    'gender': ['Gender', 'sex'],
    'relationship': ['Relationship', 'relation'],
    'dob': ['Date of Birth', 'dob', 'birth_date'],
    'age': ['Age'],
    'sum_insured': ['Sum Insured', 'si', 'coverage']
}
```

### Claims Fields
```python
CLAIMS_FIELDS = {
    'patient_name': ['Patient_name', 'patient_name', 'insured_name'],
    'employee_no': ['EMPLOYEE_NO', 'emp_no', 'member_code'],
    'dob': ['DATE_OF_BIRTH', 'dob'],
    'amount_claimed': ['Total_Amount_Claimed', 'claimed'],
    'amount_approved': ['TOTAL_AMOUNT_APPROVED', 'approved'],
    'diagnosis': ['ICD_CODE_LEVEL_1_DESCRIPTION', 'diagnosis'],
    'hospital': ['HOSPITAL_NAME', 'hospital'],
    'claim_status': ['CLAIM_STATUS', 'status']
}
```

---

## Data Set 0 Results

| Metric | Value |
|--------|-------|
| Enrolled Members | 681 |
| Claims | 31 |
| Match Rate | 80.6% |
| High Confidence Matches | 25 |
| Unmatched | 6 |
| Total Claimed | ₹1,929,046 |
| Total Approved | ₹1,526,649 |
| Approval Rate | 79.1% |

---

## Claims Status Distribution

| Status | Count | Amount |
|--------|-------|--------|
| Paid | 23 | ₹1,526,649 |
| Denied | 4 | ₹0 |
| Outstanding | 3 | ₹0 |
| Cancelled | 1 | ₹0 |

---

## Top Diseases

1. Infectious & parasitic diseases: 6
2. Symptoms & signs: 4
3. Genitourinary system: 3
4. Pregnancy/childbirth: 3
5. Respiratory system: 2

---

## Enrollment Demographics

- Male: 31, Female: 264
- SELF: 257, SPOUSE: 176, CHILD: 248
- Sum Insured: ₹200,000 (all)
- Age Range: 0-69 years (avg: 24.4)

---

## Improvement Recommendations

1. **Add Employee ID matching** - Match on EMPLOYEE_NO field
2. **Expand fuzzy threshold** - Lower to 75% for longer names
3. **Handle name suffixes** - Jr., Sr., etc.
4. **Add phonetic matching** - Handle spelling variations

---

**Version**: 1.1
**Updated**: April 2026