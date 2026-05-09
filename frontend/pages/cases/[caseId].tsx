// Case Detail Page - Full-featured case management interface
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeftIcon, SaveIcon, ClockIcon, DownloadIcon, ShareIcon } from 'lucide-react';
import axios from 'axios';

import CaseHeader from '../../components/cases/CaseHeader';
import CaseSummaryCard from '../../components/cases/CaseSummaryCard';
import CaseProgress from '../../components/cases/CaseProgress';
import TabNavigation from '../../components/cases/TabNavigation';
import ActionBar from '../../components/cases/ActionBar';
import EnrollmentTable from '../../components/cases/EnrollmentTable';
import ClaimsTable from '../../components/cases/ClaimsTable';
import { useCaseData } from '../../hooks/useCaseData';
import { useWorkflow } from '../../hooks/useWorkflow';

// Import tab components
const SummaryTab = () => {
  const { caseData, loading, matchResults } = useSummaryContext();
  const enrollmentData = caseData?.enrollment?.data || [];
  const claimsData = caseData?.claims?.data || [];
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-600 uppercase">Total Enrolled</p>
          <p className="text-2xl font-bold text-blue-900">{caseData?.metrics?.total_enrolled || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <p className="text-sm text-purple-600 uppercase">Total Claims</p>
          <p className="text-2xl font-bold text-purple-900">{caseData?.metrics?.total_claims || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-600 uppercase">Loss Ratio</p>
          <p className="text-2xl font-bold text-green-900">{caseData?.metrics?.loss_ratio || 0}%</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
          <p className="text-sm text-indigo-600 uppercase">Est. Premium</p>
          <p className="text-2xl font-bold text-indigo-900">
            ₹{(caseData?.metrics?.estimated_premium || 0).toLocaleString()}
          </p>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Enrolled Members</h3>
        <EnrollmentTable data={enrollmentData} loading={loading} />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Claims History</h3>
        <ClaimsTable data={claimsData} loading={loading} matchResults={matchResults} />
      </div>
    </div>
  );
};

const InsightsTab = () => {
  const { caseData, loading } = useSummaryContext();
  if (loading) return <div className="p-8 text-center text-gray-500">Loading insights...</div>;
  if (!caseData) return <div className="p-8 text-center text-gray-500">No insights available.</div>;
  const insights = caseData.insights || [];
  const metrics = caseData.metrics || {};
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis</h2>
      <p className="text-sm text-gray-600 mb-4">Loss Ratio: {metrics.loss_ratio}%</p>
      <div className="grid gap-4">
        {insights.length === 0 && <p className="text-gray-500">No insights generated yet.</p>}
        {insights.map((i: any, idx: number) => (
          <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-white">
            <h4 className="font-medium text-gray-900">{i.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{i.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const MatchingTab = () => {
  const { caseData, loading } = useSummaryContext();
  const matchResults = caseData?.matching?.match_results || [];
  const claimsData = caseData?.claims?.data || [];
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Claim-to-Enrollment Matching</h2>
      {loading ? (
        <div className="p-8 text-center text-gray-500">Analyzing matches...</div>
      ) : matchResults.length === 0 ? (
        <div className="p-8 text-center text-gray-500">No matching results yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Claim</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Matched ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Method</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Confidence</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {matchResults.map((m: any, idx: number) => {
                const claim = claimsData[m.claim_index] || {};
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{claim.ClaimID || `Claim ${m.claim_index + 1}`}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{m.matched_enrollment_id || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{m.match_method}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                          <div className="bg-blue-600 h-1.5 rounded-full" style={{width: `${m.confidence}%`}}></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{m.confidence}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">₹{claim.ClaimAmount?.toLocaleString() || 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const UnderwritingTab = () => {
  const { caseData, loading } = useSummaryContext();
  if (loading) return <div className="p-8 text-center text-gray-500">Running underwriting analysis...</div>;
  if (!caseData) return <div className="p-8 text-center text-gray-500">No underwriting data.</div>;
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Underwriting Assessment</h2>
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-6 mb-6">
        <h3 className="text-xl font-bold text-green-900 mb-2">Approve with Standard Terms</h3>
        <p className="text-green-700 mb-3">Low risk profile suitable for standard coverage.</p>
        <div className="text-sm text-green-600">Confidence: 85%</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase">Loss Ratio</p>
          <p className="text-2xl font-bold text-gray-900">{caseData.metrics?.loss_ratio || 0}%</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase">Total Claims</p>
          <p className="text-2xl font-bold text-gray-900">{caseData.metrics?.total_claims || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase">Enrolled</p>
          <p className="text-2xl font-bold text-gray-900">{caseData.metrics?.total_enrolled || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase">Est. Premium</p>
          <p className="text-2xl font-bold text-gray-900">₹{(caseData.metrics?.estimated_premium || 0).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

// Context for sharing data between tabs (simplified)
const SummaryContext = require('react').createContext({ caseData: null, loading: false, matchResults: [] });
const useSummaryContext = () => require('react').useContext(SummaryContext);

export default function CaseDetailPage() {
  const router = useRouter();
  const { caseId } = router.query;
  const { caseData, loading, error, refresh } = useCaseData(caseId as string);
  const { saveState, lastSavedAt, hasUnsavedChanges } = useWorkflow(caseId as string);
  const [activeTab, setActiveTab] = useState('summary');
  const [localChanges, setLocalChanges] = useState({});

  const tabData = {
    summary: { label: 'Summary', component: SummaryTab },
    insights: { label: 'AI Insights', component: InsightsTab },
    matching: { label: 'Matching', component: MatchingTab },
    underwriting: { label: 'Underwriting', component: UnderwritingTab },
  };

  const handleSave = useCallback(async () => {
    if (!caseId) return;
    await saveState({ caseId, tab: activeTab, changes: localChanges, timestamp: new Date().toISOString(), caseSnapshot: caseData });
    setLocalChanges({});
  }, [caseId, activeTab, localChanges, saveState, caseData]);

  if (error && !caseData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center"><p className="text-red-600 mb-4">Error loading case</p>
          <button onClick={() => router.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Retry</button>
        </div>
      </div>
    );
  }

  const ActiveTab = tabData[activeTab as keyof typeof tabData].component;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
              </button>
              {caseData && <CaseHeader caseId={caseId as string} memberData={{ name: caseData.primary_member || 'Unknown' }} />}
            </div>
            <div className="flex items-center gap-3">
              {lastSavedAt && <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500"><ClockIcon className="w-3.5 h-3.5" />Saved {new Date(lastSavedAt).toLocaleTimeString()}</div>}
              {hasUnsavedChanges && <div className="flex items-center gap-1.5 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full"><SaveIcon className="w-3.5 h-3.5" />Unsaved</div>}
              <button onClick={handleSave} disabled={isSaving || !hasUnsavedChanges} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                <SaveIcon className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg"><DownloadIcon className="w-5 h-5" /></button>
              <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><ShareIcon className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {caseData?.processing && <div className="mb-6"><CaseProgress status={caseData.processing.status || 'idle'} /></div>}

        {caseData && (
          <div className="mb-6">
            <CaseSummaryCard data={{ lossRatio: caseData.metrics?.loss_ratio || 0, totalClaims: caseData.metrics?.total_claims || 0, highRiskClaims: caseData.claims?.data?.filter((c: any) => c.ClaimAmount > 100000).length || 0, premiumSuggestion: caseData.metrics?.estimated_premium || 0 }} caseId={caseId as string} memberData={{ name: caseData.primary_member || 'Unknown' }} />
          </div>
        )}

        <TabNavigation activeTab={activeTab as any} onTabChange={setActiveTab} tabs={{ summary: 'Summary', insights: 'AI Insights', matching: 'Matching', underwriting: 'Underwriting' }} />

        <div className="mt-6"><ActiveTab /></div>

        <ActionBar caseId={caseId as string} onSaveDraft={handleSave} onResume={() => {}} onSubmit={() => { if (window.confirm('Submit this case?')) handleSave(); }} />
      </main>
    </div>
  );
}
