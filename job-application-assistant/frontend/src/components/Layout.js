import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { logout, getUser } from '../services/auth';

const mainNavItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
];

const resumeNavItems = [
  { path: '/resumes', label: 'My Resumes', icon: '📄' },
  { path: '/resumes/templates', label: 'Resume Builder', icon: '🎨' },
  { path: '/ats-score', label: 'ATS Score', icon: '🎯' },
  { path: '/skill-gap', label: 'Skill Gap', icon: '🧠' },
];

const jobNavItems = [
  { path: '/jobs', label: 'Job Search', icon: '🔍' },
  { path: '/applications', label: 'Applications', icon: '📋' },
  { path: '/interviews', label: 'Interviews', icon: '📅' },
  { path: '/auto-apply', label: 'Auto-Apply', icon: '⚡' },
];

const otherNavItems = [
  { path: '/cover-letters', label: 'Cover Letters', icon: '✉️' },
  { path: '/alerts', label: 'Alerts', icon: '🔔' },
  { path: '/email-generator', label: 'Email Generator', icon: '📧' },
  { path: '/downloads', label: 'Downloads', icon: '📥' },
  { path: '/profile', label: 'Profile', icon: '👤' },
];

const toolsNavItems = [
  { path: '/career-advisor', label: 'Career Advisor', icon: '🧭' },
  { path: '/interview-prep', label: 'Interview Prep', icon: '🎤' },
  { path: '/job-analyzer', label: 'Job Analyzer', icon: '🔬' },
  { path: '/linkedin-optimizer', label: 'LinkedIn Opt.', icon: '💼' },
  { path: '/portfolio', label: 'Portfolio', icon: '🌐' },
  { path: '/analytics', label: 'Analytics', icon: '📈' },
  { path: '/admin', label: 'Admin Panel', icon: '⚙️' },
];

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="app-layout">
      {/* Mobile toggle */}
      <button
        className="mobile-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{ position: 'fixed', top: 16, left: 16, zIndex: 101 }}
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <NavLink to="/" className="sidebar-logo">
            <div className="sidebar-logo-icon">AI</div>
            <div>
              <div className="sidebar-logo-text">JobAI</div>
              <div className="sidebar-logo-sub">Application Assistant</div>
            </div>
          </NavLink>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Overview</div>
          {mainNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-item-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          <div className="nav-section-label">Resumes & Skills</div>
          {resumeNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-item-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          <div className="nav-section-label">Jobs & Applications</div>
          {jobNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-item-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          <div className="nav-section-label">More</div>
          {otherNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-item-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          <div className="nav-section-label">AI Tools</div>
          {toolsNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-item-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="nav-item" onClick={handleLogout}>
            <span className="nav-item-icon">🚪</span>
            Logout
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {/* Top bar */}
        <header className="topbar">
          <h1 className="topbar-title">
            {[...mainNavItems, ...resumeNavItems, ...jobNavItems, ...otherNavItems, ...toolsNavItems]
              .find((item) => window.location.pathname === item.path)?.label || 'JobAI'}
          </h1>
          <div className="topbar-actions">
            {user && (
              <span style={{ fontSize: 14, color: 'var(--gray-500)' }}>
                Welcome, {user.full_name || user.username}
              </span>
            )}
          </div>
        </header>

        {/* Page content */}
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;
