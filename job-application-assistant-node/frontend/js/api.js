// ===== API Client =====
const API_BASE = window.location.origin;

async function apiRequest(method, path, data, isFormData, responseType) {
  const url = new URL(path, API_BASE);
  
  // If GET request with data, append as query params
  if (method === 'GET' && data && !isFormData) {
    Object.entries(data).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        url.searchParams.append(key, val);
      }
    });
  }

  const options = {
    method: method,
    headers: {}
  };

  // Add Authorization header if token exists
  const token = localStorage.getItem('access_token');
  if (token) {
    options.headers['Authorization'] = 'Bearer ' + token;
  }

  // Handle request body
  if (data && method !== 'GET') {
    if (isFormData) {
      options.body = data;
      // Don't set Content-Type for FormData - browser sets it with boundary
    } else {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(data);
    }
  }

  try {
    const response = await fetch(url.toString(), options);

    // Handle 401 Unauthorized
    if (response.status === 401) {
      logout();
      return { data: null, error: 'Session expired. Please login again.' };
    }

    // Handle response based on responseType
    let result;
    if (responseType === 'blob') {
      result = await response.blob();
    } else if (responseType === 'text') {
      result = await response.text();
    } else {
      const text = await response.text();
      try {
        result = JSON.parse(text);
      } catch (e) {
        result = text;
      }
    }

    if (!response.ok) {
      const errMsg = result && (result.detail || result.message || result.error || JSON.stringify(result));
      return { data: null, error: errMsg || 'Request failed with status ' + response.status };
    }

    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: err.message || 'Network error. Please check your connection.' };
  }
}

// Convenience wrappers
function apiGet(path, params) {
  return apiRequest('GET', path, params);
}

function apiPost(path, data) {
  return apiRequest('POST', path, data);
}

function apiPut(path, data) {
  return apiRequest('PUT', path, data);
}

function apiDelete(path) {
  return apiRequest('DELETE', path);
}

// ===== API Modules =====

const authAPI = {
  login: (email, password) => apiRequest('POST', '/api/auth/login', { email, password }),
  register: (data) => apiRequest('POST', '/api/auth/register', data),
  getProfile: () => apiRequest('GET', '/api/auth/me'),
  updateProfile: (data) => apiRequest('PUT', '/api/auth/me', data),
};

const resumeAPI = {
  list: () => apiRequest('GET', '/api/resumes'),
  get: (id) => apiRequest('GET', '/api/resumes/' + id),
  create: (data) => apiRequest('POST', '/api/resumes', data),
  upload: (formData) => apiRequest('POST', '/api/resumes/upload', formData, true),
  delete: (id) => apiRequest('DELETE', '/api/resumes/' + id),
  tailor: (id, jobDesc) => apiRequest('POST', '/api/resumes/' + id + '/tailor', { job_description: jobDesc }),
  tailorText: (resumeText, jobDesc) => apiRequest('POST', '/api/resumes/tailor-text', { resume_text: resumeText, job_description: jobDesc }),
  analyzeATS: (id, jobDesc) => apiRequest('POST', '/api/resumes/' + id + '/ats', { job_description: jobDesc }),
  analyzeATSText: (resumeText, jobDesc) => apiRequest('POST', '/api/resumes/ats-text', { resume_text: resumeText, job_description: jobDesc }),
};

const jobsAPI = {
  search: (params) => apiRequest('GET', '/api/jobs', params),
  getDetails: (id) => apiRequest('GET', '/api/jobs/' + id),
  getRecommended: () => apiRequest('GET', '/api/jobs/recommended'),
  extractSkills: (jobDesc) => apiRequest('POST', '/api/jobs/extract-skills', { job_description: jobDesc }),
  save: (jobId) => apiRequest('POST', '/api/jobs/' + jobId + '/save'),
  getSaved: () => apiRequest('GET', '/api/jobs/saved'),
  unsave: (jobId) => apiRequest('DELETE', '/api/jobs/' + jobId + '/save'),
};

const applicationsAPI = {
  create: (data) => apiRequest('POST', '/api/applications', data),
  list: (params) => apiRequest('GET', '/api/applications', params),
  get: (id) => apiRequest('GET', '/api/applications/' + id),
  update: (id, data) => apiRequest('PUT', '/api/applications/' + id, data),
  delete: (id) => apiRequest('DELETE', '/api/applications/' + id),
  getStats: () => apiRequest('GET', '/api/applications/stats'),
  generateCoverLetter: (data) => apiRequest('POST', '/api/applications/generate-cover-letter', data),
  listCoverLetters: () => apiRequest('GET', '/api/applications/cover-letters'),
};

const coverLettersAPI = {
  generate: (data) => apiRequest('POST', '/api/cover-letters/generate', data),
  save: (data) => apiRequest('POST', '/api/cover-letters', data),
  list: () => apiRequest('GET', '/api/cover-letters'),
  delete: (id) => apiRequest('DELETE', '/api/cover-letters/' + id),
};

const interviewsAPI = {
  create: (data) => apiRequest('POST', '/api/interviews', data),
  list: () => apiRequest('GET', '/api/interviews'),
  upcoming: () => apiRequest('GET', '/api/interviews/upcoming'),
  get: (id) => apiRequest('GET', '/api/interviews/' + id),
  update: (id, data) => apiRequest('PUT', '/api/interviews/' + id, data),
  complete: (id, data) => apiRequest('PUT', '/api/interviews/' + id + '/complete', data),
  delete: (id) => apiRequest('DELETE', '/api/interviews/' + id),
};

