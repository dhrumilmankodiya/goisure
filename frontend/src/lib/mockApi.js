// Mock data for the GMC Platform
// Returns realistic dummy data for all screens

const MOCK_MODE = true; // Set to false when real backend is available

// Generate realistic dummy users
const mockUsers = [
  { id: '1', email: 'admin@goisure.com', name: 'Admin User', role: 'admin', created_at: '2024-01-15T10:00:00Z' },
  { id: '2', email: 'underwriter@goisure.com', name: 'John Underwriter', role: 'underwriter', created_at: '2024-02-01T10:00:00Z' },
  { id: '3', email: 'agent@goisure.com', name: 'Sarah Agent', role: 'agent', created_at: '2024-03-10T10:00:00Z' },
  { id: '4', email: 'agent2@goisure.com', name: 'Mike Agent', role: 'agent', created_at: '2024-03-15T10:00:00Z' },
];

// Generate realistic dummy cases
const generateMockCases = () => [
  {
    id: 'case-001',
    client_name: 'TechCorp Industries',
    policy_type: 'GMC',
    business_type: 'fresh',
    status: 'draft',
    created_by: '3',
    created_by_name: 'Sarah Agent',
    created_at: '2024-06-01T10:30:00Z',
    updated_at: '2024-06-01T10:30:00Z',
    notes: 'New corporate client for health insurance',
  },
  {
    id: 'case-002',
    client_name: 'Global Services Ltd',
    policy_type: 'GMC',
    business_type: 'renewal',
    status: 'uploaded',
    created_by: '3',
    created_by_name: 'Sarah Agent',
    created_at: '2024-05-28T14:20:00Z',
    updated_at: '2024-05-29T09:15:00Z',
    filename: 'employees_data.xlsx',
    record_count: 150,
  },
  {
    id: 'case-003',
    client_name: 'StartupXYZ Pvt Ltd',
    policy_type: 'GMC',
    business_type: 'fresh',
    status: 'mapping_applied',
    created_by: '4',
    created_by_name: 'Mike Agent',
    created_at: '2024-05-25T11:00:00Z',
    updated_at: '2024-05-26T16:45:00Z',
    filename: 'team.xlsx',
    record_count: 45,
    mapping: { 'Employee ID': 'employee_id', 'Name': 'employee_name', 'Age': 'age', 'Sum Insured': 'sum_insured' },
  },
  {
    id: 'case-004',
    client_name: 'MegaCorp Holdings',
    policy_type: 'GMC',
    business_type: 'fresh',
    status: 'pending_review',
    created_by: '3',
    created_by_name: 'Sarah Agent',
    created_at: '2024-05-20T09:00:00Z',
    updated_at: '2024-05-22T14:30:00Z',
    filename: 'megacorp_employees.xlsx',
    record_count: 500,
    assigned_to: '2',
    assigned_to_name: 'John Underwriter',
  },
  {
    id: 'case-005',
    client_name: 'Healthcare Plus',
    policy_type: 'GMC',
    business_type: 'renewal',
    status: 'under_review',
    created_by: '4',
    created_by_name: 'Mike Agent',
    created_at: '2024-05-18T08:00:00Z',
    updated_at: '2024-05-21T11:20:00Z',
    filename: 'renewal_2024.xlsx',
    record_count: 280,
    assigned_to: '2',
    assigned_to_name: 'John Underwriter',
  },
  {
    id: 'case-006',
    client_name: 'EduTech Solutions',
    policy_type: 'GMC',
    business_type: 'fresh',
    status: 'approved',
    created_by: '3',
    created_by_name: 'Sarah Agent',
    created_at: '2024-05-10T10:00:00Z',
    updated_at: '2024-05-15T16:00:00Z',
    filename: 'edutech_staff.xlsx',
    record_count: 85,
    premium: 425000,
    assigned_to: '2',
    assigned_to_name: 'John Underwriter',
  },
  {
    id: 'case-007',
    client_name: 'FinanceFirst Ltd',
    policy_type: 'GMC',
    business_type: 'fresh',
    status: 'rejected',
    created_by: '4',
    created_by_name: 'Mike Agent',
    created_at: '2024-05-05T12:00:00Z',
    updated_at: '2024-05-08T14:00:00Z',
    rejection_reason: 'High risk profile - claim ratio exceeds threshold',
  },
  {
    id: 'case-008',
    client_name: 'Retail Giants',
    policy_type: 'GMC',
    business_type: 'fresh',
    status: 'draft',
    created_by: '3',
    created_by_name: 'Sarah Agent',
    created_at: '2024-06-02T15:00:00Z',
    updated_at: '2024-06-02T15:00:00Z',
    notes: 'Waiting for employee data from HR',
  },
];

