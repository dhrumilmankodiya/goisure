import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { casesApi } from '../lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Progress } from '../components/ui/progress';
import {
  ArrowLeft,
  Send,
  Users,
  DollarSign,
  Calendar,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  FileText,
} from 'lucide-react';

export default function StructuredReviewPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await casesApi.submit(caseId);
      toast.success('Case submitted for underwriting');
      navigate('/cases');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit case');
    } finally {
      setSubmitting(false);
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

  const getAgeRange = () => {
    const data = caseData?.corrected_data || caseData?.mapped_data || [];
    if (data.length === 0) return '-';
    
    const ages = data
      .map(row => {
        const dob = row.date_of_birth;
        if (!dob) return null;
        const birthDate = new Date(dob);
        const today = new Date();
        return Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
      })
      .filter(age => age !== null && age > 0 && age < 120);
    
    if (ages.length === 0) return '-';
    return `${Math.min(...ages)} - ${Math.max(...ages)} years`;
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
  const aiConfidence = caseData?.ai_confidence || 0;
  const columns = tableData.length > 0 ? Object.keys(tableData[0]).filter(k => !k.startsWith('_')) : [];

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
            <h1 className="text-2xl sm:text-3xl font-bold font-['Chivo'] tracking-tight text-zinc-900" data-testid="structured-review-title">
              Final Review
            </h1>
            <p className="text-zinc-500 mt-1">
              Review the structured output before submitting to underwriting
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-bold font-['Chivo']">{getAgeRange()}</p>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">Age Range</p>
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
            <p className="text-sm text-zinc-500 mt-2">
              {aiConfidence >= 80 
                ? 'High confidence - Data quality is excellent'
                : aiConfidence >= 60 
                ? 'Medium confidence - Some fields may need review'
                : 'Low confidence - Manual review recommended'}
            </p>
          </CardContent>
        </Card>

        {/* Risk Flags */}
        {caseData?.risk_flags && caseData.risk_flags.length > 0 && (
          <Card className="border border-orange-200 bg-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-orange-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Risk Flags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {caseData.risk_flags.map((flag, idx) => (
                  <Badge key={idx} variant="outline" className="border-orange-300 text-orange-700 bg-white">
                    {flag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Preview */}
        <Card className="border border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold font-['Chivo'] flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Data Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-80">
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
                    {tableData.slice(0, 20).map((row, idx) => (
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
            {tableData.length > 20 && (
              <div className="p-3 bg-zinc-50 border-t border-zinc-200 text-center text-sm text-zinc-500">
                Showing 20 of {tableData.length} rows
              </div>
            )}
          </CardContent>
        </Card>

        {/* Checklist */}
        <Card className="border border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold font-['Chivo']">Submission Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <CheckCircle className={`w-5 h-5 ${tableData.length > 0 ? 'text-emerald-500' : 'text-zinc-300'}`} />
                <span className={tableData.length > 0 ? 'text-zinc-900' : 'text-zinc-400'}>
                  Member data extracted ({tableData.length} records)
                </span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className={`w-5 h-5 ${columns.length > 3 ? 'text-emerald-500' : 'text-zinc-300'}`} />
                <span className={columns.length > 3 ? 'text-zinc-900' : 'text-zinc-400'}>
                  Column mapping completed ({columns.length} fields)
                </span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className={`w-5 h-5 ${aiConfidence >= 50 ? 'text-emerald-500' : 'text-zinc-300'}`} />
                <span className={aiConfidence >= 50 ? 'text-zinc-900' : 'text-zinc-400'}>
                  AI confidence above threshold ({aiConfidence}%)
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4">
          <Link to={`/cases/${caseId}/correction`}>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Correction
            </Button>
          </Link>
          <Button 
            onClick={handleSubmit}
            disabled={submitting || tableData.length === 0}
            className="bg-[#0055FF] hover:bg-[#0040CC]"
            data-testid="submit-case-button"
          >
            {submitting ? (
              <>
                <div className="spinner w-4 h-4 border-white border-t-transparent mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit to Underwriting
              </>
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
