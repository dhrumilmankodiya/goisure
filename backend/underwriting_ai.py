from pydantic import BaseModel
from typing import Dict, List, Any
import statistics

# ==================== PART B: UNDERWRITING AI ====================
class UnderwritingInput(BaseModel):
    premium: float = 0
    previous_premium: float = 0
    policy_type: str = "GMC"


def calculate_underwriting_metrics(structured_data: List[Dict], key_stats: Dict) -> Dict:
    """Calculate all underwriting metrics from structured data"""
    import statistics
    
    total_enrolled = key_stats.get("total_enrolled", len(structured_data))
    total_claims = key_stats.get("total_claims", 0)
    total_claimed = key_stats.get("total_claimed", 0)
    
    # Premium for loss ratio (could be provided or estimated)
    estimated_premium = total_claimed * 1.5 if total_claimed > 0 else 100000
    loss_ratio = (total_claimed / estimated_premium * 100) if estimated_premium > 0 else 0
    
    # Age distribution
    ages = []
    for rec in structured_data:
        if rec.get("Age"):
            try:
                ages.append(int(rec.get("Age", 0)))
            except:
                pass
    
    avg_age = statistics.mean(ages) if ages else 30
    age_bands = {"18-25": 0, "26-35": 0, "36-45": 0, "46-55": 0, "55+": 0}
    for age in ages:
        if age < 26:
            age_bands["18-25"] += 1
        elif age < 36:
            age_bands["26-35"] += 1
        elif age < 46:
            age_bands["36-45"] += 1
        elif age < 56:
            age_bands["46-55"] += 1
        else:
            age_bands["55+"] += 1
    
    # Convert to percentages
    for band in age_bands:
        age_bands[band] = round(age_bands[band] / len(ages) * 100, 1) if ages else 0
    
    # Claims frequency
    members_with_claims = len([r for r in structured_data if r.get("Claim_Count", 0) > 0])
    claims_frequency = (members_with_claims / total_enrolled * 100) if total_enrolled else 0
    
    # Average claim size
    avg_claim_size = (total_claimed / total_claims) if total_claims else 0
    
    # Claim status breakdown
    claim_status = {"Pending": 0, "Paid": 0, "Rejected": 0}
    for rec in structured_data:
        status = rec.get("Claim_Status", "")
        if status:
            status = str(status).strip().title()
            if status in claim_status:
                claim_status[status] += 1
    
    # High cost claims (above ₹5L)
    high_cost_claims = []
    for rec in structured_data:
        claimed = rec.get("Total_Claimed", 0) or 0
        if claimed > 500000:
            high_cost_claims.append({
                "name": rec.get("Name"),
                "amount": claimed,
                "status": rec.get("Claim_Status")
            })
    
    # Employee vs Dependent ratio
    employees = len([r for r in structured_data if str(r.get("Relationship", "")).lower() in ["self", "employee"]])
    dependents = total_enrolled - employees
    emp_dependent_ratio = (employees / dependents) if dependents > 0 else employees
    
    # Family size
    family_sizes = []
    for rec in structured_data:
        rel = str(rec.get("Relationship", "")).lower()
        if rel in ["self", "employee"]:
            family_sizes.append(1)
    avg_family_size = statistics.mean(family_sizes) if family_sizes else 1
    
    # ── NEW: Chronic conditions ──
    chronic_members = [r for r in structured_data if r.get("Chronic_Condition")]
    chronic_count = len(chronic_members)
    chronic_pct = round(chronic_count / total_enrolled * 100, 1) if total_enrolled else 0
    
    # ── NEW: Claims concentration (top 3 as % of total) ──
    top_members = sorted(structured_data, key=lambda r: r.get("Total_Claimed", 0), reverse=True)[:3]
    top3_total = sum(r.get("Total_Claimed", 0) for r in top_members)
    concentration_pct = round(top3_total / total_claimed * 100, 1) if total_claimed else 0
    
    # ── NEW: Gender distribution ──
    gender_dist = {}
    for r in structured_data:
        g = str(r.get("Gender", "")).strip().title()
        if g:
            gender_dist[g] = gender_dist.get(g, 0) + 1
    # Convert to percentage
    gender_dist_pct = {k: round(v / total_enrolled * 100, 1) for k, v in gender_dist.items()}
    
    # ── NEW: Industry benchmark comparison ──
    industry_benchmark = 65  # IT Services avg loss ratio
    lr_vs_benchmark = round(lr - industry_benchmark, 1)  # positive = worse than benchmark
    
    # ── NEW: Premium per member ──
    premium_per_member = round(estimated_premium / total_enrolled) if total_enrolled else 0
    claim_per_member = round(total_claimed / total_enrolled) if total_enrolled else 0
    
    # ── NEW: Claims by relationship type ──
    claims_by_rel = {}
    for r in structured_data:
        rel = str(r.get("Relationship", "SELF")).strip().title()
        if rel not in claims_by_rel:
            claims_by_rel[rel] = {"members": 0, "claimed": 0, "approved": 0}
        claims_by_rel[rel]["members"] += 1
        claims_by_rel[rel]["claimed"] += r.get("Total_Claimed", 0)
        claims_by_rel[rel]["approved"] += r.get("Total_Approved", 0)
    
    return {
        "total_enrolled": total_enrolled,
        "total_claims": total_claims,
        "total_claimed": total_claimed,
        "estimated_premium": round(estimated_premium, 0),
        "loss_ratio": round(lr, 1),
        "average_age": round(avg_age, 1),
        "age_distribution": age_bands,
        "claims_frequency": round(claims_frequency, 2),
        "average_claim_size": round(avg_claim_size, 0),
        "members_with_claims": members_with_claims,
        "claim_status_breakdown": claim_status,
        "high_cost_claims": sorted(high_cost_claims, key=lambda x: x["amount"], reverse=True)[:5],
        "employee_dependent_ratio": round(emp_dependent_ratio, 2),
        "average_family_size": round(avg_family_size, 1),
        # NEW FIELDS
        "chronic_members_count": chronic_count,
        "chronic_members_pct": chronic_pct,
        "top_3_concentration_pct": concentration_pct,
        "top_3_members": [{"name": r.get("Name"), "claimed": r.get("Total_Claimed", 0)} for r in top_members],
        "gender_distribution": gender_dist_pct,
        "employees_only_pct": round(employees / total_enrolled * 100, 1) if total_enrolled else 100,
        "claims_by_relationship": claims_by_rel,
        "premium_per_member": premium_per_member,
        "claim_per_member": claim_per_member,
        "lr_vs_industry_benchmark": lr_vs_benchmark,
        "industry_benchmark": industry_benchmark,
        "premium_per_lac": round(estimated_premium / (sum(r.get("Sum_Insured", 0) for r in structured_data) / 100000) if sum(r.get("Sum_Insured", 0) for r in structured_data) > 0 else 0, 0),
        "recommended_coverage_tier": "Essential" if lr < 50 else "Standard" if lr < 100 else "Enhanced"
    }