// Mock employee data for case details
const generateEmployeeData = (count = 20) => {
  const relationships = ['Self', 'Spouse', 'Child', 'Parent'];
  const genders = ['Male', 'Female'];
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'];
  
  return Array.from({ length: count }, (_, i) => ({
    employee_id: `EMP${String(1000 + i).padStart(4, '0')}`,
    employee_name: [
      'Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Reddy', 'Vikram Singh',
      'Anjali Desai', 'Raj Malhotra', 'Kavita Nair', 'Sanjay Gupta', 'Meera Shah',
      'Deepak Joshi', 'Rita Mathew', 'Arun Khanna', 'Sunita Rao', 'Gopalakrishnan',
      'Lakshmi Venkat', 'Ramesh Babu', 'Divya Subramanian', 'Krishnan Iyer', 'Padma Hari'
    ][i % 20],
    age: 25 + (i % 35),
    gender: genders[i % 2],
    relationship: relationships[i % 4],
    sum_insured: [100000, 200000, 300000, 500000, 750000, 1000000][i % 6],
    premium: Math.round([100000, 200000, 300000, 500000, 750000, 1000000][i % 6] * 0.012),
    city: cities[i % 8],
    department: ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'][i % 6],
  }));
};

// Mock templates
const mockTemplates = [
  { id: 'tpl-001', name: 'Standard Corporate GMC', description: 'Default template for corporate health insurance', fields: ['employee_id', 'name', 'age', 'sum_insured'], created_at: '2024-01-01T00:00:00Z' },
  { id: 'tpl-002', name: 'Family Floater', description: 'Template for family floater policies', fields: ['employee_id', 'family_members', 'sum_insured'], created_at: '2024-02-15T00:00:00Z' },
  { id: 'tpl-003', name: 'Top-up Plan', description: 'High coverage top-up insurance', fields: ['employee_id', 'base_cover', 'top_up_cover'], created_at: '2024-03-20T00:00:00Z' },
];

// Mock audit logs
const generateAuditLogs = () => [
  { id: 'log-001', action: 'case_created', user: 'Sarah Agent', case_id: 'case-001', details: 'Created new case for TechCorp Industries', timestamp: '2024-06-01T10:30:00Z' },
  { id: 'log-002', action: 'file_uploaded', user: 'Sarah Agent', case_id: 'case-002', details: 'Uploaded employees_data.xlsx (150 records)', timestamp: '2024-05-29T09:15:00Z' },
  { id: 'log-003', action: 'mapping_applied', user: 'Mike Agent', case_id: 'case-003', details: 'Applied column mapping', timestamp: '2024-05-26T16:45:00Z' },
  { id: 'log-004', action: 'submitted_for_review', user: 'Sarah Agent', case_id: 'case-004', details: 'Submitted to underwriter', timestamp: '2024-05-22T14:30:00Z' },
  { id: 'log-005', action: 'review_started', user: 'John Underwriter', case_id: 'case-005', details: 'Started review process', timestamp: '2024-05-21T11:20:00Z' },
  { id: 'log-006', action: 'case_approved', user: 'John Underwriter', case_id: 'case-006', details: 'Approved with premium: ₹425,000', timestamp: '2024-05-15T16:00:00Z' },
  { id: 'log-007', action: 'case_rejected', user: 'John Underwriter', case_id: 'case-007', details: 'Rejected - High risk profile', timestamp: '2024-05-08T14:00:00Z' },
];

// Mock notifications
const mockNotifications = [
  { id: 'notif-001', type: 'case_update', message: 'Case #case-004 has been submitted for review', read: false, created_at: '2024-06-02T09:00:00Z' },
  { id: 'notif-002', type: 'approval', message: 'Your case for Healthcare Plus has been approved', read: false, created_at: '2024-05-15T16:00:00Z' },
  { id: 'notif-003', type: 'review', message: 'New case assigned to you: MegaCorp Holdings', read: true, created_at: '2024-05-22T14:30:00Z' },
];

// Utility to simulate network delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// ============ Mock API Implementations ============

