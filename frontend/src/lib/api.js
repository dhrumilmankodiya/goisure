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
    if (isMockMode()) return { data: await mockApi.cases.getAll(params) };
    return api.get('/cases', { params });
  },
  getById: async (caseId) => {
    if (isMockMode()) return { data: await mockApi.cases.getById(caseId) };
    return api.get(`/cases/${caseId}`);
  },
  create: async (data) => {
    if (isMockMode()) return { data: await mockApi.cases.create(data) };
    return api.post('/cases', data);
  },
  update: async (caseId, data) => {
    if (isMockMode()) return { data: await mockApi.cases.update(caseId, data) };
    return api.put(`/cases/${caseId}`, data);
  },
  delete: async (caseId) => {
    if (isMockMode()) return { data: await mockApi.cases.delete(caseId) };
    return api.delete(`/cases/${caseId}`);
  },
  upload: async (caseId, file) => {
    if (isMockMode()) return { data: await mockApi.cases.upload(caseId, file) };
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/cases/${caseId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadClaims: async (caseId, file) => {
    if (isMockMode()) return { data: await mockApi.cases.uploadClaims(caseId, file) };
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/cases/${caseId}/upload-claims`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  applyMapping: async (caseId, mapping) => {
    if (isMockMode()) return { data: await mockApi.cases.applyMapping(caseId, mapping) };
    return api.post(`/cases/${caseId}/apply-mapping`, { mapping });
  },
  correctData: async (caseId, data) => {
    if (isMockMode()) return { data: await mockApi.cases.correctData(caseId, data) };
    return api.post(`/cases/${caseId}/correct`, data);
  },
  submit: async (caseId) => {
    if (isMockMode()) return { data: await mockApi.cases.submit(caseId) };
    return api.post(`/cases/${caseId}/submit`);
  },
  startReview: async (caseId) => {
    if (isMockMode()) return { data: await mockApi.cases.startReview(caseId) };
    return api.post(`/cases/${caseId}/review`);
  },
  makeDecision: async (caseId, decision) => {
    if (isMockMode()) return { data: await mockApi.cases.makeDecision(caseId, decision) };
    return api.post(`/cases/${caseId}/decision`, decision);
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async () => {
    if (isMockMode()) return { data: await mockApi.dashboard.getStats() };
    return api.get('/dashboard/stats');
  },
  getRecentActivity: async () => {
    if (isMockMode()) return { data: await mockApi.dashboard.getRecentActivity() };
    return api.get('/dashboard/recent-activity');
  },
};

// Underwriter API
export const underwriterApi = {
  getQueue: async (params) => {
    if (isMockMode()) return { data: await mockApi.underwriter.getQueue(params) };
    return api.get('/underwriter/queue', { params });
  },
};

// Admin API
export const adminApi = {
  getStats: async () => {
    if (isMockMode()) return { data: await mockApi.admin.getStats() };
    return api.get('/admin/stats');
  },
  getUsers: async (params) => {
    if (isMockMode()) return { data: await mockApi.admin.getUsers(params) };
    return api.get('/admin/users', { params });
  },
  createUser: async (data) => {
    if (isMockMode()) return { data: await mockApi.admin.createUser(data) };
    return api.post('/admin/users', data);
  },
  updateUser: async (userId, data) => {
    if (isMockMode()) return { data: await mockApi.admin.updateUser(userId, data) };
    return api.put(`/admin/users/${userId}`, data);
  },
  deleteUser: async (userId) => {
    if (isMockMode()) return { data: await mockApi.admin.deleteUser(userId) };
    return api.delete(`/admin/users/${userId}`);
  },
};

// Templates API
export const templatesApi = {
  getAll: async () => {
    if (isMockMode()) return { data: await mockApi.templates.getAll() };
    return api.get('/templates');
  },
  getById: async (templateId) => {
    if (isMockMode()) return { data: await mockApi.templates.getById(templateId) };
    return api.get(`/templates/${templateId}`);
  },
  create: async (data) => {
    if (isMockMode()) return { data: await mockApi.templates.create(data) };
    return api.post('/templates', data);
  },
  update: async (templateId, data) => {
    if (isMockMode()) return { data: await mockApi.templates.update(templateId, data) };
    return api.put(`/templates/${templateId}`, data);
  },
  delete: async (templateId) => {
    if (isMockMode()) return { data: await mockApi.templates.delete(templateId) };
    return api.delete(`/templates/${templateId}`);
  },
};

// Notifications API
export const notificationsApi = {
  getAll: async (unreadOnly = false) => {
    if (isMockMode()) return { data: await mockApi.notifications.getAll(unreadOnly) };
    return api.get('/notifications', { params: { unread_only: unreadOnly } });
  },
  markRead: async (ids) => {
    if (isMockMode()) return { data: await mockApi.notifications.markRead(ids) };
    return api.post('/notifications/mark-read', { notification_ids: ids });
  },
};

// Audit Logs API
export const auditApi = {
  getLogs: async (params) => {
    if (isMockMode()) return { data: await mockApi.audit.getLogs(params) };
    return api.get('/audit-logs', { params });
  },
};

// Calculator API
export const calculatorApi = {
  calculate: async (data) => {
    if (isMockMode()) return { data: await mockApi.calculator.calculate(data) };
    return api.post('/calculator/calculate', data);
  },
};

// AI Matching API (Gemma 4 powered)
export const matchingApi = {
  runMatch: async (caseId) => {
    if (isMockMode()) return { data: await mockApi.matching.runMatch(caseId) };
    return api.post(`/cases/${caseId}/match-ai`);
  },
  getResults: async (caseId) => {
    if (isMockMode()) return { data: await mockApi.matching.getResults(caseId) };
    return api.get(`/cases/${caseId}/match-results`);
  },
  overrideMatch: async (caseId, data) => {
    if (isMockMode()) return { data: await mockApi.matching.overrideMatch(caseId, data) };
    return api.post(`/cases/${caseId}/match-override`, data);
  },
  exportMatched: async (caseId) => {
    if (isMockMode()) return { data: await mockApi.matching.exportMatched(caseId) };
    return api.get(`/cases/${caseId}/export-matched`, { responseType: 'blob' });
  },
  getAnalytics: async (caseId) => {
    if (isMockMode()) return { data: await mockApi.matching.getAnalytics(caseId) };
    return api.get(`/cases/${caseId}/analytics`);
  },
  flagField: async (caseId, data) => {
    if (isMockMode()) return { data: await mockApi.matching.flagField(caseId, data) };
    return api.post(`/cases/${caseId}/flag-field`, data);
  },
  reuploadErrors: async (caseId, data) => {
    if (isMockMode()) return { data: await mockApi.matching.reuploadErrors(caseId, data) };
    return api.post(`/cases/${caseId}/reupload-errors`, data);
  },
  submitToUnderwriter: async (caseId, data) => {
    if (isMockMode()) return { data: await mockApi.matching.submitToUnderwriter(caseId, data) };
    return api.post(`/cases/${caseId}/submit-underwriter`, data);
  },
};

export default api;