def calculate_risk_score(metrics: Dict) -> Dict:
    """Calculate composite risk score (0-100)"""
    
    lr = metrics.get("loss_ratio", 0)
    if lr < 50:
        lr_score = 40 - (lr / 50) * 10
    elif lr < 75:
        lr_score = 30
    elif lr < 100:
        lr_score = 20
    else:
        lr_score = max(0, 15 - (lr - 100) / 10)
    
    freq = metrics.get("claims_frequency", 0)
    freq_score = min(25, freq * 3)
    
    avg_age = metrics.get("average_age", 30)
    age_score = min(20, max(0, (avg_age - 25) * 1.5))
    
    high_cost_count = len(metrics.get("high_cost_claims", []))
    chronic_score = min(15, high_cost_count * 5)
    
    total_score = lr_score + freq_score + age_score + chronic_score
    
    if total_score < 25:
        risk_category = "Low"
    elif total_score < 50:
        risk_category = "Medium"
    elif total_score < 75:
        risk_category = "High"
    else:
        risk_category = "Very High"
    
    return {
        "risk_score": round(total_score, 1),
        "risk_category": risk_category,
        "breakdown": {
            "loss_ratio_score": round(lr_score, 1),
            "frequency_score": round(freq_score, 1),
            "demographics_score": round(age_score, 1),
            "chronic_score": round(chronic_score, 1)
        }
    }


