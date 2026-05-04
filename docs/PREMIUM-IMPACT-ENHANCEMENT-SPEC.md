# Enhanced Premium Impact Section — SPEC
**Goisure AI Analysis Hub**
**Version:** 2.0 | **Date:** May 2, 2026

---

## 1. OVERVIEW

### Current State (v1.0)
The Premium Impact card shows a simple 3-column grid: Base Premium → Adjustment % → Final Premium

### Enhanced State (v2.0)
Two sub-sections within the Premium Impact section:
1. **Premium Impact Detail** — Expanded breakdown with visual flow
2. **Pre-made Plans** — 5 tiered insurance plan options to choose from

---

## 2. PREMIUM IMPACT DETAIL SECTION

### 2.1 Metrics to Show

| Metric | Source Field | Display |
|--------|-------------|---------|
| Base Premium | `premium_impact.base_premium` | ₹XX,XX,XXX |
| Burn Cost | `total_claimed` | ₹XX,XX,XXX |
| Pure Premium | `base_premium + burn_cost_impact` | ₹XX,XX,XXX |
| Loading/Discount | Sum of factor % | ±XX% (color coded) |
| Final Premium | `premium_impact.enrollment_premium` | ₹XX,XX,XXX |
| Change % | `premium_impact.change_percent` | ±XX.X% (color coded) |

### 2.2 Visual Flow Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PREMIUM IMPACT SUMMARY                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐   │
│  │   BASE    │ ─► │   BURN    │ ─► │ LOADING/  │ ─► │   FINAL   │   │
│  │ PREMIUM   │    │   COST    │    │ DISCOUNT  │    │ PREMIUM   │   │
│  ├───────────┤    ├───────────┤    ├───────────┤    ├───────────┤   │
│  │₹12,50,000 │    │₹18,75,000 │    │   +15%    │    │₹14,37,500 │   │
│  │  /year    │    │  /year    │    │ Loading   │    │  /year    │   │
│  └───────────┘    └───────────┘    └───────────┘    └───────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ RECOMMENDATION: ↑ INCREASE PREMIUM                              │  │
│  │ Loss ratio of 112% exceeds threshold — 15% loading applied     │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Visual Styling
- **Flow arrows:** `text-[#71717A]` chevron icons between boxes
- **Base/Burn/Final boxes:** `bg-[#F4F4F5] rounded-lg p-4 text-center`
- **Final box:** `bg-[#0055FF]/5 border border-[#0055FF]/20` (highlighted)
- **Recommendation badge:** Green (decrease), Red (increase), Amber (maintain)
- **Change %:** Red text if positive (loading), Green text if negative (discount)

### 2.4 Breakdown Table (Expandable)

Expandable section showing factor-level breakdown:

```
┌────────────────────────────────────────────────────────────────┐
│ DETAILED BREAKDOWN                                   [▼ Hide]  │
├────────────────────────────────────────────────────────────────┤
│ Factor               │ Impact    │ Burn Cost   │ Enroll Cost │
├──────────────────────┼───────────┼─────────────┼─────────────┤
│ High Loss Ratio      │ +20%      │ ₹3,75,000   │ ₹2,50,000   │
│ High Claims Freq     │ +8%       │ ₹1,50,000   │ ₹1,00,000   │
│ Age Demographic      │ +5%       │ ₹93,750     │ ₹62,500     │
│ High Cost Claims     │ +3%       │ ₹56,250     │ ₹37,500     │
├──────────────────────┼───────────┼─────────────┼─────────────┤
│ TOTAL                │ +36%      │ ₹6,75,000   │ ₹4,50,000   │
└──────────────────────┴───────────┴─────────────┴─────────────┘
```

---

## 3. PRE-MADE PLANS SECTION

### 3.1 Plan Definitions

5 pre-configured insurance plans:

#### Plan 1: ESSENTIAL
- **Tier:** Entry Level
- **Premium Basis:** Base premium only (no adjustments)
- **Use Case:** Low-risk groups, first-year policies, renewal with good history
- **Display:** "No risk loadings applied"

