// ClaimsTable Component - Sortable, filterable, searchable claims data table

import { useState, useMemo, useCallback } from 'react';

const CLAIM_STATUS_CONFIG = {
  Approved: { label: 'Approved', color: 'text-green-700', bgColor: 'bg-green-100' },
  Pending: { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  Rejected: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-100' },
  Paid: { label: 'Paid', color: 'text-blue-700', bgColor: 'bg-blue-100' },
};

const COLUMNS = [
  { key: 'ClaimID', label: 'Claim ID', sortable: true, filterable: true },
  { key: 'EmployeeCode', label: 'Employee', sortable: true, filterable: true },
  { key: 'ClaimAmount', label: 'Amount', sortable: true },
  { key: 'ClaimDate', label: 'Date', sortable: true },
  { key: 'ClaimStatus', label: 'Status', sortable: true, filterable: true },
  { key: 'Diagnosis', label: 'Diagnosis', filterable: true },
  { key: 'Hospital', label: 'Hospital', sortable: true, filterable: true },
  { key: 'matched', label: 'Matched', sortable: true },
];

const PAGE_SIZE = 50;

export default function ClaimsTable({ data = [], loading = false, matchResults = [] }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const matchLookup = useMemo(() => {
    const lookup: Record<string, any> = {};
    matchResults.forEach((m: any) => {
      const claimIdx = m.claim_index;
      if (claimIdx >= 0 && claimIdx < data.length) lookup[claimIdx] = m;
    });
    return lookup;
  }, [matchResults, data]);

  const filterOptions = useMemo(() => {
    const options: Record<string, Set<string>> = {};
    COLUMNS.forEach((col) => {
      if (col.filterable) {
        options[col.key] = new Set();
        data.forEach((row: any) => {
          const val = row[col.key];
          if (val) options[col.key].add(val.toString());
        });
      }
    });
    return options;
  }, [data]);

  const dataWithMatch = useMemo(() => {
    return data.map((row: any, idx: number) => {
      const match = matchLookup[idx];
      const isMatched = !!match?.matched_enrollment_id;
      return { ...row, matched: isMatched ? 'Yes' : 'No', matchDetails: match };
    });
  }, [data, matchLookup]);

  const filteredData = useMemo(() => {
    return dataWithMatch.filter((row: any) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return Object.values(row).some((val: any) => val && val.toString().toLowerCase().includes(query));
      }
      return Object.entries(filters).every(([key, value]) => !value || row[key]?.toString() === value);
    });
  }, [dataWithMatch, searchQuery, filters]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    return [...filteredData].sort((a: any, b: any) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === 'ClaimAmount') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / PAGE_SIZE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedData.slice(start, start + PAGE_SIZE);
  }, [sortedData, currentPage]);

  const handleSort = useCallback((key: string) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) return { key, direction: 'asc' };
      if (current.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
    setCurrentPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
    setCurrentPage(1);
  }, []);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const activeFilterCount = Object.keys(filters).length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {data.length > 0 && (
        <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-gray-600"><span className="font-semibold text-gray-900">{data.length}</span> total claims</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600"><span className="font-semibold text-green-600">{matchResults.filter((m: any) => m.matched_enrollment_id).length}</span> matched</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600"><span className="font-semibold text-blue-600">{formatAmount(data.reduce((s: number, c: any) => s + (c.ClaimAmount || 0), 0))}</span> total claimed</span>
          </div>
        </div>
      )}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search claims..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
              showFilters || activeFilterCount > 0 ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            Filters {activeFilterCount > 0 && <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">{activeFilterCount}</span>}
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Export CSV</button>
        </div>
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {COLUMNS.filter(c => c.filterable).map(col => (
                <div key={col.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{col.label}</label>
                  <select value={filters[col.key] || ''} onChange={(e) => handleFilterChange(col.key, e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg py-1.5 px-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">All</option>
                    {Array.from(filterOptions[col.key] || []).sort().map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Matched</label>
                <select value={filters.matched || ''} onChange={(e) => handleFilterChange('matched', e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg py-1.5 px-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">All</option><option value="Yes">Yes</option><option value="No">No</option>
                </select>
              </div>
            </div>
            {activeFilterCount > 0 && <button onClick={handleResetFilters} className="mt-3 text-sm text-blue-600 hover:text-blue-700 underline">Reset all filters</button>}
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading claims data...</div>
        ) : paginatedData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{data.length === 0 ? 'No claims data available' : 'No matching records found'}</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>{COLUMNS.map(col => (
                <th key={col.key} scope="col"
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                  onClick={() => col.sortable && handleSort(col.key)}>
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <span className="flex flex-col">
                        <svg className={`w-3 h-3 ${sortConfig?.key === col.key && sortConfig.direction === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 256 256"><path d="M128,80a8,8,0,0,1,5.66,2.34l56,56a8,8,0,0,1-11.32,11.32L128,97.66l-50.34,50.35a8,8,0,0,1-11.32-11.32Z"/></svg>
                        <svg className={`w-3 h-3 -mt-1 ${sortConfig?.key === col.key && sortConfig.direction === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 256 256"><path d="M128,176a8,8,0,0,1-5.66-2.34l-56-56a8,8,0,0,1,11.32-11.32L128,158.34l50.34-50.35a8,8,0,0,1,11.32,11.32Z"/></svg>
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((row: any, rowIndex: number) => {
                const StatusIcon = CLAIM_STATUS_CONFIG[row.ClaimStatus] || CLAIM_STATUS_CONFIG.Pending;
                return (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.ClaimID || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.EmployeeCode || '-'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatAmount(row.ClaimAmount || 0)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.ClaimDate ? new Date(row.ClaimDate).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${StatusIcon.bgColor} ${StatusIcon.color}`}><span className="w-2 h-2 rounded-full bg-current" />{StatusIcon.label}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.Diagnosis || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.Hospital || '-'}</td>
                    <td className="px-4 py-3"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${row.matched === 'Yes' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{row.matched}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-gray-600">Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, sortedData.length)} of {sortedData.length} entries</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
            <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