def generate_underwriting_factors(metrics: Dict, risk_score: Dict) -> List[Dict]:
    """Generate AI-recommended underwriting factors — calculation-based, fast, accurate."""
    factors = []
    lr = metrics.get("loss_ratio", 0)
    freq = metrics.get("claims_frequency", 0)
    total_claimed = metrics.get("total_claimed", 0)
    estimated_premium = metrics.get("estimated_premium", 100000)
    total_enrolled = metrics.get("total_enrolled", 0)
    chronic_count = metrics.get("chronic_members_count", 0)
    chronic_pct = metrics.get("chronic_members_pct", 0)
    concentration_pct = metrics.get("top_3_concentration_pct", 0)
    avg_age = metrics.get("average_age", 30)
    age_55_plus_pct = metrics.get("age_distribution", {}).get("55+", 0)
    gender_male_pct = metrics.get("gender_distribution", {}).get("Male", 0)
    employees_only = metrics.get("employees_only_pct", 100)
    
    # 1. Loss Ratio Factor
    if lr >= 100:
        loading = min(50, (lr - 80) * 2)
        burn_impact = total_claimed * (loading / 100)
        factors.append({
            "category": "Loss Ratio",
            "factor": f"Loss Ratio {lr}% — High",
            "loading": f"{round(loading, 1)}%",
            "discount": "",
            "justification": f"Loss ratio of {lr}% exceeds 100%. Claim cost exceeds premium income.",
            "burn_cost_impact": round(burn_impact, 0),
            "enrollment_impact": round(burn_impact, 0),
            "severity": "high"
        })
    elif lr >= 75:
        loading = min(20, (lr - 75) * 2)
        burn_impact = total_claimed * (loading / 100)
        factors.append({
            "category": "Loss Ratio",
            "factor": f"Loss Ratio {lr}% — Moderate",
            "loading": f"{round(loading, 1)}%",
            "discount": "",
            "justification": f"Loss ratio of {lr}% approaching concern threshold.",
            "burn_cost_impact": round(burn_impact, 0),
            "enrollment_impact": round(burn_impact, 0),
            "severity": "medium"
        })
    elif lr < 50:
        discount = min(25, (50 - lr) * 0.5)
        burn_impact = -estimated_premium * (discount / 100)
        factors.append({
            "category": "Loss Ratio",
            "factor": "Profitable Portfolio",
            "loading": "",
            "discount": f"{round(discount, 1)}%",
            "justification": f"Loss ratio of {lr}% — strong profitability. Loyalty discount warranted.",
            "burn_cost_impact": round(burn_impact, 0),
            "enrollment_impact": round(burn_impact, 0),
            "severity": "low"
        })
    
    # 2. Claims Frequency
    if freq > 15:
        loading = min(30, (freq - 8) * 5)
        factors.append({
            "category": "Frequency",
            "factor": "Very High Claims Frequency",
            "loading": f"{round(loading, 1)}%",
            "discount": "",
            "justification": f"{freq}% of members have filed claims — very high frequency indicates systemic risk.",
            "burn_cost_impact": round(total_claimed * 0.10, 0),
            "enrollment_impact": round(estimated_premium * 0.05, 0),
            "severity": "high"
        })
    elif freq > 8:
        loading = min(15, (freq - 8) * 3)
        factors.append({
            "category": "Frequency",
            "factor": "High Claims Frequency",
            "loading": f"{round(loading, 1)}%",
            "discount": "",
            "justification": f"{freq}% claims frequency — above industry average of 5-8%.",
            "burn_cost_impact": round(total_claimed * 0.05, 0),
            "enrollment_impact": round(estimated_premium * 0.03, 0),
            "severity": "medium"
        })
    
    # 3. High Cost Claims
    high_cost_claims = metrics.get("high_cost_claims", [])
    if high_cost_claims:
        total_high_cost = sum(c.get("amount", 0) for c in high_cost_claims)
        loading = min(25, len(high_cost_claims) * 7)
        factors.append({
            "category": "Severity",
            "factor": f"{len(high_cost_claims)} High-Cost Claims (₹5L+)",
            "loading": f"{loading}%",
            "discount": "",
            "justification": f"₹{total_high_cost/100000:.1f}L in high-severity claims detected.",
            "burn_cost_impact": round(total_high_cost * 0.05, 0),
            "enrollment_impact": round(estimated_premium * 0.03, 0),
            "severity": "high" if len(high_cost_claims) >= 3 else "medium"
        })
    
    # 4. Pre-Existing / Chronic Conditions
    if chronic_count > 0:
        loading = min(30, chronic_pct * 2)
        factors.append({
            "category": "Health Profile",
            "factor": f"{chronic_count} Members with Chronic Conditions ({chronic_pct}%)",
            "loading": f"{round(loading, 1)}%",
            "discount": "",
            "justification": f"Diabetes, Hypertension, Asthma etc. require higher reserve.",
            "burn_cost_impact": round(estimated_premium * loading / 100, 0),
            "enrollment_impact": round(estimated_premium * loading / 100, 0),
            "severity": "high" if chronic_pct > 20 else "medium"
        })
    
    # 5. Concentration Risk
    if concentration_pct > 40:
        loading = min(20, concentration_pct - 30)
        factors.append({
            "category": "Concentration",
            "factor": "Claims Concentration Risk",
            "loading": f"{round(loading, 1)}%",
            "discount": "",
            "justification": f"Top 3 members account for {concentration_pct}% of total claims.",
            "burn_cost_impact": round(total_claimed * 0.05, 0),
            "enrollment_impact": round(estimated_premium * 0.03, 0),
            "severity": "high" if concentration_pct > 60 else "medium"
        })
    
    # 6. Age Demographic
    if avg_age > 40:
        loading = min(20, (avg_age - 40) * 2.5)
        factors.append({
            "category": "Demographics",
            "factor": f"Aging Workforce (Avg {avg_age} yrs)",
            "loading": f"{round(loading, 1)}%",
            "discount": "",
            "justification": f"Average age {avg_age} — higher medical risk in older demographic.",
            "burn_cost_impact": round(estimated_premium * loading / 100, 0),
            "enrollment_impact": round(estimated_premium * loading / 100, 0),
            "severity": "high" if avg_age > 45 else "medium"
        })
    elif avg_age < 30:
        discount = min(10, (30 - avg_age) * 1.5)
        factors.append({
            "category": "Demographics",
            "factor": f"Young Workforce (Avg {avg_age} yrs)",
            "loading": "",
            "discount": f"{round(discount, 1)}%",
            "justification": f"Young average age {avg_age} — lower claims probability.",
            "burn_cost_impact": round(-estimated_premium * discount / 100, 0),
            "enrollment_impact": round(-estimated_premium * discount / 100, 0),
            "severity": "low"
        })
    
    # 7. 55+ Age Band
    if age_55_plus_pct > 15:
        loading = min(15, age_55_plus_pct * 1)
        factors.append({
            "category": "Demographics",
            "factor": f"{age_55_plus_pct}% Members Age 55+",
            "loading": f"{round(loading, 1)}%",
            "discount": "",
            "justification": f"{age_55_plus_pct}% in senior age band — elevated risk requiring loadings.",
            "burn_cost_impact": round(estimated_premium * loading / 100, 0),
            "enrollment_impact": round(estimated_premium * loading / 100, 0),
            "severity": "medium"
        })
    
    # 8. Industry Risk Benchmark
    industry_benchmark_lr = 65  # IT Services average
    if lr > industry_benchmark_lr * 1.3:
        factors.append({
            "category": "Industry Benchmark",
            "factor": "Above Industry Benchmark",
            "loading": "10%",
            "discount": "",
            "justification": f"LR {lr}% is {(lr/industry_benchmark_lr - 1)*100:.0f}% above IT services benchmark of {industry_benchmark_lr}%.",
            "burn_cost_impact": round(estimated_premium * 0.10, 0),
            "enrollment_impact": round(estimated_premium * 0.10, 0),
            "severity": "medium"
        })
    
    return factors


