// Mock data for the GMC Platform - Demo Mode
// Returns realistic dummy data for all screens
// Uses in-memory storage for new cases (no backend needed)

const MOCK_MODE = process.env.REACT_APP_MOCK_MODE !== 'false';

// ============ In-Memory Storage ============
let mockCasesStore = [];
let mockUsersStore = [];
let mockSessionsStore = {};

// Initialize with hardcoded test data
const initializeMockData = () => {
  // Hardcoded test users - Super Admin, Underwriters, Agents
  mockUsersStore = [
    { id: 'super-admin', email: 'superadmin@goisure.com', name: 'Super Admin', role: 'superadmin', password: 'admin123', created_at: '2024-01-01T00:00:00Z', is_active: true },
    { id: 'admin-001', email: 'admin@goisure.com', name: 'Admin User', role: 'admin', password: 'admin123', created_at: '2024-01-15T10:00:00Z', is_active: true },
    { id: 'uw-001', email: 'underwriter@goisure.com', name: 'John Underwriter', role: 'underwriter', password: 'agent123', created_at: '2024-02-01T10:00:00Z', is_active: true },
    { id: 'uw-002', email: 'underwriter2@goisure.com', name: 'Priya Sharma', role: 'underwriter', password: 'agent123', created_at: '2024-02-15T10:00:00Z', is_active: true },
    { id: 'agent-001', email: 'agent@goisure.com', name: 'Sarah Agent', role: 'agent', password: 'agent123', created_at: '2024-03-10T10:00:00Z', is_active: true },
    { id: 'agent-002', email: 'agent2@goisure.com', name: 'Mike Agent', role: 'agent', password: 'agent123', created_at: '2024-03-15T10:00:00Z', is_active: true },
    { id: 'agent-003', email: 'agent3@goisure.com', name: 'Emma Wilson', role: 'agent', password: 'agent123', created_at: '2024-04-01T10:00:00Z', is_active: true },
    { id: 'agent-004', email: 'agent4@goisure.com', name: 'Raj Patel', role: 'agent', password: 'agent123', created_at: '2024-04-10T10:00:00Z', is_active: true },
  ];

  // Hardcoded test cases covering all scenarios
  mockCasesStore = [
    // Draft cases (created by agents, not yet submitted)
    {
      id: 'case-1001',
      client_name: 'TechCorp Industries',
      policy_type: 'GMC',
      business_type: 'fresh',
      status: 'draft',
      created_by: 'agent-001',
      created_by_name: 'Sarah Agent',
      created_at: '2024-06-01T10:30:00Z',
      updated_at: '2024-06-01T10:30:00Z',
      notes: 'New corporate client, waiting for employee data',
    },
    {
      id: 'case-1002',
      client_name: 'StartupXYZ Pvt Ltd',
      policy_type: 'GMC',
      business_type: 'fresh',
      status: 'draft',
      created_by: 'agent-002',
      created_by_name: 'Mike Agent',
      created_at: '2024-06-02T14:20:00Z',
      updated_at: '2024-06-02T14:20:00Z',
      notes: 'New startup, 25 employees',
    },
    // Uploaded cases (file uploaded, awaiting mapping)
    {
      id: 'case-2001',
      client_name: 'Global Services Ltd',
      policy_type: 'GMC',
      business_type: 'renewal',
      status: 'uploaded',
      created_by: 'agent-001',
      created_by_name: 'Sarah Agent',
      created_at: '2024-05-28T14:20:00Z',
      updated_at: '2024-05-29T09:15:00Z',
      filename: 'employees_data.xlsx',
      record_count: 150,
    },
    {
      id: 'case-2002',
      client_name: 'Retail Giants Corp',
      policy_type: 'GMC',
      business_type: 'fresh',
      status: 'uploaded',
      created_by: 'agent-003',
      created_by_name: 'Emma Wilson',
      created_at: '2024-05-30T11:00:00Z',
      updated_at: '2024-05-30T16:45:00Z',
      filename: 'retail_staff.xlsx',
      record_count: 75,
    },
    // Mapping applied (ready for review)
    {
      id: 'case-3001',
      client_name: 'MegaCorp Holdings',
      policy_type: 'GMC',
      business_type: 'fresh',
      status: 'mapping_applied',
      created_by: 'agent-001',
      created_by_name: 'Sarah Agent',
      created_at: '2024-05-25T11:00:00Z',
      updated_at: '2024-05-26T16:45:00Z',
      filename: 'megacorp_employees.xlsx',
      record_count: 500,
      mapping: { 'Employee ID': 'employee_id', 'Name': 'employee_name', 'Age': 'age', 'Sum Insured': 'sum_insured' },
    },
    // Pending review (submitted to underwriter)
    {
      id: 'case-4001',
      client_name: 'Healthcare Plus',
      policy_type: 'GMC',
      business_type: 'renewal',
      status: 'pending_review',
      created_by: 'agent-002',
      created_by_name: 'Mike Agent',
      created_at: '2024-05-20T09:00:00Z',
      updated_at: '2024-05-22T14:30:00Z',
      filename: 'renewal_2024.xlsx',
      record_count: 280,
      assigned_to: 'uw-001',
      assigned_to_name: 'John Underwriter',
    },
    {
      id: 'case-4002',
      client_name: 'EduTech Solutions',
      policy_type: 'GMC',
      business_type: 'fresh',
      status: 'pending_review',
      created_by: 'agent-003',
      created_by_name: 'Emma Wilson',
      created_at: '2024-05-21T10:00:00Z',
      updated_at: '2024-05-23T09:00:00Z',
      filename: 'edutech_team.xlsx',
      record_count: 120,
      assigned_to: 'uw-002',
      assigned_to_name: 'Priya Sharma',
    },
    // Under review (underwriter is reviewing)
    {
      id: 'case-5001',
      client_name: 'FinanceFirst Ltd',
      policy_type: 'GMC',
      business_type: 'fresh',
      status: 'under_review',
      created_by: 'agent-001',
      created_by_name: 'Sarah Agent',
      created_at: '2024-05-18T08:00:00Z',
      updated_at: '2024-05-21T11:20:00Z',
      filename: 'finance_staff.xlsx',
      record_count: 200,
      assigned_to: 'uw-001',
      assigned_to_name: 'John Underwriter',
    },
    // Approved cases
    {
      id: 'case-6001',
      client_name: 'IT Services Pro',
      policy_type: 'GMC',
      business_type: 'fresh',
      status: 'approved',
      created_by: 'agent-001',
      created_by_name: 'Sarah Agent',
      created_at: '2024-05-10T10:00:00Z',
      updated_at: '2024-05-15T16:00:00Z',
      filename: 'it_services.xlsx',
      record_count: 85,
      premium: 425000,
      approved_by: 'uw-001',
      approved_by_name: 'John Underwriter',
    },
    {
      id: 'case-6002',
      client_name: 'Manufacturing Co',
      policy_type: 'GMC',
      business_type: 'renewal',
      status: 'approved',
      created_by: 'agent-002',
      created_by_name: 'Mike Agent',
      created_at: '2024-05-08T09:00:00Z',
      updated_at: '2024-05-12T14:00:00Z',
      filename: 'renewal_mfg.xlsx',
      record_count: 350,
      premium: 875000,
      approved_by: 'uw-001',
      approved_by_name: 'John Underwriter',
    },
    // Rejected cases
    {
      id: 'case-7001',
      client_name: 'High Risk Industries',
      policy_type: 'GMC',
      business_type: 'fresh',
      status: 'rejected',
      created_by: 'agent-003',
      created_by_name: 'Emma Wilson',
      created_at: '2024-05-05T12:00:00Z',
      updated_at: '2024-05-08T14:00:00Z',
      rejection_reason: 'High risk profile - claim ratio exceeds threshold',
      rejected_by: 'uw-001',
      rejected_by_name: 'John Underwriter',
    },
    {
      id: 'case-7002',
      client_name: 'Unstable Corp',
      policy_type: 'GMC',
      business_type: 'fresh',
      status: 'rejected',
      created_by: 'agent-004',
      created_by_name: 'Raj Patel',
      created_at: '2024-05-03T10:00:00Z',
      updated_at: '2024-05-06T11:00:00Z',
      rejection_reason: 'Incomplete employee data - missing age and sum insured for multiple employees',
      rejected_by: 'uw-002',
      rejected_by_name: 'Priya Sharma',
    },
  ];
};

