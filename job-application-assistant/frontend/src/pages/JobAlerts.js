import React, { useState, useEffect } from 'react';
import { alertsAPI } from '../services/api';

function JobAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('alerts');
  const [showCreate, setShowCreate] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    keywords: '',
    location: '',
    job_type: '',
    experience_level: '',
    salary_min: '',
    industry: '',
    frequency: 'daily',
  });

  const fetchData = async () => {
    try {
      const [alertsRes, notifRes, unreadRes] = await Promise.all([
        alertsAPI.list(),
        alertsAPI.getNotifications(),
        alertsAPI.getUnreadCount(),
      ]);
      setAlerts(alertsRes.data || []);
      setNotifications(notifRes.data || []);
      setUnreadCount(unreadRes.data?.unread_count || 0);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await alertsAPI.create({
        ...formData,
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
      });
      setShowCreate(false);
      setFormData({
        name: '', keywords: '', location: '', job_type: '',
        experience_level: '', salary_min: '', industry: '', frequency: 'daily',
      });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create alert');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this alert?')) return;
    try {
      await alertsAPI.delete(id);
      setAlerts(alerts.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Error deleting alert:', err);
    }
  };

  const handleToggleActive = async (alert) => {
    try {
      await alertsAPI.update(alert.id, { is_active: !alert.is_active });
      fetchData();
    } catch (err) {
      console.error('Error toggling alert:', err);
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
      <div className="flex-between mb-6">
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>🔔 Job Alerts & Notifications</h2>
          <p className="text-muted mt-1">Stay updated with new opportunities and application status changes</p>
        </div>
        {activeTab === 'alerts' && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            ➕ Create Alert
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>
          🔔 Job Alerts {alerts.length > 0 && `(${alerts.length})`}
        </button>
        <button className={`tab ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
          📬 Notifications {unreadCount > 0 && <span className="nav-item-badge">{unreadCount}</span>}
        </button>
      </div>

      {/* Create Alert Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 550 }}>
            <h3 className="modal-title">Create Job Alert</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Alert Name *</label>
                <input type="text" className="form-input" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Senior Python Jobs" required />
              </div>
              <div className="grid-2" style={{ gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Keywords</label>
                  <input type="text" className="form-input" value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="python, django, aws" />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input type="text" className="form-input" value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Remote, New York, etc." />
                </div>
                <div className="form-group">
                  <label className="form-label">Job Type</label>
                  <select className="form-select" value={formData.job_type}
                    onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}>
                    <option value="">Any</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Experience Level</label>
                  <select className="form-select" value={formData.experience_level}
                    onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}>
                    <option value="">Any</option>
                    <option value="Entry">Entry</option>
                    <option value="Mid">Mid-Level</option>
                    <option value="Senior">Senior</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Min Salary</label>
                  <input type="number" className="form-input" value={formData.salary_min}
                    onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                    placeholder="100000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Frequency</label>
                  <select className="form-select" value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}>
                    <option value="realtime">Real-time</option>
                    <option value="daily">Daily Digest</option>
                    <option value="weekly">Weekly Digest</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Alert</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <>
          {alerts.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">🔔</div>
                <h3 className="empty-state-title">No job alerts yet</h3>
                <p className="empty-state-text">Create alerts to get notified about new job opportunities matching your criteria.</p>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Your First Alert</button>
              </div>
            </div>
          ) : (
            <div className="grid-2">
              {alerts.map((alert) => (
                <div key={alert.id} className="card">
                  <div className="flex-between mb-3">
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 600 }}>
                        {alert.is_active ? '🔔' : '🔕'} {alert.name}
                      </h4>
                      <div className="text-sm text-muted mt-1">
                        {alert.frequency} • {alert.matching_jobs_count || 0} matching jobs
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className={`btn btn-sm ${alert.is_active ? 'btn-success' : 'btn-secondary'}`}
                        onClick={() => handleToggleActive(alert)}>
                        {alert.is_active ? 'Active' : 'Paused'}
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(alert.id)}>🗑️</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {alert.keywords?.split(',').map((kw, i) => (
                      <span key={i} className="tag tag-primary">{kw.trim()}</span>
                    ))}
                    {alert.location && <span className="tag">📍 {alert.location}</span>}
                    {alert.job_type && <span className="tag">⏰ {alert.job_type}</span>}
                    {alert.experience_level && <span className="tag">📊 {alert.experience_level}</span>}
                    {alert.salary_min && <span className="tag">💰 ${alert.salary_min}+</span>}
                  </div>
                  {alert.last_triggered && (
                    <p className="text-xs text-muted mt-2">
                      Last checked: {new Date(alert.last_triggered).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <>
          {notifications.length > 0 && (
            <div className="mb-4" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-sm btn-secondary" onClick={async () => {
                await alertsAPI.markAllRead();
                fetchData();
              }}>Mark All as Read</button>
            </div>
          )}

          {notifications.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">📬</div>
                <h3 className="empty-state-title">No notifications</h3>
                <p className="empty-state-text">You'll see notifications here when jobs match your alerts or application statuses change.</p>
              </div>
            </div>
          ) : (
            notifications.map((notif) => (
              <div key={notif.id} className="card mb-2 fade-in"
                style={{
                  opacity: notif.is_read ? 0.6 : 1,
                  borderLeft: notif.is_read ? '4px solid transparent' : '4px solid var(--primary)',
                }}
                onClick={async () => {
                  if (!notif.is_read) {
                    await alertsAPI.markRead(notif.id);
                    fetchData();
                  }
                }}
              >
                <div className="flex-between">
                  <div style={{ flex: 1 }}>
                    <div className="flex-between">
                      <h4 style={{ fontSize: 14, fontWeight: 600 }}>{notif.title}</h4>
                      <span className="text-sm text-muted">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm mt-1" style={{ color: 'var(--gray-600)' }}>{notif.message}</p>
                    <span className="text-xs text-muted mt-1">{notif.notification_type}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}

export default JobAlerts;
