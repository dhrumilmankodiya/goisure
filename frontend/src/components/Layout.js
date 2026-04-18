import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { notificationsApi } from '../lib/api';
import {
  LayoutDashboard,
  FolderOpen,
  Plus,
  Users,
  FileText,
  ClipboardList,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  Shield,
  CheckCircle,
} from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ScrollArea } from './ui/scroll-area';

export default function Layout({ children }) {
  const { user, logout, isAgent, isUnderwriter, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await notificationsApi.getAll();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch {
      // Ignore
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markRead();
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch {
      // Ignore
    }
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', roles: ['agent', 'underwriter', 'admin'] },
    { label: 'My Cases', icon: FolderOpen, href: '/cases', roles: ['agent', 'admin'] },
    { label: 'New Case', icon: Plus, href: '/cases/new', roles: ['agent', 'admin'] },
    { label: 'Review Queue', icon: ClipboardList, href: '/underwriter/queue', roles: ['underwriter', 'admin'] },
    { label: 'Admin Dashboard', icon: Shield, href: '/admin', roles: ['admin'] },
    { label: 'User Management', icon: Users, href: '/admin/users', roles: ['admin'] },
    { label: 'Templates', icon: FileText, href: '/admin/templates', roles: ['admin'] },
    { label: 'Audit Trail', icon: Settings, href: '/admin/audit', roles: ['admin'] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-zinc-200 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-zinc-200">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0055FF] rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="font-bold text-lg font-['Chivo']">GMC Platform</span>
          </Link>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-1">
            {filteredNav.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-[#0055FF] text-white' 
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-200 bg-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center">
                <span className="text-sm font-medium text-zinc-600">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">{user?.name}</p>
                <p className="text-xs text-zinc-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start gap-2"
              onClick={handleLogout}
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </ScrollArea>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 glass-header flex items-center justify-between px-4 lg:px-6">
          <button 
            className="lg:hidden p-2 -ml-2 rounded-md hover:bg-zinc-100"
            onClick={() => setSidebarOpen(true)}
            data-testid="mobile-menu-button"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" data-testid="notifications-button">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80" data-testid="notifications-dropdown">
                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-100">
                  <span className="font-semibold text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <button 
                      className="text-xs text-[#0055FF] hover:underline"
                      onClick={markAllRead}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <ScrollArea className="h-80">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
                      <Bell className="w-8 h-8 mb-2" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notification, idx) => (
                      <div 
                        key={idx}
                        className={`px-4 py-3 border-b border-zinc-50 hover:bg-zinc-50 ${!notification.read ? 'bg-blue-50/50' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <CheckCircle className={`w-5 h-5 mt-0.5 ${notification.type?.includes('approve') ? 'text-emerald-500' : notification.type?.includes('reject') ? 'text-red-500' : 'text-blue-500'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900">{notification.title}</p>
                            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{notification.message}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
