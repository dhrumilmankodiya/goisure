import { useMemo } from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface MatchingTabProps {
  caseData?: any;
  loading?: boolean;
}

export default function MatchingTab({ caseData, loading }: MatchingTabProps) {
  const matchResults = caseData?.matching?.match_results || [];
  const claimsData = caseData?.claims?.data || [];

  const stats = useMemo(() => {
    const matched = matchResults.filter((m: any) => m.matched_enrollment_id);
    const unmatched = matchResults.filter((m: any) => !m.matched_enrollment_id);

    const byMethod: Record<string, number> = {};
    matched.forEach((m: any) => {
      byMethod[m.match_method] = (byMethod[m.match_method] || 0) + 1;
    });

    return { matched: matched.length, unmatched: unmatched.length, byMethod };
  }, [matchResults]);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        Analyzing matches...
      </div>
    );
  }

  if (matchResults.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <ClockIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium mb-2">No matching results yet</p>
        <p className="text-sm">Run AI Matching to analyze claim-to-enrollment relationships.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-sm font-medium text-gray-600">Matched</span>
          </div>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.matched}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4">
          <div className="flex items-center">
            <XCircleIcon className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-sm font-medium text-gray-600">Unmatched</span>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.unmatched}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4">
          <span className="text-sm font-medium text-gray-600">Accuracy</span>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {stats.matched + stats.unmatched > 0
              ? ((stats.matched / (stats.matched + stats.unmatched)) * 100).toFixed(1)
              : 0}
            %
          </p>
        </div>
      </div>

      {/* Match Methods */}
      {Object.keys(stats.byMethod).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-600 mb-3">Match Methods</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.byMethod).map(([method, count]) => (
              <span key={method} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm">
                {method}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Results */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-600">Detailed Match Results</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claim</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matched ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {matchResults.map((m: any, idx: number) => {
                const claim = claimsData[m.claim_index] || {};
                const isMatched = !!m.matched_enrollment_id;
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{claim.ClaimID || `Claim ${m.claim_index + 1}`}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {m.matched_enrollment_id || '-'} {m.matched_name && `(${m.matched_name})`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{m.match_method}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${m.confidence || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{m.confidence}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      ₹{claim.ClaimAmount?.toLocaleString() || 0}
                    </td>
                    <td className="px-4 py-3">
                      {isMatched ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircleIcon className="w-3 h-3 mr-1" />
                          Matched
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <XCircleIcon className="w-3 h-3 mr-1" />
                          Unmatched
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
