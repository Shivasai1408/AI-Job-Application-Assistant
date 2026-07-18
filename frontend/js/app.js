// ===== Main Application =====

// ===== Utility Helpers =====

function showError(el, message) {
  if (!el) return;
  el.innerHTML = '<div class="alert alert-danger">' + escapeHtml(message) + '</div>';
}

function showSuccess(el, message) {
  if (!el) return;
  el.innerHTML = '<div class="alert alert-success">' + escapeHtml(message) + '</div>';
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showSpinner(el) {
  if (!el) return;
  el.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
}

function openModal(title, bodyHtml, footerHtml) {
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalFooter = document.getElementById('modal-footer');
  if (modalTitle) modalTitle.textContent = title || '';
  if (modalBody) modalBody.innerHTML = bodyHtml || '';
  if (modalFooter && footerHtml) modalFooter.innerHTML = footerHtml;
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.add('active');
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.remove('active');
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('open');
}

// ===== Initialization =====

document.addEventListener('DOMContentLoaded', function() {
  init();
});

function init() {
  // Set up sidebar navigation click handlers
  document.querySelectorAll('.sidebar-nav-item').forEach(function(item) {
    item.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        navigateTo(href.substring(1));
      }
    });
  });

  // Set up logout handler
  const logoutBtn = document.querySelector('.sidebar-footer .sidebar-nav-item');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      logout();
    });
  }

  // Set up mobile sidebar toggle
  const mobileToggle = document.getElementById('mobile-toggle');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', function(e) {
      e.preventDefault();
      toggleSidebar();
    });
  }

  // Close sidebar overlay on click
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', function() {
      toggleSidebar();
    });
  }

  // Close modal on overlay click
  const modalOverlay = document.getElementById('modal-overlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function(e) {
      if (e.target === this) closeModal();
    });
  }

  // Initial page render
  renderPage();
}


// ============================================================
// PAGE: Login
// ============================================================
window.initLogin = function() {
  const form = document.getElementById('login-form');
  if (!form) return;
  // Remove existing listeners by cloning
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error') || document.querySelector('#page-login .alert');
    if (errorEl) errorEl.remove();

    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Signing in...';

    const result = await authAPI.login(email, password);

    if (result.error) {
      btn.disabled = false;
      btn.textContent = 'Sign In';
      const errorDiv = document.createElement('div');
      errorDiv.id = 'login-error';
      errorDiv.className = 'alert alert-danger';
      errorDiv.textContent = result.error;
      this.prepend(errorDiv);
      return;
    }

    setAuthData(result.data.token || result.data.access_token, result.data.user || { name: email.split('@')[0], email: email });
    const userRole = result.data.user ? (result.data.user.role || 'jobseeker') : 'jobseeker';
    navigateTo(userRole === 'company' ? 'company-dashboard' : 'dashboard');
  });
};


// ============================================================
// PAGE: Register
// ============================================================
window.initRegister = function() {
  const form = document.getElementById('register-form');
  if (!form) return;
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;
    const role = document.getElementById('reg-role') ? document.getElementById('reg-role').value : 'jobseeker';
    const errorEl = document.getElementById('register-error') || document.querySelector('#page-register .alert');
    if (errorEl) errorEl.remove();

    // Validate passwords match
    if (password !== confirm) {
      const errorDiv = document.createElement('div');
      errorDiv.id = 'register-error';
      errorDiv.className = 'alert alert-danger';
      errorDiv.textContent = 'Passwords do not match.';
      this.prepend(errorDiv);
      return;
    }

    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Creating account...';

    const result = await authAPI.register({ full_name: name, email: email, username: username, password: password, role: role });

    if (result.error) {
      btn.disabled = false;
      btn.textContent = 'Create Account';
      const errorDiv = document.createElement('div');
      errorDiv.id = 'register-error';
      errorDiv.className = 'alert alert-danger';
      errorDiv.textContent = result.error;
      this.prepend(errorDiv);
      return;
    }

    const userData = result.data.user || { name: name, email: email, username: username, role: role };
    setAuthData(result.data.token || result.data.access_token, userData);
    // Redirect based on role
    if (role === 'company') {
      navigateTo('company-dashboard');
    } else {
      navigateTo('dashboard');
    }
  });
};


// ============================================================
// PAGE: Forgot Password
// ============================================================
let forgotResetToken = null;