#### Plan 2: STANDARD
- **Tier:** Mid-Market
- **Premium Basis:** Base + recommended adjustments
- **Use Case:** Average risk groups, standard underwriting
- **Display:** "Recommended for this group"

#### Plan 3: ENHANCED
- **Tier:** Premium Protection
- **Premium Basis:** Standard + 5% contingency buffer
- **Use Case:** High-risk groups needing additional safety margin
- **Display:** "+5% buffer for unexpected claims"

#### Plan 4: TOP-UP
- **Tier:** Supplementary
- **Premium Basis:** Base premium with SI upgrade
- **Use Case:** Existing clients upgrading coverage
- **Display:** "Enhanced sum insured option"

#### Plan 5: ENTERPRISE
- **Tier:** Custom/Corporate
- **Premium Basis:** All loadings + custom factors
- **Use Case:** Large corporates, complex risk profiles
- **Display:** "Custom underwriting available"

### 3.2 Recommendation Logic

Plans recommended based on:

| Factor | Essential | Standard | Enhanced | Top-Up | Enterprise |
|--------|-----------|----------|----------|--------|------------|
| Risk Score <25 | ✓ | ✓ | ✓ | ✓ | ✓ |
| Risk Score 25-50 | | ✓ | ✓ | ✓ | ✓ |
| Risk Score 50-75 | | | ✓ | | ✓ |
| Risk Score >75 | | | | | ✓ |
| Group <50 lives | ✓ | ✓ | | | |
| Group 50-500 lives | | ✓ | ✓ | | |
| Group >500 lives | | | ✓ | | ✓ |
| Loss Ratio <50% | ✓ | ✓ | | ✓ | ✓ |
| Loss Ratio 50-100% | | ✓ | ✓ | | |
| Loss Ratio >100% | | | | | ✓ |

### 3.3 Plan Card Display

```
┌────────────────────────────────────────────┐
│ ⭐ RECOMMENDED                            │  (only on recommended plan)
├────────────────────────────────────────────┤
│ ESSENTIAL PLAN                            │
│                                            │
│ Premium: ₹12,500 / lac SI                  │
│                                            │
│ Coverage Highlights:                       │
│ ✓ Base sum insured coverage                │
│ ✓ Standard exclusions                      │
│ ✓ No additional loadings                   │
│                                            │
│ ─────────────────────────────────────────  │
│ Best for: Low-risk groups <50 lives        │
│ Risk Score: <25 (Low)                     │
│                                            │
│ [Select Plan]                              │
└────────────────────────────────────────────┘
```

### 3.4 Plan Card Styling
- **Container:** `Card border border-[#E4E4E7] bg-white rounded-xl`
- **Recommended badge:** `absolute -top-3 left-4 bg-[#0055FF] text-white text-xs px-2 py-1 rounded-full`
- **Plan name:** `text-lg font-bold font-['Chivo'] text-[#09090B]`
- **Premium:** `text-2xl font-bold font-['Chivo'] text-[#0055FF]`
- **Features:** `text-sm text-[#71717A]` with check icons
- **Best for:** `text-xs text-[#71717A] bg-[#F4F4F5] px-2 py-1 rounded`
- **Select button:** `w-full bg-[#0055FF] hover:bg-[#0040CC] text-white rounded-lg`
- **Selected state:** `ring-2 ring-[#0055FF] ring-offset-2`

---

## 4. PLAN DATA STRUCTURE

### 4.1 JavaScript Plan Object

