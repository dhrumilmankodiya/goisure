import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import MatchingPanel from '../components/MatchingPanel';
import { casesApi } from '../lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Upload,
  FileSpreadsheet,
  X,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Download,
} from 'lucide-react';

const GROUP_SIZE_BANDS = [
  { value: 'micro', label: 'Micro (1-9 employees)' },
  { value: 'small', label: 'Small (10-50 employees)' },
  { value: 'medium', label: 'Medium (51-200 employees)' },
  { value: 'large', label: 'Large (201-1000 employees)' },
  { value: 'enterprise', label: 'Enterprise (1000+ employees)' },
];

const INDUSTRIES = [
  'IT & Technology', 'Manufacturing', 'Financial Services', 'Healthcare',
  'Retail & E-commerce', 'Construction', 'Education', 'Logistics & Transport',
  'Hospitality & Tourism', 'Media & Entertainment', 'Real Estate', 'Telecommunications',
  'Energy & Utilities', 'Agriculture', 'Automotive', 'Pharmaceuticals',
  'Consulting & Services', 'Other',
];

const COVERAGE_LEVELS = [
  { value: 'basic', label: 'Basic' },
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'topup', label: 'Top-up' },
];

function autoCalcGroupBand(count) {
  const n = parseInt(count, 10);
  if (isNaN(n)) return '';
  if (n < 10) return 'micro';
  if (n <= 50) return 'small';
  if (n <= 200) return 'medium';
  if (n <= 1000) return 'large';
  return 'enterprise';
}