export const mockApi = {
  // Auth
  auth: {
    me: async () => {
      await delay();
      return { id: '1', email: 'admin@goisure.com', name: 'Admin User', role: 'admin' };
    },
    login: async (email, password) => {
      await delay();
      if (email && password) {
        const user = mockUsers.find(u => u.email === email) || mockUsers[0];
        return { ...user, access_token: 'mock-jwt-token-12345' };
      }
      throw new Error('Invalid credentials');
    },
    register: async (data) => {
      await delay();
      const newUser = {
        id: String(mockUsers.length + 1),
        email: data.email,
        name: data.name,
        role: data.role || 'agent',
        created_at: new Date().toISOString(),
      };
      return { ...newUser, access_token: 'mock-jwt-token-12345' };
    },
    logout: async () => {
      await delay();
      return { message: 'Logged out successfully' };
    },
  },

  // Cases
  cases: {
    getAll: async (params = {}) => {
      await delay();
      let cases = generateMockCases();
      if (params.status) {
        cases = cases.filter(c => c.status === params.status);
      }
      return { cases, total: cases.length };
    },
    getById: async (caseId) => {
      await delay();
      const cases = generateMockCases();
      const caseData = cases.find(c => c.id === caseId) || cases[0];
      return {
        ...caseData,
        employees: generateEmployeeData(caseData.record_count || 20),
      };
    },
    create: async (data) => {
      await delay();
      const newCase = {
        id: `case-${String(Date.now()).slice(-3)}`,
        ...data,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return newCase;
    },
    update: async (caseId, data) => {
      await delay();
      return { message: 'Case updated', case_id: caseId };
    },
    delete: async (caseId) => {
      await delay();
      return { message: 'Case deleted' };
    },
    upload: async (caseId, file) => {
      await delay(500);
      return {
        case_id: caseId,
        filename: file?.name || 'employees.xlsx',
        columns: ['Employee ID', 'Name', 'Age', 'Gender', 'Sum Insured', 'City', 'Department'],
        record_count: 50,
        status: 'uploaded',
      };
    },
    applyMapping: async (caseId, mapping) => {
      await delay();
      return { case_id: caseId, mapped_count: 50, status: 'mapping_applied' };
    },
    correctData: async (caseId, corrections) => {
      await delay();
      return { case_id: caseId, corrected: corrections.length };
    },
    submit: async (caseId) => {
      await delay();
      return { case_id: caseId, status: 'pending_review' };
    },
    startReview: async (caseId) => {
      await delay();
      return { case_id: caseId, status: 'under_review', assigned_to: '2' };
    },
    makeDecision: async (caseId, decision) => {
      await delay();
      return { case_id: caseId, status: decision.decision, notes: decision.notes };
    },
  },

  // Dashboard
  dashboard: {
    getStats: async () => {
      await delay();
      return {
        total_cases: 8,
        pending_review: 2,
        approved: 1,
        rejected: 1,
        draft: 2,
        total_premium: 425000,
        this_month_cases: 5,
        this_month_premium: 125000,
      };
    },
    getRecentActivity: async () => {
      await delay();
      return {
        activities: [
          { id: '1', action: 'Case created', case: 'TechCorp Industries', user: 'Sarah Agent', time: '2 hours ago' },
          { id: '2', action: 'File uploaded', case: 'Global Services Ltd', user: 'Sarah Agent', time: '3 days ago' },
          { id: '3', action: 'Submitted for review', case: 'MegaCorp Holdings', user: 'Sarah Agent', time: '5 days ago' },
          { id: '4', action: 'Case approved', case: 'EduTech Solutions', user: 'John Underwriter', time: '1 week ago' },
        ],
      };
    },
  },

  // Underwriter
  underwriter: {
    getQueue: async (params = {}) => {
      await delay();
      const cases = generateMockCases().filter(c => ['pending_review', 'under_review'].includes(c.status));
      return { cases, total: cases.length };
    },
  },

  // Admin
  admin: {
    getStats: async () => {
      await delay();
      return {
        total_users: 4,
        active_users: 3,
        total_cases: 8,
        total_premium: 425000,
        agents: 2,
        underwriters: 1,
        admins: 1,
      };
    },
    getUsers: async (params = {}) => {
      await delay();
      return { users: mockUsers, total: mockUsers.length };
    },
    updateUser: async (userId, data) => {
      await delay();
      return { message: 'User updated', user_id: userId };
    },
  },

  // Templates
  templates: {
    getAll: async () => {
      await delay();
      return { templates: mockTemplates, total: mockTemplates.length };
    },
    getById: async (templateId) => {
      await delay();
      return mockTemplates.find(t => t.id === templateId) || mockTemplates[0];
    },
    create: async (data) => {
      await delay();
      return { id: `tpl-${Date.now()}`, ...data, created_at: new Date().toISOString() };
    },
    update: async (templateId, data) => {
      await delay();
      return { message: 'Template updated', template_id: templateId };
    },
    delete: async (templateId) => {
      await delay();
      return { message: 'Template deleted' };
    },
  },

  // Notifications
  notifications: {
    getAll: async (unreadOnly = false) => {
      await delay();
      let notifs = mockNotifications;
      if (unreadOnly) {
        notifs = notifs.filter(n => !n.read);
      }
      return { notifications: notifs, total: notifs.length, unread_count: notifs.filter(n => !n.read).length };
    },
    markRead: async (ids) => {
      await delay();
      return { message: 'Notifications marked as read' };
    },
  },

  // Audit
  audit: {
    getLogs: async (params = {}) => {
      await delay();
      return { logs: generateAuditLogs(), total: 7 };
    },
  },

  // Calculator
  calculator: {
    calculate: async (data) => {
      await delay(500);
      const basePremium = data.sum_insured * 0.012;
      const ageFactor = data.age > 45 ? 1.5 : data.age > 35 ? 1.2 : 1.0;
      const familyFactor = data.family_size > 3 ? 2.5 : data.family_size > 1 ? 1.8 : 1.0;
      const premium = Math.round(basePremium * ageFactor * familyFactor);
      return {
        premium,
        base_premium: basePremium,
        age_factor: ageFactor,
        family_factor: familyFactor,
        tax: Math.round(premium * 0.18),
        total: premium + Math.round(premium * 0.18),
      };
    },
  },

  // Health check
  health: async () => {
    await delay(100);
    return { status: 'healthy', service: 'gmc-platform-mock', db: 'mock' };
  },
};

// Export check for mock mode
export const isMockMode = () => MOCK_MODE;
export default mockApi;