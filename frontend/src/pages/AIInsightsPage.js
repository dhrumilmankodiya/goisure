import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { casesApi } from '../lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Sparkles, 
  FileSpreadsheet, 
  Users, 
  DollarSign, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Activity,
  Shield,
  TrendingUp,
  Download,
  Eye,
  AlertCircle,
  Target
} from 'lucide-react';

export default function AIInsightsPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState(null);
  const [structuredData, setStructuredData] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [keyStats, setKeyStats] = useState(null);

  useEffect(() => {
    fetchData();
  }, [caseId]);

  const fetchData = async () => {
    try {
      // Get case data with structured data
      const { data } = await casesApi.getById(caseId);
      setCaseData(data);
      
      // Use data from navigation state or from case
      const insights = data.ai_insights || location.state?.results?.ai_insights || [];
      const structured = data.structured_data || location.state?.results?.structured_data || [];
      const stats = data.key_stats || location.state?.results?.key_stats || {};
      
      setAiInsights(insights);
      setStructuredData(structured);
      setKeyStats(stats);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load insights');
      navigate(`/cases/${caseId}`);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const exportData = () => {
    if (!structuredData.length) return;
    
    // Create CSV
    const headers = Object.keys(structuredData[0]);
    const csvRows = [
      headers.join(','),
      ...structuredData.map(row => 
        headers.map(h => {
          const val = row[h];
          if (Array.isArray(val)) return val.join('; ');
          if (val === null || val === undefined) return '';
          return String(val).replace(/,/g, ';');
        }).join(',')
      )
    ];
    
    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `structured-data-${caseId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'risk': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'opportunity': return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'pattern': return <Activity className="w-4 h-4 text-blue-500" />;
      default: return <Sparkles className="w-4 h-4 text-[#0055FF]" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-zinc-50 text-zinc-700 border-zinc-200';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="spinner w-8 h-8 border-2 border-zinc-200 border-t-[#0055FF] mx-auto mb-3" />
            <p className="text-sm text-zinc-500">Loading insights...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-['Chivo'] tracking-tight text-zinc-900">
              AI Insights & Structured Data
            </h1>
            <p className="text-zinc-500 mt-1">
              Analysis complete for Case {caseId}
            </p>
          </div>
          <Button 
            onClick={() => navigate(`/cases/${caseId}/pricing`)}
            className="bg-[#0055FF] hover:bg-[#0040CC]"
          >
            Continue to Pricing
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Key Stats Cards */}
        {keyStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border border-zinc-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#0055FF]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-['Chivo']">{keyStats.total_enrolled || 0}</p>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">Enrolled</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-amber-50 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-['Chivo']">{keyStats.total_claims || 0}</p>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">Claims</p>
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
                    <p className="text-2xl font-bold font-['Chivo']">
                      {keyStats.total_claimed ? formatCurrency(keyStats.total_claimed).replace('₹', '') : '0'}
                    </p>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">Total Claimed</p>
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
                    <p className="text-2xl font-bold font-['Chivo']">{keyStats.high_risk_members || 0}</p>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">High Risk</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI Insights */}
        {aiInsights.length > 0 && (
          <Card className="border border-zinc-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold font-['Chivo'] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#0055FF]" />
                AI Analytics & Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiInsights.map((insight, idx) => (
                <div 
                  key={idx}
                  className={`flex items-start gap-3 p-4 rounded-lg border ${getSeverityColor(insight.severity)}`}
                >
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{insight.title}</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {insight.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-600">{insight.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Structured Data Table */}
        <Card className="border border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold font-['Chivo'] flex items-center gap-2">
              <Target className="w-5 h-5 text-[#0055FF]" />
              Structured Data Preview
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportData}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            {structuredData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>Relationship</th>
                      <th>Sum Insured</th>
                      <th>Claim Count</th>
                      <th>Total Claimed</th>
                      <th>Total Approved</th>
                      <th>Claim Status</th>
                      <th>Diagnosis 1</th>
                      <th>Diagnosis 2</th>
                      <th>Hospital</th>
                      <th>Has Claims</th>
                    </tr>
                  </thead>
                  <tbody>
                    {structuredData.slice(0, 20).map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.Name || '-'}</td>
                        <td>{row.Age || 0}</td>
                        <td className="capitalize">{row.Gender || '-'}</td>
                        <td>{row.Relationship || 'SELF'}</td>
                        <td>{row.Sum_Insured ? formatCurrency(row.Sum_Insured) : '-'}</td>
                        <td>{row.Claim_Count || 0}</td>
                        <td>{row.Total_Claimed ? formatCurrency(row.Total_Claimed) : '-'}</td>
                        <td>{row.Total_Approved ? formatCurrency(row.Total_Approved) : '-'}</td>
                        <td>
                          <Badge variant={row.Claim_Status === 'Paid' ? 'default' : 'outline'} className={row.Claim_Status === 'Paid' ? 'bg-green-100 text-green-800' : ''}>
                            {row.Claim_Status || '-'}
                          </Badge>
                        </td>
                        <td>{row.Diagnosis_1 || '-'}</td>
                        <td>{row.Diagnosis_2 || '-'}</td>
                        <td>{row.Hospital_1 || '-'}</td>
                        <td>{row.Has_Claims ? '✓' : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {structuredData.length > 20 && (
                  <p className="text-xs text-zinc-500 text-center mt-3">
                    Showing 20 of {structuredData.length} records
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500">
                <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No structured data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline"
            onClick={() => navigate(`/cases/${caseId}`)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Case
          </Button>
          <Button 
            onClick={() => navigate(`/cases/${caseId}/pricing`)}
            className="bg-[#0055FF] hover:bg-[#0040CC]"
          >
            Proceed to Pricing
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </Layout>
  );
}