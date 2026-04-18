import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { templatesApi } from '../lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Copy,
} from 'lucide-react';

export default function TemplateManagerPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    insurer: '',
    mappings: {},
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data } = await templatesApi.getAll();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (template = null) => {
    if (template) {
      setEditTemplate(template);
      setFormData({
        name: template.name,
        insurer: template.insurer,
        mappings: template.mappings || {},
      });
    } else {
      setEditTemplate(null);
      setFormData({ name: '', insurer: '', mappings: {} });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.insurer.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      if (editTemplate) {
        await templatesApi.update(editTemplate.id, formData);
        toast.success('Template updated successfully');
      } else {
        await templatesApi.create(formData);
        toast.success('Template created successfully');
      }
      setShowDialog(false);
      fetchTemplates();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      await templatesApi.delete(templateId);
      toast.success('Template deleted');
      fetchTemplates();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete template');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-['Chivo'] tracking-tight text-zinc-900" data-testid="template-manager-title">
              Template Manager
            </h1>
            <p className="text-zinc-500 mt-1">
              Manage column mapping templates for different insurers
            </p>
          </div>
          <Button 
            onClick={() => handleOpenDialog()}
            className="bg-[#0055FF] hover:bg-[#0040CC]"
            data-testid="create-template-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="spinner" />
          </div>
        ) : templates.length === 0 ? (
          <Card className="border border-zinc-200">
            <CardContent className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <FileText className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium text-zinc-600">No templates yet</p>
              <p className="text-sm mt-1 mb-4">Create your first mapping template</p>
              <Button 
                onClick={() => handleOpenDialog()}
                className="bg-[#0055FF] hover:bg-[#0040CC]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="border border-zinc-200 hover:border-zinc-300 transition-all" data-testid={`template-card-${template.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">{template.name}</CardTitle>
                      <Badge variant="outline" className="mt-2">{template.insurer}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleOpenDialog(template)}
                        data-testid={`edit-template-${template.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(template.id)}
                        data-testid={`delete-template-${template.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Mappings</span>
                      <span className="font-medium">{Object.keys(template.mappings || {}).length} fields</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Created</span>
                      <span>{formatDate(template.created_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
              <DialogDescription>
                {editTemplate ? 'Update the template details' : 'Create a new mapping template'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name *</Label>
                <Input
                  id="template-name"
                  placeholder="e.g., ICICI Lombard Standard"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  data-testid="template-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-insurer">Insurer *</Label>
                <Input
                  id="template-insurer"
                  placeholder="e.g., ICICI Lombard"
                  value={formData.insurer}
                  onChange={(e) => setFormData({ ...formData, insurer: e.target.value })}
                  data-testid="template-insurer-input"
                />
              </div>

              <div className="p-3 bg-zinc-50 rounded-lg text-sm text-zinc-600">
                <p className="font-medium mb-1">Note:</p>
                <p>Column mappings can be configured after creating the template or during case processing.</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={saving}
                className="bg-[#0055FF] hover:bg-[#0040CC]"
                data-testid="save-template-button"
              >
                {saving ? (
                  <div className="spinner w-4 h-4 border-white border-t-transparent" />
                ) : (
                  editTemplate ? 'Save Changes' : 'Create Template'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