// Initialize on load
initializeMockData();

// Mock employee data generator
const generateEmployeeData = (count = 20) => {
  const relationships = ['Self', 'Spouse', 'Child', 'Parent'];
  const genders = ['Male', 'Female'];
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'];
  const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'IT', 'Support'];
  
  const names = [
    'Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Reddy', 'Vikram Singh',
    'Anjali Desai', 'Raj Malhotra', 'Kavita Nair', 'Sanjay Gupta', 'Meera Shah',
    'Deepak Joshi', 'Rita Mathew', 'Arun Khanna', 'Sunita Rao', 'Gopalakrishnan',
    'Lakshmi Venkat', 'Ramesh Babu', 'Divya Subramanian', 'Krishnan Iyer', 'Padma Hari'
  ];

  return Array.from({ length: count }, (_, i) => ({
    employee_id: `EMP${String(1000 + i).padStart(4, '0')}`,
    employee_name: names[i % names.length],
    age: 25 + (i % 35),
    gender: genders[i % 2],
    relationship: relationships[i % 4],
    sum_insured: [100000, 200000, 300000, 500000, 750000, 1000000][i % 6],
    premium: Math.round([100000, 200000, 300000, 500000, 750000, 1000000][i % 6] * 0.012),
    city: cities[i % 8],
    department: departments[i % 8],
  }));
};

// Mock templates
const mockTemplates = [
  { id: 'tpl-001', name: 'Standard Corporate GMC', description: 'Default template for corporate health insurance', fields: ['employee_id', 'name', 'age', 'sum_insured'], created_at: '2024-01-01T00:00:00Z' },
  { id: 'tpl-002', name: 'Family Floater', description: 'Template for family floater policies', fields: ['employee_id', 'family_members', 'sum_insured'], created_at: '2024-02-15T00:00:00Z' },
  { id: 'tpl-003', name: 'Top-up Plan', description: 'High coverage top-up insurance', fields: ['employee_id', 'base_cover', 'top_up_cover'], created_at: '2024-03-20T00:00:00Z' },
];

