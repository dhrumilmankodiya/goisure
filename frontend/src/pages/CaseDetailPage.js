import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';

const API = process.env.REACT_APP_API_URL || '';

export default function CaseDetailPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [structuredData, setStructuredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingAI, setProcessingAI] = useState(false);
  
  // Tab persistence: restore last active tab from localStorage
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem(`gmc_case_${caseId}_tab`) || 'underwriting';
    } catch {
      return 'underwriting';
    }
  });
  
  const persistTab = useCallback((tab) => {
    setActiveTab(tab);
    try {
      localStorage.setItem(`gmc_case_${caseId}_tab`, tab);
    } catch { /* localStorage full or blocked */ }
    // Trigger data fetching on tab switch
    if (tab === 'breakdown') fetchClaimBreakdown();
    if (tab === 'trends') fetchClaimTrends();
    if (tab === 'members') fetchMembers();
  }, [caseId]);
  
  const [claimBreakdown, setClaimBreakdown] = useState(null);
  const [claimTrends, setClaimTrends] = useState(null);
  const [membersData, setMembersData] = useState([]);
  const [membersPagination, setMembersPagination] = useState({});
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersPage, setMembersPage] = useState(1);
  const [membersLimit] = useState(15);
  const [membersSearch, setMembersSearch] = useState('');
  const [membersFilters, setMembersFilters] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitModal, setSubmitModal] = useState(false);
  const [submitNotes, setSubmitNotes] = useState('');

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

  const fetchMembers = useCallback(async (page = 1) => {
    const token = localStorage.getItem('token');
    setMembersLoading(true);
    try {
      const filtersStr = encodeURIComponent(JSON.stringify(membersFilters));
      const searchStr = encodeURIComponent(membersSearch);
      const res = await axios.get(
        `${API}/api/cases/${caseId}/members?page=${page}&limit=${membersLimit}&search=${searchStr}&filters=${filtersStr}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setMembersData(res.data.data || []);
        setMembersPagination(res.data.pagination || {});
        setMembersPage(page);
      }
    } catch (err) {
      console.error('Fetch members error:', err);
    } finally {
      setMembersLoading(false);
    }
  }, [caseId, membersLimit, membersSearch, membersFilters]);

  const fetchClaimBreakdown = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API}/api/cases/${caseId}/claim-breakdown`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setClaimBreakdown(res.data.breakdown || {});
      }
    } catch (err) {
      console.error('Fetch claim breakdown error:', err);
    }
  }, [caseId]);

  const fetchClaimTrends = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API}/api/cases/${caseId}/claim-trends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setClaimTrends(res.data);
      }
    } catch (err) {
      console.error('Fetch claim trends error:', err);
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

  const handleSubmitToUnderwriter = async () => {
    const token = localStorage.getItem('token');
    setSubmitting(true);
    try {
      await axios.post(`${API}/api/cases/${caseId}/submit-to-underwriter`,
        { notes: submitNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubmitModal(false);
      setSubmitNotes('');
      await fetchCase();
      alert('Case submitted to underwriter successfully!');
    } catch (err) {
      console.error('Submit error:', err);
      alert('Failed to submit case');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-500">Loading case details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!caseData) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">Case not found</p>
          <Link to="/cases" className="text-blue-600 hover:underline mt-2 block">← Back to Cases</Link>
        </div>
      </Layout>
    );
  }

  const keyStats = caseData.key_stats || {};
  const metrics = caseData.metrics || caseData.underwriting_metrics || {};
  const impact = caseData.impact || {};
  const factors = caseData.factors || [];
  const plans = caseData.plans || caseData.premade_plans || [];
  const risk_score_data = caseData.risk_score || {};

  const fmt = (n) => {
    if (!n && n !== 0) return '—';
    return '₹' + Number(n).toLocaleString('en-IN');
  };

  const fmtLac = (n) => {
    if (!n && n !== 0) return '—';
    return '₹' + (Number(n) / 100000).toFixed(2) + 'L';
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
    <Layout>
      <div className="space-y-5">
        {/* ☰ TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/cases" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline ml-1">Back</span>
              <span className="sm:hidden ml-1">Cases</span>
            </Link>
            <span className="text-gray-300">/</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{caseData.name || caseData.company_name || 'Case Details'}</h1>
              <p className="text-sm text-gray-500 mt-0.5">Case ID: {caseData.case_id}</p>
            </div>
            {caseData.status && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                caseData.status === 'approved' ? 'bg-green-100 text-green-700' :
                caseData.status === 'rejected' ? 'bg-red-100 text-red-700' :
                caseData.status === 'submitted' || caseData.status === 'under_review' ? 'bg-blue-100 text-blue-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>{caseData.status.replace(/_/g, ' ')}</span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => { setSubmitModal(true); }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Submit to Underwriter
            </button>
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
          </div>
        </div>

        {/* ☆ HERO STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Members Enrolled" value={keyStats.total_enrolled ?? metrics.total_enrolled ?? '—'} sub={`${metrics.members_with_claims || 0} with claims`} color="blue" />
          <StatCard label="Total Claims" value={keyStats.total_claims ?? metrics.total_claims ?? '—'} sub={`${metrics.claims_frequency || 0}% frequency`} color="purple" />
          <StatCard label="Total Claimed" value={fmtLac(keyStats.total_claimed ?? metrics.total_claimed ?? 0)} sub={metrics.average_claim_size ? 'Avg ' + fmt(metrics.average_claim_size) : ''} color="amber" />
          <StatCard label="Loss Ratio" value={`${metrics.loss_ratio ?? 0}%`} sub={metrics.recommended_coverage_tier ? `Recommended: ${metrics.recommended_coverage_tier}` : ''} color={(metrics.loss_ratio ?? 0) >= 100 ? 'red' : (metrics.loss_ratio ?? 0) >= 60 ? 'amber' : 'green'} />
        </div>

        {/* ☆ TABS */}
        <div className="border-b border-gray-200">
          <div className="flex gap-1 overflow-x-auto">
            {[['underwriting','📊 Underwriting'],['members','👥 Members'],['breakdown','📈 Claim Types'],['trends','📉 Trends'],['plans','💰 Plans']].map(([key, label]) => (
              <button key={key} onClick={() => persistTab(key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>{label}</button>
            ))}
          </div>
        </div>

        {/* ──── UNDERWRITING TAB ──── */}
        {activeTab === 'underwriting' && (
        <div className="space-y-5">
          {(!risk_score_data.score && !metrics.loss_ratio) ? (
            <NoData message="No underwriting data. Upload files & run AI Analysis." />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-gray-900 to-gray-700 px-5 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-white font-semibold text-lg">Underwriting Intelligence</h2>
                    <p className="text-gray-300 text-sm mt-0.5">AI-calculated risk profile and premium recommendations</p>
                  </div>
                  {rs && (
                    <div className={`text-center px-4 py-2 rounded-lg ${rs.cls.replace('text-white', 'bg-white/20 text-white')}`}>
                      <div className="text-3xl font-black">{risk_score_data.score || '?'}</div>
                      <div className="text-xs opacity-80">{rs.label}</div>
                    </div>
                  )}
                </div>
              </div>
              {(impact.overall_severity || impact.recommendation) && (
                <div className={`px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm ${
                  impact.overall_severity === 'high' ? 'bg-red-50 border-b border-red-100' :
                  impact.overall_severity === 'medium' ? 'bg-yellow-50 border-b border-yellow-100' : 'bg-green-50 border-b border-green-100'
                }`}>
                  <div className="flex items-center gap-2">
                    {severityBadge(impact.overall_severity)}
                    <span className="text-gray-700"><strong>{factors.length}</strong> factors identified
                      {impact.total_loading_percent > 0 && <span className="ml-2 text-red-600 font-semibold">+{impact.total_loading_percent}% loading</span>}
                      {impact.total_discount_percent > 0 && <span className="ml-2 text-green-600 font-semibold">-{impact.total_discount_percent}% discount</span>}
                    </span>
                  </div>
                  <span className={`font-semibold ${
                    impact.recommendation === 'Increase' ? 'text-red-700' : impact.recommendation === 'Decrease' ? 'text-green-700' : 'text-gray-700'
                  }`}>
                    {impact.recommendation === 'Increase' ? '⬆️ Premium Increase Recommended' :
                     impact.recommendation === 'Decrease' ? '⬇️ Discount Available' : '➡️ Maintain Current Premium'}
                  </span>
                </div>
              )}
              <div className="p-5 space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">📈 Key Metrics</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {[['Base Premium', fmtLac(metrics.estimated_premium), 'blue'],
                      ['Premium/Lac', fmt(metrics.premium_per_lac || ''), 'blue'],
                      ['Avg Age', `${metrics.average_age || '—'} yrs`, 'purple'],
                      ['Avg Claim Size', fmt(metrics.average_claim_size), 'amber'],
                      ['Chronic Members', `${metrics.chronic_members_count || 0} (${metrics.chronic_members_pct || 0}%)`, 'red'],
                      ['Conc. Risk', `${metrics.top_3_concentration_pct || 0}%`, 'red'],
                      ['Emp/Dep Ratio', metrics.employee_dependent_ratio || '—', 'gray'],
                      ['Benchmark LR', `${metrics.industry_benchmark || 65}%`, 'gray'],
                      ['vs Benchmark', `${metrics.lr_vs_industry_benchmark > 0 ? '+' : ''}${metrics.lr_vs_industry_benchmark || 0}%`, metrics.lr_vs_industry_benchmark > 0 ? 'red' : 'green'],
                      ['Members w/ Claims', metrics.members_with_claims || 0, 'gray'],
                      ['Claim Freq.', `${metrics.claims_frequency || 0}%`, 'gray'],
                      ['Claim/Member', fmt(metrics.claim_per_member), 'gray'],
                    ].filter(m => m[1] && m[1] !== '—' && m[1] !== '₹').map(([label, value, color], i) => (
                      <div key={i} className="bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                        <div className={`text-lg font-bold leading-tight ${
                          color === 'blue' ? 'text-blue-700' : color === 'red' ? 'text-red-700' : color === 'amber' ? 'text-amber-700' : color === 'purple' ? 'text-purple-700' : 'text-gray-700'
                        }`}>{value}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {(metrics.age_distribution || metrics.gender_distribution) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {metrics.age_distribution && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">👥 Age Distribution</h3>
                        <div className="space-y-1.5">
                          {Object.entries(metrics.age_distribution).map(([band, pct]) => (
                            <div key={band} className="flex items-center gap-2">
                              <span className="text-xs text-gray-600 w-12">{band}</span>
                              <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden"><div className="h-full rounded-full text-xs font-bold text-white flex items-center px-1 bg-blue-500" style={{ width: `${Math.max(4, Math.min(100, parseFloat(pct) * 3))}%` }} /></div>
                              <span className="text-xs font-semibold text-gray-700 w-12 text-right">{pct}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {metrics.gender_distribution && Object.keys(metrics.gender_distribution).length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">⚧ Gender Distribution</h3>
                        <div className="space-y-1.5">
                          {Object.entries(metrics.gender_distribution).map(([gender, pct]) => (
                            <div key={gender} className="flex items-center gap-2"><span className="text-xs text-gray-600 w-12">{gender}</span>
                              <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden"><div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.max(4, Math.min(100, parseFloat(pct) * 2))}%` }} /></div>
                              <span className="text-xs font-semibold text-gray-700 w-12 text-right">{pct}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {(metrics.high_cost_claims?.length > 0 || metrics.top_3_members?.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {metrics.high_cost_claims?.length > 0 && (
                      <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                        <h3 className="text-sm font-bold text-red-700 mb-2">🚨 High-Cost Claims (₹5L+)</h3>
                        <div className="space-y-2">
                          {(metrics.high_cost_claims || []).slice(0, 3).map((c, i) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                              <span className="text-gray-700 truncate flex-1 mr-2">{c.name || `Member ${i+1}`}</span>
                              <span className="font-bold text-red-700 whitespace-nowrap">{fmtLac(c.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {metrics.top_3_members?.length > 0 && (
                      <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                        <h3 className="text-sm font-bold text-amber-700 mb-2">📍 Top Claims Concentration</h3>
                        <div className="space-y-2">
                          {(metrics.top_3_members || []).map((m, i) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                              <span className="text-gray-700 flex items-center gap-1.5">
                                {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} <span className="truncate">{m.name || `Rank ${i+1}`}</span>
                              </span>
                              <span className="font-bold text-amber-700 whitespace-nowrap">{fmtLac(m.claimed)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {impact.factor_breakdown?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">⚖️ Premium Factors ({factors.length} adjustments)</h3>
                    <div className="space-y-2">
                      {impact.factor_breakdown.map((f, i) => (
                        <div key={i} className={`flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border ${
                          f.type === 'loading' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'
                        }`}>
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <span className={`mt-0.5 text-sm font-bold ${
                              f.type === 'loading' ? 'text-red-600' : 'text-green-600'
                            }`}>{f.type === 'loading' ? '+' : '−'}{f.percentage}</span>
                            <div className="min-w-0"><div className="text-sm font-semibold text-gray-900 leading-tight">{f.factor}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{f.justification}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                            {f.enrollment_impact !== undefined && f.enrollment_impact !== 0 && (
                              <span className={`text-xs font-bold ${
                                f.enrollment_impact > 0 ? 'text-red-600' : 'text-green-600'
                              }`}>{f.enrollment_impact > 0 ? '+' : ''}{fmt(f.enrollment_impact)} impact</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-4 bg-gray-900 rounded-lg">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                        <div><div className="text-xl font-black text-white">{fmtLac(impact.base_premium)}</div><div className="text-xs text-gray-400">Base Premium</div></div>
                        {impact.total_adjustment > 0 ? (
                          <><div><div className="text-xl font-black text-red-400">+{fmt(impact.total_adjustment)}</div>
                            <div className="text-xs text-gray-400">Adjustments</div></div>
                            <div><div className="text-xl font-black text-yellow-400">{fmtLac(impact.enrollment_premium)}</div>
                            <div className="text-xs text-gray-400">Final Premium</div></div>
                            <div><div className="text-xl font-black text-red-400">+{impact.change_percent}%</div>
                            <div className="text-xs text-gray-400">Change</div></div>
                          </>
                        ) : impact.total_adjustment < 0 ? (
                          <><div><div className="text-xl font-black text-green-400">{fmt(impact.total_adjustment)}</div>
                          <div className="text-xs text-gray-400">Adjustments</div></div>
                          <div><div className="text-xl font-black text-green-400">{fmtLac(impact.enrollment_premium)}</div>
                          <div className="text-xs text-gray-400">Final Premium</div></div>
                          <div><div className="text-xl font-black text-green-400">{impact.change_percent}%</div>
                          <div className="text-xs text-gray-400">Savings</div></div>
                          </>
                        ) : (
                          <><div><div className="text-xl font-black text-yellow-400">No Change</div><div className="text-xs text-gray-400">Adjustments</div></div>
                          <div><div className="text-xl font-black text-white">{fmtLac(impact.enrollment_premium)}</div><div className="text-xs text-gray-400">Maintain</div></div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {plans.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">💰 Quotation — {plans.length} Plan Options</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {plans.map((plan, i) => (
                        <div key={i} className={`relative rounded-xl border-2 p-5 ${
                          i === 1 ? 'border-blue-600 shadow-lg shadow-blue-100 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
                        } bg-white`}>
                          {i === 1 && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2"><span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">⭐ Recommended</span></div>
                          )}
                          <div className="text-center mb-4">
                            <div className="text-3xl mb-1">{plan.emoji || '📋'}</div>
                            <h4 className="text-lg font-bold text-gray-900">{plan.name}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">{plan.tagline || ''}</p>
                            <div className="mt-3">
                              <span className="text-3xl font-black text-gray-900">{fmtLac(plan.premium)}</span>
                              <div className="text-xs text-gray-500 mt-0.5">per lac sum insured</div>
                            </div>
                            <div className="text-sm font-bold text-blue-600 mt-1">Total: {fmtLac(plan.total_annual_premium || plan.premium)}</div>
                          </div>
                          {plan.features && (
                            <div className="space-y-1.5 mb-4">
                              {(plan.features || []).map((feat, fi) => (
                                <div key={fi} className="flex items-center gap-2 text-sm"><span className="text-green-500">✓</span><span className="text-gray-700">{feat}</span></div>
                              ))}
                            </div>
                          )}
                          {(plan.total_loading_percent > 0 || plan.total_discount_percent > 0) && (
                            <div className="text-xs text-center mb-3">
                              {plan.total_loading_percent > 0 && <span className="text-red-600 font-semibold">+{plan.total_loading_percent}% loadings</span>}
                              {plan.total_discount_percent > 0 && <span className="text-green-600 font-semibold">-{plan.total_discount_percent}% discounts</span>}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 text-center">Loss Ratio: {plan.loss_ratio || metrics.loss_ratio}%</div></div>
                      ))}
                    </div>
                  </div>
                )}
              </div></div>
          )}</div>
        )}

        {/* ─── MEMBERS TAB ─── */}
        {activeTab === 'members' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">Member Data</h2>
                  <p className="text-sm text-gray-500">{structuredData.length} total members • {structuredData.filter(r => parseInt(r.Claim_Count || 0) > 0).length} with claims</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <input type="text" value={membersSearch} onChange={e => setMembersSearch(e.target.value)} placeholder="Search name / employee ID..." className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={e => e.key === 'Enter' && fetchMembers(1)} />
                  <button onClick={() => setMembersFilters({ has_claims: membersFilters.has_claims === 'true' ? false : 'true' })}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      membersFilters.has_claims === 'true' ? 'bg-red-100 border-red-300 text-red-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}>With Claims</button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <button onClick={() => { setMembersFilters(m => ({ ...m, risk_tier: m.risk_tier === 'high' ? 'all' : 'high' })); }} className={`px-3 py-1.5 rounded-lg border transition-colors ${
                  membersFilters.risk_tier === 'high' ? 'bg-red-100 border-red-300 text-red-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}>High Risk</button>
                <button onClick={() => { setMembersFilters(m => ({ ...m, chronic_only: m.chronic_only === 'true' ? false : 'true' })); }} className={`px-3 py-1.5 rounded-lg border transition-colors ${
                  membersFilters.chronic_only === 'true' ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}>Chronic Only</button>
                <button onClick={() => { setMembersFilters(m => ({ ...m, claim_status: m.claim_status === 'Paid' ? 'all' : 'Paid' })); }} className={`px-3 py-1.5 rounded-lg border transition-colors ${
                  membersFilters.claim_status === 'Paid' ? 'bg-green-100 border-green-300 text-green-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}>Paid Claims</button>
              </div>
            </div>
            {structuredData.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No member data. Run AI Analysis first.</p>
                <button onClick={runProcessAI} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Run AI Analysis</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-left">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-700">Member</th>
                      <th className="px-3 py-3 font-semibold text-gray-700">Age</th>
                      <th className="px-3 py-3 font-semibold text-gray-700 hidden sm:table-cell">Gender</th>
                      <th className="px-3 py-3 font-semibold text-gray-700 hidden md:table-cell">Relationship</th>
                      <th className="px-3 py-3 font-semibold text-gray-700">Claims</th>
                      <th className="px-3 py-3 font-semibold text-gray-700 text-right">Claimed</th>
                      <th className="px-3 py-3 font-semibold text-gray-700 text-center">Status</th>
                      <th className="px-3 py-3 font-semibold text-gray-700">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {membersLoading ? (
                      <tr><td colSpan={8} className="p-8 text-center"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div></td></tr>
                    ) : membersData.length === 0 ? (
                      <tr><td colSpan={8} className="p-8 text-center text-gray-500">No members match your filters</td></tr>
                    ) : membersData.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{row.Name || '—'}</div>
                          <div className="text-xs text-gray-400">{row.Employee_ID || row.employee_id || ''}</div>
                        </td>
                        <td className="px-3 py-3">{row.Age || '—'}</td>
                        <td className="px-3 py-3 hidden sm:table-cell">{row.Gender || '—'}</td>
                        <td className="px-3 py-3 hidden md:table-cell">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            row.Relationship?.toLowerCase() === 'self' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                          }`}>{row.Relationship || 'SELF'}</span>
                        </td>
                        <td className="px-3 py-3 font-semibold">{row.Claim_Count ?? 0}</td>
                        <td className="px-3 py-3 font-semibold text-gray-900 text-right">
                          {row.Total_Claimed > 0 ? '₹' + Number(row.Total_Claimed).toLocaleString('en-IN') + 'L' : '—'}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {row.Claim_Status ? (
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              row.Claim_Status === 'Paid' || row.Claim_Status === 'Approved' ? 'bg-green-100 text-green-700' :
                              row.Claim_Status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>{row.Claim_Status}</span>
                          ) : <span className="text-xs text-gray-400">No claim</span>}
                        </td>
                        <td className="px-3 py-3">
                          {row.high_risk ? (
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">High Risk</span>
                          ) : row.risk_score >= 50 ? (
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-700">Elevated</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700">Low</span>
                          )}
                          <div className="text-xs text-gray-400">{row.risk_score ?? '—'}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {membersData.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                <div className="text-gray-600">
                  Showing {(membersPagination.page - 1) * membersPagination.limit + 1} to {Math.min(membersPagination.page * membersPagination.limit, membersPagination.total)} of {membersPagination.total} members
                </div>
                <div className="flex gap-1">
                  <button onClick={() => fetchMembers(membersPagination.page - 1)} disabled={!membersPagination.has_prev} className="px-3 py-1.5 rounded border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">Previous</button>
                  <button onClick={() => fetchMembers(membersPagination.page + 1)} disabled={!membersPagination.has_next} className="px-3 py-1.5 rounded border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">Next</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── CLAIM BREAKDOWN TAB ─── */}
        {activeTab === 'breakdown' && (
          <div className="space-y-5">
            {claimBreakdown ? (
              Object.values(claimBreakdown).filter(c => c.count > 0).length === 0 ? (
                <NoData message="No claim data to analyze" />
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(claimBreakdown).filter(([, c]) => c.count > 0).map(([cat, data]) => (
                      <div key={cat} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="w-3 h-3 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: data.color }}></div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{cat}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">{data.members_count} unique members</p>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                          <div><div className="text-2xl font-black text-gray-900">{data.count}</div><div className="text-xs text-gray-500">Claims</div></div>
                          <div><div className="text-2xl font-black text-gray-900">{fmtLac(data.claimed)}</div><div className="text-xs text-gray-500">Total Claimed</div></div>
                          <div><div className="text-2xl font-black text-gray-900">{fmt(data.avg_claim_size)}</div><div className="text-xs text-gray-500">Avg Size</div></div>
                        </div>
                        {data.members.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Members</div>
                            <div className="flex flex-wrap gap-1">
                              {data.members.map((m, i) => (
                                <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{m}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )
            ) : (
              <NoData message="Loading claim breakdown..." />
            )}
          </div>
        )}

        {/* ─── TRENDS TAB ─── */}
        {activeTab === 'trends' && claimTrends && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 mb-4">📉 Loss Ratio Trend</h3>
                <div className="space-y-3">
                  {claimTrends.trends.loss_ratio.map((q, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-24 text-sm text-gray-600">{q.quarter}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500 text-xs font-bold text-white flex items-center px-2 justify-end"
                          style={{
                            width: `${Math.max(20, Math.min(100, q.loss_ratio))}%`,
                            backgroundColor: q.loss_ratio > 100 ? '#ef4444' : q.loss_ratio > 75 ? '#f59e0b' : q.loss_ratio > 60 ? '#fbbf24' : '#22c55e'
                          }}>
                          {q.loss_ratio}%
                        </div>
                      </div>
                      <span className="w-16 text-sm text-gray-600">Benchmark: {q.benchmark}%</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-lg font-bold text-gray-900">Current: {claimTrends.current.loss_ratio}%</div>
                  <div className="text-sm text-gray-500">
                    {claimTrends.current.loss_ratio > 100 ? 'Above sustainable threshold' :
                     claimTrends.current.loss_ratio > 75 ? 'Approaching concern level' :
                     'Within healthy range'}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 mb-4">📊 Claim Frequency Trend</h3>
                <div className="space-y-3">
                  {claimTrends.trends.claim_frequency.map((q, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-24 text-sm text-gray-600">{q.quarter}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500 text-xs font-bold text-white flex items-center px-2"
                          style={{
                            width: `${Math.max(20, Math.min(100, q.frequency * 5))}%`,
                            backgroundColor: q.frequency > 15 ? '#ef4444' : q.frequency > 10 ? '#f59e0b' : '#22c55e'
                          }}>
                          {q.frequency}%
                        </div>
                      </div>
                      <span className="w-16 text-sm text-gray-600">{q.members} members</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-lg font-bold text-gray-900">Current: {claimTrends.current.claim_frequency}%</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-4">💰 Total Claim Value Over Time</h3>
              <div className="flex items-end gap-2 h-40">
                {claimTrends.trends.total_claimed.map((q, i, arr) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <span className="text-xs text-gray-500 mb-1">{fmtLac(q.value)}</span>
                    <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-500" style={{ height: `${Math.max(20, (q.value / Math.max(...arr.map(x => x.value))) * 100)}%` }}></div>
                    <span className="text-xs text-gray-600 mt-1">{q.quarter}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── PLANS TAB ─── */}
        {activeTab === 'plans' && (
          <div>
            {plans.length === 0 ? (
              <NoData message="No plans available. Run AI Analysis to generate plans." />
            ) : (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Premium Plan Recommendations</h2>
                  <p className="text-sm text-gray-500 mt-1">Based on {caseData.name} profile — Loss Ratio: {metrics.loss_ratio}%</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                      </div>
                      <div className="my-4 py-4 border-y border-gray-100 text-center">
                        <div className="text-3xl font-black text-gray-900">{fmtLac(plan.premium)}</div>
                        <div className="text-sm text-gray-500">per lac sum insured</div>
                      </div>
                      <div className="text-center font-bold text-blue-600 mb-4">
                        Total Annual: {fmtLac(plan.total_annual_premium || plan.premium)}
                      </div>
                      {plan.features && (
                        <div className="space-y-2 mb-4">
                          {(plan.features || []).map((feat, fi) => (
                            <div key={fi} className="flex items-center gap-2 text-sm">
                              <span className="text-green-500 font-bold">✓</span>
                              <span className="text-gray-700">{feat}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {(plan.loading || plan.discount) && (
                        <div className="text-xs text-center py-2">
                          {plan.loading > 0 && <span className="text-red-600 font-semibold">+{plan.loading}% loading</span>}
                          {plan.discount > 0 && <span className="text-green-600 font-semibold">-{plan.discount}% discount</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Submit Modal */}
        {submitModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Submit to Underwriter</h3>
              <p className="text-sm text-gray-500 mb-4">
                Submit case <span className="font-semibold">{caseData.case_id}</span> for underwriter review.
              </p>
              <textarea
                value={submitNotes}
                onChange={e => setSubmitNotes(e.target.value)}
                placeholder="Add optional notes for underwriter..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4" rows={3}
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setSubmitModal(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                <button onClick={handleSubmitToUnderwriter} disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {submitting ? 'Submitting...' : 'Confirm Submit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}