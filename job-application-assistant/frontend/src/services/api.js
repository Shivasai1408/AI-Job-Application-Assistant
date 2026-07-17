import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// --- Auth API ---
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    return api.post('/api/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getProfile: () => api.get('/api/auth/me'),
  updateProfile: (data) => api.put('/api/auth/me', data),
};

// --- Resume API ---
export const resumeAPI = {
  list: () => api.get('/api/resumes/'),
  get: (id) => api.get(`/api/resumes/${id}`),
  create: (title, content, isBase = false) => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('is_base', isBase);
    return api.post('/api/resumes/create', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  upload: (title, file, isBase = false) => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);
    formData.append('is_base', isBase);
    return api.post('/api/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id) => api.delete(`/api/resumes/${id}`),
  tailor: (resumeId, jobDescription, jobTitle = '', company = '') =>
    api.post(`/api/resumes/${resumeId}/tailor`, {
      job_description: jobDescription,
      job_title: jobTitle,
      company,
    }),
  tailorText: (content, jobDescription, jobTitle = '', company = '') => {
    const formData = new FormData();
    formData.append('resume_content', content);
    formData.append('job_description', jobDescription);
    formData.append('job_title', jobTitle);
    formData.append('company', company);
    return api.post('/api/resumes/tailor-text', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  analyzeATS: (resumeId, jobDescription) => {
    const formData = new FormData();
    formData.append('job_description', jobDescription);
    return api.post(`/api/resumes/${resumeId}/ats-score`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  analyzeATSText: (content, jobDescription) => {
    const formData = new FormData();
    formData.append('resume_content', content);
    formData.append('job_description', jobDescription);
    return api.post('/api/resumes/ats-analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// --- Jobs API ---
export const jobsAPI = {
  search: (params) => api.get('/api/jobs/search', { params }),
  getDetails: (id) => api.get(`/api/jobs/${id}`),
  getRecommended: (limit = 5) => api.get('/api/jobs/recommended', { params: { limit } }),
  extractSkills: (id) => api.post(`/api/jobs/${id}/extract-skills`),
  save: (id) => api.post(`/api/jobs/save/${id}`),
  getSaved: () => api.get('/api/jobs/saved/list'),
  unsave: (id) => api.delete(`/api/jobs/saved/${id}`),
};

// --- Applications API ---
export const applicationsAPI = {
  create: (data) => api.post('/api/applications/', data),
  list: (status) => api.get('/api/applications/', { params: { status } }),
  get: (id) => api.get(`/api/applications/${id}`),
  update: (id, data) => api.put(`/api/applications/${id}`, data),
  delete: (id) => api.delete(`/api/applications/${id}`),
  getStats: () => api.get('/api/applications/stats'),
  generateCoverLetter: (data) => api.post('/api/applications/cover-letter', data),
  listCoverLetters: () => api.get('/api/applications/cover-letters/list'),
};

// --- Cover Letters API ---
export const coverLettersAPI = {
  generate: (data) => api.post('/api/cover-letters/generate', data),
  save: (content, jobId, tone = 'professional') => {
    const formData = new FormData();
    formData.append('content', content);
    formData.append('job_id', jobId);
    formData.append('tone', tone);
    return api.post('/api/cover-letters/save', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  list: () => api.get('/api/cover-letters/'),
  delete: (id) => api.delete(`/api/cover-letters/${id}`),
};

// --- Interviews API ---
export const interviewsAPI = {
  create: (data) => api.post('/api/interviews/', data),
  list: (status) => api.get('/api/interviews/', { params: { status } }),
  upcoming: () => api.get('/api/interviews/upcoming'),
  get: (id) => api.get(`/api/interviews/${id}`),
  update: (id, data) => api.put(`/api/interviews/${id}`, data),
  complete: (id, feedback) => api.post(`/api/interviews/${id}/complete`, feedback),
  delete: (id) => api.delete(`/api/interviews/${id}`),
};

// --- Alerts & Notifications API ---
export const alertsAPI = {
  create: (data) => api.post('/api/alerts/', data),
  list: () => api.get('/api/alerts/'),
  update: (id, data) => api.put(`/api/alerts/${id}`, data),
  delete: (id) => api.delete(`/api/alerts/${id}`),
  trigger: (id) => api.post(`/api/alerts/${id}/trigger`),
  getNotifications: (unreadOnly) => api.get('/api/alerts/notifications', { params: { unread_only: unreadOnly } }),
  markRead: (id) => api.post(`/api/alerts/notifications/${id}/read`),
  markAllRead: () => api.post('/api/alerts/notifications/read-all'),
  getUnreadCount: () => api.get('/api/alerts/notifications/unread-count'),
};

// --- Skill Gap Analysis API ---
export const skillsAPI = {
  analyzeGap: (userSkills, requiredSkills) => {
    const formData = new FormData();
    formData.append('user_skills', userSkills);
    formData.append('required_skills', requiredSkills);
    return api.post('/api/skills/analyze-gap', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getResources: (skillName) => api.get(`/api/skills/learning-resources/${encodeURIComponent(skillName)}`),
};

// --- Auto-Apply API ---
export const autoApplyAPI = {
  getPortals: () => api.get('/api/auto-apply/portals'),
  getPortalFields: (portalId) => api.get(`/api/auto-apply/portals/${portalId}/fields`),
  prepare: (data) => api.post('/api/auto-apply/prepare', data),
  submit: (data) => api.post('/api/auto-apply/submit', data),
};

// --- Career Advisor API ---
export const careerAPI = {
  getAdvice: (data) => api.post('/api/career/advice', data),
  predictSalary: (data) => api.post('/api/career/salary-prediction', data),
  getTrendingSkills: (field) => api.get('/api/career/trending-skills', { params: { field } }),
  getCertifications: (role) => api.get('/api/career/certifications', { params: { role } }),
};

// --- Interview Preparation API ---
export const interviewPrepAPI = {
  generateQuestions: (data) => api.post('/api/interview-prep/generate', data),
  evaluateAnswer: (data) => api.post('/api/interview-prep/evaluate', data),
  getHistory: () => api.get('/api/interview-prep/questions'),
};

// --- Email Generator API ---
export const emailAPI = {
  generate: (data) => api.post('/api/email/generate', data),
  getTemplates: () => api.get('/api/email/templates'),
  getHistory: () => api.get('/api/email/history'),
};

// --- Portfolio API ---
export const portfolioAPI = {
  get: () => api.get('/api/portfolio/'),
  generate: (theme = 'modern') => api.get('/api/portfolio/generate', { params: { theme } }),
  update: (data) => api.put('/api/portfolio/', data),
};

// --- LinkedIn Optimizer API ---
export const linkedinAPI = {
  optimize: (data) => api.post('/api/linkedin/optimize', data),
  getKeywords: (data) => api.post('/api/linkedin/keywords', data),
  getAnalytics: () => api.get('/api/linkedin/analytics'),
};

// --- Analytics API ---
export const analyticsAPI = {
  getOverview: () => api.get('/api/analytics/overview'),
  getMonthly: (months) => api.get('/api/analytics/monthly', { params: { months } }),
  getSkillsGrowth: () => api.get('/api/analytics/skills-growth'),
  getATSTrend: () => api.get('/api/analytics/ats-trend'),
  getSuccessRate: () => api.get('/api/analytics/success-rate'),
};

// --- Admin API ---
export const adminAPI = {
  getStats: () => api.get('/api/admin/stats'),
  getUsers: (params) => api.get('/api/admin/users', { params }),
  updateUser: (id, data) => api.put(`/api/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/api/admin/users/${id}`),
  getJobs: (params) => api.get('/api/admin/jobs', { params }),
  updateJob: (id, data) => api.put(`/api/admin/jobs/${id}`, data),
  deleteJob: (id) => api.delete(`/api/admin/jobs/${id}`),
};

// --- Forgot Password API ---
export const forgotPasswordAPI = {
  requestOTP: (email) => api.post('/api/auth/forgot-password', { email }),
  verifyOTP: (email, otp) => api.post('/api/auth/verify-otp', { email, otp }),
  resetPassword: (resetToken, newPassword) =>
    api.post('/api/auth/reset-password', { reset_token: resetToken, new_password: newPassword }),
};

// --- Job Analyzer API ---
export const jobAnalyzerAPI = {
  analyze: (data) => api.post('/api/jobs/analyze', data),
  match: (data) => api.post('/api/jobs/match', data),
  improve: (data) => api.post('/api/jobs/improve', data),
};

// --- Downloads API ---
export const downloadsAPI = {
  resume: (id) => `${API_BASE_URL}/api/downloads/resume/${id}`,
  coverLetter: (id) => `${API_BASE_URL}/api/downloads/cover-letter/${id}`,
  portfolio: (id) => `${API_BASE_URL}/api/downloads/portfolio/${id}`,
  applicationHistory: () => `${API_BASE_URL}/api/downloads/application-history`,
  downloadResume: (id) => api.get(`/api/downloads/resume/${id}`, { responseType: 'blob' }),
  downloadCoverLetter: (id) => api.get(`/api/downloads/cover-letter/${id}`, { responseType: 'blob' }),
  downloadPortfolio: (id) => api.get(`/api/downloads/portfolio/${id}`, { responseType: 'blob' }),
  downloadApplicationHistory: () => api.get('/api/downloads/application-history', { responseType: 'blob' }),
};

export default api;