```javascript
const PRE_MADE_PLANS = [
  {
    id: "essential",
    name: "Essential Plan",
    tier: "Entry Level",
    premium_per_lac: 12500,  // Base premium per lac SI
    coverage_tier: "Basic",
    sum_insured_range: {
      min: 50000,
      max: 500000
    },
    features: [
      "Base sum insured coverage",
      "Standard exclusions",
      "No additional loadings",
      "Basic hospitalization cover"
    ],
    exclusions: [
      "Pre-existing conditions (12-month wait)",
      "Cosmetic procedures",
      "Self-inflicted injuries"
    ],
    recommended_for: {
      risk_score_max: 25,
      group_size_max: 50,
      loss_ratio_max: 50
    },
    loading: 0,  // No adjustments
    discount: 0,
    highlighted: false
  },
  {
    id: "standard",
    name: "Standard Plan",
    tier: "Mid-Market",
    premium_per_lac: 14375,  // Base + recommended adjustments
    coverage_tier: "Comprehensive",
    sum_insured_range: {
      min: 100000,
      max: 1000000
    },
    features: [
      "Full sum insured coverage",
      "Maternity benefit included",
      "Day care procedures covered",
      "Ambulance cover included"
    ],
    exclusions: [
      "Pre-existing conditions (48-month wait)",
      "Cosmetic procedures",
      "Adventure sports injuries"
    ],
    recommended_for: {
      risk_score_min: 25,
      risk_score_max: 50,
      group_size_min: 50,
      group_size_max: 500,
      loss_ratio_max: 100
    },
    loading: 0,  // Recommended adjustments included
    discount: 0,
    highlighted: true  // Default recommendation
  },
  {
    id: "enhanced",
    name: "Enhanced Plan",
    tier: "Premium Protection",
    premium_per_lac: 15094,  // Standard + 5% buffer
    coverage_tier: "Premium",
    sum_insured_range: {
      min: 200000,
      max: 2000000
    },
    features: [
      "Enhanced sum insured",
      "No co-pay for 60+ age",
      "International second opinion",
      "Annual health checkup",
      "Convalescence benefit"
    ],
    exclusions: [
      "Pre-existing conditions (24-month wait)",
      "Cosmetic procedures"
    ],
    recommended_for: {
      risk_score_min: 50,
      risk_score_max: 75,
      group_size_min: 100,
      loss_ratio_max: 120
    },
    loading: 5,  // 5% contingency buffer
    discount: 0,
    highlighted: false
  },
  {
    id: "topup",
    name: "Top-Up Plan",
    tier: "Supplementary",
    premium_per_lac: 7500,  // Lower base for SI upgrade
    coverage_tier: "Top-Up",
    sum_insured_range: {
      min: 500000,
      max: 5000000
    },
    features: [
      "Covers gaps in existing coverage",
      "Deductible-based payment",
      "Higher sum insured option",
      "Cost-effective for large groups"
    ],
    exclusions: [
      "Claims below deductible",
      "Pre-existing conditions (36-month wait)"
    ],
    recommended_for: {
      loss_ratio_max: 75,
      existing_coverage: true
    },
    loading: 0,
    discount: 10,  // 10% discount for top-up
    highlighted: false
  },
  {
    id: "enterprise",
    name: "Enterprise Plan",
    tier: "Custom/Corporate",
    premium_per_lac: 0,  // Custom pricing required
    coverage_tier: "Enterprise",
    sum_insured_range: {
      min: 1000000,
      max: 10000000
    },
    features: [
      "Fully customizable coverage",
      "Custom loading/discount factors",
      "Aggregate deductible options",
      "Stop-loss protection",
      "Dedicated account manager"
    ],
    exclusions: [
      // Custom defined per group
    ],
    recommended_for: {
      risk_score_min: 75,
      group_size_min: 500,
      loss_ratio_min: 100
    },
    loading: null,  // Custom
    discount: null,  // Custom
    highlighted: false
  }
];
```

### 4.2 Plan Recommendation Function

```javascript
function recommendPlan(metrics, riskScore) {
  const { total_enrolled, loss_ratio, claims_frequency } = metrics;
  const { risk_score } = riskScore;

  // Enterprise for very high risk or large groups
  if (risk_score >= 75 || (total_enrolled > 500 && loss_ratio > 100)) {
    return 'enterprise';
  }

  // Enhanced for medium-high risk
  if (risk_score >= 50 && risk_score < 75) {
    return 'enhanced';
  }

  // Standard for average risk
  if (risk_score >= 25 && risk_score < 50 && total_enrolled >= 50) {
    return 'standard';
  }

  // Top-up for existing coverage with good history
  if (loss_ratio < 75 && claims_frequency < 10) {
    return 'topup';
  }

  // Essential for low risk small groups
  if (risk_score < 25 && total_enrolled < 50 && loss_ratio < 50) {
    return 'essential';
  }

  // Default to standard
  return 'standard';
}
```

