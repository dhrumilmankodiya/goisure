import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { casesApi } from '../lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { Progress } from '../components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  DollarSign,
  Sparkles,
  Calendar,
  FileText,
  Clock,
  MessageSquare,
} from 'lucide-react';

export default function UnderwriterReviewPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);
  const [decisionType, setDecisionType] = useState(null);
  const [notes, setNotes] = useState('');
  const [riskFlags, setRiskFlags] = useState([]);

  useEffect(() => {
    fetchCase();
  }, [caseId]);

  const fetchCase = async () => {
    try {
      const { data } = await casesApi.getById(caseId);
      setCaseData(data);
      
      // Start review if not already
      if (data.status === 'submitted') {
        await casesApi.startReview(caseId);
      }
    } catch (error) {
      toast.error('Failed to load case');
      navigate('/underwriter/queue');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async () => {
    setProcessing(true);
    try {
      await casesApi.makeDecision(caseId, {
        decision: decisionType,
        notes: notes,
        risk_flags: riskFlags,
      });
      
      toast.success(`Case ${decisionType === 'approve' ? 'approved' : decisionType === 'reject' ? 'rejected' : 'returned for corrections'}`);
      navigate('/underwriter/queue');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit decision');
    } finally {
      setProcessing(false);
      setShowDecisionDialog(false);
    }
  };

  const openDecisionDialog = (type) => {
    setDecisionType(type);
    setShowDecisionDialog(true);
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
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
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

  const tableData = caseData?.corrected_data || caseData?.mapped_data || [];
  const columns = tableData.length > 0 ? Object.keys(tableData[0]).filter(k => !k.startsWith('_')) : [];
  const aiConfidence = caseData?.ai_confidence || 0;

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Link to="/underwriter/queue" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 mb-3">
              <ArrowLeft className="w-4 h-4" />
              Back to Queue
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold font-['Chivo'] tracking-tight text-zinc-900" data-testid="underwriter-review-title">
                {caseData?.case_id}
              </h1>
              <Badge className="bg-cyan-50 text-cyan-700">
                <Clock className="w-3 h-3 mr-1" />
                Under Review
              </Badge>
            </div>
            <p className="text-zinc-500">{caseData?.client_name} • Submitted by {caseData?.agent_name}</p>
          </div>

          {/* Decision Buttons */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="border-orange-200 text-orange-700 hover:bg-orange-50"
              onClick={() => openDecisionDialog('request_fixes')}
              data-testid="request-fixes-button"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Request Fixes
            </Button>
            <Button 
              variant="outline" 
              className="border-red-200 text-red-700 hover:bg-red-50"
              onClick={() => openDecisionDialog('reject')}
              data-testid="reject-button"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => openDecisionDialog('approve')}
              data-testid="approve-button"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-['Chivo']">{tableData.length}</p>
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
                  <p className="text-lg font-bold font-['Chivo']">{formatCurrency(caseData?.sum_insured)}</p>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">Sum Insured</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-purple-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-bold font-['Chivo']">{caseData?.policy_type}</p>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">Policy Type</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-amber-50 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-['Chivo']">{aiConfidence}%</p>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">AI Confidence</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-indigo-50 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-medium">{formatDate(caseData?.submitted_at)}</p>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">Submitted</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Confidence Bar */}
        <Card className="border border-zinc-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#0055FF]" />
                <span className="font-medium">AI Data Quality Score</span>
              </div>
              <span className={`font-bold ${aiConfidence >= 80 ? 'text-emerald-600' : aiConfidence >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                {aiConfidence}%
              </span>
            </div>
            <Progress value={aiConfidence} className="h-2" />
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="members" className="space-y-4">
          <TabsList>
            <TabsTrigger value="members">Member List</TabsTrigger>
            <TabsTrigger value="coverage">Coverage Summary</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            <Card className="border border-zinc-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold font-['Chivo']">Member Data</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  <div className="overflow-x-auto">
                    <table className="data-table min-w-full">
                      <thead>
                        <tr>
                          {columns.slice(0, 8).map(col => (
                            <th key={col}>{col.replace(/_/g, ' ')}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.map((row, idx) => (
                          <tr key={idx}>
                            {columns.slice(0, 8).map(col => (
                              <td key={col}>{String(row[col] || '-')}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coverage">
            <Card className="border border-zinc-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold font-['Chivo']">Coverage Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Policy Details</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b border-zinc-100">
                        <span className="text-zinc-500">Policy Type</span>
                        <span className="font-medium">{caseData?.policy_type}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-zinc-100">
                        <span className="text-zinc-500">Total Members</span>
                        <span className="font-medium">{tableData.length}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-zinc-100">
                        <span className="text-zinc-500">Total Sum Insured</span>
                        <span className="font-medium">{formatCurrency(caseData?.sum_insured)}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Risk Assessment</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b border-zinc-100">
                        <span className="text-zinc-500">AI Confidence</span>
                        <span className={`font-medium ${aiConfidence >= 80 ? 'text-emerald-600' : aiConfidence >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                          {aiConfidence}%
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-zinc-100">
                        <span className="text-zinc-500">Data Quality</span>
                        <span className="font-medium">
                          {aiConfidence >= 80 ? 'Excellent' : aiConfidence >= 60 ? 'Good' : 'Needs Review'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card className="border border-zinc-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold font-['Chivo']">Audit Trail</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#0055FF] mt-2" />
                    <div>
                      <p className="font-medium">Case created</p>
                      <p className="text-sm text-zinc-500">{formatDate(caseData?.created_at)}</p>
                    </div>
                  </div>
                  {caseData?.submitted_at && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2" />
                      <div>
                        <p className="font-medium">Submitted for underwriting</p>
                        <p className="text-sm text-zinc-500">{formatDate(caseData?.submitted_at)}</p>
                      </div>
                    </div>
                  )}
                  {caseData?.review_started_at && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-cyan-500 mt-2" />
                      <div>
                        <p className="font-medium">Review started by {caseData?.underwriter_name}</p>
                        <p className="text-sm text-zinc-500">{formatDate(caseData?.review_started_at)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Decision Dialog */}
        <Dialog open={showDecisionDialog} onOpenChange={setShowDecisionDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {decisionType === 'approve' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                {decisionType === 'reject' && <XCircle className="w-5 h-5 text-red-500" />}
                {decisionType === 'request_fixes' && <AlertTriangle className="w-5 h-5 text-orange-500" />}
                {decisionType === 'approve' ? 'Approve Case' : decisionType === 'reject' ? 'Reject Case' : 'Request Fixes'}
              </DialogTitle>
              <DialogDescription>
                {decisionType === 'approve' 
                  ? 'This will approve the case and notify the agent.'
                  : decisionType === 'reject'
                  ? 'Please provide a reason for rejection.'
                  : 'Specify what corrections are needed.'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="notes">
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  Notes {decisionType !== 'approve' && '*'}
                </Label>
                <Textarea
                  id="notes"
                  placeholder={
                    decisionType === 'approve' 
                      ? 'Optional notes for the agent...'
                      : decisionType === 'reject'
                      ? 'Reason for rejection...'
                      : 'What needs to be fixed...'
                  }
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  data-testid="decision-notes"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDecisionDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleDecision}
                disabled={processing || (decisionType !== 'approve' && !notes.trim())}
                className={
                  decisionType === 'approve' 
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : decisionType === 'reject'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                }
                data-testid="confirm-decision-button"
              >
                {processing ? (
                  <div className="spinner w-4 h-4 border-white border-t-transparent" />
                ) : (
                  'Confirm'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