// Mock notifications
let mockNotificationsStore = [
  { id: 'notif-001', type: 'case_update', message: 'Case #case-4001 submitted for review', read: false, created_at: '2024-05-22T14:30:00Z' },
  { id: 'notif-002', type: 'approval', message: 'Case #case-6001 approved - Premium: ₹425,000', read: false, created_at: '2024-05-15T16:00:00Z' },
  { id: 'notif-003', type: 'review', message: 'New case assigned: MegaCorp Holdings', read: true, created_at: '2024-05-25T10:00:00Z' },
  { id: 'notif-004', type: 'rejection', message: 'Case #case-7001 rejected', read: true, created_at: '2024-05-08T14:00:00Z' },
];

// Mock audit logs
let mockAuditLogsStore = [
  { id: 'log-001', action: 'case_created', user: 'Sarah Agent', user_id: 'agent-001', case_id: 'case-1001', details: 'Created new case for TechCorp Industries', timestamp: '2024-06-01T10:30:00Z' },
  { id: 'log-002', action: 'file_uploaded', user: 'Sarah Agent', user_id: 'agent-001', case_id: 'case-2001', details: 'Uploaded employees_data.xlsx (150 records)', timestamp: '2024-05-29T09:15:00Z' },
  { id: 'log-003', action: 'mapping_applied', user: 'Mike Agent', user_id: 'agent-002', case_id: 'case-3001', details: 'Applied column mapping', timestamp: '2024-05-26T16:45:00Z' },
  { id: 'log-004', action: 'submitted_for_review', user: 'Mike Agent', user_id: 'agent-002', case_id: 'case-4001', details: 'Submitted to underwriter', timestamp: '2024-05-22T14:30:00Z' },
  { id: 'log-005', action: 'review_started', user: 'John Underwriter', user_id: 'uw-001', case_id: 'case-5001', details: 'Started review process', timestamp: '2024-05-21T11:20:00Z' },
  { id: 'log-006', action: 'case_approved', user: 'John Underwriter', user_id: 'uw-001', case_id: 'case-6001', details: 'Approved with premium: ₹425,000', timestamp: '2024-05-15T16:00:00Z' },
  { id: 'log-007', action: 'case_rejected', user: 'John Underwriter', user_id: 'uw-001', case_id: 'case-7001', details: 'Rejected - High risk profile', timestamp: '2024-05-08T14:00:00Z' },
  { id: 'log-008', action: 'user_created', user: 'Admin User', user_id: 'admin-001', details: 'Created new agent: Emma Wilson', timestamp: '2024-04-01T10:00:00Z' },
  { id: 'log-009', action: 'user_created', user: 'Admin User', user_id: 'admin-001', details: 'Created new agent: Raj Patel', timestamp: '2024-04-10T10:00:00Z' },
];

// Utility
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Add to audit log
const addAuditLog = (action, userId, userName, caseId, details) => {
  mockAuditLogsStore.unshift({
    id: `log-${Date.now()}`,
    action,
    user: userName,
    user_id: userId,
    case_id: caseId,
    details,
    timestamp: new Date().toISOString(),
  });
};

