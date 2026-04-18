import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Optionally redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Cases API
export const casesApi = {
  getAll: (params) => api.get('/cases', { params }),
  getById: (caseId) => api.get(`/cases/${caseId}`),
  create: (data) => api.post('/cases', data),
  update: (caseId, data) => api.put(`/cases/${caseId}`, data),
  delete: (caseId) => api.delete(`/cases/${caseId}`),
  upload: (caseId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/cases/${caseId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  applyMapping: (caseId, overrides) => api.post(`/cases/${caseId}/apply-mapping`, overrides),
  correctData: (caseId, data) => api.post(`/cases/${caseId}/correct`, data),
  submit: (caseId) => api.post(`/cases/${caseId}/submit`),
  startReview: (caseId) => api.post(`/cases/${caseId}/review`),
  makeDecision: (caseId, decision) => api.post(`/cases/${caseId}/decision`, decision),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivity: () => api.get('/dashboard/recent-activity'),
};

// Underwriter API
export const underwriterApi = {
  getQueue: (params) => api.get('/underwriter/queue', { params }),
};

// Admin API
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
};

// Templates API
export const templatesApi = {
  getAll: () => api.get('/templates'),
  getById: (templateId) => api.get(`/templates/${templateId}`),
  create: (data) => api.post('/templates', data),
  update: (templateId, data) => api.put(`/templates/${templateId}`, data),
  delete: (templateId) => api.delete(`/templates/${templateId}`),
};

// Notifications API
export const notificationsApi = {
  getAll: (unreadOnly = false) => api.get('/notifications', { params: { unread_only: unreadOnly } }),
  markRead: (ids) => api.post('/notifications/mark-read', { notification_ids: ids }),
};

// Audit Logs API
export const auditApi = {
  getLogs: (params) => api.get('/audit-logs', { params }),
};

export default api;