window.initForgotPassword = function() {
  // Step 1: Email form
  const step1Form = document.getElementById('forgot-step-1');
  if (step1Form) {
    const newStep1 = step1Form.cloneNode(true);
    step1Form.parentNode.replaceChild(newStep1, step1Form);
    newStep1.addEventListener('submit', async function(e) {
      e.preventDefault();
      const email = document.getElementById('forgot-email').value.trim();
      const btn = this.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Sending...';

      // Clear previous messages
      const msgEl = document.getElementById('forgot-message');
      if (msgEl) msgEl.remove();

      const result = await forgotPasswordAPI.requestOTP(email);

      btn.disabled = false;
      btn.textContent = 'Send OTP';

      if (result.error) {
        const errDiv = document.createElement('div');
        errDiv.id = 'forgot-message';
        errDiv.className = 'alert alert-danger';
        errDiv.textContent = result.error;
        this.prepend(errDiv);
        return;
      }

      // Store email for next steps
      this.dataset.email = email;
      showSuccess(this.parentElement, 'OTP sent to your email.');
      showForgotStep(2);
    });
  }

  // Step 2: OTP form
  const step2Form = document.getElementById('forgot-step-2');
  if (step2Form) {
    const newStep2 = step2Form.cloneNode(true);
    step2Form.parentNode.replaceChild(newStep2, step2Form);
    newStep2.addEventListener('submit', async function(e) {
      e.preventDefault();
      const otp = document.getElementById('forgot-otp').value.trim();
      const email = document.getElementById('forgot-step-1')?.dataset?.email || document.getElementById('forgot-email').value.trim();
      const btn = this.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Verifying...';

      const msgEl = document.getElementById('forgot-message');
      if (msgEl) msgEl.remove();

      const result = await forgotPasswordAPI.verifyOTP(email, otp);

      btn.disabled = false;
      btn.textContent = 'Verify OTP';

      if (result.error) {
        const errDiv = document.createElement('div');
        errDiv.id = 'forgot-message';
        errDiv.className = 'alert alert-danger';
        errDiv.textContent = result.error;
        this.prepend(errDiv);
        return;
      }

      forgotResetToken = result.data.token || result.data.reset_token;
      showSuccess(this.parentElement, 'OTP verified successfully.');
      showForgotStep(3);
    });
  }

  // Step 3: New password form
  const step3Form = document.getElementById('forgot-step-3');
  if (step3Form) {
    const newStep3 = step3Form.cloneNode(true);
    step3Form.parentNode.replaceChild(newStep3, step3Form);
    newStep3.addEventListener('submit', async function(e) {
      e.preventDefault();
      const newPass = document.getElementById('forgot-newpass').value;
      const confirm = document.getElementById('forgot-confirm').value;
      const btn = this.querySelector('button[type="submit"]');
      const msgEl = document.getElementById('forgot-message');
      if (msgEl) msgEl.remove();

      if (newPass !== confirm) {
        const errDiv = document.createElement('div');
        errDiv.id = 'forgot-message';
        errDiv.className = 'alert alert-danger';
        errDiv.textContent = 'Passwords do not match.';
        this.prepend(errDiv);
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Resetting...';

      const token = forgotResetToken || localStorage.getItem('reset_token');
      const result = await forgotPasswordAPI.resetPassword(token, newPass);

      btn.disabled = false;
      btn.textContent = 'Reset Password';

      if (result.error) {
        const errDiv = document.createElement('div');
        errDiv.id = 'forgot-message';
        errDiv.className = 'alert alert-danger';
        errDiv.textContent = result.error;
        this.prepend(errDiv);
        return;
      }

      forgotResetToken = null;
      // Show success and redirect
      const successDiv = document.createElement('div');
      successDiv.id = 'forgot-message';
      successDiv.className = 'alert alert-success';
      successDiv.textContent = 'Password reset successful! Redirecting to login...';
      this.prepend(successDiv);

      setTimeout(function() {
        navigateTo('login');
      }, 2000);
    });
  }
};

// Forgot password step helper (used by inline script as well)
function showForgotStep(step) {
  document.querySelectorAll('.auth-step').forEach(function(el) {
    el.classList.remove('active');
  });
  document.querySelectorAll('.auth-step-dot').forEach(function(dot) {
    dot.classList.remove('active', 'completed');
    const s = parseInt(dot.dataset.step);
    if (s === step) dot.classList.add('active');
    else if (s < step) dot.classList.add('completed');
  });
  const stepEl = document.querySelector('.auth-step[data-step="' + step + '"]');
  if (stepEl) stepEl.classList.add('active');
}


// ============================================================
// PAGE: Dashboard
// ============================================================
window.initDashboard = function() {
  loadDashboardStats();
  loadRecommendedJobs();
  loadRecentApplications();
};

async function loadDashboardStats() {
  const statCards = document.querySelectorAll('#page-dashboard .stat-card .stat-card-value');
  const result = await applicationsAPI.getStats();
  if (result.error || !result.data) return;

  const stats = result.data;
  const labels = ['resumes', 'applications', 'interviews', 'active_submissions'];
  statCards.forEach(function(card, index) {
    const key = labels[index];
    if (card && stats[key] !== undefined) {
      card.textContent = stats[key];
    }
  });
}

async function loadRecommendedJobs() {
  const container = document.querySelector('#page-dashboard .grid-2');
  if (!container) return;

  const result = await jobsAPI.getRecommended();
  if (result.error || !result.data || !result.data.jobs) return;

  const jobs = result.data.jobs;
  if (!jobs.length) return;

  container.innerHTML = '';
  jobs.forEach(function(job) {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.innerHTML = `
      <div class="job-card-title">${escapeHtml(job.title)}</div>
      <div class="job-card-company">${escapeHtml(job.company || '')}</div>
      <div class="job-card-details">
        <span class="job-card-detail">📍 ${escapeHtml(job.location || 'Remote')}</span>
        <span class="job-card-detail">💰 ${escapeHtml(job.salary || 'Competitive')}</span>
        <span class="job-card-detail">⏰ ${escapeHtml(job.type || 'Full-time')}</span>
      </div>
      <div class="job-card-footer">
        <span class="badge badge-primary">Match: ${job.match_score || 'N/A'}%</span>
        <button class="btn btn-sm btn-primary" onclick="navigateTo('job-details')">Apply Now</button>
      </div>
    `;
    container.appendChild(card);
  });
}

async function loadRecentApplications() {
  const container = document.querySelector('#page-dashboard .card .empty-state');
  if (!container) return;
  const parentCard = container.closest('.card');
  if (!parentCard) return;

  const result = await applicationsAPI.list({ limit: 5 });
  if (result.error || !result.data || !result.data.applications || !result.data.applications.length) return;

  const apps = result.data.applications;
  let tableHtml = '<div class="table-container"><table class="table"><thead><tr><th>Job Title</th><th>Company</th><th>Date</th><th>Status</th></tr></thead><tbody>';
  apps.forEach(function(app) {
    const statusBadge = app.status === 'applied' ? 'badge-info' : app.status === 'interviewing' ? 'badge-primary' : app.status === 'offer' ? 'badge-success' : app.status === 'rejected' ? 'badge-danger' : 'badge-warning';
    tableHtml += '<tr><td>' + escapeHtml(app.job_title || '') + '</td><td>' + escapeHtml(app.company || '') + '</td><td>' + (app.created_at ? new Date(app.created_at).toLocaleDateString() : '') + '</td><td><span class="badge ' + statusBadge + '">' + escapeHtml(app.status) + '</span></td></tr>';
  });
  tableHtml += '</tbody></table></div>';
  parentCard.innerHTML = tableHtml;
}


// ============================================================
// PAGE: Resumes
// ============================================================
window.initResumes = function() {
  loadResumes();
  setupResumeUpload();
};

async function loadResumes() {
  const container = document.querySelector('#page-resumes .grid-3');
  if (!container) return;

  showSpinner(container);
  const result = await resumeAPI.list();
  if (result.error) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📄</div><div class="empty-state-title">Error loading resumes</div><div class="empty-state-text">' + escapeHtml(result.error) + '</div></div>';
    return;
  }

  const resumes = result.data && result.data.resumes ? result.data.resumes : (Array.isArray(result.data) ? result.data : []);
  if (!resumes.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📄</div><div class="empty-state-title">No resumes yet</div><div class="empty-state-text">Upload your first resume or create one with the builder.</div></div>';
    return;
  }

  container.innerHTML = '';
  resumes.forEach(function(resume) {
    const statusBadge = resume.is_primary ? 'badge-success' : resume.status === 'optimized' ? 'badge-primary' : 'badge-warning';
    const statusText = resume.is_primary ? 'Primary' : resume.status || 'Draft';
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-header">
        <span class="card-title">${escapeHtml(resume.title || resume.name || 'Untitled')}</span>
        <span class="badge ${statusBadge}">${escapeHtml(statusText)}</span>
      </div>
      <div style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">
        <div>📅 Updated: ${resume.updated_at ? new Date(resume.updated_at).toLocaleDateString() : 'N/A'}</div>
        <div>📊 ATS Score: ${resume.ats_score || 'N/A'}%</div>
        <div>📄 ${(resume.format || 'PDF').toUpperCase()}</div>
      </div>
      <div class="flex gap-8">
        <button class="btn btn-sm btn-secondary edit-resume" data-id="${resume.id || ''}">✏️ Edit</button>
        <button class="btn btn-sm btn-secondary download-resume" data-id="${resume.id || ''}">📥 Download</button>
        <button class="btn btn-sm btn-danger delete-resume" data-id="${resume.id || ''}">🗑️</button>
      </div>
    `;
    container.appendChild(card);
  });

  // Bind delete handlers
  container.querySelectorAll('.delete-resume').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      if (!confirm('Delete this resume?')) return;
      const id = this.dataset.id;
      const result = await resumeAPI.delete(id);
      if (!result.error) loadResumes();
      else showError(container, result.error);
    });
  });
}

function setupResumeUpload() {
  const uploadBtn = document.querySelector('#page-resumes .btn-primary');
  if (!uploadBtn) return;
  const newBtn = uploadBtn.cloneNode(true);
  uploadBtn.parentNode.replaceChild(newBtn, uploadBtn);

  newBtn.addEventListener('click', function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx';
    input.addEventListener('change', async function() {
      if (!this.files.length) return;
      const formData = new FormData();
      formData.append('file', this.files[0]);
      const result = await resumeAPI.upload(formData);
      if (!result.error) loadResumes();
      else alert(result.error);
    });
    input.click();
  });
}


// ============================================================
// PAGE: Resume Builder
// ============================================================
window.initResumeBuilder = function() {
  const form = document.querySelector('#page-resume-builder form');
  if (!form) return;
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const inputs = this.querySelectorAll('input, textarea');
    const data = {};
    inputs.forEach(function(input) {
      data[input.placeholder.toLowerCase().replace(/\s+/g, '_')] = input.value;
    });

    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const result = await resumeAPI.create(data);
    btn.disabled = false;
    btn.textContent = '💾 Save Resume';

    if (result.error) {
      showError(this, result.error);
    } else {
      showSuccess(this, 'Resume saved successfully!');
      setTimeout(function() { navigateTo('resumes'); }, 1500);
    }
  });
};


// ============================================================
// PAGE: Resume Templates
// ============================================================
window.initResumeTemplates = function() {
  document.querySelectorAll('#page-resume-templates .template-card .btn-primary').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const title = this.closest('.template-card').querySelector('.template-card-title')?.textContent || 'Template';
      openModal('Use Template', '<p>Create a new resume using the <strong>' + escapeHtml(title) + '</strong> template?</p><p style="color:var(--text-secondary);font-size:13px;">This will open the resume builder with this template.</p>', '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="closeModal();navigateTo(\'resume-builder\')">Use Template</button>');
    });
  });
};


// ============================================================
// PAGE: ATS Score
// ============================================================
window.initATSScore = function() {
  const form = document.querySelector('#page-ats-score form');
  if (!form) return;
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const textareas = this.querySelectorAll('textarea');
    const selects = this.querySelectorAll('select');
    const resumeText = textareas.length > 0 ? textareas[0].value.trim() : '';
    const jobDesc = textareas.length > 1 ? textareas[1].value.trim() : textareas[0].value.trim() || '';
    const urlInput = this.querySelector('input[type="url"]');
    const jobUrl = urlInput ? urlInput.value.trim() : '';

    if (!resumeText && !jobUrl) {
      alert('Please provide a resume or job description URL.');
      return;
    }

    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Analyzing...';

    const result = await resumeAPI.analyzeATSText(resumeText, jobDesc || jobUrl);
    btn.disabled = false;
    btn.textContent = '🔍 Analyze Resume';

    if (result.error) {
      showError(this, result.error);
      return;
    }

    // Show results
    const resultsDiv = document.getElementById('ats-results');
    const emptyState = resultsDiv?.previousElementSibling;
    if (emptyState) emptyState.style.display = 'none';
    if (resultsDiv) {
      resultsDiv.style.display = 'block';
      const score = result.data.score || result.data.ats_score || 86;
      const scoreEl = resultsDiv.querySelector('.stat-card-value');
      if (scoreEl) scoreEl.textContent = score + '%';
      const fillEl = resultsDiv.querySelector('.progress-bar-fill');
      if (fillEl) fillEl.style.width = score + '%';

      // Update breakdown if available
      const breakdown = result.data.breakdown || result.data.sections || {};
      const breakdownItems = resultsDiv.querySelectorAll('[style*="font-size:13px;color:var(--text-secondary)"] div');
      if (breakdownItems.length && Object.keys(breakdown).length) {
        const keys = Object.keys(breakdown);
        breakdownItems.forEach(function(item, i) {
          if (i < keys.length) {
            const label = item.querySelector('span:first-child');
            const value = item.querySelector('span:last-child');
            if (label) label.textContent = '✅ ' + keys[i].replace(/_/g, ' ');
            if (value) value.textContent = breakdown[keys[i]] + '%';
          }
        });
      }
    }
  });
};


// ============================================================
// PAGE: Skill Gap
// ============================================================
window.initSkillGap = function() {
  const form = document.querySelector('#page-skill-gap form');
  if (!form) return;
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const inputs = this.querySelectorAll('input, textarea, select');
    const data = {};
    inputs.forEach(function(input) {
      if (input.type === 'select-one') {
        data[input.previousElementSibling?.textContent?.toLowerCase().replace(/\s+/g, '_') || 'field'] = input.value;
      } else {
        data[input.placeholder?.toLowerCase().replace(/\s+/g, '_') || 'field'] = input.value;
      }
    });

    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Analyzing...';

    const result = await skillsAPI.analyzeGap(data);
    btn.disabled = false;
    btn.textContent = '🧠 Analyze Skills';

    if (result.error) {
      showError(this, result.error);
      return;
    }

    // Display results in the right column
    const resultsCard = document.querySelector('#page-skill-gap .grid-2 > div:last-child .card:first-child .empty-state');
    const resourcesCard = document.querySelector('#page-skill-gap .grid-2 > div:last-child .card:last-child .empty-state');

    if (resultsCard) {
      const gap = result.data;
      let html = '<div style="margin-bottom:16px;">';
      if (gap.matched && gap.matched.length) {
        html += '<div style="margin-bottom:12px;"><span style="font-weight:600;color:var(--success);">✅ Matched Skills</span><div class="flex gap-8" style="margin-top:8px;flex-wrap:wrap;">';
        gap.matched.forEach(function(s) { html += '<span class="badge badge-success">' + escapeHtml(s) + '</span>'; });
        html += '</div></div>';
      }
      if (gap.partial && gap.partial.length) {
        html += '<div style="margin-bottom:12px;"><span style="font-weight:600;color:var(--warning);">⚠️ Partial Match</span><div class="flex gap-8" style="margin-top:8px;flex-wrap:wrap;">';
        gap.partial.forEach(function(s) { html += '<span class="badge badge-warning">' + escapeHtml(s) + '</span>'; });
        html += '</div></div>';
      }
      if (gap.missing && gap.missing.length) {
        html += '<div><span style="font-weight:600;color:var(--danger);">❌ Missing Skills</span><div class="flex gap-8" style="margin-top:8px;flex-wrap:wrap;">';
        gap.missing.forEach(function(s) { html += '<span class="badge badge-danger">' + escapeHtml(s) + '</span>'; });
        html += '</div></div>';
      }
      html += '</div>';
      resultsCard.innerHTML = html;
      resultsCard.classList.remove('empty-state');
      resultsCard.style.padding = '0';
    }

    if (resourcesCard && result.data.resources) {
      const resources = result.data.resources;
      if (resources.length) {
        let html = '<div>';
        resources.forEach(function(r) {
          html += '<div style="padding:8px 0;border-bottom:1px solid var(--border-color);font-size:13px;">📚 <a href="' + escapeHtml(r.url || '#') + '" target="_blank">' + escapeHtml(r.title || r.name) + '</a></div>';
        });
        html += '</div>';
        resourcesCard.innerHTML = html;
        resourcesCard.classList.remove('empty-state');
        resourcesCard.style.padding = '0';
      }
    }
  });
};


// ============================================================
// PAGE: Jobs / Job Search
// ============================================================
window.initJobs = function() {
  const searchForm = document.querySelector('#page-jobs .card .flex');
  if (!searchForm) return;
  const newForm = searchForm.cloneNode(true);
  searchForm.parentNode.replaceChild(newForm, searchForm);

  newForm.addEventListener('submit', function(e) {
    e.preventDefault();
  });

  const searchBtn = newForm.querySelector('.btn-primary');
  if (searchBtn) {
    searchBtn.addEventListener('click', searchJobs);
  }

  // Bind save/unsave buttons
  document.querySelectorAll('#page-jobs .job-card .btn-primary').forEach(function(btn) {
    if (btn.textContent.trim() === 'Apply') {
      btn.addEventListener('click', function() {
        navigateTo('job-details');
      });
    }
  });

  document.querySelectorAll('#page-jobs .job-card .btn-secondary').forEach(function(btn) {
    if (btn.textContent.trim() === 'Save') {
      btn.addEventListener('click', async function() {
        const card = this.closest('.job-card');
        const title = card?.querySelector('.job-card-title')?.textContent || '';
        btn.textContent = 'Saving...';
        btn.disabled = true;
        // Simulate save
        setTimeout(function() {
          btn.textContent = '✅ Saved';
          btn.classList.remove('btn-secondary');
          btn.classList.add('btn-success');
          btn.disabled = true;
        }, 500);
      });
    }
  });
};

async function searchJobs() {
  const container = document.querySelector('#page-jobs .grid-2');
  if (!container) return;

  const input = document.querySelector('#page-jobs input[type="text"]');
  const location = document.querySelectorAll('#page-jobs input[type="text"]')[1];
  const typeSelect = document.querySelector('#page-jobs select');

  const params = { query: input?.value || '', location: location?.value || '' };
  if (typeSelect && typeSelect.value !== 'All Types') {
    params.type = typeSelect.value;
  }

  showSpinner(container);
  const result = await jobsAPI.search(params);
  if (result.error) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">Search error</div><div class="empty-state-text">' + escapeHtml(result.error) + '</div></div>';
    return;
  }

  const jobs = result.data && result.data.jobs ? result.data.jobs : (Array.isArray(result.data) ? result.data : []);
  if (!jobs.length) {
    container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon">🔍</div><div class="empty-state-title">No jobs found</div><div class="empty-state-text">Try different search terms or filters.</div></div>';
    return;
  }

  container.innerHTML = '';
  jobs.forEach(function(job) {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.innerHTML = `
      <div class="job-card-title">${escapeHtml(job.title)}</div>
      <div class="job-card-company">${escapeHtml(job.company || '')} ${job.featured ? '<span class="tag tag-primary">Featured</span>' : ''}</div>
      <div class="job-card-details">
        <span class="job-card-detail">📍 ${escapeHtml(job.location || 'Remote')}</span>
        <span class="job-card-detail">💰 ${escapeHtml(job.salary || 'Competitive')}</span>
        <span class="job-card-detail">⏰ ${escapeHtml(job.type || 'Full-time')}</span>
      </div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">Skills: ${escapeHtml(job.skills ? (Array.isArray(job.skills) ? job.skills.join(', ') : job.skills) : '')}</div>
      <div class="job-card-footer">
        <span class="badge badge-primary">Match: ${job.match_score || job.match_percentage || 'N/A'}%</span>
        <div class="flex gap-8">
          <button class="btn btn-sm btn-secondary view-job" onclick="navigateTo('job-details')">Details</button>
          <button class="btn btn-sm btn-primary apply-job">Apply</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}


// ============================================================
// PAGE: Job Details
// ============================================================
window.initJobDetails = function() {
  // Bind apply button
  const applyBtn = document.querySelector('#page-job-details .btn-primary');
  if (applyBtn) {
    applyBtn.addEventListener('click', async function() {
      this.disabled = true;
      this.textContent = 'Applying...';
      const result = await applicationsAPI.create({ job_title: 'Senior Frontend Developer', company: 'TechCorp Inc.', status: 'applied' });
      this.disabled = false;
      this.textContent = result.error ? '❌ Failed' : '✅ Applied!';
      if (!result.error) setTimeout(() => { this.textContent = '📝 Apply Now'; }, 2000);
    });
  }
};


// ============================================================
// PAGE: Auto-Apply
// ============================================================
window.initAutoApply = function() {
  const form = document.querySelector('#page-auto-apply form');
  if (!form) return;
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const inputs = this.querySelectorAll('input, select');
    const data = {};
    inputs.forEach(function(input) {
      data[input.placeholder?.toLowerCase().replace(/\s+/g, '_') || input.type || 'field'] = input.value;
    });

    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Starting...';

    const result = await autoApplyAPI.prepare(data);
    btn.disabled = false;
    btn.textContent = '⚡ Start Auto-Apply';

    if (result.error) showError(this, result.error);
    else showSuccess(this, 'Auto-apply started! Check back for results.');
  });
};


