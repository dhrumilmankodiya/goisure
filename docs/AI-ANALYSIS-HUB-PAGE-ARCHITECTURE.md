# Goisure AI Analysis Hub — Page Architecture Spec
**Version:** 1.0 | **Date:** May 2, 2026  
**Design System:** React + Tailwind CSS | Primary: `#0055FF` | Fonts: Chivo (headings/numbers), IBM Plex Sans (body)

---

## 1. Problem Statement (Context)

The current AI Analysis Hub suffers from:
- **Too many clicks** — Pipeline requires manual triggering per step
- **Too much hunting** — Key stats buried in step-by-step flow; user must run steps to see anything
- **Scattered metrics** — Stats split across Step 1 (basic) and Step 3 (underwriting)
- **Missing diagnostics** — Diagnosis data IS in the pipeline but not visible in the page
- **Pagination missing** — Table shows hardcoded 20 of 681 records with no controls
- **Premium section weak** — No pre-made plan options shown

**User's core need:** Land on page → see ALL key stats immediately → take action. Zero hunting.

---

## 2. Full Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                  │
│  ┌─────────────────────────────┐  ┌────────────────────────────────┐   │
│  │ AI Analysis Hub            │  │ [Continue to Pricing →]        │   │
│  │ Case {caseId}              │  └────────────────────────────────┘   │
│  └─────────────────────────────┘                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  PIPELINE BAR (Collapsed to icon row when complete, expandable)         │
│  ○───○───○  Data Mapping → Structuring → Underwriting AI                 │
│  ✓     ✓    [Run Full Analysis] (shown only when all idle)              │
├─────────────────────────────────────────────────────────────────────────────┤
│  KEY STATS GRID — ALWAYS VISIBLE (first fold)                            │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐                                  │
│  │Enroll │ │Claims │ │Freq % │ │Avg Clm│                                  │
│  └───────┘ └───────┘ └───────┘ └───────┘                                  │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐                                  │
│  │Avg Age│ │ w/Clm │ │High $$│ │Loss % │                                  │
│  └───────┘ └───────┘ └───────┘ └───────┘                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  RISK METER + AI INSIGHTS ROW (side by side on desktop)                 │
│  ┌────────────────────────┐  ┌─────────────────────────────────────┐     │
│  │  COMPOSITE RISK SCORE  │  │  AI ANALYTICS INSIGHTS              │     │
│  │  ══════════════════    │  │  ● Risk alert card                 │     │
│  │  72/100  HIGH RISK    │  │  ● Pattern card                     │     │
│  │  [gauge visualization]│  │  ● Opportunity card                  │     │
│  │  Score breakdown:     │  │  (scrollable, max 5 visible)        │     │
│  │  LR: 32  Freq: 18     │  └─────────────────────────────────────┘     │
│  └────────────────────────┘                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  STRUCTURED DATA TABLE                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Structured Data Preview         [681 records] [Export CSV]       │   │
│  │  ─────────────────────────────────────────────────────────────  │   │
│  │  Name │ Age │ Gender │ Rel. │ SI │ Claims │ Total │ Diagnosis │    │   │
│  │  ─────────────────────────────────────────────────────────────  │   │
│  │  ← pagination controls (page 1 of 35) →                          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────────┤
│  PREMIUM IMPACT SECTION                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  PREMIUM IMPACT SUMMARY                                          │   │
│  │  Base: ₹X   Adjustment: +15%   Final: ₹Y   [Maintain/↑/↓]      │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │  PRE-MADE PLAN OPTIONS (3 cards)                                 │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐                 │   │
│  │  │ Basic     │  │ Standard   │  │ Premium    │                 │   │
│  │  │ ₹X/lac    │  │ ₹Y/lac     │  │ ₹Z/lac     │                 │   │
│  │  │ [Select]  │  │ [Select]   │  │ [Select]   │                 │   │
│  │  └────────────┘  └────────────┘  └────────────┘                 │   │
│  └──────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────────┤
│  UNDERWRITING FACTORS (collapsible)                                      │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Recommended Risk Factors (4 factors)    [▼ Expand]             │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │ ⚠ High Loss Ratio - Loading 25%                          │  │   │
│  │  │   Burn cost: ₹12,500  |  Per member: ₹250                  │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Section-by-Section Specifications

### 3.1 Header
| Element | Spec |
|---------|------|
| Title | `font-['Chivo'] text-2xl font-bold` — "AI Analysis Hub" |
| Subtitle | Case ID + "Automated Underwriting Intelligence" |
| CTA Button | "Continue to Pricing →" — `bg-[#0055FF]` — **only visible when step 3 is done** |
| Position | Fixed top or sticky — always accessible |

