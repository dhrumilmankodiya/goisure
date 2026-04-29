// GMC Platform - Demo Mode Active
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/sonner";

// Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import CaseListPage from "./pages/CaseListPage";
import NewCasePage from "./pages/NewCasePage";
import CaseDetailPage from "./pages/CaseDetailPage";
import MappingReviewPage from "./pages/MappingReviewPage";
import DataCorrectionPage from "./pages/DataCorrectionPage";
import StructuredReviewPage from "./pages/StructuredReviewPage";
import AIMatchReviewPage from "./pages/AIMatchReviewPage";
import AIProcessingPage from "./pages/AIProcessingPage";
import AIInsightsPage from "./pages/AIInsightsPage";
import UnderwriterQueuePage from "./pages/UnderwriterQueuePage";
import UnderwriterReviewPage from "./pages/UnderwriterReviewPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import UserManagementPage from "./pages/UserManagementPage";
import TemplateManagerPage from "./pages/TemplateManagerPage";
import AuditTrailPage from "./pages/AuditTrailPage";
import PremiumCalculatorPage from "./pages/PremiumCalculatorPage";

import "./App.css";

// Protected Route Component
function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Public Route (redirect if authenticated)
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="spinner" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

      {/* Protected Routes - All Users */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/cases" element={<ProtectedRoute><CaseListPage /></ProtectedRoute>} />
      <Route path="/cases/new" element={<ProtectedRoute allowedRoles={['agent', 'admin']}><NewCasePage /></ProtectedRoute>} />
      <Route path="/cases/:caseId" element={<ProtectedRoute><CaseDetailPage /></ProtectedRoute>} />
      <Route path="/cases/:caseId/mapping" element={<ProtectedRoute allowedRoles={['agent', 'admin']}><MappingReviewPage /></ProtectedRoute>} />
      <Route path="/cases/:caseId/correction" element={<ProtectedRoute allowedRoles={['agent', 'admin']}><DataCorrectionPage /></ProtectedRoute>} />
      <Route path="/cases/:caseId/review" element={<ProtectedRoute allowedRoles={['agent', 'admin']}><StructuredReviewPage /></ProtectedRoute>} />
      <Route path="/cases/:caseId/processing" element={<ProtectedRoute allowedRoles={['agent', 'admin']}><AIProcessingPage /></ProtectedRoute>} />
      <Route path="/cases/:caseId/insights" element={<ProtectedRoute allowedRoles={['agent', 'admin']}><AIInsightsPage /></ProtectedRoute>} />
      <Route path="/cases/:caseId/ai-review" element={<ProtectedRoute allowedRoles={['agent', 'admin']}><AIMatchReviewPage /></ProtectedRoute>} />

      {/* Underwriter Routes */}
      <Route path="/underwriter/queue" element={<ProtectedRoute allowedRoles={['underwriter', 'admin']}><UnderwriterQueuePage /></ProtectedRoute>} />
      <Route path="/underwriter/cases/:caseId" element={<ProtectedRoute allowedRoles={['underwriter', 'admin']}><UnderwriterReviewPage /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><AdminDashboardPage /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><UserManagementPage /></ProtectedRoute>} />
      <Route path="/admin/templates" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><TemplateManagerPage /></ProtectedRoute>} />
      <Route path="/admin/audit" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><AuditTrailPage /></ProtectedRoute>} />

      {/* Calculator Route */}
      <Route path="/calculator" element={<ProtectedRoute><PremiumCalculatorPage /></ProtectedRoute>} />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="bottom-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