// ============================================================
// PAGE: Applications
// ============================================================
window.initApplications = function() {
  loadApplications();
  setupApplicationFilters();
};

async function loadApplications() {
  const pipeline = document.querySelector('#page-applications .pipeline');
  const tableBody = document.querySelector('#page-applications .table tbody');
  if (!tableBody) return;

  const result = await applicationsAPI.list();
  if (result.error) return;

  const apps = result.data && result.data.applications ? result.data.applications : (Array.isArray(result.data) ? result.data : []);
  if (!apps.length) return;

  // Update pipeline columns
  if (pipeline) {
    const columns = pipeline.querySelectorAll('.pipeline-column');
    const statusMap = { 'saved': [], 'applied': [], 'interviewing': [], 'offer': [], 'rejected': [] };
    apps.forEach(function(app) {
      const status = (app.status || 'saved').toLowerCase();
      if (statusMap[status]) statusMap[status].push(app);
    });

    columns.forEach(function(col) {
      const title = col.querySelector('.pipeline-column-title')?.textContent?.trim() || '';
      const statusKey = title.includes('Saved') ? 'saved' : title.includes('Applied') ? 'applied' : title.includes('Interview') ? 'interviewing' : title.includes('Offer') ? 'offer' : title.includes('Rejected') ? 'rejected' : null;
      if (!statusKey) return;

      const items = statusMap[statusKey] || [];
      const existingItems = col.querySelectorAll('.pipeline-item');
      existingItems.forEach(function(item, i) {
        if (i < items.length) {
          const app = items[i];
          item.querySelector('.pipeline-item-title').textContent = app.job_title || app.title || 'Untitled';
          item.querySelector('.pipeline-item-sub').textContent = (app.company || '') + (app.created_at ? ' · ' + new Date(app.created_at).toLocaleDateString() : '');
        }
      });
    });
  }

  // Update table
  if (tableBody) {
    tableBody.innerHTML = '';
    apps.forEach(function(app) {
      const statusBadge = app.status === 'applied' ? 'badge-info' : app.status === 'interviewing' ? 'badge-primary' : app.status === 'offer' ? 'badge-success' : app.status === 'rejected' ? 'badge-danger' : 'badge-warning';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(app.job_title || app.title || '')}</td>
        <td>${escapeHtml(app.company || '')}</td>
        <td>${app.created_at ? new Date(app.created_at).toLocaleDateString() : ''}</td>
        <td><span class="badge ${statusBadge}">${escapeHtml(app.status)}</span></td>
        <td><button class="btn btn-sm btn-secondary view-application" data-id="${app.id || ''}">View</button></td>
      `;
      tableBody.appendChild(tr);
    });
  }
}

function setupApplicationFilters() {
  const filterSelects = document.querySelectorAll('#page-applications .form-select');
  filterSelects.forEach(function(select) {
    select.addEventListener('change', loadApplications);
  });

  const addBtn = document.querySelector('#page-applications .btn-primary');
  if (addBtn) {
    addBtn.addEventListener('click', function() {
      openModal('Add Application', `
        <form id="add-application-form">
          <div class="form-group"><label class="form-label">Job Title</label><input type="text" class="form-input" id="app-title" placeholder="e.g. Frontend Developer" required></div>
          <div class="form-group"><label class="form-label">Company</label><input type="text" class="form-input" id="app-company" placeholder="Company name" required></div>
          <div class="form-group"><label class="form-label">Status</label><select class="form-select" id="app-status"><option>Saved</option><option>Applied</option><option>Interviewing</option><option>Offer</option><option>Rejected</option></select></div>
        </form>
      `, '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" id="save-application-btn">Add</button>');

      setTimeout(function() {
        document.getElementById('save-application-btn')?.addEventListener('click', async function() {
          const data = {
            job_title: document.getElementById('app-title')?.value,
            company: document.getElementById('app-company')?.value,
            status: document.getElementById('app-status')?.value?.toLowerCase()
          };
          const result = await applicationsAPI.create(data);
          if (!result.error) { closeModal(); loadApplications(); }
        });
      }, 100);
    });
  }
}


// ============================================================
// PAGE: Interviews
// ============================================================
window.initInterviews = function() {
  loadInterviews();
  setupInterviewSchedule();
};

async function loadInterviews() {
  const timeline = document.querySelector('#page-interviews .timeline');
  if (!timeline) return;

  const result = await interviewsAPI.upcoming();
  if (result.error) return;

  const interviews = result.data && result.data.interviews ? result.data.interviews : (Array.isArray(result.data) ? result.data : []);
  if (!interviews.length) return;

  // Clear static items
  timeline.innerHTML = '';
  interviews.forEach(function(iv) {
    const item = document.createElement('div');
    item.className = 'timeline-item' + (iv.status === 'completed' ? ' completed' : '');
    item.innerHTML = `
      <div class="timeline-item-title">${escapeHtml(iv.title || iv.type || 'Interview')} - ${escapeHtml(iv.company || '')}</div>
      <div class="timeline-item-subtitle">${escapeHtml(iv.company || '')}${iv.type ? ' · ' + iv.type : ''}</div>
      <div class="timeline-item-date">📅 ${iv.date ? new Date(iv.date).toLocaleDateString() : ''}${iv.time ? ' at ' + iv.time : ''}</div>
    `;
    timeline.appendChild(item);
  });
}

function setupInterviewSchedule() {
  const form = document.querySelector('#page-interviews .card:last-child form');
  if (!form) return;
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const inputs = this.querySelectorAll('input, select');
    const data = {};
    inputs.forEach(function(input) {
      data[input.type || input.placeholder?.toLowerCase().replace(/\s+/g, '_') || 'field'] = input.value;
    });

    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Scheduling...';

    const result = await interviewsAPI.create(data);
    btn.disabled = false;
    btn.textContent = '📅 Add to Calendar';

    if (result.error) {
      showError(this, result.error);
    } else {
      showSuccess(this, 'Interview scheduled!');
      loadInterviews();
    }
  });
}


// ============================================================
// PAGE: Cover Letters
// ============================================================
window.initCoverLetters = function() {
  const form = document.querySelector('#page-cover-letters form');
  if (!form) return;
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const inputs = this.querySelectorAll('input, select, textarea');
    const data = {};
    inputs.forEach(function(input) {
      data[input.placeholder?.toLowerCase().replace(/\s+/g, '_') || input.type || 'field'] = input.value;
    });

    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Generating...';

    const result = await coverLettersAPI.generate(data);
    btn.disabled = false;
    btn.textContent = '✉️ Generate Cover Letter';

    if (result.error) {
      showError(this, result.error);
      return;
    }

    // Show result
    const resultCard = document.querySelector('#page-cover-letters .grid-2 > div:last-child .card:first-child .empty-state');
    if (resultCard) {
      const letter = result.data?.cover_letter || result.data?.content || result.data?.text || 'Your generated cover letter will appear here.';
      resultCard.innerHTML = `
        <div style="text-align:left;">
          <div style="white-space:pre-wrap;font-size:14px;line-height:1.8;color:var(--text-secondary);margin-bottom:16px;">${escapeHtml(letter)}</div>
          <button class="btn btn-sm btn-secondary copy-letter">📋 Copy</button>
          <button class="btn btn-sm btn-primary save-letter">💾 Save</button>
        </div>
      `;
      resultCard.classList.remove('empty-state');
      resultCard.style.padding = '0';

      resultCard.querySelector('.copy-letter')?.addEventListener('click', function() {
        navigator.clipboard.writeText(letter).then(function() {
          this.textContent = '✅ Copied!';
          setTimeout(function() { this.textContent = '📋 Copy'; }.bind(this), 2000);
        }.bind(this));
      });

      resultCard.querySelector('.save-letter')?.addEventListener('click', async function() {
        const saveResult = await coverLettersAPI.save({ content: letter, job_title: data.job_title || '', company: data.company_name || '' });
        if (!saveResult.error) showSuccess(resultCard, 'Cover letter saved!');
        else alert(saveResult.error);
      });
    }
  });

  loadSavedCoverLetters();
};

async function loadSavedCoverLetters() {
  const container = document.querySelector('#page-cover-letters .grid-2 > div:last-child .card:last-child .empty-state');
  if (!container) return;

  const result = await coverLettersAPI.list();
  if (result.error || !result.data) return;

  const letters = result.data.cover_letters || result.data;
  if (!letters || (Array.isArray(letters) && !letters.length)) return;

  if (Array.isArray(letters)) {
    container.innerHTML = '';
    container.classList.remove('empty-state');
    letters.forEach(function(letter) {
      const div = document.createElement('div');
      div.style.cssText = 'padding:8px 0;border-bottom:1px solid var(--border-color);font-size:13px;display:flex;justify-content:space-between;';
      div.innerHTML = '<span>' + escapeHtml(letter.job_title || 'Cover Letter') + ' - ' + escapeHtml(letter.company || '') + '</span><small style="color:var(--text-muted);">' + (letter.created_at ? new Date(letter.created_at).toLocaleDateString() : '') + '</small>';
      container.appendChild(div);
    });
    container.style.padding = '0';
  }
}


// ============================================================
// PAGE: Job Alerts
// ============================================================
window.initAlerts = function() {
  loadAlerts();
  setupCreateAlert();
};

async function loadAlerts() {
  const container = document.querySelector('#page-alerts .grid-2');
  if (!container) return;

  const result = await alertsAPI.list();
  if (result.error) return;

  const alerts = result.data && result.data.alerts ? result.data.alerts : (Array.isArray(result.data) ? result.data : []);
  // Keep the "Create Alert" button above, just update cards
  const cards = container.querySelectorAll('.card');
  alerts.forEach(function(alert, i) {
    if (i < cards.length) {
      const card = cards[i];
      const titleEl = card.querySelector('.card-title');
      const infoEl = card.querySelector('[style*="font-size:12px"]');
      const statusBadge = card.querySelector('.badge');
      if (titleEl) titleEl.textContent = alert.title || alert.name || 'Alert';
      if (infoEl) infoEl.textContent = '📍 ' + (alert.location || 'Any') + ' · ' + (alert.type || 'Any');
      if (statusBadge) {
        statusBadge.textContent = alert.active ? 'Active' : 'Paused';
        statusBadge.className = 'badge ' + (alert.active ? 'badge-success' : 'badge-warning');
      }
    }
  });
}

function setupCreateAlert() {
  const createBtn = document.querySelector('#page-alerts .btn-primary');
  if (!createBtn) return;
  const newBtn = createBtn.cloneNode(true);
  createBtn.parentNode.replaceChild(newBtn, createBtn);

  newBtn.addEventListener('click', function() {
    openModal('Create Job Alert', `
      <form id="create-alert-form">
        <div class="form-group"><label class="form-label">Alert Name</label><input type="text" class="form-input" id="alert-name" placeholder="e.g. Frontend Jobs" required></div>
        <div class="form-group"><label class="form-label">Keywords</label><input type="text" class="form-input" id="alert-keywords" placeholder="e.g. React, TypeScript"></div>
        <div class="form-group"><label class="form-label">Location</label><input type="text" class="form-input" id="alert-location" placeholder="San Francisco"></div>
        <div class="form-group"><label class="form-label">Frequency</label><select class="form-select" id="alert-frequency"><option>Daily</option><option>Weekly</option><option>Instant</option></select></div>
      </form>
    `, '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" id="save-alert-btn">Create Alert</button>');

    setTimeout(function() {
      document.getElementById('save-alert-btn')?.addEventListener('click', async function() {
        const data = {
          name: document.getElementById('alert-name')?.value,
          keywords: document.getElementById('alert-keywords')?.value,
          location: document.getElementById('alert-location')?.value,
          frequency: document.getElementById('alert-frequency')?.value
        };
        const result = await alertsAPI.create(data);
        if (!result.error) { closeModal(); loadAlerts(); }
        else alert(result.error);
      });
    }, 100);
  });
}


// ============================================================
// PAGE: Email Generator
// ============================================================
window.initEmailGenerator = function() {
  const form = document.querySelector('#page-email-generator form');
  if (!form) return;
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const inputs = this.querySelectorAll('input, select, textarea');
    const data = {};
    inputs.forEach(function(input) {
      data[input.placeholder?.toLowerCase().replace(/\s+/g, '_') || input.type || 'field'] = input.value;
    });

    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Generating...';

    const result = await emailAPI.generate(data);
    btn.disabled = false;
    btn.textContent = '📧 Generate Email';

    if (result.error) {
      showError(this, result.error);
      return;
    }

    const resultCard = document.querySelector('#page-email-generator .grid-2 > div:last-child .card .empty-state');
    if (resultCard) {
      const emailContent = result.data?.subject ? '<div style="margin-bottom:12px;"><strong style="font-size:15px;">Subject:</strong><div style="color:var(--accent);font-size:14px;margin-top:4px;">' + escapeHtml(result.data.subject) + '</div></div><div style="margin-bottom:12px;"><strong>Body:</strong></div>' : '';
      const body = result.data?.body || result.data?.content || result.data?.email || 'Your generated email will appear here.';
      resultCard.innerHTML = `
        <div style="text-align:left;">
          ${emailContent}
          <div style="white-space:pre-wrap;font-size:14px;line-height:1.8;color:var(--text-secondary);background:var(--bg-card);padding:16px;border-radius:var(--radius-sm);border:1px solid var(--border-color);margin-bottom:16px;">${escapeHtml(body)}</div>
          <div class="flex gap-8">
            <button class="btn btn-sm btn-secondary copy-email">📋 Copy</button>
            <button class="btn btn-sm btn-primary save-email">💾 Save</button>
          </div>
        </div>
      `;
      resultCard.classList.remove('empty-state');
      resultCard.style.padding = '0';

      resultCard.querySelector('.copy-email')?.addEventListener('click', function() {
        navigator.clipboard.writeText(body).then(function() {
          this.textContent = '✅ Copied!';
          setTimeout(function() { this.textContent = '📋 Copy'; }.bind(this), 2000);
        }.bind(this));
      });
    }
  });
};


// ============================================================
// PAGE: Downloads
// ============================================================
window.initDownloads = function() {
  loadDownloads();
};

async function loadDownloads() {
  const result = await downloadsAPI.getUrls();
  if (result.error) return;

  const statValues = document.querySelectorAll('#page-downloads .stat-card-value');
  if (result.data && statValues.length >= 2) {
    statValues[0].textContent = result.data.resume_count || result.data.resumes || 5;
    statValues[1].textContent = result.data.cover_letter_count || result.data.cover_letters || 8;
  }

  // Bind download buttons
  document.querySelectorAll('#page-downloads .btn-primary').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const row = this.closest('tr');
      if (row) {
        const fileName = row.querySelector('td:first-child')?.textContent || 'download';
        const type = fileName.includes('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        // Trigger download via the API URLs
        const id = fileName.split('_').pop()?.split('.')[0] || '';
        downloadsAPI.downloadResume(id).then(function(res) {
          if (res.data) {
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
          }
        });
      }
    });
  });
}


// ============================================================
// PAGE: Profile
// ============================================================
window.initProfile = function() {
  loadProfile();
  setupProfileForm();
};

async function loadProfile() {
  const user = getUser();
  if (!user) return;

  const inputs = document.querySelectorAll('#page-profile .form-input');
  const fieldMap = ['first_name', 'last_name', 'email', 'phone', 'location', 'linkedin_url', 'github_url'];
  inputs.forEach(function(input, i) {
    if (i < fieldMap.length) {
      const val = user[fieldMap[i]] || user[fieldMap[i].replace('_', '')] || '';
      if (val) input.value = val;
    }
  });

  // If we have a full profile from API, fetch it
  const result = await authAPI.getProfile();
  if (result.error || !result.data) return;

  const profile = result.data.user || result.data;
  inputs.forEach(function(input, i) {
    if (i < fieldMap.length) {
      const val = profile[fieldMap[i]] || profile[fieldMap[i].replace('_', '')] || '';
      if (val) input.value = val;
    }
  });
}

function setupProfileForm() {
  const form = document.querySelector('#page-profile form');
  if (!form) return;
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const inputs = this.querySelectorAll('.form-input');
    const data = {};
    const fieldMap = ['first_name', 'last_name', 'email', 'phone', 'location', 'linkedin_url', 'github_url'];
    inputs.forEach(function(input, i) {
      if (i < fieldMap.length) data[fieldMap[i]] = input.value;
    });

    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const result = await authAPI.updateProfile(data);
    btn.disabled = false;
    btn.textContent = '💾 Save Changes';

    if (result.error) showError(this, result.error);
    else showSuccess(this, 'Profile updated successfully!');
  });
}


// ============================================================
// PAGE: Career Advisor
// ============================================================
window.initCareerAdvisor = function() {
  setupCareerAdvice();
  setupSalaryPredictor();
};

function setupCareerAdvice() {
  const form = document.querySelector('#page-career-advisor .card:last-child form');
  if (!form) return;
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const textarea = this.querySelector('textarea');
    const question = textarea ? textarea.value.trim() : '';
    if (!question) return;

    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Getting advice...';

    const resultDiv = document.getElementById('advice-result');

    const result = await careerAPI.getAdvice({ question: question });
    btn.disabled = false;
    btn.textContent = '🤖 Get Advice';

    if (result.error) {
      if (resultDiv) showError(resultDiv, result.error);
      return;
    }

    if (resultDiv) {
      const advice = result.data?.advice || result.data?.answer || result.data?.response || 'No advice available.';
      resultDiv.innerHTML = '<div style="text-align:left;font-size:14px;color:var(--text-secondary);line-height:1.8;white-space:pre-wrap;">' + escapeHtml(advice) + '</div>';
      resultDiv.classList.remove('empty-state');
    }
  });
}

function setupSalaryPredictor() {
  const form = document.querySelector('#page-career-advisor .card:first-child form');
  if (!form) return;
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const inputs = this.querySelectorAll('input');
    const data = {};
    inputs.forEach(function(input) {
      data[input.placeholder?.toLowerCase().replace(/\s+/g, '_') || 'field'] = input.value;
    });

    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Predicting...';

    const result = await careerAPI.predictSalary(data);
    btn.disabled = false;
    btn.textContent = '💰 Predict Salary';

    if (result.error) {
      showError(this, result.error);
      return;
    }

    const resultDiv = document.getElementById('salary-result');
    if (resultDiv) {
      resultDiv.style.display = 'block';
      const salary = result.data?.salary_range || result.data?.range || result.data?.salary || '$140k - $180k';
      const rangeEl = resultDiv.querySelector('[style*="font-weight:700"]');
      if (rangeEl) rangeEl.textContent = salary;
      const progress = result.data?.confidence || result.data?.match || 75;
      const progressFill = resultDiv.querySelector('.progress-bar-fill');
      if (progressFill) progressFill.style.width = progress + '%';
    }
  });
}


// ============================================================
// PAGE: Interview Prep
// ============================================================
window.initInterviewPrep = function() {
  const form = document.querySelector('#page-interview-prep form');
  if (!form) return;
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const inputs = this.querySelectorAll('input, select');
    const data = {};
    inputs.forEach(function(input) {
      data[input.placeholder?.toLowerCase().replace(/\s+/g, '_') || input.type || 'field'] = input.value;
    });

    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Generating questions...';

    const result = await interviewPrepAPI.generateQuestions(data);
    btn.disabled = false;
    btn.textContent = '🎤 Start Practice';

    if (result.error) {
      showError(this, result.error);
      return;
    }

    const resultCard = document.querySelector('#page-interview-prep .grid-2 > div:last-child .card:first-child .empty-state');
    if (resultCard) {
      const questions = result.data?.questions || result.data?.items || [];
      let html = '<div style="text-align:left;">';
      if (Array.isArray(questions)) {
        questions.forEach(function(q, i) {
          const text = typeof q === 'string' ? q : (q.question || q.text || '');
          html += '<div style="padding:12px 0;' + (i < questions.length - 1 ? 'border-bottom:1px solid var(--border-color);' : '') + '"><strong style="font-size:14px;">Q' + (i + 1) + ':</strong> <span style="font-size:14px;color:var(--text-secondary);">' + escapeHtml(text) + '</span></div>';
        });
      } else {
        html += '<div style="font-size:14px;color:var(--text-secondary);">' + escapeHtml(result.data.content || result.data.text || '') + '</div>';
      }
      html += '</div>';
      resultCard.innerHTML = html;
      resultCard.classList.remove('empty-state');
      resultCard.style.padding = '0';

      // Update progress
      const progressFill = document.querySelector('#page-interview-prep .progress-bar-fill');
      if (progressFill && questions.length) {
        progressFill.style.width = '0%';
        const progressLabel = document.querySelector('#page-interview-prep .flex-between span:last-child');
        if (progressLabel) progressLabel.textContent = '0/' + questions.length + ' completed';
      }
    }
  });
};


// ============================================================
// PAGE: Job Analyzer
// ============================================================
window.initJobAnalyzer = function() {
  const form = document.querySelector('#page-job-analyzer form');
  if (!form) return;
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const urlInput = this.querySelector('input[type="url"]');
    const textarea = this.querySelector('textarea');
    const data = {};
    if (urlInput?.value) data.url = urlInput.value;
    if (textarea?.value) data.job_description = textarea.value;

    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Analyzing...';

    const result = await jobAnalyzerAPI.analyze(data);
    btn.disabled = false;
    btn.textContent = '🔬 Analyze';

    if (result.error) {
      showError(this, result.error);
      return;
    }

    // Show results
    const resultCard = document.querySelector('#page-job-analyzer .grid-2 > div:last-child .card:first-child .empty-state');
    const insightsCard = document.querySelector('#page-job-analyzer .grid-2 > div:last-child .card:last-child .empty-state');

    if (resultCard) {
      const analysis = result.data;
      let html = '<div style="text-align:left;">';
      if (analysis.skills && analysis.skills.length) {
        html += '<div style="margin-bottom:12px;"><strong>Required Skills:</strong><div class="flex gap-8" style="margin-top:8px;flex-wrap:wrap;">';
        analysis.skills.forEach(function(s) { html += '<span class="badge badge-primary">' + escapeHtml(typeof s === 'string' ? s : s.name) + '</span>'; });
        html += '</div></div>';
      }
      if (analysis.keywords && analysis.keywords.length) {
        html += '<div style="margin-bottom:12px;"><strong>Key Keywords:</strong><div class="flex gap-8" style="margin-top:8px;flex-wrap:wrap;">';
        analysis.keywords.forEach(function(k) { html += '<span class="tag tag-info">' + escapeHtml(typeof k === 'string' ? k : k.word) + '</span>'; });
        html += '</div></div>';
      }
      html += '</div>';
      resultCard.innerHTML = html;
      resultCard.classList.remove('empty-state');
      resultCard.style.padding = '0';
    }

    if (insightsCard) {
      insightsCard.innerHTML = '<div style="text-align:left;font-size:13px;color:var(--text-secondary);"><div style="margin-bottom:8px;">📊 <strong>Experience Level:</strong> ' + escapeHtml(result.data?.experience_level || 'N/A') + '</div><div style="margin-bottom:8px;">🏢 <strong>Industry:</strong> ' + escapeHtml(result.data?.industry || 'N/A') + '</div><div>💰 <strong>Salary Range:</strong> ' + escapeHtml(result.data?.salary_range || 'Not specified') + '</div></div>';
      insightsCard.classList.remove('empty-state');
      insightsCard.style.padding = '0';
    }
  });
};


// ============================================================
// PAGE: LinkedIn Optimizer
// ============================================================
window.initLinkedInOptimizer = function() {
  const form = document.querySelector('#page-linkedin-optimizer form');
  if (!form) return;
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const inputs = this.querySelectorAll('input, select');
    const data = {};
    inputs.forEach(function(input) {
      data[input.placeholder?.toLowerCase().replace(/\s+/g, '_') || input.type || 'field'] = input.value;
    });

    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Analyzing...';

    const result = await linkedinAPI.optimize(data);
    btn.disabled = false;
    btn.textContent = '💼 Analyze Profile';

    if (result.error) {
      showError(this, result.error);
      return;
    }

    // Show score
    const scoreCard = document.querySelector('#page-linkedin-optimizer .grid-2 > div:last-child .card:first-child .empty-state');
    if (scoreCard) {
      const score = result.data?.score || result.data?.optimization_score || 75;
      scoreCard.innerHTML = '<div style="text-align:center;padding:20px 0;"><div style="font-size:48px;font-weight:700;color:var(--accent);">' + score + '%</div><div style="font-size:14px;color:var(--text-secondary);margin-top:8px;">Optimization Score</div><div class="progress-bar" style="max-width:200px;margin:16px auto;"><div class="progress-bar-fill" style="width:' + score + '%;"></div></div></div>';
      scoreCard.classList.remove('empty-state');
    }
  });
};


// ============================================================
// PAGE: Portfolio Builder
// ============================================================
window.initPortfolio = function() {
  const form = document.querySelector('#page-portfolio form');
  if (!form) return;
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const inputs = this.querySelectorAll('input, textarea');
    const data = {};
    inputs.forEach(function(input) {
      data[input.placeholder?.toLowerCase().replace(/\s+/g, '_') || 'field'] = input.value;
    });

    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Generating...';

    const result = await portfolioAPI.generate(data);
    btn.disabled = false;
    btn.textContent = '🌐 Generate Portfolio';

    if (result.error) {
      showError(this, result.error);
      return;
    }

    const previewCard = document.querySelector('#page-portfolio .grid-2 > div:last-child .card:first-child .empty-state');
    if (previewCard) {
      const url = result.data?.url || result.data?.preview_url || '#';
      previewCard.innerHTML = '<div style="text-align:center;"><div style="font-size:48px;margin-bottom:16px;">🌐</div><div style="font-size:16px;font-weight:600;margin-bottom:8px;">Portfolio Generated!</div><a href="' + escapeHtml(url) + '" target="_blank" class="btn btn-primary">🔗 View Portfolio</a></div>';
      previewCard.classList.remove('empty-state');
    }
  });

  loadPortfolio();
};

async function loadPortfolio() {
  const result = await portfolioAPI.get();
  if (result.error || !result.data) return;

  const existing = result.data;
  const inputs = document.querySelectorAll('#page-portfolio .form-input, #page-portfolio .form-textarea');
  const fieldMap = ['title', 'bio', 'projects', 'skills', 'custom_domain'];
  inputs.forEach(function(input, i) {
    if (i < fieldMap.length && existing[fieldMap[i]]) {
      input.value = existing[fieldMap[i]];
    }
  });
}


// ============================================================
// PAGE: Analytics
// ============================================================
window.initAnalytics = function() {
  loadAnalytics();
};

async function loadAnalytics() {
  const result = await analyticsAPI.getOverview();
  if (result.error || !result.data) return;

  const stats = result.data;
  const statValues = document.querySelectorAll('#page-analytics .stat-card-value');
  const keys = ['total_applications', 'interviews', 'offers', 'response_rate'];
  statValues.forEach(function(el, i) {
    if (i < keys.length && stats[keys[i]] !== undefined) {
      const val = stats[keys[i]];
      el.textContent = typeof val === 'number' && keys[i] === 'response_rate' ? val + '%' : val;
    }
  });

  // Load monthly data
  const monthlyResult = await analyticsAPI.getMonthly();
  if (!monthlyResult.error && monthlyResult.data) {
    const monthlyContainer = document.querySelector('#page-analytics .grid-2:last-child .card:last-child');
    if (monthlyContainer) {
      const dataEl = monthlyContainer.querySelector('[style*="font-size:13px"]');
      if (dataEl) {
        const months = Array.isArray(monthlyResult.data) ? monthlyResult.data : (monthlyResult.data.months || []);
        if (months.length) {
          dataEl.innerHTML = '';
          months.forEach(function(m) {
            dataEl.innerHTML += '<div class="flex-between" style="padding:8px 0;border-bottom:1px solid var(--border-color);"><span>' + escapeHtml(m.month || m.label || '') + '</span><span>' + escapeHtml(m.applications || '0') + ' applications, ' + escapeHtml(m.interviews || '0') + ' interviews</span></div>';
          });
        }
      }
    }
  }
};


// ============================================================
// PAGE: Admin Panel
// ============================================================
window.initAdmin = function() {
  loadAdminStats();
  loadAdminUsers();
  loadAdminJobs();
  setupAdminTabs();
};

async function loadAdminStats() {
  const result = await adminAPI.getStats();
  if (result.error || !result.data) return;

  // Admin stats are shown in the grid-3 cards at the bottom
  const cards = document.querySelectorAll('#page-admin .grid-3 .card');
  if (cards.length >= 3) {
    // System info
    const sysInfo = result.data.system || result.data;
    const sysInfoEl = cards[0].querySelector('[style*="font-size:13px"]');
    if (sysInfoEl) {
      sysInfoEl.innerHTML = '';
      Object.entries(sysInfo).slice(0, 4).forEach(function([key, val]) {
        sysInfoEl.innerHTML += '<div class="flex-between" style="margin-bottom:8px;"><span>' + escapeHtml(key.replace(/_/g, ' ')) + '</span><span>' + escapeHtml(String(val)) + '</span></div>';
      });
    }

    // API usage
    const apiInfo = result.data.api || result.data;
    const apiInfoEl = cards[1].querySelector('[style*="font-size:13px"]');
    if (apiInfoEl) {
      apiInfoEl.innerHTML = '';
      Object.entries(apiInfo).slice(0, 4).forEach(function([key, val]) {
        apiInfoEl.innerHTML += '<div class="flex-between" style="margin-bottom:8px;"><span>' + escapeHtml(key.replace(/_/g, ' ')) + '</span><span>' + escapeHtml(String(val)) + '</span></div>';
      });
    }
  }

  // Update user count
  const userCount = document.querySelector('#page-admin .flex-between span:first-child');
  if (userCount && result.data.total_users) {
    userCount.textContent = 'Total Users: ' + result.data.total_users;
  }
}

async function loadAdminUsers() {
  const tableBody = document.querySelectorAll('#page-admin .table tbody');
  if (!tableBody.length) return;

  const result = await adminAPI.getUsers();
  if (result.error || !result.data) return;

  const users = result.data.users || (Array.isArray(result.data) ? result.data : []);
  if (!users.length) return;

  const tbody = tableBody[0];
  tbody.innerHTML = '';
  users.forEach(function(user) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(user.name || user.username || '')}</td>
      <td>${escapeHtml(user.email || '')}</td>
      <td><span class="badge ${user.role === 'admin' ? 'badge-warning' : 'badge-primary'}">${escapeHtml(user.role || 'User')}</span></td>
      <td><span class="badge ${user.is_active ? 'badge-success' : 'badge-danger'}">${user.is_active ? 'Active' : 'Suspended'}</span></td>
      <td>${user.created_at ? new Date(user.created_at).toLocaleDateString() : ''}</td>
      <td><button class="btn btn-sm btn-secondary manage-user" data-id="${user.id || ''}">Manage</button></td>
    `;
    tbody.appendChild(tr);
  });
}