const alertsAPI = {
  create: (data) => apiRequest('POST', '/api/alerts', data),
  list: () => apiRequest('GET', '/api/alerts'),
  update: (id, data) => apiRequest('PUT', '/api/alerts/' + id, data),
  delete: (id) => apiRequest('DELETE', '/api/alerts/' + id),
  trigger: (id) => apiRequest('POST', '/api/alerts/' + id + '/trigger'),
  getNotifications: () => apiRequest('GET', '/api/alerts/notifications'),
  markRead: (id) => apiRequest('PUT', '/api/alerts/notifications/' + id + '/read'),
  markAllRead: () => apiRequest('PUT', '/api/alerts/notifications/read-all'),
  getUnreadCount: () => apiRequest('GET', '/api/alerts/notifications/unread-count'),
};

const skillsAPI = {
  analyzeGap: (data) => apiRequest('POST', '/api/skills/analyze-gap', data),
  getResources: (data) => apiRequest('POST', '/api/skills/resources', data),
};

const autoApplyAPI = {
  getPortals: () => apiRequest('GET', '/api/auto-apply/portals'),
  getPortalFields: (portal) => apiRequest('GET', '/api/auto-apply/portals/' + portal + '/fields'),
  prepare: (data) => apiRequest('POST', '/api/auto-apply/prepare', data),
  submit: (data) => apiRequest('POST', '/api/auto-apply/submit', data),
};

const careerAPI = {
  getAdvice: (data) => apiRequest('POST', '/api/career/advice', data),
  predictSalary: (data) => apiRequest('POST', '/api/career/predict-salary', data),
  getTrendingSkills: () => apiRequest('GET', '/api/career/trending-skills'),
  getCertifications: (data) => apiRequest('POST', '/api/career/certifications', data),
};

const interviewPrepAPI = {
  generateQuestions: (data) => apiRequest('POST', '/api/interview-prep/generate', data),
  evaluateAnswer: (data) => apiRequest('POST', '/api/interview-prep/evaluate', data),
  getHistory: () => apiRequest('GET', '/api/interview-prep/history'),
};

const emailAPI = {
  generate: (data) => apiRequest('POST', '/api/email/generate', data),
  getTemplates: () => apiRequest('GET', '/api/email/templates'),
  getHistory: () => apiRequest('GET', '/api/email/history'),
};

const portfolioAPI = {
  get: () => apiRequest('GET', '/api/portfolio'),
  generate: (data) => apiRequest('POST', '/api/portfolio/generate', data),
  update: (data) => apiRequest('PUT', '/api/portfolio', data),
};

const linkedinAPI = {
  optimize: (data) => apiRequest('POST', '/api/linkedin/optimize', data),
  getKeywords: (data) => apiRequest('POST', '/api/linkedin/keywords', data),
  getAnalytics: () => apiRequest('GET', '/api/linkedin/analytics'),
};

const analyticsAPI = {
  getOverview: () => apiRequest('GET', '/api/analytics/overview'),
  getMonthly: () => apiRequest('GET', '/api/analytics/monthly'),
  getSkillsGrowth: () => apiRequest('GET', '/api/analytics/skills-growth'),
  getATSTrend: () => apiRequest('GET', '/api/analytics/ats-trend'),
  getSuccessRate: () => apiRequest('GET', '/api/analytics/success-rate'),
};

const adminAPI = {
  getStats: () => apiRequest('GET', '/api/admin/stats'),
  getUsers: (params) => apiRequest('GET', '/api/admin/users', params),
  updateUser: (id, data) => apiRequest('PUT', '/api/admin/users/' + id, data),
  deleteUser: (id) => apiRequest('DELETE', '/api/admin/users/' + id),
  getJobs: (params) => apiRequest('GET', '/api/admin/jobs', params),
  updateJob: (id, data) => apiRequest('PUT', '/api/admin/jobs/' + id, data),
  deleteJob: (id) => apiRequest('DELETE', '/api/admin/jobs/' + id),
};

const forgotPasswordAPI = {
  requestOTP: (email) => apiRequest('POST', '/api/auth/forgot-password', { email }),
  verifyOTP: (email, otp) => apiRequest('POST', '/api/auth/verify-otp', { email, otp }),
  resetPassword: (token, newPassword) => apiRequest('POST', '/api/auth/reset-password', { token, new_password: newPassword }),
};

const jobAnalyzerAPI = {
  analyze: (data) => apiRequest('POST', '/api/job-analyzer/analyze', data),
  match: (data) => apiRequest('POST', '/api/job-analyzer/match', data),
  improve: (data) => apiRequest('POST', '/api/job-analyzer/improve', data),
};

const downloadsAPI = {
  downloadResume: (id) => apiRequest('GET', '/api/downloads/resume/' + id, null, false, 'blob'),
  downloadCoverLetter: (id) => apiRequest('GET', '/api/downloads/cover-letter/' + id, null, false, 'blob'),
  downloadPortfolio: () => apiRequest('GET', '/api/downloads/portfolio', null, false, 'blob'),
  downloadApplicationHistory: () => apiRequest('GET', '/api/downloads/application-history', null, false, 'blob'),
  getUrls: () => apiRequest('GET', '/api/downloads/urls'),
};
