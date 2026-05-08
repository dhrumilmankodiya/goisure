import { useMemo } from 'react';
import EnrollmentTable from '../EnrollmentTable';
import ClaimsTable from '../ClaimsTable';

interface SummaryTabProps {
  caseData?: any;
  loading?: boolean;
}

export default function SummaryTab({ caseData, loading }: SummaryTabProps) {
  const enrollmentData = caseData?.enrollment?.data || [];
  const claimsData = caseData?.claims?.data || [];
  const matchResults = caseData?.matching?.match_results || [];
  const metrics = caseData?.metrics || {};

  return (
    <div className="p-6 space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-600 uppercase">Total Enrolled</p>
          <p className="text-2xl font-bold text-blue-900">{metrics.total_enrolled || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <p className="text-sm text-purple-600 uppercase">Total Claims</p>
          <p className="text-2xl font-bold text-purple-900">{metrics.total_claims || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-600 uppercase">Loss Ratio</p>
          <p className="text-2xl font-bold text-green-900">{metrics.loss_ratio || 0}%</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
          <p className="text-sm text-indigo-600 uppercase">Est. Premium</p>
          <p className="text-2xl font-bold text-indigo-900">
            ₹{(metrics.estimated_premium || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Enrolled Members */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Enrolled Members</h3>
        <EnrollmentTable data={enrollmentData} loading={loading} />
      </div>

      {/* Claims History */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Claims History</h3>
        <ClaimsTable data={claimsData} loading={loading} matchResults={matchResults} />
      </div>
    </div>
  );
}
