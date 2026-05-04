import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '';

export default function AIInsightsPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [structuredData, setStructuredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingAI, setProcessingAI] = useState(false);
  const [activeTab, setActiveTab] = useState('underwriting');
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchCase = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API}/api/cases/${caseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.case || res.data;
      setCaseData(data);
      if (data.structured_data?.length) {
        setStructuredData(data.structured_data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => { fetchCase(); }, [fetchCase]);

  const runProcessAI = async () => {
    const token = localStorage.getItem('token');
    setProcessingAI(true);
    try {
      await axios.post(`${API}/api/cases/${caseId}/process-ai`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchCase();
    } catch (err) {
      console.error('Process AI error:', err);
    } finally {
      setProcessingAI(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500">Loading insights...</p>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">Case not found</p>
        <Link to="/cases" className="text-blue-600 hover:underline mt-2 block">← Back to Cases</Link>
      </div>
    );
  }

  const keyStats = caseData.key_stats || {};
  const metrics = caseData.metrics || {};
  const impact = caseData.impact || {};
  const factors = caseData.factors || [];
  const plans = caseData.plans || [];
  const underwriting_metrics = caseData.underwriting_metrics || metrics;
  const risk_score_data = caseData.risk_score || {};

  const fmt = (n) => {
    if (!n && n !== 0) return '—';
    return '₹' + Number(n).toLocaleString('en-IN');
  };

  const fmtLac = (n) => {
    if (!n && n !== 0) return '—';
    return '₹' + (Number(n) / 100000).toFixed(2) + 'L';
  };

  const statusColor = (s) => {
    switch ((s || '').toLowerCase()) {
      case 'ready': return 'bg-green-100 text-green-700';
      case 'processing': return 'bg-yellow-100 text-yellow-700';
      case 'error': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const severityBadge = (s) => {
    switch (s) {
      case 'high': return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">High Risk</span>;
      case 'medium': return <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-700">Medium Risk</span>;
      case 'low': return <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700">Low Risk</span>;
      default: return null;
    }
  };

  const riskBadge = (score) => {
    if (!score) return null;
    if (score >= 75) return { label: 'High Risk', cls: 'bg-red-600 text-white' };
    if (score >= 50) return { label: 'Moderate', cls: 'bg-yellow-500 text-white' };
    return { label: 'Low Risk', cls: 'bg-green-600 text-white' };
  };
  const rs = riskBadge(risk_score_data.score);

  // ─── STAT CARD ───
  const StatCard = ({ label, value, sub, color = 'blue' }) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-900',
      green: 'bg-green-50 border-green-200 text-green-900',
      red: 'bg-red-50 border-red-200 text-red-900',
      amber: 'bg-amber-50 border-amber-200 text-amber-900',
      purple: 'bg-purple-50 border-purple-200 text-purple-900',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-900',
    };
    return (
      <div className={`rounded-xl border p-4 ${colors[color]}`}>
        <div className="text-2xl font-bold leading-tight">{value}</div>
        <div className="text-sm font-medium opacity-80 mt-0.5">{label}</div>
        {sub && <div className="text-xs opacity-60 mt-0.5">{sub}</div>}
      </div>
    );
  };

  // ─── SECTION HEADER ───
  const SectionHeader = ({ title, subtitle, badge }) => (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {badge && <div className="mt-0.5">{badge}</div>}
    </div>
  );

  // ─── NO DATA PLACEHOLDER ───
  const NoData = ({ message = 'Run AI Processing first to generate insights' }) => (
    <div className="text-center py-12 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
      <div className="text-4xl mb-3">📊</div>
      <p className="text-gray-500 font-medium">{message}</p>
      <button
        onClick={runProcessAI}
        disabled={processingAI}
        className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors"
      >
        {processingAI ? '⚙️ Processing...' : '▶️ Run AI Processing'}
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">
      {/* ── TOP BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{caseData.name || caseData.company_name || 'GMC Analysis'}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${statusColor(caseData.ai_status)}`}>
              {caseData.ai_status || 'Pending'}
            </span>
            {rs && <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${rs.cls}`}>{rs.label} ({risk_score_data.score})</span>}
          </div>
          <p className="text-sm text-gray-500 mt-1">Case ID: {caseData.case_id}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={runProcessAI}
            disabled={processingAI}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {processingAI ? (
              <><span className="animate-spin">⚙️</span> Processing...</>
            ) : (
              <><span>▶️</span> Run AI Analysis</>
            )}
          </button>
          <Link
            to={`/cases/${caseId}/upload`}
            className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* ── HERO STATS (4-grid, mobile: 2-col) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Members Enrolled"
          value={keyStats.total_enrolled ?? metrics.total_enrolled ?? '—'}
          sub={`${metrics.members_with_claims || 0} with claims`}
          color="blue"
        />
        <StatCard
          label="Total Claims"
          value={keyStats.total_claims ?? metrics.total_claims ?? '—'}
          sub={`${metrics.claims_frequency || 0}% frequency`}
          color="purple"
        />
        <StatCard
          label="Total Claimed"
          value={fmtLac(keyStats.total_claimed ?? metrics.total_claimed ?? 0)}
          sub={`${metrics.average_claim_size ? 'Avg ' + fmt(metrics.average_claim_size) : ''}`}
          color="amber"
        />
        <StatCard
          label="Loss Ratio"
          value={`${metrics.loss_ratio ?? 0}%`}
          sub={metrics.recommended_coverage_tier ? `Recommended: ${metrics.recommended_coverage_tier}` : ''}
          color={(metrics.loss_ratio ?? 0) >= 100 ? 'red' : (metrics.loss_ratio ?? 0) >= 60 ? 'amber' : 'green'}
        />
      </div>

      {/* ── TABS ── */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto">
          {[
            { key: 'underwriting', label: '📊 Underwriting Analysis' },
            { key: 'members', label: '👥 Member Data' },
            { key: 'plans', label: '💰 Premium Plans' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          UNDERWRITING TAB
      ══════════════════════════════════════════ */}
      {activeTab === 'underwriting' && (
        <div className="space-y-5">
          {/* No underwriting data yet */}
          {!risk_score_data.score && !metrics.loss_ratio && (
            <NoData message="No underwriting data yet. Upload enrollment & claims files, then run AI Analysis." />
          )}

          {metrics.loss_ratio !== undefined && (
            <>
              {/* UNDERWRITING PANEL */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

                {/* Panel Header */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-700 px-5 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-white font-semibold text-lg">Underwriting Intelligence</h2>
                      <p className="text-gray-300 text-sm mt-0.5">AI-calculated risk profile and premium recommendations</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {rs && (
                        <div className={`text-center px-4 py-2 rounded-lg ${rs.cls.replace('text-white', 'bg-white/20 text-white')}`}>
                          <div className="text-3xl font-black">{risk_score_data.score || '?'}</div>
                          <div className="text-xs opacity-80">{rs.label}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Severity + Recommendation Bar */}
                {(impact.overall_severity || impact.recommendation) && (
                  <div className={`px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm ${
                    impact.overall_severity === 'high' ? 'bg-red-50 border-b border-red-100' :
                    impact.overall_severity === 'medium' ? 'bg-yellow-50 border-b border-yellow-100' :
                    'bg-green-50 border-b border-green-100'
                  }`}>
                    <div className="flex items-center gap-2">
                      {severityBadge(impact.overall_severity)}
                      <span className="text-gray-700">
                        <strong>{factors.length}</strong> factors identified
                        {impact.total_loading_percent > 0 && <span className="ml-2 text-red-600 font-semibold">+{impact.total_loading_percent}% loading</span>}
                        {impact.total_discount_percent > 0 && <span className="ml-2 text-green-600 font-semibold">-{impact.total_discount_percent}% discount</span>}
                      </span>
                    </div>
                    <span className={`font-semibold ${
                      impact.recommendation === 'Increase' ? 'text-red-700' :
                      impact.recommendation === 'Decrease' ? 'text-green-700' : 'text-gray-700'
                    }`}>
                      {impact.recommendation === 'Increase' ? '⬆️ Premium Increase Recommended' :
                       impact.recommendation === 'Decrease' ? '⬇️ Discount Available' :
                       '➡️ Maintain Current Premium'}
                    </span>
                  </div>
                )}

                <div className="p-5 space-y-5">
                  {/* METRICS GRID */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">📈 Key Metrics</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {[
                        { label: 'Base Premium', value: fmtLac(underwriting_metrics.estimated_premium), color: 'text-blue-700' },
                        { label: 'Premium/Lac', value: fmt(underwriting_metrics.premium_per_lac || ''), color: 'text-blue-700' },
                        { label: 'Avg Age', value: `${underwriting_metrics.average_age || '—'} yrs`, color: 'text-purple-700' },
                        { label: 'Avg Claim Size', value: fmt(underwriting_metrics.average_claim_size), color: 'text-amber-700' },
                        { label: 'Chronic Members', value: `${underwriting_metrics.chronic_members_count || 0} (${underwriting_metrics.chronic_members_pct || 0}%)`, color: 'text-red-700' },
                        { label: 'Conc. Risk', value: `${underwriting_metrics.top_3_concentration_pct || 0}%`, color: 'text-red-700' },
                        { label: 'Emp/Dep Ratio', value: underwriting_metrics.employee_dependent_ratio || '—', color: 'text-gray-700' },
                        { label: 'Benchmark LR', value: `${underwriting_metrics.industry_benchmark || 65}%`, color: 'text-gray-500' },
                        { label: 'vs Benchmark', value: `${underwriting_metrics.lr_vs_industry_benchmark > 0 ? '+' : ''}${underwriting_metrics.lr_vs_industry_benchmark || 0}%`, color: (underwriting_metrics.lr_vs_industry_benchmark || 0) > 0 ? 'text-red-700' : 'text-green-700' },
                        { label: 'Members w/ Claims', value: underwriting_metrics.members_with_claims || 0, color: 'text-gray-700' },
                        { label: 'Claim Freq.', value: `${underwriting_metrics.claims_frequency || 0}%`, color: 'text-gray-700' },
                        { label: 'Claim/Member', value: fmt(underwriting_metrics.claim_per_member), color: 'text-gray-700' },
                      ].filter(m => m.value && m.value !== '—' && m.value !== '₹').map((m, i) => (
                        <div key={i} className="bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                          <div className={`text-lg font-bold leading-tight ${m.color}`}>{m.value}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{m.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AGE + GENDER DISTRIBUTION */}
                  {(underwriting_metrics.age_distribution || underwriting_metrics.gender_distribution) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {underwriting_metrics.age_distribution && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">👥 Age Distribution</h3>
                          <div className="space-y-1.5">
                            {Object.entries(underwriting_metrics.age_distribution).map(([band, pct]) => (
                              <div key={band} className="flex items-center gap-2">
                                <span className="text-xs text-gray-600 w-12">{band}</span>
                                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full text-xs font-bold text-white flex items-center px-1 ${
                                      parseFloat(pct) > 30 ? 'bg-red-500' : parseFloat(pct) > 15 ? 'bg-amber-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${Math.max(4, Math.min(100, parseFloat(pct) * 3))}%` }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-gray-700 w-12 text-right">{pct}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {underwriting_metrics.gender_distribution && Object.keys(underwriting_metrics.gender_distribution).length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">⚧ Gender Distribution</h3>
                          <div className="space-y-1.5">
                            {Object.entries(underwriting_metrics.gender_distribution).map(([gender, pct]) => (
                              <div key={gender} className="flex items-center gap-2">
                                <span className="text-xs text-gray-600 w-12">{gender}</span>
                                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                                  <div
                                    className="h-full bg-purple-500 rounded-full"
                                    style={{ width: `${Math.max(4, Math.min(100, parseFloat(pct) * 2))}%` }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-gray-700 w-12 text-right">{pct}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* HIGH COST + TOP MEMBERS */}
                  {(underwriting_metrics.high_cost_claims?.length > 0 || underwriting_metrics.top_3_members?.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {underwriting_metrics.high_cost_claims?.length > 0 && (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                          <h3 className="text-sm font-bold text-red-700 mb-2">🚨 High-Cost Claims (₹5L+)</h3>
                          <div className="space-y-2">
                            {(underwriting_metrics.high_cost_claims || []).slice(0, 3).map((c, i) => (
                              <div key={i} className="flex justify-between items-center text-sm">
                                <span className="text-gray-700 truncate flex-1 mr-2">{c.name || `Member ${i+1}`}</span>
                                <span className="font-bold text-red-700 whitespace-nowrap">{fmtLac(c.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {underwriting_metrics.top_3_members?.length > 0 && (
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                          <h3 className="text-sm font-bold text-amber-700 mb-2">📍 Top Claims Concentration</h3>
                          <div className="space-y-2">
                            {(underwriting_metrics.top_3_members || []).map((m, i) => (
                              <div key={i} className="flex justify-between items-center text-sm">
                                <span className="text-gray-700 flex items-center gap-1.5">
                                  {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                                  <span className="truncate">{m.name || `Rank ${i+1}`}</span>
                                </span>
                                <span className="font-bold text-amber-700 whitespace-nowrap">{fmtLac(m.claimed)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PREMIUM IMPACT BREAKDOWN */}
                  {impact.factor_breakdown?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">⚖️ Premium Factors ({factors.length} adjustments)</h3>
                      <div className="space-y-2">
                        {impact.factor_breakdown.map((f, i) => (
                          <div key={i} className={`flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border ${
                            f.type === 'loading' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'
                          }`}>
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <span className={`mt-0.5 text-sm font-bold ${f.type === 'loading' ? 'text-red-600' : 'text-green-600'}`}>
                                {f.type === 'loading' ? '+' : '−'}{f.percentage}
                              </span>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-gray-900 leading-tight">{f.factor}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{f.justification}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                              {f.enrollment_impact !== undefined && f.enrollment_impact !== 0 && (
                                <span className={`text-xs font-bold ${f.enrollment_impact > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {f.enrollment_impact > 0 ? '+' : ''}{fmt(f.enrollment_impact)} impact
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Summary impact bar */}
                      <div className="mt-4 p-4 bg-gray-900 rounded-lg">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="text-xl font-black text-white">{fmtLac(impact.base_premium)}</div>
                            <div className="text-xs text-gray-400">Base Premium</div>
                          </div>
                          {impact.total_adjustment > 0 ? (
                            <>
                              <div>
                                <div className="text-xl font-black text-red-400">+{fmt(impact.total_adjustment)}</div>
                                <div className="text-xs text-gray-400">Adjustments</div>
                              </div>
                              <div>
                                <div className="text-xl font-black text-yellow-400">{fmtLac(impact.enrollment_premium)}</div>
                                <div className="text-xs text-gray-400">Final Premium</div>
                              </div>
                              <div>
                                <div className="text-xl font-black text-red-400">+{impact.change_percent}%</div>
                                <div className="text-xs text-gray-400">Change</div>
                              </div>
                            </>
                          ) : impact.total_adjustment < 0 ? (
                            <>
                              <div>
                                <div className="text-xl font-black text-green-400">{fmt(impact.total_adjustment)}</div>
                                <div className="text-xs text-gray-400">Adjustments</div>
                              </div>
                              <div>
                                <div className="text-xl font-black text-green-400">{fmtLac(impact.enrollment_premium)}</div>
                                <div className="text-xs text-gray-400">Final Premium</div>
                              </div>
                              <div>
                                <div className="text-xl font-black text-green-400">{impact.change_percent}%</div>
                                <div className="text-xs text-gray-400">Savings</div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <div className="text-xl font-black text-yellow-400">No Change</div>
                                <div className="text-xs text-gray-400">Adjustments</div>
                              </div>
                              <div>
                                <div className="text-xl font-black text-white">{fmtLac(impact.enrollment_premium)}</div>
                                <div className="text-xs text-gray-400">Maintain</div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── 3 PREMIUM PLAN CARDS ── */}
                  {plans.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">💰 Quotation — {plans.length} Plan Options</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {plans.map((plan, i) => (
                          <div
                            key={i}
                            className={`relative rounded-xl border-2 p-5 ${
                              i === 1
                                ? 'border-blue-600 shadow-lg shadow-blue-100 ring-2 ring-blue-100'
                                : 'border-gray-200 hover:border-gray-300'
                            } bg-white`}
                          >
                            {i === 1 && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">⭐ Recommended</span>
                              </div>
                            )}
                            <div className="text-center mb-4">
                              <div className="text-3xl mb-1">{plan.emoji || '📋'}</div>
                              <h4 className="text-lg font-bold text-gray-900">{plan.name}</h4>
                              <p className="text-xs text-gray-500 mt-0.5">{plan.tagline || ''}</p>
                              <div className="mt-3">
                                <span className="text-3xl font-black text-gray-900">{fmtLac(plan.premium)}</span>
                                <div className="text-xs text-gray-500 mt-0.5">per lac sum insured</div>
                              </div>
                              <div className="text-sm font-semibold text-blue-600 mt-1">
                                Total: {fmtLac((plan.total_annual_premium || plan.premium))}
                              </div>
                            </div>

                            {/* Features */}
                            {plan.features && (
                              <div className="space-y-1.5 mb-4">
                                {(plan.features || []).map((feat, fi) => (
                                  <div key={fi} className="flex items-start gap-1.5 text-xs">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    <span className="text-gray-700">{feat}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Loading/Discount */}
                            {(plan.total_loading_percent > 0 || plan.total_discount_percent > 0) && (
                              <div className="text-xs text-center mb-3">
                                {plan.total_loading_percent > 0 && (
                                  <span className="text-red-600 font-semibold">+{plan.total_loading_percent}% loadings applied</span>
                                )}
                                {plan.total_discount_percent > 0 && (
                                  <span className="text-green-600 font-semibold">-{plan.total_discount_percent}% discounts applied</span>
                                )}
                              </div>
                            )}

                            <div className="text-xs text-gray-400 text-center">
                              Loss Ratio: {plan.loss_ratio || metrics.loss_ratio}%
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* QUOTATION ACTIONS */}
                      <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          onClick={() => {
                            const text = `GMC Quotation — ${caseData.name}\n\nPlans:\n${plans.map((p,i) => `${i+1}. ${p.name}: ₹${(p.premium/100000).toFixed(2)}L/lac (Total: ₹${((p.total_annual_premium || p.premium)/100000).toFixed(2)}L)\nFeatures: ${(p.features || []).join(', ')}`).join('\n\n')}\n\nCase: ${caseData.case_id}`;
                            if (navigator.share) {
                              navigator.share({ title: 'GMC Quotation', text });
                            } else {
                              navigator.clipboard.writeText(text);
                              alert('Quotation copied to clipboard!');
                            }
                          }}
                          className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          📤 Share Quotation
                        </button>
                        <button
                          onClick={runProcessAI}
                          disabled={processingAI}
                          className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium transition-colors"
                        >
                          🔄 Regenerate
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          MEMBERS TAB
      ══════════════════════════════════════════ */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Member Data</h2>
              <p className="text-sm text-gray-500">{structuredData.length} members • {structuredData.filter(r => r.Has_Claims).length} with claims</p>
            </div>
          </div>
          {structuredData.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No member data. Run AI Analysis first.</p>
              <button onClick={runProcessAI} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                Run AI Analysis
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Member</th>
                    <th className="text-left px-3 py-3 font-semibold text-gray-700 whitespace-nowrap">Age</th>
                    <th className="text-left px-3 py-3 font-semibold text-gray-700 whitespace-nowrap hidden sm:table-cell">Gender</th>
                    <th className="text-left px-3 py-3 font-semibold text-gray-700 whitespace-nowrap hidden md:table-cell">Relationship</th>
                    <th className="text-left px-3 py-3 font-semibold text-gray-700 whitespace-nowrap hidden lg:table-cell">PEC</th>
                    <th className="text-center px-3 py-3 font-semibold text-gray-700 whitespace-nowrap">Claims</th>
                    <th className="text-right px-3 py-3 font-semibold text-gray-700 whitespace-nowrap">Claimed</th>
                    <th className="text-center px-3 py-3 font-semibold text-gray-700 whitespace-nowrap">Status</th>
                    <th className="text-left px-3 py-3 font-semibold text-gray-700 whitespace-nowrap hidden xl:table-cell">Diagnosis</th>
                  </tr>
                </thead>
                <tbody>
                  {structuredData.map((row, i) => (
                    <React.Fragment key={i}>
                      <tr
                        onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                        className={`border-b border-gray-100 cursor-pointer transition-colors ${
                          expandedRow === i ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 leading-tight">{row.Name || '—'}</div>
                          <div className="text-xs text-gray-400">{row.Employee_ID || row.employee_id || ''}</div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="whitespace-nowrap">{row.Age || row.age || '—'}</span>
                          {row.Age_Band && <div className="text-xs text-gray-400">{row.Age_Band}</div>}
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell">{row.Gender || '—'}</td>
                        <td className="px-3 py-3 hidden md:table-cell">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            row.Relationship?.toLowerCase() === 'self' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                          }`}>{row.Relationship || 'SELF'}</span>
                        </td>
                        <td className="px-3 py-3 hidden lg:table-cell">
                          {row.Chronic_Condition ? (
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">Chronic</span>
                          ) : row.Pre_Existing_Conditions ? (
                            <span className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700">PEC</span>
                          ) : (
                            <span className="text-xs text-gray-400">None</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center font-semibold">{row.Claim_Count ?? 0}</td>
                        <td className="px-3 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                          {row.Total_Claimed > 0 ? fmtLac(row.Total_Claimed) : '—'}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {row.Claim_Status ? (
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              row.Claim_Status === 'Paid' || row.Claim_Status === 'Approved' ? 'bg-green-100 text-green-700' :
                              row.Claim_Status === 'Rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>{row.Claim_Status}</span>
                          ) : (
                            <span className="text-xs text-gray-400">No claim</span>
                          )}
                        </td>
                        <td className="px-3 py-3 hidden xl:table-cell">
                          <div className="text-xs text-gray-600 max-w-[200px] truncate" title={row.Diagnosis_1 || ''}>
                            {row.Diagnosis_1 || '—'}
                          </div>
                        </td>
                      </tr>
                      {/* Expanded row */}
                      {expandedRow === i && (
                        <tr className="bg-blue-50">
                          <td colSpan={9} className="px-6 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              {row.Hospital_1 && (
                                <div>
                                  <div className="text-xs font-semibold text-gray-500 uppercase">Hospital</div>
                                  <div className="text-gray-900 mt-0.5">{row.Hospital_1}</div>
                                </div>
                              )}
                              {row.Diagnosis_1 && (
                                <div>
                                  <div className="text-xs font-semibold text-gray-500 uppercase">Primary Diagnosis</div>
                                  <div className="text-gray-900 mt-0.5">{row.Diagnosis_1}</div>
                                </div>
                              )}
                              {row.Diagnosis_2 && (
                                <div>
                                  <div className="text-xs font-semibold text-gray-500 uppercase">Secondary Diagnosis</div>
                                  <div className="text-gray-900 mt-0.5">{row.Diagnosis_2}</div>
                                </div>
                              )}
                              {row.Pre_Existing_Conditions && (
                                <div>
                                  <div className="text-xs font-semibold text-gray-500 uppercase">Pre-Existing Conditions</div>
                                  <div className="text-gray-900 mt-0.5">{row.Pre_Existing_Conditions}</div>
                                </div>
                              )}
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase">Sum Insured</div>
                                <div className="text-gray-900 mt-0.5">{fmt(row.Sum_Insured)}</div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase">Approved Amount</div>
                                <div className="text-gray-900 mt-0.5">{fmt(row.Total_Approved)}</div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase">Department</div>
                                <div className="text-gray-900 mt-0.5">{row.Department || '—'}</div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase">Age Band</div>
                                <div className="text-gray-900 mt-0.5">{row.Age_Band || '—'}</div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          PLANS TAB (standalone view)
      ══════════════════════════════════════════ */}
      {activeTab === 'plans' && (
        <div>
          {plans.length === 0 ? (
            <NoData message="No plans generated yet. Run AI Analysis to generate premium plans." />
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Premium Plan Options</h2>
                <p className="text-sm text-gray-500 mt-1">Based on {caseData.name || caseData.company_name} — {metrics.loss_ratio}% loss ratio</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan, i) => (
                  <div key={i} className={`relative rounded-2xl border-2 p-6 ${
                    i === 1 ? 'border-blue-600 shadow-xl shadow-blue-100' : 'border-gray-200 shadow-sm'
                  } bg-white`}>
                    {i === 1 && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <span className="bg-blue-600 text-white text-sm font-bold px-4 py-1 rounded-full">⭐ Recommended</span>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="text-4xl mb-2">{plan.emoji || '📋'}</div>
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{plan.tagline}</p>
                      <div className="my-4 py-4 border-y border-gray-100">
                        <div className="text-4xl font-black text-gray-900">{fmtLac(plan.premium)}</div>
                        <div className="text-sm text-gray-500">per lac sum insured</div>
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        Total: {fmtLac(plan.total_annual_premium || plan.premium)}
                      </div>
                    </div>
                    {plan.features && (
                      <div className="mt-4 space-y-2">
                        {(plan.features || []).map((feat, fi) => (
                          <div key={fi} className="flex items-center gap-2 text-sm">
                            <span className="text-green-500 font-bold">✓</span>
                            <span className="text-gray-700">{feat}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-5 flex flex-col gap-2">
                      <button
                        onClick={() => {
                          const text = `GMC QUOTATION\n\nCompany: ${caseData.name}\nCase: ${caseData.case_id}\n\n${plan.name} Plan\nPremium: ${fmtLac(plan.premium)}/lac\nTotal Annual Premium: ${fmtLac(plan.total_annual_premium || plan.premium)}\n\nFeatures:\n${(plan.features || []).map((f,i) => `${i+1}. ${f}`).join('\n')}`;
                          navigator.clipboard.writeText(text);
                          alert('Plan copied to clipboard!');
                        }}
                        className="w-full px-4 py-2.5 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-semibold"
                      >
                        Copy Plan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <button onClick={runProcessAI} disabled={processingAI} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                  🔄 Regenerate Plans
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