def calculate_premium_impact(metrics: Dict, factors: List[Dict]) -> Dict:
    """Calculate premium impact from factors"""
    estimated_premium = metrics.get("estimated_premium", 100000)
    total_claimed = metrics.get("total_claimed", 0)
    
    total_burn_cost = sum(f.get("burn_cost_impact", 0) for f in factors)
    total_enrollment = sum(f.get("enrollment_impact", 0) for f in factors)
    
    final_premium = estimated_premium + total_enrollment
    change_percent = (total_enrollment / estimated_premium * 100) if estimated_premium > 0 else 0
    
    # Calculate per-factor breakdown
    factor_breakdown = []
    total_loading_pct = 0
    total_discount_pct = 0
    severity_counts = {"high": 0, "medium": 0, "low": 0}
    for f in factors:
        loading = float(f.get("loading", "0").replace("%", "") or 0)
        discount = float(f.get("discount", "0").replace("%", "") or 0)
        if loading > 0:
            total_loading_pct += loading
            sev = f.get("severity", "medium")
            if sev in severity_counts:
                severity_counts[sev] += 1
        elif discount > 0:
            total_discount_pct += discount
        factor_breakdown.append({
            "category": f.get("category", "General"),
            "factor": f.get("factor", ""),
            "type": "loading" if loading > 0 else "discount",
            "percentage": f.get("loading") or f.get("discount", ""),
            "justification": f.get("justification", ""),
            "burn_cost_impact": f.get("burn_cost_impact", 0),
            "enrollment_impact": f.get("enrollment_impact", 0),
            "severity": f.get("severity", "medium")
        })
    
    h = severity_counts.get("high", 0)
    m = severity_counts.get("medium", 0)
    overall_severity = "high" if h >= 2 else ("medium" if h >= 1 or m >= 2 else "low")
    
    return {
        "base_premium": round(estimated_premium, 2),
        "burn_cost_premium": round(total_claimed + total_burn_cost, 2),
        "pure_premium": round(estimated_premium + total_burn_cost, 2),
        "enrollment_premium": round(final_premium, 2),
        "total_adjustment": round(total_enrollment, 2),
        "change_percent": round(change_percent, 1),
        "recommendation": "Increase" if change_percent > 5 else ("Decrease" if change_percent < -5 else "Maintain"),
        "total_loading_percent": round(total_loading_pct, 1),
        "total_discount_percent": round(total_discount_pct, 1),
        "overall_severity": overall_severity,
        "severity_summary": severity_counts,
        "factor_breakdown": factor_breakdown
    }


