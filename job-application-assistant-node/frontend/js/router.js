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
  const isAuthenticated = !!getToken();

  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.auth-container').forEach(a => a.style.display = 'none');

  // Handle authentication routing
  if (!isAuthenticated && !isAuthPage) {
    // Not authenticated and trying to access a protected page -> redirect to login
    navigateTo('login');
    return;
  }

  if (isAuthenticated && isAuthPage) {
    // Authenticated and on an auth page -> redirect to dashboard
    navigateTo('dashboard');
    return;
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
    'admin': 'initAdmin'
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
  if (user && nameEl) {
    nameEl.textContent = user.name || user.username || 'User';
  }
  if (user && avatarEl) {
    avatarEl.textContent = (user.name || user.username || 'U')[0].toUpperCase();
  }
}

// Event listeners
window.addEventListener('hashchange', renderPage);
window.addEventListener('popstate', renderPage);