### 3.2 Pipeline Bar (Step Indicator)
| Element | Spec |
|---------|------|
| Design | Horizontal stepper: 3 circles connected by lines |
| States | idle (gray), running (blue pulse), done (blue + check), error (red) |
| Auto-run | When all steps idle → show "Run Full Analysis Pipeline" button prominently |
| Collapsed mode | When all done → compress to single line "✓ Pipeline Complete — 681 records processed" |
| Click behavior | Non-done steps are clickable to re-run individually |

### 3.3 KEY STATS GRID — The 8 Required Stats

**Position:** First visible section, above the fold, before any scroll.

| # | Stat | Source | Card Design |
|---|------|--------|-------------|
| 1 | **Enrollment Count** | `underwriting_metrics.total_enrolled` | Blue icon, `font-['Chivo']` number |
| 2 | **Claims Count** | `underwriting_metrics.total_claims` | Amber icon |
| 3 | **Claims Frequency (%)** | `underwriting_metrics.claims_frequency` | Amber icon, show as XX% |
| 4 | **Average Claim Size (₹)** | `underwriting_metrics.average_claim_size` | Green icon, formatted ₹ |
| 5 | **Average Age** | `underwriting_metrics.average_age` | Gray icon, show as XX.X yrs |
| 6 | **Members with Claims** | `underwriting_metrics.members_with_claims` | Blue icon |
| 7 | **High Cost Claims** | `underwriting_metrics.high_cost_claims.length` | Red icon |
| 8 | **Loss Ratio (%)** | `underwriting_metrics.loss_ratio` | Red (>100%) / Amber (50-100%) / Green (<50%) — color-coded by value |

**Card spec:**
```
┌────────────────────────────────┐
│ ┌─────┐                        │
│ │Icon │  [NUMBER]              │
│ └─────┘  [Label]               │
└────────────────────────────────┘
```
- Grid: `grid-cols-2 md:grid-cols-4` (2 rows × 4 cols on desktop, stacked on mobile)
- Icon size: `w-10 h-10 rounded-lg bg-{color}-50`
- Number: `text-2xl font-bold font-['Chivo']`
- Label: `text-xs text-[#71717A] uppercase tracking-wide`

**Fallback:** If `underwriting_metrics` not yet generated, show from `key_stats` with a "pending underwriting" indicator.

---

### 3.4 Risk Meter (Composite Risk Score)

**Prominence:** Dark background card (`bg-[#09090B]`) with white text — the visual anchor.

| Element | Spec |
|---------|------|
| Position | Row 2, left column (spans 40% width on desktop) |
| Gauge Type | **Semi-circular gauge** (SVG arc, 180°) |
| Arc color | Green <25, Amber <50, Red <75, Dark Red ≥75 |
| Score display | `text-5xl font-['Chivo'] font-bold` — "72/100" |
| Category badge | Rounded pill with color + "HIGH RISK" / "LOW RISK" etc. |
| Breakdown | 4 mini stat boxes below gauge: Loss Ratio / Frequency / Demographics / High Cost |

**Breakdown box spec:**
```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│   32.0   │ │   18.0   │ │   12.0   │ │   10.0   │
│ LR Score │ │ Freq Scr │ │ Age Scr  │ │High Cost │
│  / 40    │ │  / 25    │ │  / 20    │ │  / 15    │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```
- Text: white, `text-2xl font-bold font-['Chivo']` for value, small for label/max

**Source:** `underwritingData.risk_score.risk_score` and `underwritingData.risk_score.breakdown`

---

### 3.5 AI Analytics Insights

**Position:** Row 2, right column (60% width on desktop)

| Element | Spec |
|---------|------|
| Container | `Card border border-[#E4E4E7] bg-white` with scrollable overflow |
| Max visible | 5 cards (scrollable for more) |
| Card types | risk (⚠️ red), pattern (📊 blue), opportunity (📈 green), info (💡 blue) |
| Severity colors | high → red bg, medium → amber bg, low → green bg |
| Each card shows | Icon + Title + Badge (severity) + Description |

**Source:** Merged from:
1. `data.ai_insights` (from processing)
2. `underwritingData.insights` (from underwriting AI)
3. Auto-generated insights from risk metrics

---

### 3.6 Structured Data Table

**Position:** Below stats + risk row

