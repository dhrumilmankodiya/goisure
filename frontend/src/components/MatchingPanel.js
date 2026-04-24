import React, { useState } from 'react';
import { matchingApi } from '../lib/api';

const MatchingPanel = ({ caseId, enrollmentUploaded, claimsUploaded, onMatchComplete }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [overrideModal, setOverrideModal] = useState(null);
  const [overrideValue, setOverrideValue] = useState('');

  const canRunMatch = enrollmentUploaded && claimsUploaded;

  const runMatching = async () => {
    if (!canRunMatch) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await matchingApi.runMatch(caseId);
      setResults(response.data);
      if (onMatchComplete) onMatchComplete(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Matching failed');
    } finally {
      setLoading(false);
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
      
      // Refresh results
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
    if (score >= 95) return 'text-green-600 bg-green-50';
    if (score >= 80) return 'text-blue-600 bg-blue-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
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
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="font-medium">Upload Files to Enable Matching</p>
          <p className="text-sm mt-1">Upload both enrollment and claims files first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Matching Engine</h3>
            <p className="text-sm text-gray-500">Powered by Gemma 4 • Hybrid Rule + LLM</p>
          </div>
        </div>
        
        <button
          onClick={runMatching}
          disabled={loading}
          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
            loading 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Matching...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Run AI Match
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="p-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{results.summary.total_claims}</p>
              <p className="text-xs text-gray-500">Total Claims</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{results.summary.matched_count}</p>
              <p className="text-xs text-gray-500">Matched</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-600">{results.summary.unmatched_count}</p>
              <p className="text-xs text-gray-500">Unmatched</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-600">{results.summary.match_rate}%</p>
              <p className="text-xs text-gray-500">Match Rate</p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="flex gap-2 mb-4">
            {results.summary.breakdown?.exact > 0 && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                EXACT: {results.summary.breakdown.exact}
              </span>
            )}
            {results.summary.breakdown?.fuzzy > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                FUZZY: {results.summary.breakdown.fuzzy}
              </span>
            )}
            {results.summary.breakdown?.llm > 0 && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                LLM: {results.summary.breakdown.llm}
              </span>
            )}
            {results.summary.breakdown?.member_id > 0 && (
              <span className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded text-xs">
                MEMBER_ID: {results.summary.breakdown.member_id}
              </span>
            )}
          </div>

          {/* Results Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Claim</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Matched Enrollment</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600">Confidence</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600">Method</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.matches?.map((match, idx) => (
                  <tr key={idx} className={match.needs_review ? 'bg-yellow-50' : ''}>
                    <td className="px-3 py-2">
                      <span className="font-medium">{match.claim_name}</span>
                      {match.claim_employee_no && (
                        <span className="text-gray-400 text-xs ml-2">#{match.claim_employee_no}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {match.matched_enrollment ? (
                        <span>{match.matched_enrollment}</span>
                      ) : (
                        <span className="text-red-500 italic">No match</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(match.match_score)}`}>
                        {match.match_score}%
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${getMethodBadge(match.match_method)}`}>
                        {match.match_method}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {match.needs_review && (
                        <button
                          onClick={() => setOverrideModal(match)}
                          className="text-purple-600 hover:text-purple-800 text-xs font-medium"
                        >
                          Override
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Export Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={exportData}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-green-700"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Matched Data
            </button>
          </div>
        </div>
      )}

      {/* Override Modal */}
      {overrideModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Override Match</h3>
            <p className="text-sm text-gray-600 mb-2">
              Claim: <strong>{overrideModal.claim_name}</strong>
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Current match: <strong>{overrideModal.matched_enrollment || 'No match'}</strong> ({overrideModal.match_score}%)
            </p>
            
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter correct enrollment name:
            </label>
            <input
              type="text"
              value={overrideValue}
              onChange={(e) => setOverrideValue(e.target.value)}
              placeholder="Type enrollment name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setOverrideModal(null);
                  setOverrideValue('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleOverride}
                disabled={!overrideValue}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                Save Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchingPanel;