function UploadZone({ id, label, hint, file, onFileChange, onRemove, disabled, status }) {
  const [dragOver, setDragOver] = useState(false);

  if (file && !status) {
    // Already uploaded
    return (
      <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-emerald-800 truncate text-sm">{label} — Uploaded</p>
            <p className="text-xs text-emerald-600 truncate">{file.name}</p>
          </div>
        </div>
      </div>
    );
  }

  if (file) {
    // File selected, not yet uploaded
    return (
      <div className="border border-zinc-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-zinc-900 truncate text-sm">{file.name}</p>
            <p className="text-xs text-zinc-500">{formatFileSize(file.size)}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onRemove} disabled={disabled}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Empty dropzone
  return (
    <div
      className={`upload-zone rounded-lg p-6 text-center cursor-pointer transition-all border-2 border-dashed ${
        dragOver ? 'border-[#0055FF] bg-blue-50' : 'border-zinc-300 bg-zinc-50 hover:bg-zinc-100'
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) onFileChange(dropped);
      }}
      onClick={() => document.getElementById(id).click()}
    >
      <input
        id={id}
        type="file"
        className="hidden"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => { const f = e.target.files[0]; if (f) onFileChange(f); }}
      />
      <Upload className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
      <p className="text-sm font-medium text-zinc-700 mb-1">{label}</p>
      <p className="text-xs text-zinc-500">{hint || 'Drag & drop or click to browse'}</p>
    </div>
  );
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function NewCasePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingEnrollment, setUploadingEnrollment] = useState(false);
  const [uploadingClaims, setUploadingClaims] = useState(false);

  const [formData, setFormData] = useState({
    client_name: '',
    policy_type: 'GMC',
    business_type: 'fresh',
    // Fresh fields
    industry: '',
    employee_count: '',
    group_size_band: '',
    current_insurer: '',
    coverage_level: '',
    // Renewal fields
    previous_policy_number: '',
    previous_premium: '',
    claims_ratio: '',
    previous_insurer: '',
    policy_start: '',
    policy_end: '',
    renewal_date: '',
    notes: '',
  });

  const [enrollmentFile, setEnrollmentFile] = useState(null);
  const [claimsFile, setClaimsFile] = useState(null);
  const [caseId, setCaseId] = useState(null);
  const [enrollmentResult, setEnrollmentResult] = useState(null);
  const [claimsResult, setClaimsResult] = useState(null);

  const isRenewal = formData.business_type === 'renewal';

  const handleFormChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    // Auto-set group_size_band when employee_count changes
    if (field === 'employee_count') {
      updated.group_size_band = autoCalcGroupBand(value) || updated.group_size_band;
    }
    setFormData(updated);
  };

  const validateFile = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const validExts = ['.xlsx', '.xls', '.csv'];
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    if (!validExts.includes(ext) && !validTypes.includes(file.type)) {
      toast.error('Please upload an Excel (.xlsx, .xls) or CSV file');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return false;
    }
    return true;
  };

  const handleCreateCase = async () => {
    if (!formData.client_name.trim()) {
      toast.error('Please enter a client name');
      return;
    }
    if (isRenewal) {
      if (!formData.previous_insurer.trim()) {
        toast.error('Previous insurer is required for renewal cases');
        return;
      }
      if (!formData.previous_premium) {
        toast.error('Previous premium is required for renewal cases');
        return;
      }
      if (!formData.previous_policy_number.trim()) {
        toast.error('Previous policy number is required for renewal cases');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = { ...formData };
      if (payload.employee_count) payload.employee_count = parseInt(payload.employee_count, 10);
      if (payload.previous_premium) payload.previous_premium = parseFloat(payload.previous_premium);
      if (payload.claims_ratio) payload.claims_ratio = parseFloat(payload.claims_ratio);
      const { data } = await casesApi.create(payload);
      console.log('Case created response:', data);
      const newCaseId = data.id || data.case_id;
      setCaseId(newCaseId);
      setStep(2);
      toast.success('Case created successfully.');
    } catch (error) {
      console.error('Create case error:', error);
      alert(`Error: ${error.message}`);
      toast.error(error.response?.data?.detail || 'Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollmentUpload = async (file) => {
    if (!file || !caseId) return;
    setUploadingEnrollment(true);
    try {
      const { data } = await casesApi.upload(caseId, file);
      console.log('Enrollment upload response:', data);
      setEnrollmentResult(data);
      toast.success('Enrollment data uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload enrollment file');
      setEnrollmentFile(null);
    } finally {
      setUploadingEnrollment(false);
    }
  };

  const handleClaimsUpload = async (file) => {
    if (!file || !caseId) return;
    setUploadingClaims(true);
    try {
      const { data } = await casesApi.uploadClaims(caseId, file);
      setClaimsResult(data);
      toast.success('Claims file uploaded');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload claims file');
      setClaimsFile(null);
    } finally {
      setUploadingClaims(false);
    }
  };

  const canProceed = () => {
    if (!enrollmentResult) return false;
    if (isRenewal && !claimsResult) return false;
    return true;
  };

  const handleProceed = () => {
    if (!canProceed()) {
      toast.error('Please upload required files first');
      return;
    }
    // New flow: Go to AI processing page
    navigate(`/cases/${caseId}/processing`);
  };

  const allUploaded = enrollmentResult && (!isRenewal || claimsResult);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">

        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Chivo'] tracking-tight text-zinc-900" data-testid="new-case-title">
            New Case
          </h1>
          <p className="text-zinc-500 mt-1">
            Create a new GMC case and upload your data files
          </p>
        </div>

        {/* Business Type Toggle */}
        <div className="flex rounded-lg border border-zinc-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setFormData(f => ({ ...f, business_type: 'fresh' }))}
            className={`flex-1 py-3 text-sm font-medium transition-all ${
              !isRenewal
                ? 'bg-[#0055FF] text-white'
                : 'bg-white text-zinc-600 hover:bg-zinc-50'
            }`}
            data-testid="business-type-fresh"
          >
            Fresh Case
          </button>
          <button
            type="button"
            onClick={() => setFormData(f => ({ ...f, business_type: 'renewal' }))}
            className={`flex-1 py-3 text-sm font-medium transition-all border-l border-zinc-200 ${
              isRenewal
                ? 'bg-[#0055FF] text-white'
                : 'bg-white text-zinc-600 hover:bg-zinc-50'
            }`}
            data-testid="business-type-renewal"
          >
            Renewal Case
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#0055FF]' : 'text-zinc-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-[#0055FF] text-white' : 'bg-zinc-200 text-zinc-500'}`}>
              {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
            </div>
            <span className="text-sm font-medium">Case Details</span>
          </div>
          <div className="flex-1 h-px bg-zinc-200" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#0055FF]' : 'text-zinc-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-[#0055FF] text-white' : 'bg-zinc-200 text-zinc-500'}`}>
              2
            </div>
            <span className="text-sm font-medium">Upload Files</span>
          </div>
        </div>

        {/* ===== STEP 1: Case Details ===== */}
        {step === 1 && (
          <Card className="border border-zinc-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold font-['Chivo']">
                {isRenewal ? 'Renewal Case Details' : 'Fresh Case Details'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Required Fields */}
              <div className="space-y-2">
                <Label htmlFor="client_name">Client Name *</Label>
                <Input
                  id="client_name"
                  placeholder="Enter client or company name"
                  value={formData.client_name}
                  onChange={(e) => handleFormChange('client_name', e.target.value)}
                  data-testid="client-name-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="policy_type">Policy Type</Label>
                  <Select value={formData.policy_type} onValueChange={(v) => handleFormChange('policy_type', v)}>
                    <SelectTrigger data-testid="policy-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GMC">Group Medical Coverage (GMC)</SelectItem>
                      <SelectItem value="GPA">Group Personal Accident (GPA)</SelectItem>
                      <SelectItem value="GTL">Group Term Life (GTL)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={formData.industry} onValueChange={(v) => handleFormChange('industry', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map(ind => (
                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee_count">Number of Employees</Label>
                  <Input
                    id="employee_count"
                    type="number"
                    placeholder="e.g. 150"
                    value={formData.employee_count}
                    onChange={(e) => handleFormChange('employee_count', e.target.value)}
                    data-testid="employee-count-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group_size_band">Group Size Band</Label>
                  <Select value={formData.group_size_band} onValueChange={(v) => handleFormChange('group_size_band', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Auto or select" />
                    </SelectTrigger>
                    <SelectContent>
                      {GROUP_SIZE_BANDS.map(b => (
                        <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current_insurer">Current Insurer</Label>
                  <Input
                    id="current_insurer"
                    placeholder="e.g. ICICI Lombard"
                    value={formData.current_insurer}
                    onChange={(e) => handleFormChange('current_insurer', e.target.value)}
                    data-testid="current-insurer-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coverage_level">Coverage Level</Label>
                  <Select value={formData.coverage_level} onValueChange={(v) => handleFormChange('coverage_level', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {COVERAGE_LEVELS.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Renewal-only fields */}
              {isRenewal && (
                <>
                  <div className="border-t border-zinc-200 pt-5 space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Renewal Details</p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="previous_policy_number">Previous Policy Number *</Label>
                        <Input
                          id="previous_policy_number"
                          placeholder="POL-XXXX-XXXX"
                          value={formData.previous_policy_number}
                          onChange={(e) => handleFormChange('previous_policy_number', e.target.value)}
                          data-testid="previous-policy-input"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="previous_insurer">Previous Insurer *</Label>
                        <Input
                          id="previous_insurer"
                          placeholder="e.g. HDFC Ergo"
                          value={formData.previous_insurer}
                          onChange={(e) => handleFormChange('previous_insurer', e.target.value)}
                          data-testid="previous-insurer-input"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="previous_premium">Previous Annual Premium (₹) *</Label>
                        <Input
                          id="previous_premium"
                          type="number"
                          placeholder="e.g. 500000"
                          value={formData.previous_premium}
                          onChange={(e) => handleFormChange('previous_premium', e.target.value)}
                          data-testid="previous-premium-input"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="claims_ratio">Claims Ratio *</Label>
                        <Input
                          id="claims_ratio"
                          type="number"
                          step="0.01"
                          placeholder="e.g. 0.65"
                          value={formData.claims_ratio}
                          onChange={(e) => handleFormChange('claims_ratio', e.target.value)}
                          data-testid="claims-ratio-input"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="policy_start">Policy Start Date</Label>
                        <Input
                          id="policy_start"
                          type="date"
                          value={formData.policy_start}
                          onChange={(e) => handleFormChange('policy_start', e.target.value)}
                          data-testid="policy-start-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="policy_end">Policy End Date</Label>
                        <Input
                          id="policy_end"
                          type="date"
                          value={formData.policy_end}
                          onChange={(e) => handleFormChange('policy_end', e.target.value)}
                          data-testid="policy-end-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="renewal_date">Renewal Date</Label>
                        <Input
                          id="renewal_date"
                          type="date"
                          value={formData.renewal_date}
                          onChange={(e) => handleFormChange('renewal_date', e.target.value)}
                          data-testid="renewal-date-input"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes or instructions..."
                  value={formData.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  rows={2}
                  data-testid="notes-input"
                />
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleCreateCase}
                  disabled={loading || !formData.client_name.trim()}
                  className="w-full bg-[#0055FF] hover:bg-[#0040CC]"
                  data-testid="create-case-button"
                >
                  {loading ? (
                    <div className="spinner w-5 h-5 border-white border-t-transparent" />
                  ) : (
                    <>
                      Continue to Upload
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ===== STEP 2: Upload Files ===== */}
        {step === 2 && (
          <>
            <Card className="border border-zinc-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold font-['Chivo']">Upload Data Files</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-zinc-500">Case ID:</span>
                  <code className="px-2 py-1 bg-zinc-100 rounded text-zinc-900 font-mono text-xs">{caseId}</code>
                </div>

{/* === Always show both Claims and Enrollment uploads === */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <p className="text-sm text-blue-700">
                      Upload both Claims and Enrollment files to proceed to pricing
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Claims File */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Claims File *</Label>
                      <UploadZone
                        id="claims-file-input"
                        label="Claims File"
                        hint="Historical claims data (.xlsx, .xls, .csv)"
                        file={claimsFile || claimsResult}
                        onFileChange={(f) => {
                          if (validateFile(f)) {
                            setClaimsFile(f);
                            handleClaimsUpload(f);
                          }
                        }}
                        onRemove={() => setClaimsFile(null)}
                        disabled={uploadingClaims}
                        status={claimsResult ? 'uploaded' : null}
                      />
                      {uploadingClaims && (
                        <div className="flex items-center gap-2 text-sm text-zinc-500">
                          <div className="spinner w-4 h-4 border-zinc-300 border-t-[#0055FF]" />
                          Uploading...
                        </div>
                      )}
                      {claimsResult && (
                        <p className="text-xs text-emerald-600">
                          {claimsResult.claims_record_count} rows · {claimsResult.status}
                        </p>
                      )}
                    </div>

                    {/* Enrollment File */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Enrollment File *</Label>
                      <UploadZone
                        id="enrollment-file-input"
                        label="Enrollment File"
                        hint="Member list with demographics (.xlsx, .xls, .csv)"
                        file={enrollmentFile || enrollmentResult}
                        onFileChange={(f) => {
                          if (validateFile(f)) {
                            setEnrollmentFile(f);
                            handleEnrollmentUpload(f);
                          }
                        }}
                        onRemove={() => setEnrollmentFile(null)}
                        disabled={uploadingEnrollment}
                        status={enrollmentResult ? 'uploaded' : null}
                      />
                      {uploadingEnrollment && (
                        <div className="flex items-center gap-2 text-sm text-zinc-500">
                          <div className="spinner w-4 h-4 border-zinc-300 border-t-[#0055FF]" />
                          Uploading...
                        </div>
                      )}
                      {enrollmentResult && (
                        <p className="text-xs text-emerald-600">
                          {enrollmentResult.row_count} rows · {enrollmentResult.status}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Upload Checklist */}
                  <div className="border border-zinc-200 rounded-lg divide-y divide-zinc-100">
                    <div className={`flex items-center gap-3 px-4 py-2.5 ${claimsResult ? 'text-emerald-700' : 'text-zinc-400'}`}>
                      {claimsResult ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
                      <span className="text-sm font-medium">Claims file</span>
                    </div>
                    <div className={`flex items-center gap-3 px-4 py-2.5 ${enrollmentResult ? 'text-emerald-700' : 'text-zinc-400'}`}>
                      {enrollmentResult ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
                      <span className="text-sm font-medium">Enrollment file</span>
                    </div>
                  </div>
                </div>

                {/* Files uploaded - ready for AI processing */}
                {allUploaded && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 rounded-lg text-emerald-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Files uploaded successfully</span>
                  </div>
                )}}

                {/* Template Download */}
                <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-zinc-400" />
                  <p className="text-sm text-zinc-600 flex-1">
                    Need a template? Download our standard GMC data format
                  </p>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Template
                  </Button>
                </div>

                {/* Proceed Button */}
                <Button
                  onClick={handleProceed}
                  disabled={!allUploaded}
                  className="w-full bg-[#0055FF] hover:bg-[#0040CC]"
                  data-testid="proceed-to-mapping-button"
                >
                  Process with AI
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}