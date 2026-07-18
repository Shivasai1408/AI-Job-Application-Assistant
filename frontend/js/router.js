// ===== Hash-based SPA Router =====

function navigateTo(hash) {
  window.location.hash = hash;
  renderPage();
}

function getCurrentRoute() {
  const hash = window.location.hash.replace('#', '');
  return hash || 'dashboard';
}

function renderPage() {
  const route = getCurrentRoute();
  const isAuthPage = ['login', 'register', 'forgot-password'].includes(route);
  const isCompanyRoute = ['company-dashboard', 'company-profile', 'company-jobs', 'company-post-job', 'company-applicants'].includes(route);
  const isAuthenticated = !!getToken();
  const user = getUser();
  const userRole = user ? (user.role || 'jobseeker') : 'jobseeker';

  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.auth-container').forEach(a => a.style.display = 'none');

  // Handle authentication routing
  if (!isAuthenticated && !isAuthPage) {
    navigateTo('login');
    return;
  }

  if (isAuthenticated && isAuthPage) {
    // Redirect based on role
    if (userRole === 'company') {
      navigateTo('company-dashboard');
    } else {
      navigateTo('dashboard');
    }
    return;
  }

  // Handle role-based route access
  if (isAuthenticated) {
    if (userRole === 'company' && !isCompanyRoute && !['login', 'register', 'forgot-password', 'profile'].includes(route)) {
      // Company user trying to access employee pages - but allow profile
      navigateTo('company-dashboard');
      return;
    }
    if (userRole === 'jobseeker' && isCompanyRoute) {
      // Jobseeker trying to access company pages
      navigateTo('dashboard');
      return;
    }
  }

  const appLayout = document.getElementById('app-layout');
  const authPages = document.getElementById('page-login').parentNode;

  if (isAuthPage) {
    // Show auth page
    appLayout.style.display = 'none';
    document.querySelectorAll('.auth-container').forEach(a => a.classList.remove('active'));
    const authPage = document.getElementById('page-' + route);
    if (authPage) {
      authPage.style.display = 'flex';
      authPage.classList.add('active');
    }
  } else {
    // Show app layout
    appLayout.style.display = 'flex';
    document.querySelectorAll('.auth-container').forEach(a => a.style.display = 'none');
    const page = document.getElementById('page-' + route);
    if (page) {
      page.style.display = 'block';
      page.classList.add('active');
    }
  }

  // Update sidebar active state
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('href') === '#' + route) {
      item.classList.add('active');
    }
  });

  // Update topbar title
  const titles = {
    'dashboard': 'Dashboard',
    'resumes': 'My Resumes',
    'resume-builder': 'Resume Builder',
    'resume-templates': 'Resume Templates',
    'ats-score': 'ATS Score',
    'skill-gap': 'Skill Gap',
    'jobs': 'Job Search',
    'job-details': 'Job Details',
    'applications': 'Applications',
    'interviews': 'Interviews',
    'auto-apply': 'Auto-Apply',
    'cover-letters': 'Cover Letters',
    'alerts': 'Job Alerts',
    'email-generator': 'Email Generator',
    'downloads': 'Downloads',
    'profile': 'Profile',
    'career-advisor': 'Career Advisor',
    'interview-prep': 'Interview Prep',
    'job-analyzer': 'Job Analyzer',
    'linkedin-optimizer': 'LinkedIn Optimizer',
    'portfolio': 'Portfolio Builder',
    'analytics': 'Analytics',
    'admin': 'Admin Panel',
    'company-dashboard': 'Company Dashboard',
    'company-profile': 'Company Profile',
    'company-jobs': 'My Job Postings',
    'company-post-job': 'Post a Job',
    'company-applicants': 'Applicants',
    'login': 'Sign In',
    'register': 'Create Account',
    'forgot-password': 'Reset Password'
  };
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = titles[route] || 'Dashboard';

  // Update user info in topbar
  updateTopbarUser();

  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  }

  // Call page-specific init function
  const initFnMap = {
    'login': 'initLogin',
    'register': 'initRegister',
    'forgot-password': 'initForgotPassword',
    'dashboard': 'initDashboard',
    'resumes': 'initResumes',
    'resume-builder': 'initResumeBuilder',
    'resume-templates': 'initResumeTemplates',
    'ats-score': 'initATSScore',
    'skill-gap': 'initSkillGap',
    'jobs': 'initJobs',
    'job-details': 'initJobDetails',
    'applications': 'initApplications',
    'interviews': 'initInterviews',
    'auto-apply': 'initAutoApply',
    'cover-letters': 'initCoverLetters',
    'alerts': 'initAlerts',
    'email-generator': 'initEmailGenerator',
    'downloads': 'initDownloads',
    'profile': 'initProfile',
    'career-advisor': 'initCareerAdvisor',
    'interview-prep': 'initInterviewPrep',
    'job-analyzer': 'initJobAnalyzer',
    'linkedin-optimizer': 'initLinkedInOptimizer',
    'portfolio': 'initPortfolio',
    'analytics': 'initAnalytics',
    'admin': 'initAdmin',
    'company-dashboard': 'initCompanyDashboard',
    'company-profile': 'initCompanyProfile',
    'company-jobs': 'initCompanyJobs',
    'company-post-job': 'initCompanyPostJob',
    'company-applicants': 'initCompanyApplicants'
  };

  const fnName = initFnMap[route];
  if (fnName && typeof window[fnName] === 'function') {
    window[fnName]();
  }
}

function updateTopbarUser() {
  const user = getUser();
  const nameEl = document.getElementById('user-name');
  const avatarEl = document.getElementById('user-avatar');
  const userRole = user ? (user.role || 'jobseeker') : 'jobseeker';
  
  if (user && nameEl) {
    nameEl.textContent = user.name || user.username || 'User';
  }
  if (user && avatarEl) {
    avatarEl.textContent = (user.name || user.username || 'U')[0].toUpperCase();
  }

  // Toggle sidebar sections based on role
  const employeeSection = document.querySelector('.sidebar-section-employee');
  const companySection = document.querySelector('.sidebar-section-company');
  if (employeeSection) {
    employeeSection.style.display = (userRole === 'company') ? 'none' : '';
  }
  if (companySection) {
    companySection.style.display = (userRole === 'company') ? '' : 'none';
  }
}

// Event listeners
window.addEventListener('hashchange', renderPage);
window.addEventListener('popstate', renderPage);