| Element | Spec |
|---------|------|
| Records | 681 total — currently shows 20 hardcoded |
| **Pagination** | **MUST implement** — use server-side or client pagination |
| Page size | 20 records per page |
| Pagination UI | "← Page 1 of 35 →" with prev/next buttons + page number input |
| Columns | Name, Age, Gender, Relationship, Sum Insured, Claims, Total Claimed, Total Approved, Status, **Diagnosis 1**, Hospital |

**Critical — Diagnostics visibility:**
The backend **does** extract `Diagnosis_1` and `Diagnosis_2` (server.py lines 1595-1624). The table **does** show `Diagnosis_1` column (AIInsightsPage.js line 528). However, the raw claims file may not have `ICD_CODE_LEVEL_1_DESCRIPTION` columns — the data simply won't appear if those fields are empty in the source. This is a **data quality issue**, not a code issue. The fix is in the data mapping pipeline.

**Recommended fix for diagnostics:**
Add a "Diagnosis Coverage" metric to the stats grid: `X/Y records have diagnosis data`. If coverage < 80%, show a warning insight: "⚠️ Only X% of records have diagnosis data — improve source file mapping".

**Export:** "Export CSV" button still included.

---

### 3.7 Premium Impact Section

**Position:** Below table

**3.7.1 Summary Row:**
| Metric | Source field | Notes |
|--------|-------------|-------|
| Base Premium | `premium_impact.base_premium` | Show as ₹X |
| Adjustment | `premium_impact.change_percent` | Show as `+15%` (red) or `-8%` (green) |
| Final Premium | `premium_impact.enrollment_premium` | Highlighted box with `#0055FF` border |
| Recommendation | `premium_impact.recommendation` | Badge: "Increase ↑" / "Decrease ↓" / "Maintain →" |

**BUG FIX NEEDED:** Current frontend (line 719) uses `adjustment_pct` and `final_premium` — backend returns `change_percent` and `enrollment_premium`.

**3.7.2 Pre-made Plan Options (3 cards):**

Based on the backend's `calculate_premium_impact()` and standard insurance tiers:

| Plan | Basis | Data to show |
|------|-------|--------------|
| **Basic** | Base premium only, no adjustments | Base premium per lac SI |
| **Standard** | Base + recommended adjustments | Final premium per lac SI |
| **Premium Plus** | Base + max loading scenarios | Premium with +10% additional buffer |

Each plan card:
```
┌──────────────────┐
│ [BASIC PLAN]     │
│ ₹12,500/lac SI   │
│ No risk loadings │
│ [Select Plan]    │
└──────────────────┘
```

---

### 3.8 Underwriting Factors (Collapsible)

**Position:** Below Premium Impact

| Element | Spec |
|---------|------|
| Default state | Collapsed (show count badge only) |
| Expanded state | List of factor cards |
| Each factor | Factor name, loading/discount %, justification, burn cost impact, per-enrollee impact |
| Fields mapping | Fix frontend — backend uses `loading`, `discount`, `justification`, `burn_cost_impact`, `enrollment_impact` (not `weight`, `reason`, `impact.burn_cost`) |

---

## 4. Metrics Accuracy — Backend Source Map

| Metric | Backend Function | Accuracy | Notes |
|--------|-----------------|----------|-------|
| Enrollment Count | `key_stats.total_enrolled` / `underwriting_metrics.total_enrolled` | ✅ TRUSTED | From enrollment file count |
| Claims Count | `key_stats.total_claims` / `underwriting_metrics.total_claims` | ✅ TRUSTED | From claims file count |
| Claims Frequency | `calculate_underwriting_metrics()` line 48-49 | ✅ TRUSTED | `members_with_claims / total_enrolled × 100` |
| Avg Claim Size | `calculate_underwriting_metrics()` line 52 | ✅ TRUSTED | `total_claimed / total_claims` |
| Avg Age | `calculate_underwriting_metrics()` lines 21-29 | ✅ TRUSTED | Mean of all Age fields |
| Members w/ Claims | `calculate_underwriting_metrics()` line 48 | ✅ TRUSTED | Count where Claim_Count > 0 |
| High Cost Claims | `calculate_underwriting_metrics()` lines 64-72 | ✅ TRUSTED | Claims > ₹5,00,000 |
| Loss Ratio | `calculate_underwriting_metrics()` line 18 | ⚠️ ESTIMATED | Uses `estimated_premium = total_claimed × 1.5` — not actual premium |
| Risk Score | `calculate_risk_score()` lines 105-147 | ✅ TRUSTED | Weighted formula on LR + freq + age + high-cost |
| Premium Impact | `calculate_premium_impact()` lines 223-241 | ⚠️ ESTIMATED | Same estimated premium dependency |

