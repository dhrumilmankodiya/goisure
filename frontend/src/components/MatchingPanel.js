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

  if (structuring) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col items-center justify-center p-12">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Structuring & Mapping Data</h3>
        <p className="text-gray-500 text-sm">AI is analyzing and matching your enrollment and claims data...</p>
        <p className="text-gray-400 text-xs mt-4">This usually takes a few seconds</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {!results && (
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Matching</h3>
              <p className="text-sm text-gray-500">Ready to match enrollment and claims</p>
            </div>
          </div>
          
          <button
            onClick={runMatching}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-purple-700 transition-colors"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Running...
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
      )}

      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <button onClick={() => setError(null)} className="float-right underline">Dismiss</button>
        </div>
      )}

      {results && (
        <>
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-4 gap-4">
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
          </div>

          <div className="px-4 pt-3 pb-2 flex flex-wrap gap-1">
            {results.summary.breakdown?.exact > 0 && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                EXACT: {results.summary.breakdown.exact}
              </span>
            )}
            {results.summary.breakdown?.fuzzy > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                FUZZY: {results.summary.breakdown.fuzzy}
              </span>
            )}
            {results.summary.breakdown?.llm > 0 && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                LLM (Gemma 4): {results.summary.breakdown.llm}
              </span>
            )}
            {results.summary.breakdown?.member_id > 0 && (
              <span className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded text-xs font-medium">
                MEMBER_ID: {results.summary.breakdown.member_id}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 text-xs uppercase">Claim</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 text-xs uppercase">Matched</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600 text-xs uppercase">Score</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600 text-xs uppercase">Method</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600 text-xs uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.matches?.slice(0, 50).map((match, idx) => (
                  <tr key={idx} className={`${match.needs_review ? 'bg-yellow-50' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className="px-3 py-2">
                      <div className="font-medium text-sm">{match.claim_name}</div>
                      {match.claim_employee_no && (
                        <span className="text-gray-400 text-xs">#{match.claim_employee_no}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {match.matched_enrollment ? (
                        <span className="text-sm">{match.matched_enrollment}</span>
                      ) : (
                        <span className="text-red-500 italic text-sm">No match</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(match.match_score)}`}>
                        {match.match_score}%
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs ${getMethodBadge(match.match_method)}`}>
                        {match.match_method}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {match.needs_review && (
                        <button
                          onClick={() => setOverrideModal(match)}
                          className="text-purple-600 hover:text-purple-800 text-xs font-medium underline decoration-dotted"
                        >
                          Override
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {results.matches?.length > 50 && (
              <p className="text-center text-gray-400 text-xs py-2">
                Showing first 50 of {results.matches.length} matches
              </p>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={exportData}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-green-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setResults(null)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                New Match
              </button>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">
                Submit to Underwriter
              </button>
            </div>
          </div>
        </>
      )}

      {overrideModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Override Match</h3>
            <p className="text-sm text-gray-500 mb-4">Change the matched enrollment for this claim</p>
            
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm"><span className="font-medium">Claim:</span> {overrideModal.claim_name}</p>
              <p className="text-sm text-gray-600"><span className="font-medium">Current:</span> {overrideModal.matched_enrollment || 'No match'} ({overrideModal.match_score}%)</p>
            </div>
            
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correct Enrollment:
            </label>
            <input
              type="text"
              value={overrideValue}
              onChange={(e) => setOverrideValue(e.target.value)}
              placeholder="Type enrollment name or member ID..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              autoFocus
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
                disabled={!overrideValue.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
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
