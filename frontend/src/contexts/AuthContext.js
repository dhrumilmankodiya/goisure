import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Configure axios defaults - use cookies for auth
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
  const [user, setUser] = useState(null); // null = checking, false = not authenticated
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true });
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
      const { data } = await axios.post(
        `${API_URL}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );
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
      const { data } = await axios.post(
        `${API_URL}/api/auth/register`,
        { email, password, name, role },
        { withCredentials: true }
      );
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
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch {
      // Ignore errors
    } finally {
      setUser(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
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
      isAgent: user?.role === 'agent',
      isUnderwriter: user?.role === 'underwriter',
      isAdmin: user?.role === 'admin'
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