---

## 5. UI DESIGN SPECIFICATION

### 5.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PREMIUM IMPACT                                           [Export Quote] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ 2A. PREMIUM BREAKDOWN (Always visible)                                 │
│ ───────────────────────────────────────                                │
│ ┌─────┐    ┌─────┐    ┌─────┐    ┌─────┐                              │
│ │Base │ ─► │Burn │ ─► │Load │ ─► │Final│   [Recommendation Badge]    │
│ └─────┘    └─────┘    └─────┘    └─────┘                              │
│                                                                         │
│ [▼ View Detailed Breakdown]                                            │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ 2B. PRE-MADE PLAN OPTIONS                                  [Compare All]│
│ ───────────────────────────────────────                                │
│                                                                         │
│ ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐ ┌────────┐ │
│ │ Essential │  │ Standard  │  │  Enhanced │  │  Top-Up   │ │Enterprise│ │
│ │  ₹12,500  │  │  ₹14,375  │  │  ₹15,094  │  │   ₹7,500  │ │ Custom  │ │
│ │   /lac    │  │   /lac    │  │   /lac    │  │   /lac    │ │  Pricing │ │
│ │  ⭐       │  │ ⭐RECOMMEND│  │           │  │           │ │         │ │
│ │ [Select] │  │  [Select] │  │  [Select] │  │  [Select] │ │[Select]│ │
│ └───────────┘  └───────────┘  └───────────┘  └───────────┘ └────────┘ │
│                                                                         │
│ (Horizontal scroll on mobile)                                         │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ 2C. PLAN COMPARISON TABLE (When 2+ plans selected)                    │
│ ───────────────────────────────────────                                │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────┐    │
│ │              Essential   Standard  Enhanced   Top-Up  Enterprise│    │
│ │ Premium/lac  ₹12,500     ₹14,375   ₹15,094    ₹7,500  Custom     │    │
│ │ Coverage     Basic       Full      Premium    Top-Up   Custom    │    │
│ │ SI Range     50K-5L      1L-10L    2L-20L     5L-50L   10L-1Cr  │    │
│ │ Loading      0%          0%        5%         0%        Custom   │    │
│ │ Recommended  ○           ●         ○          ○          ○       │    │
│ └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Interaction Specifications

**Plan Selection:**
- Click plan card → selected state (blue ring)
- Selected plan's premium populates "Apply to Quote" button
- Only one plan can be selected at a time
- Click again to deselect

**Comparison Mode:**
- "Compare All" button → shows comparison table
- Checkbox on each plan card to include in comparison
- Comparison table appears below plan cards
- Close button to dismiss comparison

**Expand/Collapse:**
- Detailed breakdown section defaults to collapsed
- "View Detailed Breakdown" button expands it
- Smooth transition animation (300ms ease)

### 5.3 Mobile Responsiveness

- Plans display as horizontal scroll carousel
- One card visible at a time on mobile
- Dot indicators for carousel position
- Detailed breakdown always full-width
- Comparison table scrolls horizontally

---

## 6. BACKEND CHANGES NEEDED

### 6.1 underwriting_ai.py Changes

Add new function for plan recommendations:

