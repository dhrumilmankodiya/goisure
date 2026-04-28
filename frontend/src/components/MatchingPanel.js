import React, { useState } from 'react';
import { matchingApi } from '../lib/api';

const MatchingPanel = ({ caseId, enrollmentUploaded, claimsUploaded, onMatchComplete }) => {
  const [loading, setLoading] = useState(false);
  const [structuring, setStructuring] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [overrideModal, setOverrideModal] = useState(null);
  const [overrideValue, setOverrideValue] = useState('');

  const canRunMatch = enrollmentUploaded && claimsUploaded;

  const runMatching = async () => {
    if (!canRunMatch) return;
    setLoading(true);
    setStructuring(true);
    setError(null);
    setResults(null);
    try {
      const response = await matchingApi.runMatch(caseId);
      setResults(response.data);
      if (onMatchComplete) onMatchComplete(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Matching failed');
    } finally {
      setLoading(false);
      setStructuring(false);
    }
  };

  const getMatchResults = async () => {
    try {
      const response = await matchingApi.getResults(caseId);
      setResults(response.data);
    } catch (err) {
      setError('No matching results found');
    }
  };

  const handleOverride = async () => {
    if (!overrideValue || !overrideModal) return;
    try {
      await matchingApi.overrideMatch(caseId, {
        claim_name: overrideModal.claim_name,
        override_enrollment: overrideValue,
        reason: 'Manual override'
      });
      await getMatchResults();
      setOverrideModal(null);
      setOverrideValue('');
    } catch (err) {
      setError('Override failed');
    }
  };

  const exportData = async () => {
    try {
      const response = await matchingApi.exportMatched(caseId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `matched_data_${caseId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Export failed');
    }
  };

  const getConfidenceColor = (score) => {
    if (score >= 95) return 'bg-green-50 text-green-700 border-green-200';
    if (score >= 80) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (score >= 70) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const getMethodBadge = (method) => {
    const badges = {
      'EXACT': 'bg-green-100 text-green-700',
      'FUZZY': 'bg-blue-100 text-blue-700',
      'LLM': 'bg-purple-100 text-purple-700',
      'MEMBER_ID': 'bg-cyan-100 text-cyan-700',
      'MANUAL_OVERRIDE': 'bg-orange-100 text-orange-700',
      'NO_MATCH': 'bg-red-100 text-red-700'
    };
    return badges[method] || 'bg-gray-100 text-gray-700';
  };

  if (!canRunMatch) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-100 p-6">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg mb-1">AI-Powered Data Structuring</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Upload your enrollment and claims files to automatically structure and match the data using AI. Our system will analyze both files, identify field mappings, create structured data tables, and provide actionable insights for underwriting and pricing decisions.
              </p>
            </div>
          </div>
        </div>
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  if (structuring) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex flex-col items-center justify-center py-16 px-8">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-6"></div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Your Files</h3>
          <p className="text-gray-500 text-center text-sm mb-2">AI is analyzing and structuring your enrollment and claims data</p>
          <div className="flex items-center gap-4 text-xs text-gray-400 mt-6">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Identifying field mappings
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Matching records across files
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Generating insights
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Analysis Complete</h3>
            <p className="text-sm text-gray-500">Structured data and insights ready for review</p>
          </div>
        </div>
        <button onClick={exportData} className="px-4 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg font-medium flex items-center gap-2 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </button>
      </div>
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {results && (
        <>
          <div className="p-6 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Key Statistics</h4>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-gray-900">{results.summary.total_claims}</p>
                <p className="text-xs text-gray-500 mt-1">Total Claims</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{results.summary.matched_count}</p>
                <p className="text-xs text-gray-500 mt-1">Successfully Matched</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-red-600">{results.summary.unmatched_count}</p>
                <p className="text-xs text-gray-500 mt-1">Require Manual Review</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-purple-600">{results.summary.match_rate}%</p>
                <p className="text-xs text-gray-500 mt-1">Overall Match Rate</p>
              </div>
            </div>
          </div>
          <div className="p-6 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">AI Insights & Analysis</h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Field Mapping Analysis</h5>
                <div className="space-y-3">
                  {results.field_mapping?.enrollment?.length > 0 ? (
                    results.field_mapping.enrollment.map((field, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                        <div className={field.confidence >= 90 ? 'w-2 h-2 rounded-full bg-green-500' : field.confidence >= 70 ? 'w-2 h-2 rounded-full bg-yellow-500' : 'w-2 h-2 rounded-full bg-red-500'}></div>
                        <span className="text-sm text-gray-600 flex-1">{field.source_field}</span>
                        <span className="text-xs text-gray-400">→</span>
                        <span className="text-sm font-medium text-gray-900">{field.mapped_field}</span>
                        <span className={field.confidence >= 90 ? 'text-xs px-2 py-0.5 rounded bg-green-100 text-green-700' : field.confidence >= 70 ? 'text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700' : 'text-xs px-2 py-0.5 rounded bg-red-100 text-red-700'}>
                          {field.confidence}%
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">Field mapping data not available</p>
                  )}
                </div>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Key Findings</h5>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">High match confidence</span> ({results.summary.avg_confidence || 95}% avg) - data quality is excellent
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{results.summary.unmatched_count} records</span> require manual review - recommend re-upload or override
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                    </svg>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{results.summary.matched_count} claims</span> successfully linked to enrollment records
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Structured Data Records</h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Filter:</span>
                <select className="text-xs border-gray-200 rounded-lg text-sm">
                  <option>All Records</option>
                  <option>Accurate (95%+)</option>
                  <option>Review Needed (&lt;70%)</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Member</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Enrollment ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Claims Matched</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Confidence</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Accuracy Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Method</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {results.matched_records?.slice(0, 10).map((record, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{record.member_name}</div>
                        <div className="text-xs text-gray-500">DOB: {record.dob}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-sm text-gray-600">{record.enrollment_id}</td>
                      <td className="py-3 px-4">
                        <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">{record.claims_count} claims</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 w-16 bg-gray-200 rounded-full h-2">
                            <div style={{width: record.confidence + '%'}} className={record.confidence >= 95 ? 'bg-green-500 h-2 rounded-full' : record.confidence >= 80 ? 'bg-blue-500 h-2 rounded-full' : record.confidence >= 70 ? 'bg-yellow-500 h-2 rounded-full' : 'bg-red-500 h-2 rounded-full'}></div>
                          </div>
                          <span className={getConfidenceColor(record.confidence)}>{record.confidence}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {record.confidence >= 95 ? (
                          <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">Accurate</span>
                        ) : record.confidence >= 70 ? (
                          <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700">Acceptable</span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">Needs Review</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={getMethodBadge(record.method)}>{record.method}</span>
                      </td>
                      <td className="py-3 px-4">
                        {record.confidence < 70 && (
                          <button onClick={() => setOverrideModal(record)} className="text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-2 py-1 rounded">Override</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {results.summary.total_records > 10 && (
              <div className="text-center mt-4">
                <button className="text-sm text-purple-600 hover:text-purple-700">View all {results.summary.total_records} records →</button>
              </div>
            )}
          </div>
          {results.unmatched_records && results.unmatched_records.length > 0 && (
            <div className="p-6">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Records Requiring Attention</h4>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-red-700">{results.unmatched_records.length} records could not be matched</span>
                </div>
                <p className="text-sm text-red-600">These claims do not match any enrollment records. Recommend re-uploading or manual intervention.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-red-200">
                      <th className="text-left py-2 px-4 font-semibold text-red-700">Claim ID</th>
                      <th className="text-left py-2 px-4 font-semibold text-red-700">Patient Name</th>
                      <th className="text-left py-2 px-4 font-semibold text-red-700">Amount</th>
                      <th className="text-left py-2 px-4 font-semibold text-red-700">Suggested Enrollment Match</th>
                      <th className="text-left py-2 px-4 font-semibold text-red-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.unmatched_records.slice(0, 5).map((record, idx) => (
                      <tr key={idx} className="border-b border-red-100">
                        <td className="py-2 px-4 font-mono text-sm text-red-700">{record.claim_id}</td>
                        <td className="py-2 px-4 text-red-700">{record.claimant_name}</td>
                        <td className="py-2 px-4 text-red-700">₹{record.amount?.toLocaleString()}</td>
                        <td className="py-2 px-4">
                          {record.suggested_match ? (
                            <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">{record.suggested_match} ({record.suggested_confidence}% match)</span>
                          ) : (
                            <span className="text-xs text-gray-400">No match found</span>
                          )}
                        </td>
                        <td className="py-2 px-4">
                          <button className="text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-2 py-1 rounded">Manual Override</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-lg flex items-center justify-between">
            <p className="text-sm text-gray-500">Review the structured data above before proceeding to pricing</p>
            <button onClick={runMatching} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Proceed to Mapping & Pricing
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MatchingPanel;
