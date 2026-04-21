import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { mockApi, isMockMode } from '../lib/mockApi';

const AuthContext = createContext(null);

const API_URL = ''; // Always empty for mock mode

axios.defaults.withCredentials = true;

function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      let data;
      if (isMockMode()) {
        data = await mockApi.auth.me();
      } else {
        const response = await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true });
        data = response.data;
      }
      setUser(data);
    } catch {
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    try {
      let data;
      if (isMockMode()) {
        data = await mockApi.auth.login(email, password);
      } else {
        const response = await axios.post(
          `${API_URL}/api/auth/login`,
          { email, password },
          { withCredentials: true }
        );
        data = response.data;
      }
      setUser(data);
      return { success: true, data };
    } catch (e) {
      return {
        success: false,
        error: formatApiErrorDetail(e.response?.data?.detail) || e.message
      };
    }
  };

  const register = async (email, password, name, role = 'agent') => {
    try {
      let data;
      if (isMockMode()) {
        data = await mockApi.auth.register({ email, password, name, role });
      } else {
        const response = await axios.post(
          `${API_URL}/api/auth/register`,
          { email, password, name, role },
          { withCredentials: true }
        );
        data = response.data;
      }
      setUser(data);
      return { success: true, data };
    } catch (e) {
      return {
        success: false,
        error: formatApiErrorDetail(e.response?.data?.detail) || e.message
      };
    }
  };

  const logout = async () => {
    try {
      if (!isMockMode()) {
        await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
      }
    } catch {
      // Ignore errors
    } finally {
      setUser(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      if (isMockMode()) {
        return { success: true, data: { message: 'Reset link sent to email' } };
      }
      const { data } = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      return { success: true, data };
    } catch (e) {
      return {
        success: false,
        error: formatApiErrorDetail(e.response?.data?.detail) || e.message
      };
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      if (isMockMode()) {
        return { success: true, data: { message: 'Password reset successfully' } };
      }
      const { data } = await axios.post(`${API_URL}/api/auth/reset-password`, {
        token,
        new_password: newPassword
      });
      return { success: true, data };
    } catch (e) {
      return {
        success: false,
        error: formatApiErrorDetail(e.response?.data?.detail) || e.message
      };
    }
  };

  // Role-based checks
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isUnderwriter = user?.role === 'underwriter';
  const isAgent = user?.role === 'agent';
  const canCreateCase = isAgent || isAdmin;
  const canReview = isUnderwriter || isAdmin;
  const canManageUsers = isAdmin;
  const canViewAnalytics = isAdmin || isSuperAdmin;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      forgotPassword,
      resetPassword,
      checkAuth,
      isAuthenticated: user !== null && user !== false,
      isSuperAdmin,
      isAdmin,
      isUnderwriter,
      isAgent,
      canCreateCase,
      canReview,
      canManageUsers,
      canViewAnalytics,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}