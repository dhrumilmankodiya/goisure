import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { auditApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
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
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  User,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';

const actionColors = {
  user_registered: 'bg-blue-50 text-blue-700',
  user_login: 'bg-emerald-50 text-emerald-700',
  user_logout: 'bg-zinc-100 text-zinc-700',
  case_created: 'bg-indigo-50 text-indigo-700',
  file_uploaded: 'bg-purple-50 text-purple-700',
  mapping_applied: 'bg-cyan-50 text-cyan-700',
  data_corrected: 'bg-amber-50 text-amber-700',
  case_submitted: 'bg-orange-50 text-orange-700',
  review_started: 'bg-teal-50 text-teal-700',
  decision_made: 'bg-pink-50 text-pink-700',
  case_updated: 'bg-lime-50 text-lime-700',
  case_deleted: 'bg-red-50 text-red-700',
};

const actionLabels = {
  user_registered: 'User Registered',
  user_login: 'User Login',
  user_logout: 'User Logout',
  case_created: 'Case Created',
  file_uploaded: 'File Uploaded',
  mapping_applied: 'Mapping Applied',
  data_corrected: 'Data Corrected',
  case_submitted: 'Case Submitted',
  review_started: 'Review Started',
  decision_made: 'Decision Made',
  case_updated: 'Case Updated',
  case_deleted: 'Case Deleted',
};

export default function AuditTrailPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 50;

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (actionFilter !== 'all') params.action = actionFilter;
      
      const { data } = await auditApi.getLogs(params);
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDetails = (details) => {
    if (!details) return '-';
    const entries = Object.entries(details);
    if (entries.length === 0) return '-';
    
    return entries.map(([key, value]) => {
      if (Array.isArray(value)) return `${key}: ${value.join(', ')}`;
      return `${key}: ${value}`;
    }).join(' • ');
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.action?.toLowerCase().includes(query) ||
      log.user_id?.toLowerCase().includes(query) ||
      JSON.stringify(log.details)?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-['Chivo'] tracking-tight text-zinc-900" data-testid="audit-trail-title">
              Audit Trail
            </h1>
            <p className="text-zinc-500 mt-1">
              View complete history of all system activities
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="search-logs-input"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {Object.entries(actionLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Logs Table */}
        <Card className="border border-zinc-200">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="spinner" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
                <FileText className="w-12 h-12 mb-4" />
                <p className="text-lg font-medium text-zinc-600">No audit logs found</p>
                <p className="text-sm mt-1">Activity will appear here once users interact with the system</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-zinc-50">
                        <TableHead className="font-semibold w-48">
                          <Clock className="w-4 h-4 inline mr-1" />
                          Timestamp
                        </TableHead>
                        <TableHead className="font-semibold">Action</TableHead>
                        <TableHead className="font-semibold">
                          <User className="w-4 h-4 inline mr-1" />
                          User ID
                        </TableHead>
                        <TableHead className="font-semibold">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log, idx) => {
                        const colorClass = actionColors[log.action] || 'bg-zinc-100 text-zinc-700';
                        const label = actionLabels[log.action] || log.action;
                        
                        return (
                          <TableRow key={idx} className="hover:bg-zinc-50" data-testid={`audit-row-${idx}`}>
                            <TableCell className="text-sm text-zinc-600 font-mono">
                              {formatDateTime(log.timestamp)}
                            </TableCell>
                            <TableCell>
                              <Badge className={colorClass}>{label}</Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {log.user_id?.substring(0, 8)}...
                            </TableCell>
                            <TableCell className="text-sm text-zinc-600 max-w-md truncate">
                              {formatDetails(log.details)}
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
                      Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} logs
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
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
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
