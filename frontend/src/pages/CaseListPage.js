import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { casesApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  FolderOpen,
} from 'lucide-react';

const statusConfig = {
  draft: { label: 'Draft', class: 'bg-zinc-100 text-zinc-700' },
  mapping_review: { label: 'Mapping Review', class: 'bg-blue-50 text-blue-700' },
  data_correction: { label: 'Data Correction', class: 'bg-amber-50 text-amber-700' },
  review: { label: 'Review', class: 'bg-purple-50 text-purple-700' },
  submitted: { label: 'Submitted', class: 'bg-indigo-50 text-indigo-700' },
  under_review: { label: 'Under Review', class: 'bg-cyan-50 text-cyan-700' },
  approved: { label: 'Approved', class: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: 'Rejected', class: 'bg-red-50 text-red-700' },
  needs_correction: { label: 'Needs Correction', class: 'bg-orange-50 text-orange-700' },
};

export default function CaseListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cases, setCases] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const limit = 20;

  useEffect(() => {
    fetchCases();
  }, [status, page]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (status && status !== 'all') params.status = status;
      if (search) params.search = search;
      
      const { data } = await casesApi.getAll(params);
      setCases(data.cases || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCases();
  };

  const handleStatusChange = (value) => {
    setStatus(value);
    setPage(1);
    setSearchParams(prev => {
      if (value === 'all') {
        prev.delete('status');
      } else {
        prev.set('status', value);
      }
      return prev;
    });
  };

  const totalPages = Math.ceil(total / limit);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-['Chivo'] tracking-tight text-zinc-900" data-testid="case-list-title">
              My Cases
            </h1>
            <p className="text-zinc-500 mt-1">
              Manage and track all your GMC submissions
            </p>
          </div>
          <Link to="/cases/new">
            <Button className="bg-[#0055FF] hover:bg-[#0040CC]" data-testid="new-case-button">
              <Plus className="w-4 h-4 mr-2" />
              New Case
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Search by Case ID or Client Name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
          </form>
          <Select value={status} onValueChange={handleStatusChange} data-testid="status-filter">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(statusConfig).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="spinner" />
            </div>
          ) : cases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <FolderOpen className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium text-zinc-600">No cases found</p>
              <p className="text-sm mt-1">Start by creating a new case</p>
              <Link to="/cases/new" className="mt-4">
                <Button className="bg-[#0055FF] hover:bg-[#0040CC]">
                  <Plus className="w-4 h-4 mr-2" />
                  New Case
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-zinc-50">
                      <TableHead className="font-semibold">Case ID</TableHead>
                      <TableHead className="font-semibold">Client Name</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Members</TableHead>
                      <TableHead className="font-semibold text-right">Sum Insured</TableHead>
                      <TableHead className="font-semibold">Uploaded</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cases.map((caseItem) => {
                      const statusInfo = statusConfig[caseItem.status] || { label: caseItem.status, class: 'bg-zinc-100 text-zinc-700' };
                      return (
                        <TableRow key={caseItem.case_id} className="hover:bg-zinc-50" data-testid={`case-row-${caseItem.case_id}`}>
                          <TableCell className="font-mono text-sm">
                            <Link to={`/cases/${caseItem.case_id}`} className="text-[#0055FF] hover:underline">
                              {caseItem.case_id}
                            </Link>
                          </TableCell>
                          <TableCell className="font-medium">{caseItem.client_name}</TableCell>
                          <TableCell>
                            <Badge className={statusInfo.class}>{statusInfo.label}</Badge>
                          </TableCell>
                          <TableCell>{caseItem.member_count || 0}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(caseItem.sum_insured)}
                          </TableCell>
                          <TableCell className="text-zinc-500 text-sm">
                            {formatDate(caseItem.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Link to={`/cases/${caseItem.case_id}`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`view-case-${caseItem.case_id}`}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200">
                  <p className="text-sm text-zinc-500">
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} cases
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      data-testid="prev-page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-zinc-600">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      data-testid="next-page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