def generate_premade_plans(metrics: Dict, risk_score: Dict, premium_impact: Dict) -> List[Dict]:
    """Generate pre-made insurance plan options based on metrics"""
    plans = []
    base_premium = premium_impact.get("base_premium", 100000)
    final_premium = premium_impact.get("enrollment_premium", base_premium)
    total_enrolled = max(metrics.get("total_enrolled", 1), 1)
    loss_ratio = metrics.get("loss_ratio", 0)
    risk_score_value = risk_score.get("risk_score", 50)
    
    # Calculate premium per lac SI (assuming 10 lac average SI)
    avg_si = 1000000  # 10 lac
    base_rate_per_lac = (base_premium / total_enrolled) / (avg_si / 100000) if total_enrolled > 0 else 12500
    final_rate_per_lac = (final_premium / total_enrolled) / (avg_si / 100000) if total_enrolled > 0 else base_rate_per_lac
    
    # Determine which plan is recommended based on metrics
    recommended_id = "standard"
    if risk_score_value >= 75 or (total_enrolled > 500 and loss_ratio > 100):
        recommended_id = "enterprise"
    elif risk_score_value >= 50:
        recommended_id = "enhanced"
    elif risk_score_value < 25 and total_enrolled < 50 and loss_ratio < 50:
        recommended_id = "essential"
    
    plan_definitions = [
        {
            "id": "essential",
            "name": "Essential Plan",
            "tier": "Entry Level",
            "description": "Base coverage without risk loadings",
            "premium_per_lac": round(base_rate_per_lac * 0.85, 0),
            "coverage_tier": "Basic",
            "sum_insured_range": {"min": 50000, "max": 500000},
            "features": [
                "Base sum insured coverage",
                "Standard exclusions",
                "No additional loadings",
                "Basic hospitalization cover"
            ],
            "loading": 0,
            "discount": 15,
            "recommended_for": {
                "risk_score_max": 25,
                "group_size_max": 50,
                "loss_ratio_max": 50
            }
        },
        {
            "id": "standard",
            "name": "Standard Plan",
            "tier": "Mid-Market",
            "description": "Recommended coverage with applied adjustments",
            "premium_per_lac": round(final_rate_per_lac, 0),
            "coverage_tier": "Comprehensive",
            "sum_insured_range": {"min": 100000, "max": 1000000},
            "features": [
                "Full sum insured coverage",
                "Maternity benefit included",
                "Day care procedures covered",
                "Ambulance cover included"
            ],
            "loading": 0,
            "discount": 0,
            "recommended_for": {
                "risk_score_min": 25,
                "risk_score_max": 50,
                "group_size_min": 50,
                "group_size_max": 500
            }
        },
        {
            "id": "enhanced",
            "name": "Enhanced Plan",
            "tier": "Premium Protection",
            "description": "Enhanced coverage with safety buffer",
            "premium_per_lac": round(final_rate_per_lac * 1.05, 0),
            "coverage_tier": "Premium",
            "sum_insured_range": {"min": 200000, "max": 2000000},
            "features": [
                "Enhanced sum insured",
                "No co-pay for 60+ age",
                "International second opinion",
                "Annual health checkup",
                "Convalescence benefit"
            ],
            "loading": 5,
            "discount": 0,
            "recommended_for": {
                "risk_score_min": 50,
                "risk_score_max": 75,
                "group_size_min": 100
            }
        },
        {
            "id": "topup",
            "name": "Top-Up Plan",
            "tier": "Supplementary",
            "description": "Gap coverage for existing policies",
            "premium_per_lac": round(base_rate_per_lac * 0.6, 0),
            "coverage_tier": "Top-Up",
            "sum_insured_range": {"min": 500000, "max": 5000000},
            "features": [
                "Covers gaps in existing coverage",
                "Deductible-based payment",
                "Higher sum insured option",
                "Cost-effective for large groups"
            ],
            "loading": 0,
            "discount": 40,
            "recommended_for": {
                "loss_ratio_max": 75,
                "existing_coverage": True
            }
        },
        {
            "id": "enterprise",
            "name": "Enterprise Plan",
            "tier": "Custom/Corporate",
            "description": "Fully customizable enterprise coverage",
            "premium_per_lac": 0,  # Custom pricing required
            "coverage_tier": "Enterprise",
            "sum_insured_range": {"min": 1000000, "max": 10000000},
            "features": [
                "Fully customizable coverage",
                "Custom loading/discount factors",
                "Aggregate deductible options",
                "Stop-loss protection",
                "Dedicated account manager"
            ],
            "loading": None,
            "discount": None,
            "recommended_for": {
                "risk_score_min": 75,
                "group_size_min": 500,
                "loss_ratio_min": 100
            }
        }
    ]
    
    for plan_def in plan_definitions:
        plan = plan_def.copy()
        plan["recommended"] = plan["id"] == recommended_id
        plans.append(plan)
    
    return plans


