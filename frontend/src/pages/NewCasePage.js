import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
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

export default function NewCasePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  const [formData, setFormData] = useState({
    client_name: '',
    policy_type: 'GMC',
    notes: '',
  });
  const [file, setFile] = useState(null);
  const [caseId, setCaseId] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateCase = async () => {
    if (!formData.client_name.trim()) {
      toast.error('Please enter a client name');
      return;
    }

    setLoading(true);
    try {
      const { data } = await casesApi.create(formData);
      setCaseId(data.case_id);
      setStep(2);
      toast.success('Case created successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, []);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (file) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!validExtensions.includes(ext) && !validTypes.includes(file.type)) {
      toast.error('Please upload an Excel (.xlsx, .xls) or CSV file');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    
    setFile(file);
  };

  const handleUpload = async () => {
    if (!file || !caseId) return;

    setUploading(true);
    try {
      const { data } = await casesApi.upload(caseId, file);
      setUploadResult(data);
      toast.success('File uploaded and processed successfully');
      
      // Navigate to mapping review
      setTimeout(() => {
        navigate(`/cases/${caseId}/mapping`);
      }, 1500);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Chivo'] tracking-tight text-zinc-900" data-testid="new-case-title">
            New Case
          </h1>
          <p className="text-zinc-500 mt-1">
            Create a new GMC case and upload your data file
          </p>
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
            <span className="text-sm font-medium">Upload File</span>
          </div>
        </div>

        {/* Step 1: Case Details */}
        {step === 1 && (
          <Card className="border border-zinc-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold font-['Chivo']">Case Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="space-y-2">
                <Label htmlFor="policy_type">Policy Type</Label>
                <Select 
                  value={formData.policy_type} 
                  onValueChange={(v) => handleFormChange('policy_type', v)}
                  data-testid="policy-type-select"
                >
                  <SelectTrigger>
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
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes or instructions..."
                  value={formData.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  rows={3}
                  data-testid="notes-input"
                />
              </div>

              <div className="pt-4">
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

        {/* Step 2: Upload File */}
        {step === 2 && (
          <Card className="border border-zinc-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold font-['Chivo']">Upload Data File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Case ID Badge */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-zinc-500">Case ID:</span>
                <code className="px-2 py-1 bg-zinc-100 rounded text-zinc-900 font-mono">{caseId}</code>
              </div>

              {/* Upload Zone */}
              {!file ? (
                <div
                  className={`upload-zone rounded-lg p-8 text-center cursor-pointer transition-all ${dragOver ? 'drag-over border-[#0055FF] bg-blue-50' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input').click()}
                  data-testid="upload-dropzone"
                >
                  <input
                    id="file-input"
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                  />
                  <Upload className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-zinc-700 mb-2">
                    Drag and drop your file here
                  </p>
                  <p className="text-sm text-zinc-500 mb-4">
                    or click to browse
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
                    <FileSpreadsheet className="w-4 h-4" />
                    Supports: .xlsx, .xls, .csv (Max 10MB)
                  </div>
                </div>
              ) : (
                <div className="border border-zinc-200 rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-900 truncate">{file.name}</p>
                      <p className="text-sm text-zinc-500">{formatFileSize(file.size)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setFile(null)}
                      disabled={uploading}
                      data-testid="remove-file-button"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Upload Result */}
              {uploadResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg" data-testid="upload-success">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-emerald-800">File processed successfully</p>
                      <p className="text-sm text-emerald-600 mt-1">
                        {uploadResult.row_count} rows extracted, {uploadResult.columns?.length || 0} columns detected
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Template Download */}
              <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-zinc-400" />
                <p className="text-sm text-zinc-600 flex-1">
                  Need a template? Download our standard GMC data format
                </p>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Template
                </Button>
              </div>

              {/* Upload Button */}
              <div className="pt-4">
                <Button 
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="w-full bg-[#0055FF] hover:bg-[#0040CC]"
                  data-testid="upload-file-button"
                >
                  {uploading ? (
                    <>
                      <div className="spinner w-5 h-5 border-white border-t-transparent mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload & Process
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