// ============ Mock API Implementations ============
export const mockApi = {
  // Auth - with in-memory sessions
  auth: {
    me: async () => {
      await delay();
      const currentUserId = sessionStorage.getItem('mock_user_id');
      if (!currentUserId) return null;
      return mockUsersStore.find(u => u.id === currentUserId) || null;
    },
    login: async (email, password) => {
      await delay();
      const user = mockUsersStore.find(u => u.email === email && u.password === password);
      if (!user) {
        throw new Error('Invalid credentials');
      }
      // Store session
      sessionStorage.setItem('mock_user_id', user.id);
      sessionStorage.setItem('mock_user_role', user.role);
      const result = { ...user, access_token: `mock-token-${user.id}` };
    },
    register: async (data) => {
      await delay();
      // Check if user already exists
      if (mockUsersStore.find(u => u.email === data.email)) {
        throw new Error('Email already registered');
      }
      // Create new user - new users default to 'agent' role
      const newUser = {
        id: `user-${Date.now()}`,
        email: data.email,
        name: data.name,
        role: data.role || 'agent',
        password: data.password,
        created_at: new Date().toISOString(),
        is_active: true,
      };
      mockUsersStore.push(newUser);
      sessionStorage.setItem('mock_user_id', newUser.id);
      sessionStorage.setItem('mock_user_role', newUser.role);
      addAuditLog('user_created', newUser.id, newUser.name, null, `Created new ${newUser.role}: ${newUser.name}`);
      return { ...newUser, access_token: `mock-token-${newUser.id}` };
    },
    logout: async () => {
      await delay();
      sessionStorage.removeItem('mock_user_id');
      sessionStorage.removeItem('mock_user_role');
      return { message: 'Logged out successfully' };
    },
    // Get current session user
    getCurrentUser: () => {
      const userId = sessionStorage.getItem('mock_user_id');
      const role = sessionStorage.getItem('mock_user_role');
      return { id: userId, role };
    },
  },

  // Cases - with in-memory storage
  cases: {
    getAll: async (params = {}) => {
      await delay();
      let cases = [...mockCasesStore];
      const currentUserId = sessionStorage.getItem('mock_user_id');
      const currentRole = sessionStorage.getItem('mock_user_role');
      
      // Filter by user role
      if (currentRole === 'agent') {
        // Agents see only their cases
        cases = cases.filter(c => c.created_by === currentUserId);
      } else if (currentRole === 'underwriter') {
        // Underwriters see pending/under_review cases
        if (!params.status) {
          cases = cases.filter(c => ['pending_review', 'under_review'].includes(c.status));
        }
      }
      // Filter by status if provided
      if (params.status) {
        cases = cases.filter(c => c.status === params.status);
      }
      return { cases, total: cases.length };
    },
    getById: async (caseId) => {
      await delay();
      const caseData = mockCasesStore.find(c => c.id === caseId);
      if (!caseData) throw new Error('Case not found');
      return {
        ...caseData,
        employees: generateEmployeeData(caseData.record_count || 20),
      };
    },
    create: async (data) => {
      await delay();
      const currentUserId = sessionStorage.getItem('mock_user_id');
      const currentUser = mockUsersStore.find(u => u.id === currentUserId);
      const newCase = {
        id: `case-${Date.now()}`,
        client_name: data.client_name,
        policy_type: data.policy_type || 'GMC',
        business_type: data.business_type || 'fresh',
        status: 'draft',
        created_by: currentUserId,
        created_by_name: currentUser?.name || 'Unknown',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: data.notes || '',
      };
      mockCasesStore.push(newCase);
      addAuditLog('case_created', currentUserId, currentUser?.name, newCase.id, `Created case: ${newCase.client_name}`);
      return newCase;
    },
    update: async (caseId, data) => {
      await delay();
      const index = mockCasesStore.findIndex(c => c.id === caseId);
      if (index === -1) throw new Error('Case not found');
      const currentUserId = sessionStorage.getItem('mock_user_id');
      const currentUser = mockUsersStore.find(u => u.id === currentUserId);
      mockCasesStore[index] = { ...mockCasesStore[index], ...data, updated_at: new Date().toISOString() };
      addAuditLog('case_updated', currentUserId, currentUser?.name, caseId, `Updated case details`);
      return { message: 'Case updated', case_id: caseId };
    },
    delete: async (caseId) => {
      await delay();
      const index = mockCasesStore.findIndex(c => c.id === caseId);
      if (index === -1) throw new Error('Case not found');
      const currentUserId = sessionStorage.getItem('mock_user_id');
      const currentUser = mockUsersStore.find(u => u.id === currentUserId);
      mockCasesStore.splice(index, 1);
      addAuditLog('case_deleted', currentUserId, currentUser?.name, caseId, `Deleted case`);
      return { message: 'Case deleted' };
    },
    upload: async (caseId, file) => {
      await delay(500);
      // Don't require case to exist - just return success
      const currentUserId = sessionStorage.getItem('mock_user_id');
      const currentUser = mockUsersStore.find(u => u.id === currentUserId);
      if (currentUserId && currentUser) {
        addAuditLog('file_uploaded', currentUserId, currentUser?.name, caseId, `Uploaded ${file?.name || 'employees.xlsx'}`);
      }
      return {
        case_id: caseId,
        filename: file?.name || 'employees.xlsx',
        columns: ['Employee ID', 'Name', 'Age', 'Gender', 'Sum Insured', 'City', 'Department'],
        record_count: 50,
        row_count: 50,
        status: 'uploaded',
      };
    },
    uploadClaims: async (caseId, file) => {
      await delay(500);
      // Don't require case to exist - just return success
      return {
        case_id: caseId,
        claims_filename: file?.name || 'claims.xlsx',
        claims_columns: ['Claim ID', 'Employee ID', 'Claim Amount', 'Claim Date', 'Status'],
        claims_row_count: 25,
        record_count: 25,
        status: 'uploaded',
      };
    },
    applyMapping: async (caseId, mapping) => {
      await delay();
      const index = mockCasesStore.findIndex(c => c.id === caseId);
      if (index !== -1) {
        mockCasesStore[index] = {
          ...mockCasesStore[index],
          status: 'mapping_applied',
          mapping,
          updated_at: new Date().toISOString(),
        };
      }
      const currentUserId = sessionStorage.getItem('mock_user_id');
      const currentUser = mockUsersStore.find(u => u.id === currentUserId);
      addAuditLog('mapping_applied', currentUserId, currentUser?.name, caseId, 'Applied column mapping');
      return { case_id: caseId, mapped_count: 50, status: 'mapping_applied' };
    },
    submit: async (caseId) => {
      await delay();
      const index = mockCasesStore.findIndex(c => c.id === caseId);
      if (index !== -1) {
        mockCasesStore[index] = {
          ...mockCasesStore[index],
          status: 'pending_review',
          updated_at: new Date().toISOString(),
        };
      }
      const currentUserId = sessionStorage.getItem('mock_user_id');
      const currentUser = mockUsersStore.find(u => u.id === currentUserId);
      addAuditLog('submitted_for_review', currentUserId, currentUser?.name, caseId, 'Submitted to underwriter');
      return { case_id: caseId, status: 'pending_review' };
    },
    startReview: async (caseId) => {
      await delay();
      const currentUserId = sessionStorage.getItem('mock_user_id');
      const currentUser = mockUsersStore.find(u => u.id === currentUserId);
      const index = mockCasesStore.findIndex(c => c.id === caseId);
      if (index !== -1) {
        mockCasesStore[index] = {
          ...mockCasesStore[index],
          status: 'under_review',
          assigned_to: currentUserId,
          assigned_to_name: currentUser?.name,
          updated_at: new Date().toISOString(),
        };
      }
      addAuditLog('review_started', currentUserId, currentUser?.name, caseId, 'Started review process');
      return { case_id: caseId, status: 'under_review', assigned_to: currentUserId };
    },
    makeDecision: async (caseId, decision) => {
      await delay();
      const currentUserId = sessionStorage.getItem('mock_user_id');
      const currentUser = mockUsersStore.find(u => u.id === currentUserId);
      const index = mockCasesStore.findIndex(c => c.id === caseId);
      if (index !== -1) {
        const status = decision.decision === 'approve' ? 'approved' : 'rejected';
        mockCasesStore[index] = {
          ...mockCasesStore[index],
          status,
          decision_notes: decision.notes,
          updated_at: new Date().toISOString(),
        };
        if (decision.decision === 'approve') {
          mockCasesStore[index].premium = decision.premium || 500000;
          mockCasesStore[index].approved_by = currentUserId;
          mockCasesStore[index].approved_by_name = currentUser?.name;
        } else {
          mockCasesStore[index].rejection_reason = decision.notes;
          mockCasesStore[index].rejected_by = currentUserId;
          mockCasesStore[index].rejected_by_name = currentUser?.name;
        }
      }
      addAuditLog(
        decision.decision === 'approve' ? 'case_approved' : 'case_rejected',
        currentUserId,
        currentUser?.name,
        caseId,
        decision.decision === 'approve' ? `Approved with premium: ₹${decision.premium || 500000}` : `Rejected - ${decision.notes}`
      );
      return { case_id: caseId, status: decision.decision === 'approve' ? 'approved' : 'rejected', notes: decision.notes };
    },
  
  runMapping: async (caseId) => {
    console.log('Mock AI mapping for case', caseId);
    await delay(2000);
    const cache = getCache(caseId);
    const matches = cache?.matchResults || {
      summary: { total_claims: 8, matched_count: 6, unmatched_count: 2, match_rate: '75%', breakdown: { exact: 2, fuzzy: 2, llm: 1, member_id: 1 } },
      matches: [
        { claim_name: 'ANJU M', claim_employee_no: 'ASDC02', matched_enrollment: 'ANJU M', match_score: 100, match_method: 'EXACT', needs_review: false },
        { claim_name: 'BALAJI S', claim_employee_no: '4001', matched_enrollment: 'BALAJI S', match_score: 100, match_method: 'EXACT', needs_review: false },
        { claim_name: 'DIVYA K', claim_employee_no: '4137', matched_enrollment: 'DIVYA K', match_score: 100, match_method: 'EXACT', needs_review: false },
        { claim_name: 'PREM SHANKAR', claim_employee_no: '4129', matched_enrollment: 'PREM SHANKAR', match_score: 95, match_method: 'MEMBER_ID', needs_review: false },
        { claim_name: 'RAJESH KUMAR', claim_employee_no: '4004', matched_enrollment: 'RAJESH KUMAR', match_score: 85, match_method: 'FUZZY', needs_review: false },
        { claim_name: 'RAVINDRA MEDHE', claim_employee_no: '4040', matched_enrollment: '', match_score: 55, match_method: 'NO_MATCH', needs_review: true },
      ]
    };
    setCache(caseId, 'matchResults', matches);
    return { status: 'complete', summary: matches.summary };
  },
  getMappingResults: async (caseId) => {
    const cache = getCache(caseId);
    const matches = cache?.matchResults || {
      match_results: [
        { claim_id: 'C001', claimant_name: 'ANJU M', matched_enrollment_id: 'E001', matched_name: 'ANJU M', confidence: 100, match_method: 'EXACT' },
        { claim_id: 'C002', claimant_name: 'BALAJI S', matched_enrollment_id: 'E002', matched_name: 'BALAJI S', confidence: 100, match_method: 'EXACT' },
        { claim_id: 'C003', claimant_name: 'DIVYA K', matched_enrollment_id: 'E003', matched_name: 'DIVYA K', confidence: 100, match_method: 'EXACT' },
        { claim_id: 'C004', claimant_name: 'PREM SHANKAR', matched_enrollment_id: 'E004', matched_name: 'PREM SHANKAR', confidence: 95, match_method: 'MEMBER_ID' },
        { claim_id: 'C005', claimant_name: 'RAJESH KUMAR', matched_enrollment_id: 'E005', matched_name: 'RAJESH KUMAR', confidence: 85, match_method: 'FUZZY' },
        { claim_id: 'C006', claimant_name: 'RAVINDRA MEDHE', matched_enrollment_id: null, matched_name: null, confidence: 55, match_method: 'NO_MATCH' },
      ],
      matched_count: 5,
      unmatched_count: 1,
      match_rate: '83.3%'
    };
    return {
      status: 'complete',
      summary: {
        total_claims: 6,
        total_records: 6,
        matched_count: matches.matched_count,
        unmatched_count: matches.unmatched_count,
        match_rate: matches.match_rate,
        avg_confidence: 89,
        total_sum_insured: 50000000
      },
      field_mapping: {
        enrollment: [
          { source_field: 'employee_id', mapped_field: 'Employee ID', confidence: 100 },
          { source_field: 'member_name', mapped_field: 'Name', confidence: 98 },
          { source_field: 'dob', mapped_field: 'Date of Birth', confidence: 100 },
          { source_field: 'sum_insured', mapped_field: 'Sum Insured', confidence: 100 },
          { source_field: 'gender', mapped_field: 'Gender', confidence: 100 },
          { source_field: 'email', mapped_field: 'Email', confidence: 95 },
          { source_field: 'phone', mapped_field: 'Phone', confidence: 95 },
          { source_field: 'department', mapped_field: 'Department', confidence: 72 },
        ]
      },
      matched_records: [
        { member_name: 'ANJU M', enrollment_id: 'E001', dob: '1985-03-15', claims_count: 2, confidence: 100, method: 'EXACT' },
        { member_name: 'BALAJI S', enrollment_id: 'E002', dob: '1978-07-22', claims_count: 1, confidence: 100, method: 'EXACT' },
        { member_name: 'DIVYA K', enrollment_id: 'E003', dob: '1990-11-08', claims_count: 1, confidence: 100, method: 'EXACT' },
        { member_name: 'PREM SHANKAR', enrollment_id: 'E004', dob: '1982-05-30', claims_count: 3, confidence: 95, method: 'MEMBER_ID' },
        { member_name: 'RAJESH KUMAR', enrollment_id: 'E005', dob: '1975-12-03', claims_count: 2, confidence: 85, method: 'FUZZY' },
        { member_name: 'RAVINDRA MEDHE', enrollment_id: null, dob: '1988-09-14', claims_count: 1, confidence: 55, method: 'NO_MATCH' },
      ],
      unmatched_records: [
        { claim_id: 'C006', claimant_name: 'RAVINDRA MEDHE', amount: 150000, suggested_match: null },
      ]
    };
  },
  exportMappedData: async (caseId) => {
    const csv = 'Member Name,Enrollment ID,DOB,Claims Count,Confidence,Method,Sum Insured\n' +
      'ANJU M,E001,1985-03-15,2,100%,EXACT,10000000\n' +
      'BALAJI S,E002,1978-07-22,1,100%,EXACT,8000000\n' +
      'DIVYA K,E003,1990-11-08,1,100%,EXACT,12000000\n' +
      'PREM SHANKAR,E004,1982-05-30,3,95%,MEMBER_ID,10000000\n' +
      'RAJESH KUMAR,E005,1975-12-03,2,85%,FUZZY,10000000\n';
    return new Blob([csv], { type: 'text/csv' });
  },},

  // Dashboard - with analytics
  dashboard: {
    getStats: async () => {
      await delay();
      const allCases = mockCasesStore;
      const currentUserId = sessionStorage.getItem('mock_user_id');
      const currentRole = sessionStorage.getItem('mock_user_role');
      
      // Calculate stats based on role
      let totalCases = allCases.length;
      let pendingReview = allCases.filter(c => c.status === 'pending_review').length;
      let underReview = allCases.filter(c => c.status === 'under_review').length;
      let approved = allCases.filter(c => c.status === 'approved').length;
      let rejected = allCases.filter(c => c.status === 'rejected').length;
      let draft = allCases.filter(c => c.status === 'draft').length;
      let uploaded = allCases.filter(c => c.status === 'uploaded').length;
      let mappingApplied = allCases.filter(c => c.status === 'mapping_applied').length;
      
      const totalPremium = allCases
        .filter(c => c.status === 'approved')
        .reduce((sum, c) => sum + (c.premium || 0), 0);
        
      return {
        total_cases: totalCases,
        pending_review: pendingReview + underReview,
        approved,
        rejected,
        draft,
        uploaded,
        mapping_applied: mappingApplied,
        total_premium: totalPremium,
        this_month_cases: allCases.filter(c => {
          const date = new Date(c.created_at);
          const now = new Date();
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }).length,
        this_month_premium: allCases
          .filter(c => c.status === 'approved' && new Date(c.updated_at).getMonth() === new Date().getMonth())
          .reduce((sum, c) => sum + (c.premium || 0), 0),
      };
    },
    getRecentActivity: async () => {
      await delay();
      return { activities: mockAuditLogsStore.slice(0, 10) };
    },
  },

  // Underwriter
  underwriter: {
    getQueue: async (params = {}) => {
      await delay();
      const cases = mockCasesStore.filter(c => ['pending_review', 'under_review'].includes(c.status));
      return { cases, total: cases.length };
    },
  },

  // Admin - user management
  admin: {
    getStats: async () => {
      await delay();
      return {
        total_users: mockUsersStore.length,
        active_users: mockUsersStore.filter(u => u.is_active).length,
        total_cases: mockCasesStore.length,
        total_premium: mockCasesStore.filter(c => c.status === 'approved').reduce((sum, c) => sum + (c.premium || 0), 0),
        agents: mockUsersStore.filter(u => u.role === 'agent').length,
        underwriters: mockUsersStore.filter(u => u.role === 'underwriter').length,
        admins: mockUsersStore.filter(u => ['admin', 'superadmin'].includes(u.role)).length,
      };
    },
    getUsers: async (params = {}) => {
      await delay();
      let users = [...mockUsersStore];
      if (params.role) {
        users = users.filter(u => u.role === params.role);
      }
      if (params.is_active !== undefined) {
        users = users.filter(u => u.is_active === (params.is_active === 'true'));
      }
      // Remove passwords before returning
      users = users.map(({ password, ...rest }) => rest);
      return { users, total: users.length };
    },
    createUser: async (data) => {
      await delay();
      const newUser = {
        id: `user-${Date.now()}`,
        email: data.email,
        name: data.name,
        role: data.role || 'agent',
        password: data.password || 'agent123',
        created_at: new Date().toISOString(),
        is_active: true,
      };
      mockUsersStore.push(newUser);
      const currentUserId = sessionStorage.getItem('mock_user_id');
      const currentUser = mockUsersStore.find(u => u.id === currentUserId);
      addAuditLog('user_created', currentUserId, currentUser?.name, null, `Created new ${data.role}: ${data.name}`);
      return { ...newUser };
    },
    updateUser: async (userId, data) => {
      await delay();
      const index = mockUsersStore.findIndex(u => u.id === userId);
      if (index !== -1) {
        mockUsersStore[index] = { ...mockUsersStore[index], ...data };
      }
      return { message: 'User updated', user_id: userId };
    },
    deleteUser: async (userId) => {
      await delay();
      const index = mockUsersStore.findIndex(u => u.id === userId);
      if (index !== -1) {
        mockUsersStore.splice(index, 1);
      }
      return { message: 'User deleted' };
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
      const newTemplate = {
        id: `tpl-${Date.now()}`,
        ...data,
        created_at: new Date().toISOString(),
      };
      mockTemplates.push(newTemplate);
      return newTemplate;
    },
    update: async (templateId, data) => {
      await delay();
      const index = mockTemplates.findIndex(t => t.id === templateId);
      if (index !== -1) {
        mockTemplates[index] = { ...mockTemplates[index], ...data };
      }
      return { message: 'Template updated', template_id: templateId };
    },
    delete: async (templateId) => {
      await delay();
      const index = mockTemplates.findIndex(t => t.id === templateId);
      if (index !== -1) {
        mockTemplates.splice(index, 1);
      }
      return { message: 'Template deleted' };
    },
  },

  // Notifications
  notifications: {
    getAll: async (unreadOnly = false) => {
      await delay();
      let notifs = mockNotificationsStore;
      if (unreadOnly) {
        notifs = notifs.filter(n => !n.read);
      }
      return { notifications: notifs, total: notifs.length, unread_count: notifs.filter(n => !n.read).length };
    },
    markRead: async (ids) => {
      await delay();
      ids.forEach(id => {
        const notif = mockNotificationsStore.find(n => n.id === id);
        if (notif) notif.read = true;
      });
      return { message: 'Notifications marked as read' };
    },
  },

  // Audit
  audit: {
    getLogs: async (params = {}) => {
      await delay();
      let logs = [...mockAuditLogsStore];
      if (params.user_id) {
        logs = logs.filter(l => l.user_id === params.user_id);
      }
      if (params.action) {
        logs = logs.filter(l => l.action === params.action);
      }
      return { logs, total: logs.length };
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
    return { status: 'healthy', service: 'gmc-platform-demo', db: 'in-memory' };
  },

  // AI Matching
  matching: {
    runMatch: async (caseId) => {
      await delay(1500);
      // Simulate realistic matching results
      return {
        total_claims: result.matches?.length || 0,
        summary: {
          total_claims: 31,
          matched_count: 24,
          unmatched_count: 7,
          match_rate: '77.4%',
          breakdown: { exact: 4, fuzzy: 12, llm: 5, member_id: 3 }
        },
        matches: [
          { claim_name: 'ANJU M', claim_employee_no: 'ASDC02', matched_enrollment: 'ANJU', match_score: 100, match_method: 'EXACT', needs_review: false },
          { claim_name: 'ANSH JHALDIYAL', claim_employee_no: '1513', matched_enrollment: 'ANSH', match_score: 95, match_method: 'MEMBER_ID', needs_review: false },
          { claim_name: 'BALAJI S', claim_employee_no: '4001', matched_enrollment: 'BALAJI', match_score: 100, match_method: 'EXACT', needs_review: false },
          { claim_name: 'DIVYA', claim_employee_no: '4137', matched_enrollment: 'DIVYA', match_score: 100, match_method: 'EXACT', needs_review: false },
          { claim_name: 'GOLDI SHARMA', claim_employee_no: '1528', matched_enrollment: 'GOLDI', match_score: 95, match_method: 'MEMBER_ID', needs_review: false },
          { claim_name: 'JYOTI', claim_employee_no: '4131', matched_enrollment: 'JYOTI', match_score: 100, match_method: 'EXACT', needs_review: false },
          { claim_name: 'MENAKA', claim_employee_no: '4110', matched_enrollment: 'MENAKA', match_score: 100, match_method: 'EXACT', needs_review: false },
          { claim_name: 'PREM SHANKAR', claim_employee_no: '4129', matched_enrollment: 'PREM', match_score: 85, match_method: 'FUZZY', needs_review: false },
          { claim_name: 'RAJESH KUMAR', claim_employee_no: '4004', matched_enrollment: 'RAJESH', match_score: 90, match_method: 'LLM', needs_review: false },
          { claim_name: 'RAVINDRA MEDHE', claim_employee_no: '4040', matched_enrollment: 'RAVINDRA', match_score: 88, match_method: 'FUZZY', needs_review: false },
          { claim_name: 'REVATHI K', claim_employee_no: 'NA003', matched_enrollment: 'REVATHI', match_score: 87, match_method: 'FUZZY', needs_review: false },
          { claim_name: 'SARANYA P', claim_employee_no: 'NS027', matched_enrollment: 'SARANYA', match_score: 87, match_method: 'FUZZY', needs_review: false },
          { claim_name: 'SURYANSH BHARDWAJ', claim_employee_no: '4128', matched_enrollment: 'SURYANSH', match_score: 82, match_method: 'LLM', needs_review: false },
          { claim_name: 'SUSHMA YADAV', claim_employee_no: 'NS001', matched_enrollment: 'SUSHMA', match_score: 85, match_method: 'FUZZY', needs_review: false },
          { claim_name: 'SUSHMA YADAV', claim_employee_no: 'NS001', matched_enrollment: 'SUSHMA', match_score: 85, match_method: 'FUZZY', needs_review: false },
          { claim_name: 'BHARGAVI RAI', claim_employee_no: 'NA002', matched_enrollment: 'BHARGAVI', match_score: 80, match_method: 'FUZZY', needs_review: false },
          { claim_name: 'AKSHAY KADAM', claim_employee_no: '5062', matched_enrollment: '', match_score: 55, match_method: 'NO_MATCH', needs_review: true },
          { claim_name: 'ANURAG VISHWAKARMA', claim_employee_no: '5061', matched_enrollment: '', match_score: 41, match_method: 'NO_MATCH', needs_review: true },
          { claim_name: 'ARYAN YADAV', claim_employee_no: 'NS017', matched_enrollment: 'AARYAN', match_score: 66, match_method: 'LLM', needs_review: true },
          { claim_name: 'DINESH K', claim_employee_no: 'NA008', matched_enrollment: 'Dinesh', match_score: 85, match_method: 'FUZZY', needs_review: false },
          { claim_name: 'POOJA KADAM', claim_employee_no: '5063', matched_enrollment: 'POOJA', match_score: 62, match_method: 'FUZZY', needs_review: true },
          { claim_name: 'POOJA KADAM', claim_employee_no: '5063', matched_enrollment: 'POOJA', match_score: 62, match_method: 'FUZZY', needs_review: true },
          { claim_name: 'RAHUL PATEL', claim_employee_no: '4014', matched_enrollment: 'RAHUL', match_score: 70, match_method: 'FUZZY', needs_review: true },
          { claim_name: 'SANKET MHASUDGE', claim_employee_no: '4008', matched_enrollment: 'Sanket', match_score: 64, match_method: 'FUZZY', needs_review: true },
          { claim_name: 'SARIKA', claim_employee_no: '4060', matched_enrollment: 'SARIKA JAGDISH', match_score: 72, match_method: 'FUZZY', needs_review: true },
          { claim_name: 'SURYA KUMAR', claim_employee_no: '4041', matched_enrollment: 'SHAURYA', match_score: 83, match_method: 'LLM', needs_review: false },
          { claim_name: 'JASKARAN', claim_employee_no: '4138', matched_enrollment: 'BASKAR', match_score: 71, match_method: 'FUZZY', needs_review: true },
          { claim_name: 'GURPREET BAGGA', claim_employee_no: '4119', matched_enrollment: '', match_score: 31, match_method: 'NO_MATCH', needs_review: true },
          { claim_name: 'VISHWANATH KAND', claim_employee_no: '4062', matched_enrollment: '', match_score: 49, match_method: 'NO_MATCH', needs_review: true },
          { claim_name: 'AKSHAY KADAM', claim_employee_no: '5062', matched_enrollment: '', match_score: 55, match_method: 'NO_MATCH', needs_review: true },
        ]
      };
    },
    getResults: async (caseId) => {
      await delay(500);
      // Return cached results from mock runMatch
      return {
        total_claims: result.matches?.length || 0,
        summary: {
          total_claims: 31,
          matched_count: 24,
          unmatched_count: 7,
          match_rate: '77.4%',
          breakdown: { exact: 4, fuzzy: 12, llm: 5, member_id: 3 }
        },
        matches: []
      };
    },
    overrideMatch: async (caseId, data) => {
      await delay(300);
      return { message: 'Override saved', case_id: caseId };
    },
    exportMatched: async (caseId) => {
      await delay(500);
      // Return a minimal blob
      return { data: new Blob([''], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }) };
    },
    getAnalytics: async (caseId) => {
      await delay(500);
      return {
        total_claims: 31,
        matched: 24,
        unmatched: 7,
        verified: 16,
        needs_review: 8,
        claim_amount: 1929046,
        approved_amount: 1526649,
        approval_rate: 79.1
      };
    },
    flagField: async (caseId, data) => {
      await delay(200);
      return { message: 'Field flagged', case_id: caseId };
    },
    reuploadErrors: async (caseId, data) => {
      await delay(500);
      return { message: 'Errors reuploaded', case_id: caseId };
    },
    submitToUnderwriter: async (caseId, data) => {
      await delay(500);
      return { message: 'Submitted to underwriter', case_id: caseId };
    },
  },
};

// Export
export const isMockMode = () => MOCK_MODE;
export default mockApi;