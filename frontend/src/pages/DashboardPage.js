import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { dashboardApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Upload,
  Clock,
  AlertTriangle,
  XCircle,
  Send,
  CheckCircle,
  Plus,
  ArrowRight,
  Activity,
  TrendingUp,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isAgent, isUnderwriter, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecentActivity(),
      ]);
      setStats(statsRes.data);
      setActivities(activityRes.data.activities || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      label: 'Total Uploads', 
      value: stats?.total_uploads || 0, 
      icon: Upload, 
      color: 'bg-blue-50 text-blue-600',
      href: '/cases'
    },
    { 
      label: 'In Progress', 
      value: stats?.in_progress || 0, 
      icon: Clock, 
      color: 'bg-amber-50 text-amber-600',
      href: '/cases?status=in_progress'
    },
    { 
      label: 'Needs Review', 
      value: stats?.needs_review || 0, 
      icon: AlertTriangle, 
      color: 'bg-orange-50 text-orange-600',
      href: '/cases?status=needs_correction'
    },
    { 
      label: 'Failed', 
      value: stats?.failed || 0, 
      icon: XCircle, 
      color: 'bg-red-50 text-red-600',
      href: '/cases?status=failed'
    },
    { 
      label: 'Ready for UW', 
      value: stats?.ready_for_uw || 0, 
      icon: Send, 
      color: 'bg-indigo-50 text-indigo-600',
      href: isUnderwriter || isAdmin ? '/underwriter/queue' : '/cases?status=submitted'
    },
    { 
      label: 'Completed', 
      value: stats?.completed || 0, 
      icon: CheckCircle, 
      color: 'bg-emerald-50 text-emerald-600',
      href: '/cases?status=approved'
    },
  ];

  const formatAction = (action) => {
    const actionLabels = {
      'case_created': 'Created case',
      'file_uploaded': 'Uploaded file',
      'mapping_applied': 'Applied mapping',
      'data_corrected': 'Corrected data',
      'case_submitted': 'Submitted case',
      'review_started': 'Started review',
      'decision_made': 'Made decision',
      'user_login': 'Logged in',
      'user_logout': 'Logged out',
    };
    return actionLabels[action] || action;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
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

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-['Chivo'] tracking-tight text-zinc-900" data-testid="dashboard-title">
              Welcome back, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-zinc-500 mt-1">
              Here's what's happening with your cases today
            </p>
          </div>
          {(isAgent || isAdmin) && (
            <Link to="/cases/new">
              <Button className="bg-[#0055FF] hover:bg-[#0040CC]" data-testid="new-case-button">
                <Plus className="w-4 h-4 mr-2" />
                New Case
              </Button>
            </Link>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4" data-testid="stats-grid">
          {statCards.map((stat) => (
            <Link key={stat.label} to={stat.href}>
              <Card className="border border-zinc-200 hover:border-zinc-300 transition-all duration-200 hover:-translate-y-1 hover:shadow-sm cursor-pointer" data-testid={`stat-card-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardContent className="p-4">
                  <div className={`w-10 h-10 rounded-md flex items-center justify-center ${stat.color} mb-3`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold font-['Chivo'] text-zinc-900">{stat.value}</p>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="border border-zinc-200 lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold font-['Chivo']">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(isAgent || isAdmin) && (
                <>
                  <Link to="/cases/new" className="block">
                    <div className="flex items-center justify-between p-4 rounded-md border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-all" data-testid="quick-action-upload">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center">
                          <Upload className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900">Upload New Case</p>
                          <p className="text-sm text-zinc-500">Start processing a new GMC file</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-zinc-400" />
                    </div>
                  </Link>
                  <Link to="/cases?status=needs_correction" className="block">
                    <div className="flex items-center justify-between p-4 rounded-md border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-all" data-testid="quick-action-review">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-orange-50 flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900">Review Required Cases</p>
                          <p className="text-sm text-zinc-500">{stats?.needs_review || 0} cases need your attention</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-zinc-400" />
                    </div>
                  </Link>
                </>
              )}
              {(isUnderwriter || isAdmin) && (
                <Link to="/underwriter/queue" className="block">
                  <div className="flex items-center justify-between p-4 rounded-md border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-all" data-testid="quick-action-queue">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-indigo-50 flex items-center justify-center">
                        <Send className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900">Underwriting Queue</p>
                        <p className="text-sm text-zinc-500">{stats?.ready_for_uw || 0} cases waiting for review</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-zinc-400" />
                  </div>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border border-zinc-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold font-['Chivo'] flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center py-8 text-zinc-400">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.slice(0, 5).map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-[#0055FF] mt-2" />
                      <div className="flex-1 min-w-0">
                        <p className="text-zinc-900 font-medium">{formatAction(activity.action)}</p>
                        {activity.details?.case_id && (
                          <p className="text-zinc-500 text-xs truncate">{activity.details.case_id}</p>
                        )}
                      </div>
                      <span className="text-xs text-zinc-400 whitespace-nowrap">
                        {formatTime(activity.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
