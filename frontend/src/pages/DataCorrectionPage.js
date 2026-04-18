import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { casesApi } from '../lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Save,
  Undo,
  Redo,
  Filter,
  Search,
} from 'lucide-react';

export default function DataCorrectionPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [data, setData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all'); // all, errors, warnings
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    fetchCase();
  }, [caseId]);

  const fetchCase = async () => {
    try {
      const { data: caseRes } = await casesApi.getById(caseId);
      setCaseData(caseRes);
      const tableData = caseRes.corrected_data || caseRes.mapped_data || [];
      setData(tableData);
      setOriginalData(JSON.parse(JSON.stringify(tableData)));
      setHistory([JSON.parse(JSON.stringify(tableData))]);
      setHistoryIndex(0);
    } catch (error) {
      toast.error('Failed to load case');
      navigate('/cases');
    } finally {
      setLoading(false);
    }
  };

  const handleCellChange = (rowIndex, field, value) => {
    setData(prev => {
      const updated = [...prev];
      updated[rowIndex] = { ...updated[rowIndex], [field]: value };
      
      // Clear error for this field if it exists
      if (updated[rowIndex]._errors) {
        updated[rowIndex]._errors = updated[rowIndex]._errors.filter(e => e.field !== field);
      }
      
      // Add to history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(updated)));
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      return updated;
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setData(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setData(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await casesApi.correctData(caseId, { corrected_data: data });
      toast.success('Data saved successfully');
      navigate(`/cases/${caseId}/review`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  const getColumns = () => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).filter(k => !k.startsWith('_'));
  };

  const getFilteredData = () => {
    let filtered = data;
    
    if (filter === 'errors') {
      filtered = filtered.filter(row => row._errors && row._errors.length > 0);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(row => 
        Object.values(row).some(v => String(v).toLowerCase().includes(query))
      );
    }
    
    return filtered;
  };

  const getTotalErrors = () => {
    return data.reduce((acc, row) => acc + (row._errors?.length || 0), 0);
  };

  const getErrorForCell = (row, field) => {
    return row._errors?.find(e => e.field === field);
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

  const columns = getColumns();
  const filteredData = getFilteredData();
  const totalErrors = getTotalErrors();

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
            <h1 className="text-2xl sm:text-3xl font-bold font-['Chivo'] tracking-tight text-zinc-900" data-testid="data-correction-title">
              Data Correction
            </h1>
            <p className="text-zinc-500 mt-1">
              Review and correct data errors before submission
            </p>
          </div>
        </div>

        {/* Stats & Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {totalErrors > 0 ? (
              <Badge className="bg-red-50 text-red-700 border border-red-200">
                <AlertCircle className="w-3 h-3 mr-1" />
                {totalErrors} errors
              </Badge>
            ) : (
              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                No errors
              </Badge>
            )}
            <span className="text-sm text-zinc-500">{data.length} rows</span>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleUndo}
              disabled={historyIndex <= 0}
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Search data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="search-input"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-400" />
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-[#0055FF] hover:bg-[#0040CC]' : ''}
            >
              All
            </Button>
            <Button 
              variant={filter === 'errors' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('errors')}
              className={filter === 'errors' ? 'bg-[#0055FF] hover:bg-[#0040CC]' : ''}
            >
              Errors Only
            </Button>
          </div>
        </div>

        {/* Editable Table */}
        <Card className="border border-zinc-200">
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="overflow-x-auto">
                <table className="data-table min-w-full">
                  <thead>
                    <tr>
                      <th className="sticky left-0 bg-white z-20 w-16">#</th>
                      {columns.map(col => (
                        <th key={col} className="min-w-40">
                          {col.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((row, rowIdx) => {
                      const hasErrors = row._errors && row._errors.length > 0;
                      const actualIndex = data.findIndex(d => d._row_index === row._row_index);
                      
                      return (
                        <tr 
                          key={row._row_index || rowIdx} 
                          className={hasErrors ? 'has-error' : ''}
                          data-testid={`data-row-${rowIdx}`}
                        >
                          <td className="sticky left-0 bg-white z-10 text-center text-zinc-500 text-sm">
                            {(row._row_index || rowIdx) + 1}
                          </td>
                          {columns.map(col => {
                            const error = getErrorForCell(row, col);
                            return (
                              <td key={col} className="p-0">
                                <div className={`editable-cell ${error ? 'has-error' : ''}`}>
                                  <Input
                                    value={row[col] || ''}
                                    onChange={(e) => handleCellChange(actualIndex >= 0 ? actualIndex : rowIdx, col, e.target.value)}
                                    className={`border-0 rounded-none h-full ${error ? 'bg-red-50' : ''}`}
                                    data-testid={`cell-${rowIdx}-${col}`}
                                  />
                                  {error && (
                                    <div className="absolute -top-1 -right-1">
                                      <div className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center" title={error.message}>
                                        <span className="text-white text-xs">!</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Error Summary */}
        {totalErrors > 0 && (
          <Card className="border border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-red-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Error Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {data.flatMap((row, idx) => 
                  (row._errors || []).map((err, errIdx) => (
                    <li key={`${idx}-${errIdx}`} className="text-sm text-red-700">
                      Row {(row._row_index || idx) + 1}: {err.field} - {err.message}
                    </li>
                  ))
                ).slice(0, 10)}
                {totalErrors > 10 && (
                  <li className="text-sm text-red-600 font-medium">
                    ... and {totalErrors - 10} more errors
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4">
          <Link to={`/cases/${caseId}/mapping`}>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Mapping
            </Button>
          </Link>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-[#0055FF] hover:bg-[#0040CC]"
            data-testid="save-corrections-button"
          >
            {saving ? (
              <>
                <div className="spinner w-4 h-4 border-white border-t-transparent mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save & Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
