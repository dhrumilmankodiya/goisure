import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { adminApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import {
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  TrendingUp,
  Shield,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await adminApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
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

  const caseStats = stats?.cases || {};
  const userStats = stats?.users || {};
  const aiStats = stats?.ai || {};

  const completionRate = caseStats.total > 0 
    ? Math.round((caseStats.approved / caseStats.total) * 100) 
    : 0;

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Chivo'] tracking-tight text-zinc-900" data-testid="admin-dashboard-title">
            Admin Dashboard
          </h1>
          <p className="text-zinc-500 mt-1">
            System overview and performance metrics
          </p>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-['Chivo']">{userStats.total || 0}</p>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-emerald-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-['Chivo']">{userStats.agents || 0}</p>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">Agents</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-purple-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-['Chivo']">{userStats.underwriters || 0}</p>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">Underwriters</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-amber-50 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-['Chivo']">{userStats.admins || 0}</p>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Case Statistics */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border border-zinc-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold font-['Chivo']">Case Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600">Total Cases</span>
                <span className="font-bold text-xl">{caseStats.total || 0}</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-zinc-400" />
                    <span className="text-sm">Draft</span>
                  </div>
                  <span className="font-medium">{caseStats.draft || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm">In Progress</span>
                  </div>
                  <span className="font-medium">
                    {(caseStats.mapping_review || 0) + (caseStats.data_correction || 0) + (caseStats.review || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500" />
                    <span className="text-sm">Submitted</span>
                  </div>
                  <span className="font-medium">{caseStats.submitted || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-500" />
                    <span className="text-sm">Under Review</span>
                  </div>
                  <span className="font-medium">{caseStats.under_review || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-sm">Approved</span>
                  </div>
                  <span className="font-medium">{caseStats.approved || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm">Rejected</span>
                  </div>
                  <span className="font-medium">{caseStats.rejected || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-sm">Needs Correction</span>
                  </div>
                  <span className="font-medium">{caseStats.needs_correction || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold font-['Chivo']">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Completion Rate */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium">Completion Rate</span>
                  </div>
                  <span className="font-bold text-emerald-600">{completionRate}%</span>
                </div>
                <Progress value={completionRate} className="h-2" />
              </div>

              {/* AI Confidence */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#0055FF]" />
                    <span className="text-sm font-medium">Avg AI Confidence</span>
                  </div>
                  <span className="font-bold text-[#0055FF]">{aiStats.avg_confidence || 0}%</span>
                </div>
                <Progress value={aiStats.avg_confidence || 0} className="h-2" />
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
                <div className="text-center">
                  <p className="text-2xl font-bold font-['Chivo'] text-emerald-600">{caseStats.approved || 0}</p>
                  <p className="text-xs text-zinc-500">Approved</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold font-['Chivo'] text-red-600">{caseStats.rejected || 0}</p>
                  <p className="text-xs text-zinc-500">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold font-['Chivo']">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              <a href="/admin/users" className="p-4 border border-zinc-200 rounded-lg hover:border-zinc-300 hover:bg-zinc-50 transition-all">
                <Users className="w-8 h-8 text-blue-600 mb-2" />
                <p className="font-medium">Manage Users</p>
                <p className="text-sm text-zinc-500">View and edit user accounts</p>
              </a>
              <a href="/admin/templates" className="p-4 border border-zinc-200 rounded-lg hover:border-zinc-300 hover:bg-zinc-50 transition-all">
                <FileText className="w-8 h-8 text-purple-600 mb-2" />
                <p className="font-medium">Templates</p>
                <p className="text-sm text-zinc-500">Manage mapping templates</p>
              </a>
              <a href="/admin/audit" className="p-4 border border-zinc-200 rounded-lg hover:border-zinc-300 hover:bg-zinc-50 transition-all">
                <Clock className="w-8 h-8 text-amber-600 mb-2" />
                <p className="font-medium">Audit Trail</p>
                <p className="text-sm text-zinc-500">View system activity logs</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