```python
def generate_premade_plans(metrics: Dict, risk_score: Dict, premium_impact: Dict) -> List[Dict]:
    """Generate pre-made plan options based on metrics"""
    
    plans = []
    base_premium = premium_impact.get("base_premium", 100000)
    final_premium = premium_impact.get("enrollment_premium", base_premium)
    total_enrolled = metrics.get("total_enrolled", 0)
    loss_ratio = metrics.get("loss_ratio", 0)
    risk_category = risk_score.get("risk_category", "Medium")
    risk_score_value = risk_score.get("risk_score", 50)
    
    # Calculate premium per lac SI (assuming 10 lac average SI)
    avg_si = 1000000  # 10 lac
    base_rate_per_lac = (base_premium / total_enrolled) / (avg_si / 100000) if total_enrolled > 0 else 12500
    final_rate_per_lac = (final_premium / total_enrolled) / (avg_si / 100000) if total_enrolled > 0 else base_rate_per_lac
    
    # Essential Plan
    essential_plan = {
        "id": "essential",
        "name": "Essential Plan",
        "tier": "Entry Level",
        "premium_per_lac": round(base_rate_per_lac * (1 - 0.15), 0),  # No loading
        "final_premium_per_lac": round(base_rate_per_lac * (1 - 0.15), 0),
        "coverage_tier": "Basic",
        "sum_insured_range": {"min": 50000, "max": 500000},
        "features": ["Base sum insured coverage", "Standard exclusions", "No additional loadings"],
        "loading": 0,
        "discount": 15,
        "recommended": False,
        "recommended_for": {
            "risk_score_max": 25,
            "group_size_max": 50,
            "loss_ratio_max": 50
        }
    }
    
    # Standard Plan
    standard_plan = {
        "id": "standard",
        "name": "Standard Plan",
        "tier": "Mid-Market",
        "premium_per_lac": round(final_rate_per_lac, 0),
        "final_premium_per_lac": round(final_rate_per_lac, 0),
        "coverage_tier": "Comprehensive",
        "sum_insured_range": {"min": 100000, "max": 1000000},
        "features": ["Full sum insured coverage", "Maternity benefit included", "Day care procedures covered"],
        "loading": 0,
        "discount": 0,
        "recommended": True,  # Mark as recommended
        "recommended_for": {
            "risk_score_min": 25,
            "risk_score_max": 50,
            "group_size_min": 50,
            "group_size_max": 500
        }
    }
    
    # Enhanced Plan
    enhanced_plan = {
        "id": "enhanced",
        "name": "Enhanced Plan",
        "tier": "Premium Protection",
        "premium_per_lac": round(final_rate_per_lac * 1.05, 0),  # 5% buffer
        "final_premium_per_lac": round(final_rate_per_lac * 1.05, 0),
        "coverage_tier": "Premium",
        "sum_insured_range": {"min": 200000, "max": 2000000},
        "features": ["Enhanced sum insured", "No co-pay for 60+", "International second opinion"],
        "loading": 5,
        "discount": 0,
        "recommended": False,
        "recommended_for": {
            "risk_score_min": 50,
            "risk_score_max": 75,
            "group_size_min": 100
        }
    }
    
    # Top-Up Plan
    topup_plan = {
        "id": "topup",
        "name": "Top-Up Plan",
        "tier": "Supplementary",
        "premium_per_lac": round(base_rate_per_lac * 0.6, 0),  # Lower rate
        "final_premium_per_lac": round(base_rate_per_lac * 0.6, 0),
        "coverage_tier": "Top-Up",
        "sum_insured_range": {"min": 500000, "max": 5000000},
        "features": ["Covers gaps in existing coverage", "Deductible-based payment", "Higher sum insured"],
        "loading": 0,
        "discount": 40,
        "recommended": False,
        "recommended_for": {
            "loss_ratio_max": 75,
            "existing_coverage": True
        }
    }
    
    # Enterprise Plan
    enterprise_plan = {
        "id": "enterprise",
        "name": "Enterprise Plan",
        "tier": "Custom/Corporate",
        "premium_per_lac": 0,  # Custom pricing
        "final_premium_per_lac": 0,
        "coverage_tier": "Enterprise",
        "sum_insured_range": {"min": 1000000, "max": 10000000},
        "features": ["Fully customizable coverage", "Custom loading/discount factors", "Stop-loss protection"],
        "loading": None,
        "discount": None,
        "recommended": False,
        "recommended_for": {
            "risk_score_min": 75,
            "group_size_min": 500,
            "loss_ratio_min": 100
        }
    }
    
    plans = [essential_plan, standard_plan, enhanced_plan, topup_plan, enterprise_plan]
    
    # Determine which plan is recommended based on metrics
    recommended_id = "standard"
    if risk_score_value >= 75 or total_enrolled > 500:
        recommended_id = "enterprise"
    elif risk_score_value >= 50:
        recommended_id = "enhanced"
    elif risk_score_value < 25 and total_enrolled < 50:
        recommended_id = "essential"
    
    for plan in plans:
        plan["recommended"] = plan["id"] == recommended_id
    
    return plans
```

