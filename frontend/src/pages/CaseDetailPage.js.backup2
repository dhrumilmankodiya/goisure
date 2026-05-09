import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { casesApi } from '../lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  ArrowLeft,
  FileText,
  Users,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Upload,
  Eye,
  Edit,
} from 'lucide-react';

const statusConfig = {
  draft: { label: 'Draft', class: 'bg-zinc-100 text-zinc-700', icon: FileText },
  mapping_review: { label: 'Mapping Review', class: 'bg-blue-50 text-blue-700', icon: Eye },
  data_correction: { label: 'Data Correction', class: 'bg-amber-50 text-amber-700', icon: Edit },
  review: { label: 'Review', class: 'bg-purple-50 text-purple-700', icon: Eye },
  submitted: { label: 'Submitted', class: 'bg-indigo-50 text-indigo-700', icon: Clock },
  under_review: { label: 'Under Review', class: 'bg-cyan-50 text-cyan-700', icon: Clock },
  approved: { label: 'Approved', class: 'bg-emerald-50 text-emerald-700', icon: CheckCircle },
  rejected: { label: 'Rejected', class: 'bg-red-50 text-red-700', icon: XCircle },
  needs_correction: { label: 'Needs Correction', class: 'bg-orange-50 text-orange-700', icon: AlertTriangle },
};

export default function CaseDetailPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { isAgent, isUnderwriter, isAdmin } = useAuth();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCase();
  }, [caseId]);

  const fetchCase = async () => {
    try {
      const { data } = await casesApi.getById(caseId);
      setCaseData(data);
    } catch (error) {
      toast.error('Failed to load case');
      navigate('/cases');
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
      hour: '2-digit',
      minute: '2-digit',
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

  const getNextAction = () => {
    if (!caseData) return null;
    
    switch (caseData.status) {
      case 'draft':
        return { label: 'Upload File', href: `/cases/${caseId}`, icon: Upload };
      case 'mapping_review':
        return { label: 'Review Mapping', href: `/cases/${caseId}/mapping`, icon: Eye };
      case 'data_correction':
        return { label: 'Correct Data', href: `/cases/${caseId}/correction`, icon: Edit };
      case 'review':
        return { label: 'Final Review', href: `/cases/${caseId}/review`, icon: CheckCircle };
      case 'needs_correction':
        return { label: 'Fix Issues', href: `/cases/${caseId}/correction`, icon: AlertTriangle };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="spinner" />
        </div>
      </Layout>
    );
  }

  if (!caseData) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-zinc-500">Case not found</p>
        </div>
      </Layout>
    );
  }

  const statusInfo = statusConfig[caseData.status] || { label: caseData.status, class: 'bg-zinc-100 text-zinc-700', icon: FileText };
  const StatusIcon = statusInfo.icon;
  const nextAction = getNextAction();

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Link to="/cases" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 mb-3">
              <ArrowLeft className="w-4 h-4" />
              Back to Cases
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold font-['Chivo'] tracking-tight text-zinc-900" data-testid="case-detail-title">
                {caseData.case_id}
              </h1>
              <Badge className={statusInfo.class}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-zinc-500">{caseData.client_name}</p>
          </div>
          
          {nextAction && (isAgent || isAdmin) && (
            <Link to={nextAction.href}>
              <Button className="bg-[#0055FF] hover:bg-[#0040CC]" data-testid="next-action-button">
                <nextAction.icon className="w-4 h-4 mr-2" />
                {nextAction.label}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-['Chivo']">{caseData.member_count || 0}</p>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-emerald-50 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-lg font-bold font-['Chivo']">{formatCurrency(caseData.sum_insured)}</p>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">Sum Insured</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-purple-50 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{formatDate(caseData.created_at)}</p>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">Created</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-amber-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-lg font-bold font-['Chivo']">{caseData.ai_confidence || 0}%</p>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">AI Confidence</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="data">Data Preview</TabsTrigger>
            {caseData.underwriter_notes && <TabsTrigger value="feedback">Underwriter Feedback</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview">
            <Card className="border border-zinc-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold font-['Chivo']">Case Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Policy Type</p>
                    <p className="font-medium">{caseData.policy_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Agent</p>
                    <p className="font-medium">{caseData.agent_name}</p>
                  </div>
                  {caseData.underwriter_name && (
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Underwriter</p>
                      <p className="font-medium">{caseData.underwriter_name}</p>
                    </div>
                  )}
                  {caseData.submitted_at && (
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Submitted At</p>
                      <p className="font-medium">{formatDate(caseData.submitted_at)}</p>
                    </div>
                  )}
                </div>
                
                {caseData.notes && (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Notes</p>
                    <p className="text-zinc-700">{caseData.notes}</p>
                  </div>
                )}

                {caseData.risk_flags && caseData.risk_flags.length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Risk Flags</p>
                    <div className="flex flex-wrap gap-2">
                      {caseData.risk_flags.map((flag, idx) => (
                        <Badge key={idx} variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data">
            <Card className="border border-zinc-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold font-['Chivo']">Data Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {caseData.mapped_data && caseData.mapped_data.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          {Object.keys(caseData.mapped_data[0]).filter(k => !k.startsWith('_')).slice(0, 6).map(key => (
                            <th key={key}>{key.replace(/_/g, ' ')}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {caseData.mapped_data.slice(0, 10).map((row, idx) => (
                          <tr key={idx}>
                            {Object.entries(row).filter(([k]) => !k.startsWith('_')).slice(0, 6).map(([key, value]) => (
                              <td key={key}>{String(value) || '-'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {caseData.mapped_data.length > 10 && (
                      <p className="text-sm text-zinc-500 mt-3 text-center">
                        Showing 10 of {caseData.mapped_data.length} rows
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-zinc-500 text-center py-8">No data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {caseData.underwriter_notes && (
            <TabsContent value="feedback">
              <Card className="border border-zinc-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold font-['Chivo']">Underwriter Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-zinc-50 rounded-lg">
                    <p className="text-zinc-700">{caseData.underwriter_notes}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
}
