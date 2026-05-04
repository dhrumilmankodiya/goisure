import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { matchingApi, casesApi } from '../lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Progress } from '../components/ui/progress';
import {
  ArrowLeft,
  ArrowRight,
  Send,
  Users,
  DollarSign,
  Calendar,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  FileText,
  Upload,
  Flag,
  Download,
  RefreshCw,
  Shield,
  Check,
  X,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function AIMatchReviewPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [matchResults, setMatchResults] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('basic');
  const [activeTab, setActiveTab] = useState('overview');
  const [flagModal, setFlagModal] = useState(null);
  const [reuploadModal, setReuploadModal] = useState(null);
  const [flagData, setFlagData] = useState({ field_name: '', issue_description: '', correct_value: '' });
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, [caseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch match results
      const resultsRes = await matchingApi.getResults(caseId);
      setMatchResults(resultsRes.data);
      
      // Fetch analytics
      const analyticsRes = await matchingApi.getAnalytics(caseId);
      setAnalytics(analyticsRes.data);
      
    } catch (error) {
      toast.error('Failed to load match data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFlagField = async () => {
    if (!flagData.field_name || !flagModal) return;
    
    try {
      await matchingApi.flagField(caseId, {
        claim_name: flagModal.claim_name,
        field_name: flagData.field_name,
        issue_description: flagData.issue_description,
        correct_value: flagData.correct_value
      });
      toast.success('Field flagged successfully');
      setFlagModal(null);
      setFlagData({ field_name: '', issue_description: '', correct_value: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to flag field');
    }
  };

  const handleReupload = async () => {
    if (!reuploadModal || !reuploadModal.records?.length) return;
    
    try {
      await matchingApi.reuploadErrors(caseId, {
        file_type: reuploadModal.type,
        records: reuploadModal.records
      });
      toast.success('Error records re-uploaded');
      setReuploadModal(null);
    } catch (error) {
      toast.error('Failed to re-upload');
    }
  };

  const handleSubmitToUnderwriter = async () => {
    setSubmitting(true);
    try {
      await matchingApi.submitToUnderwriter(caseId, {
        selected_plan: selectedPlan,
        notes: notes
      });
      toast.success('Submitted to underwriter');
      navigate('/cases');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="spinner" />
        </div>
      </Layout>
    );
  }

  const overview = analytics?.overview || {};
  const quality = analytics?.match_quality || {};
  const risks = analytics?.risk_indicators || [];
  const plans = analytics?.premium_three_plans || [];
  const recommendations = analytics?.recommendations || [];
  const claimsAnalysis = analytics?.claims_analysis || {};
  const demographics = analytics?.demographics || {};

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Link to={`/cases/${caseId}`} className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 mb-3">
              <ArrowLeft className="w-4 h-4" />
              Back to Case
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold font-['Chivo'] tracking-tight text-zinc-900">
              AI Match Review
            </h1>
            <p className="text-zinc-500 mt-1">
              Review AI matching results, analytics, and submit to underwriting
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-zinc-200 pb-2">
          {[
            { id: 'overview', label: 'Overview & Stats', icon: Sparkles },
            { id: 'analytics', label: 'AI Analytics', icon: FileText },
            { id: 'premiums', label: 'Premium Plans', icon: DollarSign },
            { id: 'table', label: 'Match Table', icon: Users },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#0055FF] text-white'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ==================== OVERVIEW TAB ==================== */}
        {activeTab === 'overview' && (
          <>
            {/* Key Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border border-zinc-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold font-['Chivo']">{overview.total_claims || 0}</p>
                      <p className="text-xs text-zinc-500 uppercase tracking-wide">Total Claims</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-zinc-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-emerald-50 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold font-['Chivo'] text-emerald-600">{overview.matched_count || 0}</p>
                      <p className="text-xs text-zinc-500 uppercase tracking-wide">Matched</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-zinc-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-red-50 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold font-['Chivo'] text-red-600">{overview.unmatched_count || 0}</p>
                      <p className="text-xs text-zinc-500 uppercase tracking-wide">Unmatched</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-zinc-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-purple-50 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold font-['Chivo'] text-purple-600">{overview.match_rate || 0}%</p>
                      <p className="text-xs text-zinc-500 uppercase tracking-wide">Match Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Match Quality & Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border border-zinc-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold font-['Chivo'] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#0055FF]" />
                    Match Quality Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium">Quality Score</span>
                    <span className={`text-2xl font-bold ${
                      quality.quality_rating === 'Excellent' ? 'text-green-600' :
                      quality.quality_rating === 'Good' ? 'text-blue-600' :
                      quality.quality_rating === 'Fair' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {quality.quality_score || 0}%
                    </span>
                  </div>
                  <Progress value={quality.quality_score || 0} className="h-2 mb-2" />
                  <Badge className={`${
                    quality.quality_rating === 'Excellent' ? 'bg-green-100 text-green-700' :
                    quality.quality_rating === 'Good' ? 'bg-blue-100 text-blue-700' :
                    quality.quality_rating === 'Fair' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {quality.quality_rating || 'N/A'}
                  </Badge>
                  
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-green-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-green-600">{quality.confidence_distribution?.high || 0}</p>
                      <p className="text-xs text-green-700">High (95%+)</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-blue-600">{quality.confidence_distribution?.medium || 0}</p>
                      <p className="text-xs text-blue-700">Medium (70-95%)</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-red-600">{quality.confidence_distribution?.low || 0}</p>
                      <p className="text-xs text-red-700">Low (&lt;70%)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-zinc-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold font-['Chivo'] flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Match Method Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-700">EXACT</Badge>
                        Exact Name Match
                      </span>
                      <span className="font-bold">{overview.exact_matches || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Badge className="bg-cyan-100 text-cyan-700">MEMBER_ID</Badge>
                        Employee Number Match
                      </span>
                      <span className="font-bold">{overview.member_id_matches || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-700">FUZZY</Badge>
                        First Name Fuzzy
                      </span>
                      <span className="font-bold">{overview.fuzzy_matches || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Badge className="bg-purple-100 text-purple-700">LLM</Badge>
                        Gemma 4 AI Match
                      </span>
                      <span className="font-bold">{overview.llm_matches || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Risk Indicators */}
            {risks.length > 0 && (
              <Card className="border border-orange-200 bg-orange-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-orange-800 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Risk Indicators ({risks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {risks.map((risk, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border ${
                        risk.type === 'high_risk' ? 'border-red-300 bg-red-50' :
                        risk.type === 'medium_risk' ? 'border-orange-300 bg-orange-50' :
                        'border-yellow-300 bg-yellow-50'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-orange-900">{risk.title || risk.category}</p>
                            <p className="text-sm text-orange-800">{risk.description}</p>
                          </div>
                          <Badge variant="outline" className="border-orange-300 text-orange-700">
                            {risk.action}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Recommendations */}
            {recommendations.length > 0 && (
              <Card className="border border-purple-200 bg-purple-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-purple-800 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recommendations.map((rec, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border ${
                        rec.priority === 'high' ? 'border-red-300 bg-red-50' :
                        rec.priority === 'medium' ? 'border-blue-300 bg-blue-50' :
                        'border-gray-300 bg-gray-50'
                      }`}>
                        <div className="flex items-start gap-3">
                          {rec.priority === 'high' ? (
                            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="font-medium text-purple-900">{rec.title}</p>
                            <p className="text-sm text-purple-800">{rec.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* ==================== ANALYTICS TAB ==================== */}
        {activeTab === 'analytics' && (
          <>
            {/* Financial Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <Card className="border border-zinc-200">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Total Claimed</p>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(claimsAnalysis.financial_summary?.total_claimed)}</p>
                </CardContent>
              </Card>
              <Card className="border border-zinc-200">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Total Approved</p>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(claimsAnalysis.financial_summary?.total_approved)}</p>
                </CardContent>
              </Card>
              <Card className="border border-zinc-200">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Total Paid</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(claimsAnalysis.financial_summary?.total_paid)}</p>
                </CardContent>
              </Card>
              <Card className="border border-zinc-200">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Approval Rate</p>
                  <p className="text-xl font-bold text-purple-600">{claimsAnalysis.financial_summary?.approval_rate || 0}%</p>
                </CardContent>
              </Card>
            </div>

            {/* Claims Status Breakdown */}
            {claimsAnalysis.status_breakdown && (
              <Card className="border border-zinc-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold font-['Chivo']">Claims Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(claimsAnalysis.status_breakdown).map(([status, count]) => (
                      <Badge key={status} className={`${
                        status === 'Paid' ? 'bg-green-100 text-green-700' :
                        status === 'Denied' ? 'bg-red-100 text-red-700' :
                        status === 'Outstanding' ? 'bg-yellow-100 text-yellow-700' :
                        status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {status}: {count}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Demographics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {demographics.gender_distribution && (
                <Card className="border border-zinc-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold font-['Chivo']">Gender Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(demographics.gender_distribution).map(([gender, count]) => (
                        <div key={gender} className="flex items-center justify-between">
                          <span>{gender}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={(count / overview.total_enrolled) * 100} className="w-24 h-2" />
                            <span className="font-medium">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {demographics.relationship_distribution && (
                <Card className="border border-zinc-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold font-['Chivo']">Relationship Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(demographics.relationship_distribution).map(([rel, count]) => (
                        <div key={rel} className="flex items-center justify-between">
                          <span>{rel}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={(count / overview.total_enrolled) * 100} className="w-24 h-2" />
                            <span className="font-medium">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        {/* ==================== PREMIUM PLANS TAB ==================== */}
        {activeTab === 'premiums' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold font-['Chivo']">AI Suggested Premium Plans</h2>
              <p className="text-zinc-500">Choose a plan based on AI analysis of your data</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card 
                  key={plan.plan_type}
                  className={`border-2 transition-all cursor-pointer ${
                    selectedPlan === plan.plan_type 
                      ? 'border-[#0055FF] bg-blue-50 shadow-lg' 
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                  onClick={() => setSelectedPlan(plan.plan_type)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold">{plan.plan_name}</CardTitle>
                      {selectedPlan === plan.plan_type && (
                        <Badge className="bg-[#0055FF] text-white">Selected</Badge>
                      )}
                    </div>
                    <p className="text-3xl font-bold text-[#0055FF]">{formatCurrency(plan.premium)}</p>
                    <p className="text-sm text-zinc-500">{plan.coverage}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {plan.features?.slice(0, 4).map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-2 bg-zinc-50 rounded-lg">
                      <p className="text-xs text-zinc-600">{plan.suitability}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Selected Plan Details */}
            <Card className="border border-[#0055FF] bg-blue-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-[#0055FF]">
                  Selected: {plans.find(p => p.plan_type === selectedPlan)?.plan_name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Coverage Features</p>
                    <ul className="space-y-1">
                      {plans.find(p => p.plan_type === selectedPlan)?.features.map((f, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Exclusions</p>
                    <ul className="space-y-1">
                      {plans.find(p => p.plan_type === selectedPlan)?.exclusions.map((e, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-red-600">
                          <X className="w-4 h-4" />
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ==================== MATCH TABLE TAB ==================== */}
        {activeTab === 'table' && (
          <>
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  const errors = matchResults?.matches?.filter(m => m.needs_review || m.match_method === 'NO_MATCH') || [];
                  setReuploadModal({ type: 'claims', records: errors });
                }}
              >
                <Upload className="w-4 h-4 mr-2" />
                Re-upload Errors ({matchResults?.matches?.filter(m => m.needs_review).length || 0})
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>

            {/* Full Match Table */}
            <Card className="border border-zinc-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold font-['Chivo'] flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Complete Match Results
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-zinc-600">Claim Name</th>
                        <th className="px-3 py-2 text-left font-medium text-zinc-600">Employee No</th>
                        <th className="px-3 py-2 text-left font-medium text-zinc-600">Matched Enrollment</th>
                        <th className="px-3 py-2 text-center font-medium text-zinc-600">Confidence</th>
                        <th className="px-3 py-2 text-center font-medium text-zinc-600">Method</th>
                        <th className="px-3 py-2 text-center font-medium text-zinc-600">Status</th>
                        <th className="px-3 py-2 text-center font-medium text-zinc-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {matchResults?.matches?.map((match, idx) => (
                        <tr key={idx} className={match.needs_review ? 'bg-yellow-50' : match.match_method === 'NO_MATCH' ? 'bg-red-50' : ''}>
                          <td className="px-3 py-2">
                            <span className="font-medium">{match.claim_name}</span>
                          </td>
                          <td className="px-3 py-2 text-zinc-500">{match.claim_employee_no || '-'}</td>
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
                            {match.needs_review ? (
                              <Badge className="bg-yellow-100 text-yellow-700">Needs Review</Badge>
                            ) : match.match_method === 'NO_MATCH' ? (
                              <Badge className="bg-red-100 text-red-700">Unmatched</Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-700">Verified</Badge>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setFlagModal(match)}
                            >
                              <Flag className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </CardContent>
            </Card>
          </>
        )}

        {/* ==================== SUBMIT SECTION ==================== */}
        <Card className="border border-zinc-200 bg-zinc-50">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <h3 className="font-semibold mb-3">Additional Notes (Optional)</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes for the underwriter..."
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#0055FF] focus:border-transparent"
                  rows={3}
                />
              </div>
              <div className="flex flex-col items-end justify-between">
                <div className="text-right mb-4">
                  <p className="text-sm text-zinc-500">Selected Plan</p>
                  <p className="text-xl font-bold text-[#0055FF]">
                    {plans.find(p => p.plan_type === selectedPlan)?.plan_name}
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(plans.find(p => p.plan_type === selectedPlan)?.premium)}
                  </p>
                </div>
                <Button
                  onClick={handleSubmitToUnderwriter}
                  disabled={submitting}
                  className="bg-[#0055FF] hover:bg-[#0040CC] px-8"
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <div className="spinner w-4 h-4 border-white border-t-transparent mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit to Underwriter
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ==================== FLAG MODAL ==================== */}
        {flagModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-500" />
                Flag Field Issue
              </h3>
              <p className="text-sm text-zinc-600 mb-4">
                Claim: <strong>{flagModal.claim_name}</strong>
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Field with Issue</label>
                  <select
                    value={flagData.field_name}
                    onChange={(e) => setFlagData({ ...flagData, field_name: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                  >
                    <option value="">Select field...</option>
                    <option value="name">Name</option>
                    <option value="employee_no">Employee No</option>
                    <option value="dob">Date of Birth</option>
                    <option value="gender">Gender</option>
                    <option value="relationship">Relationship</option>
                    <option value="sum_insured">Sum Insured</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Issue Description</label>
                  <textarea
                    value={flagData.issue_description}
                    onChange={(e) => setFlagData({ ...flagData, issue_description: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                    rows={2}
                    placeholder="Describe the issue..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Correct Value</label>
                  <input
                    type="text"
                    value={flagData.correct_value}
                    onChange={(e) => setFlagData({ ...flagData, correct_value: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                    placeholder="Enter correct value..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 justify-end mt-4">
                <Button variant="outline" onClick={() => setFlagModal(null)}>
                  Cancel
                </Button>
                <Button onClick={handleFlagField} className="bg-red-600 hover:bg-red-700">
                  <Flag className="w-4 h-4 mr-2" />
                  Flag Issue
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== REUPLOAD MODAL ==================== */}
        {reuploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-500" />
                Re-upload Error Records
              </h3>
              <p className="text-sm text-zinc-600 mb-4">
                {reuploadModal.records.length} records need to be re-uploaded
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">File Type</label>
                <select
                  value={reuploadModal.type}
                  onChange={(e) => setReuploadModal({ ...reuploadModal, type: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                >
                  <option value="enrollment">Enrollment</option>
                  <option value="claims">Claims</option>
                </select>
              </div>
              
              <div className="bg-zinc-50 p-3 rounded-lg mb-4 max-h-40 overflow-y-auto">
                {reuploadModal.records.map((rec, idx) => (
                  <div key={idx} className="text-sm py-1 border-b border-zinc-200 last:border-0">
                    {rec.claim_name || rec.name || `Record ${idx + 1}`}
                  </div>
                ))}
              </div>
              
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setReuploadModal(null)}>
                  Cancel
                </Button>
                <Button onClick={handleReupload} className="bg-[#0055FF] hover:bg-[#0040CC]">
                  <Upload className="w-4 h-4 mr-2" />
                  Re-upload
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}