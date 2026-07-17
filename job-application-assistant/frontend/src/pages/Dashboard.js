import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { applicationsAPI, jobsAPI, resumeAPI } from '../services/api';
import { getUser } from '../services/auth';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentApps, setRecentApps] = useState([]);
  const [resumeCount, setResumeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const user = getUser();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, jobsRes, appsRes, resumesRes] = await Promise.all([
          applicationsAPI.getStats().catch(() => null),
          jobsAPI.getRecommended(4).catch(() => null),
          applicationsAPI.list().catch(() => null),
          resumeAPI.list().catch(() => null),
        ]);

        if (statsRes) setStats(statsRes.data);
        if (jobsRes) setRecentJobs(jobsRes.data || []);
        if (appsRes) setRecentApps((appsRes.data || []).slice(0, 5));
        if (resumesRes) setResumeCount((resumesRes.data || []).length);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  const statCards = [
    {
      icon: '📄',
      color: 'blue',
      value: resumeCount,
      label: 'Resumes',
      link: '/resumes',
    },
    {
      icon: '📋',
      color: 'green',
      value: stats?.total_applications || 0,
      label: 'Applications',
      link: '/applications',
    },
    {
      icon: '🎯',
      color: 'purple',
      value: stats?.interview || 0,
      label: 'Interviews',
      link: '/applications',
    },
    {
      icon: '✉️',
      color: 'orange',
      value: recentApps.filter((a) => a.status === 'submitted').length || 0,
      label: 'Active Submissions',
      link: '/applications',
    },
  ];

  return (
    <div>
      {/* Welcome Section */}
      <div className="card mb-6" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)', color: 'white', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
              Welcome back, {user?.full_name || user?.username}! 👋
            </h2>
            <p style={{ opacity: 0.9, fontSize: 15 }}>
              Your AI-powered job application assistant is ready. Let's find your next opportunity!
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to="/jobs" className="btn btn-primary" style={{ background: 'white', color: '#4f46e5' }}>
              🔍 Browse Jobs
            </Link>
            <Link to="/resumes" className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
              📄 Manage Resumes
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid-4 mb-6">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className="stat-card"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(stat.link)}
          >
            <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
            <div className="stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Recent Jobs */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recommended Jobs</h2>
            <Link to="/jobs" className="btn btn-sm btn-primary">
              View All
            </Link>
          </div>
          {recentJobs.length === 0 ? (
            <div className="empty-state" style={{ padding: 30 }}>
              <p className="text-muted">No recommendations yet. Update your skills in profile.</p>
            </div>
          ) : (
            recentJobs.map((job) => (
              <div
                key={job.id}
                className="job-card"
                style={{ marginBottom: 12, cursor: 'pointer' }}
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <div className="job-card-title">{job.title}</div>
                <div className="job-card-company">{job.company}</div>
                <div className="job-card-details">
                  <span className="job-card-detail">📍 {job.location}</span>
                  <span className="job-card-detail">💰 {job.salary_range}</span>
                  <span className="job-card-detail">⏰ {job.job_type}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recent Applications */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Applications</h2>
            <Link to="/applications" className="btn btn-sm btn-primary">
              View All
            </Link>
          </div>
          {recentApps.length === 0 ? (
            <div className="empty-state" style={{ padding: 30 }}>
              <p className="text-muted">No applications yet. Start by searching for jobs!</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApps.map((app) => (
                    <tr key={app.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/applications')}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{app.job?.title || 'Unknown Position'}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{app.job?.company || ''}</div>
                      </td>
                      <td>
                        <span className={`status-badge status-${app.status}`}>
                          {app.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                        {app.created_at ? new Date(app.created_at).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card mt-4">
        <h2 className="card-title mb-4">🚀 Quick Actions</h2>
        <div className="grid-4" style={{ gap: 12 }}>
          <Link to="/resumes/new" className="btn btn-primary" style={{ justifyContent: 'center' }}>
            ➕ Create Resume
          </Link>
          <Link to="/resumes/templates" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
            🎨 Resume Templates
          </Link>
          <Link to="/jobs" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
            🔍 Search Jobs
          </Link>
          <Link to="/applications" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
            📋 Applications
          </Link>
          <Link to="/interviews" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
            📅 Schedule Interview
          </Link>
          <Link to="/alerts" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
            🔔 Job Alerts
          </Link>
          <Link to="/skill-gap" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
            🧠 Skill Gap
          </Link>
          <Link to="/auto-apply" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
            ⚡ Auto-Apply
          </Link>
          <Link to="/ats-score" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
            🎯 ATS Score
          </Link>
          <Link to="/cover-letters" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
            ✉️ Cover Letter
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
