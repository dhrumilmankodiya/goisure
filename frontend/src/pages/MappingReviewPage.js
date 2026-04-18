import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { casesApi } from '../lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
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
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

const standardFields = [
  { value: 'unmapped', label: 'Unmapped' },
  { value: 'employee_id', label: 'Employee ID' },
  { value: 'employee_name', label: 'Employee Name' },
  { value: 'date_of_birth', label: 'Date of Birth' },
  { value: 'gender', label: 'Gender' },
  { value: 'relationship', label: 'Relationship' },
  { value: 'sum_insured', label: 'Sum Insured' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'address', label: 'Address' },
  { value: 'department', label: 'Department' },
  { value: 'designation', label: 'Designation' },
  { value: 'date_of_joining', label: 'Date of Joining' },
  { value: 'salary', label: 'Salary' },
  { value: 'policy_start_date', label: 'Policy Start Date' },
  { value: 'policy_end_date', label: 'Policy End Date' },
  { value: 'nominee_name', label: 'Nominee Name' },
  { value: 'nominee_relationship', label: 'Nominee Relationship' },
  { value: 'pre_existing_conditions', label: 'Pre-existing Conditions' },
];

const confidenceColors = {
  high: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-orange-50 text-orange-700 border-orange-200',
  uncertain: 'bg-red-50 text-red-700 border-red-200',
};

export default function MappingReviewPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchCase();
  }, [caseId]);

  const fetchCase = async () => {
    try {
      const { data } = await casesApi.getById(caseId);
      setCaseData(data);
      if (data.mapping_suggestions) {
        setMappings(data.mapping_suggestions);
      }
    } catch (error) {
      toast.error('Failed to load case');
      navigate('/cases');
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (index, newField) => {
    setMappings(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], suggested_field: newField, confidence: 'high' };
      return updated;
    });
  };

  const acceptAllHighConfidence = () => {
    // No changes needed, high confidence are already accepted
    toast.success('All high-confidence mappings accepted');
  };

  const handleApplyMapping = async () => {
    setApplying(true);
    try {
      const overrides = mappings
        .filter(m => m.suggested_field !== 'unmapped')
        .map(m => ({
          source_column: m.source_column,
          target_field: m.suggested_field,
        }));

      const { data } = await casesApi.applyMapping(caseId, overrides);
      toast.success('Mapping applied successfully');
      
      if (data.status === 'data_correction') {
        navigate(`/cases/${caseId}/correction`);
      } else {
        navigate(`/cases/${caseId}/review`);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to apply mapping');
    } finally {
      setApplying(false);
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

  const sampleData = caseData?.raw_data?.slice(0, 3) || [];
  const highConfidenceCount = mappings.filter(m => m.confidence === 'high').length;
  const mappedCount = mappings.filter(m => m.suggested_field !== 'unmapped').length;

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
            <h1 className="text-2xl sm:text-3xl font-bold font-['Chivo'] tracking-tight text-zinc-900" data-testid="mapping-review-title">
              AI Mapping Review
            </h1>
            <p className="text-zinc-500 mt-1">
              Review and adjust the AI-suggested column mappings
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg">
            <Sparkles className="w-5 h-5 text-[#0055FF]" />
            <span className="text-sm">
              <strong>{highConfidenceCount}</strong> of {mappings.length} columns with high confidence
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span className="text-sm">
              <strong>{mappedCount}</strong> columns mapped
            </span>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={acceptAllHighConfidence}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Accept All High Confidence
          </Button>
        </div>

        {/* Mapping Table */}
        <Card className="border border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold font-['Chivo']">Column Mappings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50">
                    <TableHead className="w-48">Source Column</TableHead>
                    <TableHead className="w-48">AI Suggestion</TableHead>
                    <TableHead className="w-32">Confidence</TableHead>
                    <TableHead>Sample Values</TableHead>
                    <TableHead className="w-48">Your Choice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappings.map((mapping, idx) => (
                    <TableRow key={idx} data-testid={`mapping-row-${idx}`}>
                      <TableCell className="font-medium font-mono text-sm">
                        {mapping.source_column}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#0055FF]" />
                          <span className="text-sm">
                            {standardFields.find(f => f.value === mapping.suggested_field)?.label || mapping.suggested_field}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${confidenceColors[mapping.confidence]} border`}>
                          {mapping.confidence}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {sampleData.slice(0, 2).map((row, i) => (
                            <code key={i} className="px-2 py-0.5 bg-zinc-100 rounded text-xs text-zinc-600 max-w-32 truncate">
                              {String(row[mapping.source_column] || '-')}
                            </code>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={mapping.suggested_field} 
                          onValueChange={(v) => handleMappingChange(idx, v)}
                          data-testid={`mapping-select-${idx}`}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {standardFields.map(field => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* AI Reasoning */}
        {mappings.some(m => m.reasoning) && (
          <Card className="border border-zinc-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold font-['Chivo'] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#0055FF]" />
                AI Reasoning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mappings.filter(m => m.reasoning && m.suggested_field !== 'unmapped').slice(0, 5).map((mapping, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm">
                    <code className="px-2 py-0.5 bg-zinc-100 rounded text-xs font-mono shrink-0">
                      {mapping.source_column}
                    </code>
                    <span className="text-zinc-600">→</span>
                    <span className="text-zinc-700">{mapping.reasoning}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4">
          <Link to={`/cases/${caseId}`}>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <Button 
            onClick={handleApplyMapping}
            disabled={applying || mappedCount === 0}
            className="bg-[#0055FF] hover:bg-[#0040CC]"
            data-testid="apply-mapping-button"
          >
            {applying ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                Apply Mapping
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