async function loadAdminJobs() {
  // Admin jobs list - uses same table but different data
  const result = await adminAPI.getJobs();
  // If there's a second table, populate it
  const tables = document.querySelectorAll('#page-admin .table');
  if (tables.length > 1) {
    const tbody = tables[1].querySelector('tbody');
    if (!tbody) return;
    const jobs = result.data?.jobs || (Array.isArray(result.data) ? result.data : []);
    if (!jobs.length) return;

    tbody.innerHTML = '';
    jobs.forEach(function(job) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(job.title || '')}</td>
        <td>${escapeHtml(job.company || '')}</td>
        <td>${escapeHtml(job.location || '')}</td>
        <td><span class="badge ${job.is_active ? 'badge-success' : 'badge-danger'}">${job.is_active ? 'Active' : 'Closed'}</span></td>
        <td><button class="btn btn-sm btn-secondary manage-job" data-id="${job.id || ''}">Manage</button></td>
      `;
      tbody.appendChild(tr);
    });
  }
}

function setupAdminTabs() {
  const tabs = document.querySelectorAll('#page-admin .tab');
  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      tabs.forEach(function(t) { t.classList.remove('active'); });
      this.classList.add('active');
    });
  });
}


// ============================================================
// PAGE: Company Dashboard
// ============================================================
window.initCompanyDashboard = function() {
  loadCompanyStats();
  loadCompanyRecentApplicants();
};

async function loadCompanyStats() {
  const result = await companyAPI.getStats();
  if (result.error || !result.data) return;

  const stats = result.data;
  const setVal = function(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val !== undefined ? val : 0;
  };

  setVal('company-stat-total-jobs', stats.total_jobs);
  setVal('company-stat-active-jobs', stats.active_jobs);
  setVal('company-stat-total-applicants', stats.total_applicants);
  setVal('company-stat-shortlisted', stats.shortlisted);

  setVal('company-pipeline-new', stats.total_applicants);
  setVal('company-pipeline-interviewing', stats.shortlisted);
  setVal('company-pipeline-hired', stats.hired);
  setVal('company-pipeline-rejected', 0);
}

async function loadCompanyRecentApplicants() {
  const container = document.getElementById('company-recent-applicants');
  if (!container) return;

  // Get all company jobs first
  const jobsResult = await companyAPI.getJobs();
  if (jobsResult.error || !jobsResult.data || !jobsResult.data.jobs) return;

  const jobs = jobsResult.data.jobs;
  if (!jobs.length) return;

  // Get applicants for the most recent job
  const latestJob = jobs[0];
  const applicantsResult = await companyAPI.getApplicants(latestJob.id);
  if (applicantsResult.error || !applicantsResult.data || !applicantsResult.data.applicants) return;

  const applicants = applicantsResult.data.applicants;
  if (!applicants.length) {
    container.innerHTML = '<div class="empty-state" style="padding:40px;text-align:center;color:var(--text-muted);">No applicants yet.</div>';
    return;
  }

  let html = '<div class="table-container"><table class="table"><thead><tr><th>Name</th><th>Email</th><th>Position</th><th>Status</th><th>Date</th></tr></thead><tbody>';
  applicants.slice(0, 10).forEach(function(app) {
    const statusBadge = app.status === 'applied' ? 'badge-info' : app.status === 'interviewing' ? 'badge-primary' : app.status === 'offer' || app.status === 'hired' ? 'badge-success' : app.status === 'rejected' ? 'badge-danger' : 'badge-warning';
    html += '<tr><td>' + escapeHtml(app.full_name || app.name || '') + '</td><td>' + escapeHtml(app.email || '') + '</td><td>' + escapeHtml(latestJob.title || '') + '</td><td><span class="badge ' + statusBadge + '">' + escapeHtml(app.status) + '</span></td><td>' + (app.created_at ? new Date(app.created_at).toLocaleDateString() : '') + '</td></tr>';
  });
  html += '</tbody></table></div>';
  container.innerHTML = html;
}


// ============================================================
// PAGE: Company Profile
// ============================================================
window.initCompanyProfile = function() {
  loadCompanyProfile();
  setupCompanyProfileForm();
};

async function loadCompanyProfile() {
  const result = await companyAPI.getProfile();
  if (result.error) return;

  const profile = result.data.profile || {};
  const user = result.data.user || {};

  const setName = function(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  setName('cp-name', profile.company_name);
  setName('cp-industry', profile.industry);
  setName('cp-size', profile.company_size);
  setName('cp-website', profile.website);
  setName('cp-description', profile.description);
  setName('cp-location', profile.location);
}

function setupCompanyProfileForm() {
  const form = document.getElementById('company-profile-form');
  if (!form) return;
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const msgEl = document.getElementById('company-profile-message');
    if (msgEl) msgEl.innerHTML = '';

    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const data = {
      company_name: document.getElementById('cp-name').value.trim(),
      industry: document.getElementById('cp-industry').value.trim(),
      company_size: document.getElementById('cp-size').value,
      website: document.getElementById('cp-website').value.trim(),
      description: document.getElementById('cp-description').value.trim(),
      location: document.getElementById('cp-location').value.trim()
    };

    const result = await companyAPI.updateProfile(data);

    btn.disabled = false;
    btn.textContent = '💾 Save Profile';

    if (result.error) {
      if (msgEl) msgEl.innerHTML = '<div class="alert alert-danger">' + escapeHtml(result.error) + '</div>';
      return;
    }

    if (msgEl) msgEl.innerHTML = '<div class="alert alert-success">Profile updated successfully!</div>';
  });
}


// ============================================================
// PAGE: Company Jobs
// ============================================================
window.initCompanyJobs = function() {
  loadCompanyJobs();
};

async function loadCompanyJobs() {
  const container = document.getElementById('company-jobs-list');
  if (!container) return;

  const result = await companyAPI.getJobs();
  if (result.error || !result.data || !result.data.jobs) return;

  const jobs = result.data.jobs;
  if (!jobs.length) {
    container.innerHTML = '<div class="empty-state" style="padding:60px;text-align:center;color:var(--text-muted);"><div style="font-size:48px;margin-bottom:16px;">📋</div><div style="font-size:18px;font-weight:600;margin-bottom:8px;">No jobs posted yet</div><p style="margin-bottom:20px;">Post your first job to start receiving applications.</p><button class="btn btn-primary" onclick="navigateTo(\'company-post-job\')">Post a Job</button></div>';
    return;
  }

  let html = '<div class="table-container"><table class="table"><thead><tr><th>Title</th><th>Location</th><th>Type</th><th>Applicants</th><th>Status</th><th>Posted</th><th>Actions</th></tr></thead><tbody>';

  for (const job of jobs) {
    // Get applicant count for each job
    let applicantCount = 0;
    const appsResult = await companyAPI.getApplicants(job.id);
    if (!appsResult.error && appsResult.data && appsResult.data.applicants) {
      applicantCount = appsResult.data.applicants.length;
    }

    const statusBadge = job.is_active ? 'badge-success' : 'badge-danger';
    const statusText = job.is_active ? 'Active' : 'Closed';
    const postedDate = job.posted_date || job.created_at ? new Date(job.posted_date || job.created_at).toLocaleDateString() : '';

    html += '<tr>' +
      '<td><strong>' + escapeHtml(job.title) + '</strong></td>' +
      '<td>' + escapeHtml(job.location || 'Remote') + '</td>' +
      '<td>' + escapeHtml(job.job_type || 'Full-time') + '</td>' +
      '<td><a href="#" onclick="navigateTo(\'company-applicants\');return false" style="color:var(--accent);">' + applicantCount + ' applicants</a></td>' +
      '<td><span class="badge ' + statusBadge + '">' + statusText + '</span></td>' +
      '<td>' + postedDate + '</td>' +
      '<td>' +
        '<button class="btn btn-sm btn-secondary toggle-job" data-id="' + job.id + '" data-active="' + job.is_active + '" style="margin-right:4px;">' + (job.is_active ? 'Close' : 'Activate') + '</button>' +
        '<button class="btn btn-sm btn-danger delete-job" data-id="' + job.id + '">Delete</button>' +
      '</td></tr>';
  }
  html += '</tbody></table></div>';
  container.innerHTML = html;

  // Add event listeners for toggle and delete
  container.querySelectorAll('.toggle-job').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      const id = this.dataset.id;
      const isActive = this.dataset.active === '1';
      const result = await companyAPI.updateJob(id, { is_active: isActive ? 0 : 1 });
      if (!result.error) loadCompanyJobs();
    });
  });

  container.querySelectorAll('.delete-job').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      if (!confirm('Are you sure you want to delete this job?')) return;
      const id = this.dataset.id;
      const result = await companyAPI.deleteJob(id);
      if (!result.error) loadCompanyJobs();
    });
  });
}


// ============================================================
// PAGE: Company Post Job
// ============================================================
window.initCompanyPostJob = function() {
  setupCompanyPostJobForm();
};

function setupCompanyPostJobForm() {
  const form = document.getElementById('company-post-job-form');
  if (!form) return;
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const msgEl = document.getElementById('company-post-job-message');
    if (msgEl) msgEl.innerHTML = '';

    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Posting...';

    const data = {
      title: document.getElementById('cpj-title').value.trim(),
      location: document.getElementById('cpj-location').value.trim(),
      job_type: document.getElementById('cpj-type').value,
      experience_level: document.getElementById('cpj-experience').value,
      industry: document.getElementById('cpj-industry').value.trim(),
      salary_range: document.getElementById('cpj-salary').value.trim(),
      skills_required: document.getElementById('cpj-skills').value.trim(),
      description: document.getElementById('cpj-description').value.trim(),
      requirements: document.getElementById('cpj-requirements').value.trim()
    };

    const result = await companyAPI.createJob(data);

    btn.disabled = false;
    btn.textContent = '📢 Post Job';

    if (result.error) {
      if (msgEl) msgEl.innerHTML = '<div class="alert alert-danger">' + escapeHtml(result.error) + '</div>';
      return;
    }

    if (msgEl) msgEl.innerHTML = '<div class="alert alert-success">Job posted successfully! <a href="#" onclick="navigateTo(\'company-jobs\');return false">View my jobs</a></div>';
    this.reset();
  });
}


// ============================================================
// PAGE: Company Applicants
// ============================================================
window.initCompanyApplicants = function() {
  loadCompanyApplicants();
};

async function loadCompanyApplicants() {
  const container = document.getElementById('company-applicants-list');
  const subtitle = document.getElementById('company-applicants-subtitle');
  if (!container) return;

  // Get all company jobs
  const jobsResult = await companyAPI.getJobs();
  if (jobsResult.error || !jobsResult.data || !jobsResult.data.jobs) {
    container.innerHTML = '<div class="empty-state" style="padding:60px;text-align:center;color:var(--text-muted);"><div style="font-size:48px;margin-bottom:16px;">👥</div><div style="font-size:18px;font-weight:600;margin-bottom:8px;">No jobs found</div><p>Post a job first to start receiving applications.</p></div>';
    return;
  }

  const jobs = jobsResult.data.jobs;
  if (!jobs.length) {
    container.innerHTML = '<div class="empty-state" style="padding:60px;text-align:center;color:var(--text-muted);"><div style="font-size:48px;margin-bottom:16px;">👥</div><div style="font-size:18px;font-weight:600;margin-bottom:8px;">No jobs posted yet</div><p>Post a job to start receiving applications.</p></div>';
    return;
  }

  // Show a dropdown to select which job's applicants to view
  let html = '<div class="form-group" style="max-width:400px;margin-bottom:20px;">';
  html += '<label class="form-label">Select Job</label>';
  html += '<select id="company-applicant-job-select" class="form-input">';
  html += '<option value="">-- Select a job --</option>';
  jobs.forEach(function(job) {
    html += '<option value="' + job.id + '">' + escapeHtml(job.title) + ' (' + escapeHtml(job.location || 'Remote') + ')</option>';
  });
  html += '</select></div>';

  html += '<div id="company-applicants-table"><div class="empty-state" style="padding:40px;text-align:center;color:var(--text-muted);">Select a job above to view its applicants.</div></div>';
  container.innerHTML = html;

  if (subtitle) subtitle.textContent = 'Review and manage candidates for your job postings';

  // Handle job selection change
  const select = document.getElementById('company-applicant-job-select');
  if (select) {
    select.addEventListener('change', async function() {
      const jobId = this.value;
      const tableContainer = document.getElementById('company-applicants-table');
      if (!jobId) {
        if (tableContainer) tableContainer.innerHTML = '<div class="empty-state" style="padding:40px;text-align:center;color:var(--text-muted);">Select a job above to view its applicants.</div>';
        return;
      }

      const result = await companyAPI.getApplicants(jobId);
      if (result.error || !result.data || !result.data.applicants || !result.data.applicants.length) {
        if (tableContainer) tableContainer.innerHTML = '<div class="empty-state" style="padding:40px;text-align:center;color:var(--text-muted);">No applicants for this job yet.</div>';
        return;
      }

      const applicants = result.data.applicants;
      let tableHtml = '<div class="table-container"><table class="table"><thead><tr><th>Name</th><th>Email</th><th>Experience</th><th>Skills</th><th>Status</th><th>Actions</th></tr></thead><tbody>';

      const statuses = ['applied', 'reviewing', 'shortlisted', 'interviewing', 'offer', 'hired', 'rejected'];

      applicants.forEach(function(app) {
        const statusBadge = app.status === 'applied' ? 'badge-info' : app.status === 'reviewing' ? 'badge-warning' : app.status === 'shortlisted' || app.status === 'interviewing' ? 'badge-primary' : app.status === 'offer' || app.status === 'hired' ? 'badge-success' : app.status === 'rejected' ? 'badge-danger' : 'badge-warning';

        // Build status dropdown
        let statusDropdown = '<select class="form-input applicant-status" data-app-id="' + app.id + '" style="padding:4px 8px;font-size:12px;">';
        statuses.forEach(function(s) {
          statusDropdown += '<option value="' + s + '" ' + (app.status === s ? 'selected' : '') + '>' + s + '</option>';
        });
        statusDropdown += '</select>';

        tableHtml += '<tr>' +
          '<td><strong>' + escapeHtml(app.full_name || app.name || '') + '</strong></td>' +
          '<td>' + escapeHtml(app.email || '') + '</td>' +
          '<td>' + (app.experience_years || 0) + ' yrs</td>' +
          '<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHtml(app.skills || '') + '</td>' +
          '<td><span class="badge ' + statusBadge + '">' + escapeHtml(app.status) + '</span></td>' +
          '<td>' + statusDropdown + '</td></tr>';
      });

      tableHtml += '</tbody></table></div>';
      if (tableContainer) tableContainer.innerHTML = tableHtml;

      // Handle status change
      tableContainer.querySelectorAll('.applicant-status').forEach(function(sel) {
        sel.addEventListener('change', async function() {
          const appId = this.dataset.appId;
          const newStatus = this.value;
          const result = await companyAPI.updateApplicantStatus(appId, newStatus);
          if (!result.error) {
            loadCompanyApplicants();
          }
        });
      });
    });
  }
}