### 6.2 Update calculate_premium_impact Response

Add breakdown detail to the response:

```python
def calculate_premium_impact(metrics: Dict, factors: List[Dict]) -> Dict:
    """Calculate premium impact from factors"""
    # ... existing code ...
    
    # Calculate per-factor breakdown
    factor_breakdown = []
    for f in factors:
        factor_breakdown.append({
            "factor": f.get("factor", ""),
            "type": "loading" if f.get("loading") else "discount",
            "percentage": f.get("loading") or f.get("discount", ""),
            "burn_cost_impact": f.get("burn_cost_impact", 0),
            "enrollment_impact": f.get("enrollment_impact", 0)
        })
    
    return {
        "base_premium": round(estimated_premium, 2),
        "burn_cost_premium": round(total_claimed + total_burn_cost, 2),
        "enrollment_premium": round(final_premium, 2),
        "total_adjustment": round(total_enrollment, 2),
        "change_percent": round(change_percent, 1),
        "recommendation": "Increase" if change_percent > 5 else ("Decrease" if change_percent < -5 else "Maintain"),
        # New fields
        "pure_premium": round(estimated_premium + total_burn_cost, 2),
        "total_loading_percent": sum(float(f.get("loading", 0) or 0) for f in factors),
        "total_discount_percent": sum(float(f.get("discount", 0) or 0) for f in factors),
        "factor_breakdown": factor_breakdown
    }
```

### 6.3 API Response Update

In the `/cases/{case_id}/underwriting-ai` endpoint, add the new field:

```python
# Generate pre-made plan options
premade_plans = generate_premade_plans(metrics, risk_score, premium_impact)

return {
    "success": True,
    "underwriting_metrics": metrics,
    "risk_score": risk_score,
    "recommended_factors": recommended_factors,
    "premium_impact": premium_impact,
    "premade_plans": premade_plans,  # NEW FIELD
    "ai_insights": ai_insights
}
```

### 6.4 Save to Database

```python
await db.cases.update_one(
    {"case_id": case_id},
    {"$set": {
        "underwriting_metrics": metrics,
        "risk_score": risk_score,
        "recommended_factors": recommended_factors,
        "premium_impact": premium_impact,
        "premade_plans": premade_plans,
        "underwriting_ai_generated": datetime.now(timezone.utc).isoformat()
    }}
)
```

---

## 7. FILES TO MODIFY

| File | Changes |
|------|---------|
| `underwriting_ai.py` | Add `generate_premade_plans()` function, update `calculate_premium_impact()` |
| `AIInsightsPage.js` | Add Premium Impact Detail + Pre-made Plans UI components |
| `server.py` | Update response fields (optional, if changes to naming) |

---

## 8. IMPLEMENTATION PRIORITY

1. **P0 - Critical:** Backend function `generate_premade_plans()`
2. **P0 - Critical:** API response includes `premade_plans`
3. **P1 - High:** Premium Impact Detail visual flow
4. **P1 - High:** Pre-made Plan cards display
5. **P1 - High:** Plan recommendation logic
6. **P2 - Medium:** Plan comparison table
7. **P2 - Medium:** Expandable detailed breakdown
8. **P3 - Low:** Plan selection persistence

---

## 9. SUCCESS METRICS

- User can see 5 plan options immediately after underwriting analysis
- Recommended plan is visually highlighted
- Premium rates are displayed per lac SI
- Selection persists when navigating to Pricing page
- No additional API calls required (data available in existing response)