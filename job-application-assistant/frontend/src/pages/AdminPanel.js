import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';

const TABS = [
  { key: 'dashboard', label: '📊 Dashboard', icon: '📊' },
  { key: 'users', label: '👥 Users', icon: '👥' },
  { key: 'jobs', label: '💼 Jobs', icon: '💼' },
];

const STAT_CARD_STYLE = {
  primary: { icon: '📊', color: 'primary', gradient: 'stat-primary' },
  success: { icon: '✅', color: 'success', gradient: 'stat-success' },
  warning: { icon: '⚠️', color: 'warning', gradient: 'stat-warning' },
  danger: { icon: '🚨', color: 'danger', gradient: 'stat-danger' },
  accent: { icon: '📋', color: 'accent', gradient: 'stat-accent' },
  secondary: { icon: '🎯', color: 'secondary', gradient: '' },
};

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dashboard state
  const [stats, setStats] = useState(null);

  // Users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // Jobs state
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobSearch, setJobSearch] = useState('');

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminAPI.getStats();
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError('Failed to load system statistics');
    }
  }, []);

  const fetchUsers = useCallback(async (search = '') => {
    setUsersLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      const res = await adminAPI.getUsers(params);
      setUsers(res.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchJobs = useCallback(async (search = '') => {
    setJobsLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      const res = await adminAPI.getJobs(params);
      setJobs(res.data || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load jobs');
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    if (activeTab === 'dashboard') {
      fetchStats().finally(() => setLoading(false));
    } else if (activeTab === 'users') {
      fetchUsers(userSearch).finally(() => setLoading(false));
    } else if (activeTab === 'jobs') {
      fetchJobs(jobSearch).finally(() => setLoading(false));
    }
  }, [activeTab, fetchStats, fetchUsers, fetchJobs, userSearch, jobSearch]);

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await adminAPI.updateUser(userId, { is_active: !currentStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !currentStatus } : u))
      );
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await adminAPI.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setConfirmModal(null);
    } catch (err) {
      setError('Failed to delete user');
      setConfirmModal(null);
    }
  };

  const handleToggleJobStatus = async (jobId, currentStatus) => {
    try {
      await adminAPI.updateJob(jobId, { is_active: !currentStatus });
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, is_active: !currentStatus } : j))
      );
    } catch (err) {
      setError('Failed to update job status');
    }
  };

  const handleDeleteJob = async (jobId) => {
    try {
      await adminAPI.deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      setConfirmModal(null);
    } catch (err) {
      setError('Failed to delete job');
      setConfirmModal(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const renderStatsCards = () => {
    if (!stats) return null;

    const cards = [
      {
        key: 'total_users',
        ...STAT_CARD_STYLE.primary,
        value: stats.total_users,
        label: 'Total Users',
      },
      {
        key: 'active_users',
        ...STAT_CARD_STYLE.success,
        value: stats.active_users,
        label: 'Active Users',
      },
      {
        key: 'total_applications',
        ...STAT_CARD_STYLE.accent,
        value: stats.total_applications,
        label: 'Total Applications',
      },
      {
        key: 'total_jobs',
        ...STAT_CARD_STYLE.warning,
        value: stats.total_jobs,
        label: 'Total Jobs',
      },
      {
        key: 'total_interviews',
        ...STAT_CARD_STYLE.secondary,
        value: stats.total_interviews,
        label: 'Total Interviews',
      },
      {
        key: 'total_resumes',
        ...STAT_CARD_STYLE.danger,
        value: stats.total_resumes,
        label: 'Total Resumes',
      },
      {
        key: 'applications_today',
        ...STAT_CARD_STYLE.primary,
        value: stats.applications_today,
        label: 'Applications Today',
      },
      {
        key: 'users_joined_today',
        ...STAT_CARD_STYLE.success,
        value: stats.users_joined_today,
        label: 'Users Joined Today',
      },
    ];

    return (
      <div className="grid-4">
        {cards.map((card) => (
          <div key={card.key} className={`stat-card ${card.gradient}`}>
            <div className={`stat-card-icon ${card.color}`}>
              {card.icon}
            </div>
            <div className="stat-card-content">
              <div className="stat-card-value">{card.value ?? 0}</div>
              <div className="stat-card-label">{card.label}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDashboard = () => {
    if (loading) {
      return (
        <div className="spinner-container">
          <div className="spinner spinner-lg" />
        </div>
      );
    }

    return (
      <div>
        <div className="mb-6">
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>System Overview</h3>
          <p className="text-muted">Key metrics and statistics across the platform</p>
        </div>

        {renderStatsCards()}

        {stats && stats.most_common_status && (
          <div className="card mt-6">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span className="text-muted text-sm">Most Common Application Status</span>
                <h4 style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>
                  <span className="badge badge-info" style={{ fontSize: 14, padding: '6px 16px' }}>
                    {stats.most_common_status}
                  </span>
                </h4>
              </div>
              <div>
                <span className="text-muted text-sm">Average Applications Per User</span>
                <h4 style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>
                  {stats.average_applications_per_user?.toFixed(1) || '0'}
                </h4>
              </div>
            </div>
          </div>
        )}

        {stats && stats.status_breakdown && stats.status_breakdown.length > 0 && (
          <div className="card mt-4">
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Status Breakdown</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.status_breakdown.map((item) => {
                const total = Object.values(stats.status_breakdown).reduce(
                  (sum, s) => sum + (typeof s === 'number' ? s : 0),
                  0
                ) || 1;
                const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
                return (
                  <div key={item.status}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="text-sm font-medium">{item.status}</span>
                      <span className="text-sm text-muted">{item.count} ({pct}%)</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderUsers = () => {
    return (
      <div>
        <div className="search-filter-bar">
          <div className="search-field">
            <span className="search-field-icon">🔍</span>
            <input
              type="text"
              placeholder="Search users by name, email, or username..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => fetchUsers(userSearch)}
            disabled={usersLoading}
          >
            {usersLoading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {usersLoading ? (
          <div className="spinner-container">
            <div className="spinner spinner-lg" />
          </div>
        ) : users.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <h3 className="empty-state-title">No users found</h3>
              <p className="empty-state-text">
                {userSearch ? 'Try a different search term.' : 'No users registered yet.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Full Name</th>
                  <th>Status</th>
                  <th>Skills</th>
                  <th>Location</th>
                  <th>Applications</th>
                  <th>Interviews</th>
                  <th>Joined</th>
                  <th className="table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <span className="font-medium">{user.username}</span>
                    </td>
                    <td>
                      <span className="text-sm">{user.email}</span>
                    </td>
                    <td>
                      <span className="text-sm">{user.full_name || '-'}</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {user.skills && user.skills.length > 0 ? (
                        <div className="tags-list" style={{ maxWidth: 200 }}>
                          {(Array.isArray(user.skills) ? user.skills : []).slice(0, 3).map((skill, i) => (
                            <span key={i} className="tag tag-primary">{skill}</span>
                          ))}
                          {user.skills.length > 3 && (
                            <span className="tag">+{user.skills.length - 3}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <span className="text-sm">{user.location || '-'}</span>
                    </td>
                    <td>
                      <span className="badge badge-info">{user.applications_count || 0}</span>
                    </td>
                    <td>
                      <span className="badge badge-secondary">{user.interviews_count || 0}</span>
                    </td>
                    <td>
                      <span className="text-sm text-muted">{formatDate(user.created_at)}</span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className={`btn btn-sm ${user.is_active ? 'btn-warning' : 'btn-success'}`}
                          onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                          title={user.is_active ? 'Deactivate user' : 'Activate user'}
                        >
                          {user.is_active ? '🔒 Deactivate' : '🔓 Activate'}
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() =>
                            setConfirmModal({
                              type: 'user',
                              id: user.id,
                              name: user.username,
                              message: `Are you sure you want to delete user "${user.username}"? This action cannot be undone.`,
                            })
                          }
                          title="Delete user"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderJobs = () => {
    return (
      <div>
        <div className="search-filter-bar">
          <div className="search-field">
            <span className="search-field-icon">🔍</span>
            <input
              type="text"
              placeholder="Search jobs by title, company, or industry..."
              value={jobSearch}
              onChange={(e) => setJobSearch(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => fetchJobs(jobSearch)}
            disabled={jobsLoading}
          >
            {jobsLoading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {jobsLoading ? (
          <div className="spinner-container">
            <div className="spinner spinner-lg" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">💼</div>
              <h3 className="empty-state-title">No jobs found</h3>
              <p className="empty-state-text">
                {jobSearch ? 'Try a different search term.' : 'No jobs have been posted yet.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Company</th>
                  <th>Location</th>
                  <th>Job Type</th>
                  <th>Industry</th>
                  <th>Status</th>
                  <th>Applications</th>
                  <th>Created</th>
                  <th className="table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <span className="font-medium">{job.title}</span>
                    </td>
                    <td>
                      <span className="text-sm">{job.company}</span>
                    </td>
                    <td>
                      <span className="text-sm">{job.location || '-'}</span>
                    </td>
                    <td>
                      <span className="tag tag-primary">{job.job_type || '-'}</span>
                    </td>
                    <td>
                      <span className="text-sm">{job.industry || '-'}</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${job.is_active ? 'badge-success' : 'badge-danger'}`}
                      >
                        {job.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-info">{job.applications_count || 0}</span>
                    </td>
                    <td>
                      <span className="text-sm text-muted">{formatDate(job.created_at)}</span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className={`btn btn-sm ${job.is_active ? 'btn-warning' : 'btn-success'}`}
                          onClick={() => handleToggleJobStatus(job.id, job.is_active)}
                          title={job.is_active ? 'Deactivate job' : 'Activate job'}
                        >
                          {job.is_active ? '🔒 Deactivate' : '🔓 Activate'}
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() =>
                            setConfirmModal({
                              type: 'job',
                              id: job.id,
                              name: job.title,
                              message: `Are you sure you want to delete job "${job.title}" at ${job.company}? This action cannot be undone.`,
                            })
                          }
                          title="Delete job"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'users':
        return renderUsers();
      case 'jobs':
        return renderJobs();
      default:
        return null;
    }
  };

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>🛡️ Admin Panel</h1>
          <p>Monitor and manage platform users and job listings</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-6">
          <span className="alert-icon">⚠️</span>
          <div className="alert-content">{error}</div>
          <button
            className="modal-close"
            style={{ marginLeft: 'auto', flexShrink: 0 }}
            onClick={() => setError('')}
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 24,
          padding: 4,
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: '12px 20px',
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: activeTab === tab.key ? 600 : 500,
              background: activeTab === tab.key
                ? 'var(--primary-gradient)'
                : 'transparent',
              color: activeTab === tab.key
                ? 'var(--text-on-primary)'
                : 'var(--text-secondary)',
              boxShadow: activeTab === tab.key ? 'var(--shadow-glow-primary)' : 'none',
              transition: 'all 0.25s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fadeIn">
        {renderTabContent()}
      </div>

      {/* Confirm Delete Modal */}
      {confirmModal && (
        <div className="modal-overlay" onClick={() => setConfirmModal(null)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
              <button className="modal-close" onClick={() => setConfirmModal(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 48 }}>⚠️</span>
              </div>
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {confirmModal.message}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmModal(null)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  if (confirmModal.type === 'user') {
                    handleDeleteUser(confirmModal.id);
                  } else if (confirmModal.type === 'job') {
                    handleDeleteJob(confirmModal.id);
                  }
                }}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
