import axios from 'axios';
import { mockApi, isMockMode } from './mockApi';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

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
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Cases API
export const casesApi = {
  getAll: async (params) => {
    if (isMockMode()) return mockApi.cases.getAll(params);
    return api.get('/cases', { params });
  },
  getById: async (caseId) => {
    if (isMockMode()) return mockApi.cases.getById(caseId);
    return api.get(`/cases/${caseId}`);
  },
  create: async (data) => {
    if (isMockMode()) return mockApi.cases.create(data);
    return api.post('/cases', data);
  },
  update: async (caseId, data) => {
    if (isMockMode()) return mockApi.cases.update(caseId, data);
    return api.put(`/cases/${caseId}`, data);
  },
  delete: async (caseId) => {
    if (isMockMode()) return mockApi.cases.delete(caseId);
    return api.delete(`/cases/${caseId}`);
  },
  upload: async (caseId, file) => {
    if (isMockMode()) return mockApi.cases.upload(caseId, file);
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/cases/${caseId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  applyMapping: async (caseId, overrides) => {
    if (isMockMode()) return mockApi.cases.applyMapping(caseId, overrides);
    return api.post(`/cases/${caseId}/apply-mapping`, overrides);
  },
  correctData: async (caseId, data) => {
    if (isMockMode()) return mockApi.cases.correctData(caseId, data);
    return api.post(`/cases/${caseId}/correct`, data);
  },
  submit: async (caseId) => {
    if (isMockMode()) return mockApi.cases.submit(caseId);
    return api.post(`/cases/${caseId}/submit`);
  },
  startReview: async (caseId) => {
    if (isMockMode()) return mockApi.cases.startReview(caseId);
    return api.post(`/cases/${caseId}/review`);
  },
  makeDecision: async (caseId, decision) => {
    if (isMockMode()) return mockApi.cases.makeDecision(caseId, decision);
    return api.post(`/cases/${caseId}/decision`, decision);
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async () => {
    if (isMockMode()) return { data: mockApi.dashboard.getStats() };
    return api.get('/dashboard/stats');
  },
  getRecentActivity: async () => {
    if (isMockMode()) return { data: mockApi.dashboard.getRecentActivity() };
    return api.get('/dashboard/recent-activity');
  },
};

// Underwriter API
export const underwriterApi = {
  getQueue: async (params) => {
    if (isMockMode()) return { data: mockApi.underwriter.getQueue(params) };
    return api.get('/underwriter/queue', { params });
  },
};

// Admin API
export const adminApi = {
  getStats: async () => {
    if (isMockMode()) return { data: mockApi.admin.getStats() };
    return api.get('/admin/stats');
  },
  getUsers: async (params) => {
    if (isMockMode()) return { data: mockApi.admin.getUsers(params) };
    return api.get('/admin/users', { params });
  },
  updateUser: async (userId, data) => {
    if (isMockMode()) return mockApi.admin.updateUser(userId, data);
    return api.put(`/admin/users/${userId}`, data);
  },
};

// Templates API
export const templatesApi = {
  getAll: async () => {
    if (isMockMode()) return { data: mockApi.templates.getAll() };
    return api.get('/templates');
  },
  getById: async (templateId) => {
    if (isMockMode()) return { data: mockApi.templates.getById(templateId) };
    return api.get(`/templates/${templateId}`);
  },
  create: async (data) => {
    if (isMockMode()) return { data: mockApi.templates.create(data) };
    return api.post('/templates', data);
  },
  update: async (templateId, data) => {
    if (isMockMode()) return { data: mockApi.templates.update(templateId, data) };
    return api.put(`/templates/${templateId}`, data);
  },
  delete: async (templateId) => {
    if (isMockMode()) return { data: mockApi.templates.delete(templateId) };
    return api.delete(`/templates/${templateId}`);
  },
};

// Notifications API
export const notificationsApi = {
  getAll: async (unreadOnly = false) => {
    if (isMockMode()) return { data: mockApi.notifications.getAll(unreadOnly) };
    return api.get('/notifications', { params: { unread_only: unreadOnly } });
  },
  markRead: async (ids) => {
    if (isMockMode()) return { data: mockApi.notifications.markRead(ids) };
    return api.post('/notifications/mark-read', { notification_ids: ids });
  },
};

// Audit Logs API
export const auditApi = {
  getLogs: async (params) => {
    if (isMockMode()) return { data: mockApi.audit.getLogs(params) };
    return api.get('/audit-logs', { params });
  },
};

// Calculator API
export const calculatorApi = {
  calculate: async (data) => {
    if (isMockMode()) return { data: await mockApi.calculator.calculate(data) };
    return api.post('/calculator/calculate', data);
  },
  calculateFactor: async (params) => {
    if (isMockMode()) return { data: await mockApi.calculator.calculate(params) };
    return api.post('/calculator/factor', null, { params });
  },
};

export default api;