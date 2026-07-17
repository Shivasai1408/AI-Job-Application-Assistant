import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationsAPI } from '../services/api';

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

function Applications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();

  const fetchApps = async () => {
    setLoading(true);
    try {
      const [appsRes, statsRes] = await Promise.all([
        applicationsAPI.list(statusFilter || undefined),
        applicationsAPI.getStats().catch(() => null),
      ]);
      setApps(appsRes.data || []);
      if (statsRes) setStats(statsRes.data);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [statusFilter]);

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await applicationsAPI.update(appId, { status: newStatus });
      setApps(apps.map((a) => (a.id === appId ? { ...a, status: newStatus } : a)));
      setEditingId(null);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDelete = async (appId) => {
    if (!window.confirm('Delete this application?')) return;
    try {
      await applicationsAPI.delete(appId);
      setApps(apps.filter((a) => a.id !== appId));
    } catch (err) {
      console.error('Error deleting application:', err);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>📋 Applications</h2>
        <p className="text-muted mt-1">Track and manage all your job applications</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid-4 mb-6">
          <div className="stat-card">
            <div className="stat-icon blue">📋</div>
            <div className="stat-info">
              <h3>{stats.total_applications}</h3>
              <p>Total</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">✉️</div>
            <div className="stat-info">
              <h3>{stats.submitted || 0}</h3>
              <p>Submitted</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple">🎤</div>
            <div className="stat-info">
              <h3>{stats.interview || 0}</h3>
              <p>Interviews</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">🏆</div>
            <div className="stat-info">
              <h3>{stats.offer || 0}</h3>
              <p>Offers</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="card mb-4">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>
            Filter by status:
          </label>
          <select
            className="form-select"
            style={{ maxWidth: 200 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Applications List */}
      {apps.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3 className="empty-state-title">No applications yet</h3>
            <p className="empty-state-text">
              Start by searching for jobs and creating applications.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/jobs')}>
              🔍 Browse Jobs
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Job / Company</th>
                  <th>Status</th>
                  <th>Applied</th>
                  <th>Interview</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{app.job?.title || 'Unknown'}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                        {app.job?.company || ''}
                      </div>
                    </td>
                    <td>
                      {editingId === app.id ? (
                        <select
                          className="form-select"
                          style={{ width: 130, padding: '4px 8px', fontSize: 12 }}
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value)}
                          autoFocus
                          onBlur={() => setEditingId(null)}
                        >
                          {statusOptions.filter((o) => o.value).map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`status-badge status-${app.status}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setEditingId(app.id)}
                        >
                          {app.status}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                      {app.applied_date
                        ? new Date(app.applied_date).toLocaleDateString()
                        : app.created_at
                          ? new Date(app.created_at).toLocaleDateString()
                          : '-'}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                      {app.interview_date
                        ? new Date(app.interview_date).toLocaleDateString()
                        : '-'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => navigate(`/jobs/${app.job_id}`)}
                        >
                          👁️
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(app.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Applications;