@api_router.post("/cases/{case_id}/underwriting-ai")
async def generate_underwriting_ai(case_id: str, data: UnderwritingInput = None, request: Request = None):
    """Generate Part B - AI Underwriting Intelligence from Part A structured data"""
    user = await get_current_user(request)
    
    case = await db.cases.find_one({"case_id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    if user["role"] == "agent" and case["agent_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    structured_data = case.get("structured_data", [])
    key_stats = case.get("key_stats", {})
    
    if not structured_data:
        raise HTTPException(status_code=400, detail="Run Part A (Process AI) first")
    
    # Calculate underwriting metrics
    metrics = calculate_underwriting_metrics(structured_data, key_stats)
    
    # If premium provided, recalculate with actual
    if data and data.premium > 0:
        metrics["estimated_premium"] = data.premium
        metrics["loss_ratio"] = round(metrics["total_claimed"] / data.premium * 100, 1)
    
    # Calculate risk score
    risk_score = calculate_risk_score(metrics)
    
    # Generate recommended factors
    recommended_factors = generate_underwriting_factors(metrics, risk_score)
    
    # Calculate premium impact
    premium_impact = calculate_premium_impact(metrics, recommended_factors)
    
    # Generate pre-made plan options
    premade_plans = generate_premade_plans(metrics, risk_score, premium_impact)
    
    # Generate AI underwriting insights
    ai_insights = [
        {
            "type": "risk",
            "title": f"Risk Score: {risk_score['risk_category']}",
            "description": f"Composite risk score of {risk_score['risk_score']}/100 based on loss ratio, frequency, demographics, and high-cost claims",
            "severity": "high" if risk_score["risk_category"] in ["High", "Very High"] else "medium"
        }
    ]
    
    if metrics.get("loss_ratio", 0) > 100:
        ai_insights.append({
            "type": "risk",
            "title": "Loss Ratio Alert",
            "description": f"Loss ratio of {metrics['loss_ratio']}% exceeds 100% - premium increase recommended",
            "severity": "high"
        })
    elif metrics.get("loss_ratio", 0) < 50:
        ai_insights.append({
            "type": "opportunity",
            "title": "Profit Opportunity",
            "description": f"Loss ratio of {metrics['loss_ratio']}% indicates profitable portfolio - discount eligible",
            "severity": "low"
        })
    
    if metrics.get("claims_frequency", 0) > 8:
        ai_insights.append({
            "type": "risk",
            "title": "High Claims Frequency",
            "description": f"{metrics['claims_frequency']}% claims frequency above industry benchmark",
            "severity": "medium"
        })
    
    # Save to case
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
    
    await log_audit("underwriting_ai_completed", user["id"], {
        "case_id": case_id,
        "risk_score": risk_score["risk_score"],
        "factors_recommended": len(recommended_factors),
        "plans_generated": len(premade_plans)
    })
    
    return {
        "success": True,
        "underwriting_metrics": metrics,
        "risk_score": risk_score,
        "recommended_factors": recommended_factors,
        "premium_impact": premium_impact,
        "premade_plans": premade_plans,
        "ai_insights": ai_insights
    }