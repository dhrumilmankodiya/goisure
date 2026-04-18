import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { underwriterApi } from '../lib/api';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
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
  Eye,
  Users,
  DollarSign,
  Sparkles,
  Clock,
  FolderOpen,
} from 'lucide-react';

export default function UnderwriterQueuePage() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchQueue();
  }, [statusFilter]);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const { data } = await underwriterApi.getQueue(params);
      setCases(data.cases || []);
    } catch (error) {
      console.error('Failed to fetch queue:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-emerald-600';
    if (confidence >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-['Chivo'] tracking-tight text-zinc-900" data-testid="underwriter-queue-title">
              Underwriting Queue
            </h1>
            <p className="text-zinc-500 mt-1">
              Review and process submitted cases
            </p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cases</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Queue Stats */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg">
            <Clock className="w-5 h-5 text-indigo-500" />
            <span className="text-sm font-medium">
              {cases.filter(c => c.status === 'submitted').length} awaiting review
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg">
            <Eye className="w-5 h-5 text-cyan-500" />
            <span className="text-sm font-medium">
              {cases.filter(c => c.status === 'under_review').length} under review
            </span>
          </div>
        </div>

        {/* Queue Table */}
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="spinner" />
            </div>
          ) : cases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <FolderOpen className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium text-zinc-600">No cases in queue</p>
              <p className="text-sm mt-1">Cases will appear here when agents submit them</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50">
                    <TableHead className="font-semibold">Case ID</TableHead>
                    <TableHead className="font-semibold">Client</TableHead>
                    <TableHead className="font-semibold">Agent</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-center">
                      <Users className="w-4 h-4 inline mr-1" />
                      Members
                    </TableHead>
                    <TableHead className="font-semibold text-right">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Sum Insured
                    </TableHead>
                    <TableHead className="font-semibold text-center">
                      <Sparkles className="w-4 h-4 inline mr-1" />
                      AI Score
                    </TableHead>
                    <TableHead className="font-semibold">Submitted</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((caseItem) => (
                    <TableRow key={caseItem.case_id} className="hover:bg-zinc-50" data-testid={`queue-row-${caseItem.case_id}`}>
                      <TableCell className="font-mono text-sm">
                        <Link to={`/underwriter/cases/${caseItem.case_id}`} className="text-[#0055FF] hover:underline">
                          {caseItem.case_id}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">{caseItem.client_name}</TableCell>
                      <TableCell className="text-zinc-600">{caseItem.agent_name}</TableCell>
                      <TableCell>
                        <Badge className={caseItem.status === 'submitted' ? 'bg-indigo-50 text-indigo-700' : 'bg-cyan-50 text-cyan-700'}>
                          {caseItem.status === 'submitted' ? 'Submitted' : 'Under Review'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{caseItem.member_count || 0}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(caseItem.sum_insured)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${getConfidenceColor(caseItem.ai_confidence || 0)}`}>
                          {caseItem.ai_confidence || 0}%
                        </span>
                      </TableCell>
                      <TableCell className="text-zinc-500 text-sm">
                        {formatDate(caseItem.submitted_at)}
                      </TableCell>
                      <TableCell>
                        <Link to={`/underwriter/cases/${caseItem.case_id}`}>
                          <Button size="sm" className="bg-[#0055FF] hover:bg-[#0040CC]" data-testid={`review-case-${caseItem.case_id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