**⚠️ Accuracy concern:** Loss ratio and premium impact use `estimated_premium = total_claimed * 1.5` if no actual premium is provided. This is a rough estimate. The page should display a notice: "Loss ratio calculated using estimated premium — input actual premium for accuracy."

---

## 5. UX Flow

### Page Load Sequence

```
1. Page loads → show skeleton/loader
2. Fetch case data from `/api/cases/{caseId}`
3. Check step status:
   a. If underwriting_metrics exists → ALL data ready
      → Load immediately → show full stats grid + risk meter + table + premium
   b. If structured_data exists but no underwriting → steps 1&2 done
      → Show stats from key_stats (limited) + auto-trigger step 3
   c. If nothing done → all idle
      → Show pipeline bar with "Run Full Analysis Pipeline" button
4. User clicks "Run" → steps 1→2→3 execute sequentially with progress indicators
5. Each step completion → relevant section fades in
6. All done → full page visible with stats prominent
```

### Scroll Behavior
- **Initial load:** Stats grid should be visible without scrolling (above fold)
- **Sticky header:** Keep title + CTA visible on scroll
- **Recommended section order ensures natural reading flow:**
  1. Stats (what's the situation?)
  2. Risk meter (how risky is it?)
  3. AI insights (why?)
  4. Data table (show me the details)
  5. Premium (what does it cost?)
  6. Factors (why does it cost that?)

---

## 6. Diagnostics Investigation — Root Cause

### Finding: Diagnostics ARE being extracted
The backend **does extract** `Diagnosis_1` and `Diagnosis_2` from claims:

**server.py lines 1595-1624:**
```python
diagnosis_1 = first_claim.get("ICD_CODE_LEVEL_1_DESCRIPTION") or first_claim.get("ICD_CODE_1") or ""
diagnosis_2 = first_claim.get("ICD_CODE_LEVEL_2_DESCRIPTION") or first_claim.get("ICD_CODE_2") or ""
```

These are written to `structured_data` and returned to the frontend.

**AIInsightsPage.js line 553:**
```jsx
<td className="py-3 px-3 text-[#71717A] max-w-[150px] truncate">{row.Diagnosis_1 || '-'}</td>
```

The column **is present** in the table.

### Root Cause: Data Quality
The most likely reason diagnostics show as `-` is:
1. **Source file doesn't have ICD columns** — common with small insurers or Excel exports
2. **Column name mismatch** — the mapping looks for specific field names; alternate names like "Ailment", "Condition", "Diagnosis Description" won't match
3. **Diagnosis is free-text** — not in structured columns at all

### Recommended Fixes:
1. Add diagnostic coverage metric to stats: `"diagnosis_coverage": X%`
2. Show warning insight if coverage < 80%
3. Expand the diagnosis mapping to include more field name variations
4. Add "Diagnosis 2" column to the table (currently only shows Diagnosis 1)
5. Add a "Diagnosis Category" derived field (e.g., "Cardiovascular", "Orthopedic", "Maternity") — see `categorize_diseases()` in docs

---

## 7. Implementation Checklist

| # | Task | Priority | Files to Modify |
|---|------|----------|-----------------|
| 1 | Move all 8 key stats to underwriting_metrics source | 🔴 CRITICAL | AIInsightsPage.js |
| 2 | Fix Premium Impact field names (change_percent, enrollment_premium) | 🔴 CRITICAL | AIInsightsPage.js |
| 3 | Implement table pagination (681 records) | 🔴 CRITICAL | AIInsightsPage.js |
| 4 | Fix Underwriting Factors field mapping | 🔴 CRITICAL | AIInsightsPage.js |
| 5 | Show diagnostics coverage metric | 🟡 HIGH | AIInsightsPage.js, server.py |
| 6 | Add 3 pre-made plan option cards | 🟡 HIGH | AIInsightsPage.js |
| 7 | Show Diagnosis_2 in table | 🟡 HIGH | AIInsightsPage.js |
| 8 | Auto-run pipeline when structured data exists | 🟡 HIGH | AIInsightsPage.js |
| 9 | Collapsible underwriting factors section | 🟢 MEDIUM | AIInsightsPage.js |
| 10 | "Loss ratio estimated" notice | 🟢 MEDIUM | AIInsightsPage.js |
| 11 | Premium Impact section field name fixes | 🔴 CRITICAL | AIInsightsPage.js (lines 719, 726) |
