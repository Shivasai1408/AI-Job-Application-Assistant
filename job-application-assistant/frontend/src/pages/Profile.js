import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { getUser, setAuthData } from '../services/auth';

function Profile() {
  const user = getUser();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    headline: '',
    summary: '',
    skills: '',
    experience_years: 0,
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authAPI.getProfile();
        const data = res.data;
        setFormData({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || '',
          headline: data.headline || '',
          summary: data.summary || '',
          skills: data.skills || '',
          experience_years: data.experience_years || 0,
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setFetchLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const value = e.target.name === 'experience_years' ? parseInt(e.target.value) || 0 : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await authAPI.updateProfile(formData);
      // Update stored user data
      const currentUser = getUser();
      if (currentUser) {
        setAuthData(
          localStorage.getItem('access_token'),
          { ...currentUser, ...res.data }
        );
      }
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>👤 Profile Settings</h2>
        <p className="text-muted mt-1">Manage your personal information and skills</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="detail-layout">
        {/* Main Profile Form */}
        <div className="card">
          <h3 className="card-title mb-4">Personal Information</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid-2" style={{ gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  className="form-input"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="John Doe"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  disabled
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="text"
                  name="phone"
                  className="form-input"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  name="location"
                  className="form-input"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="San Francisco, CA"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Professional Headline</label>
              <input
                type="text"
                name="headline"
                className="form-input"
                value={formData.headline}
                onChange={handleChange}
                placeholder="e.g., Senior Software Engineer | Full Stack Developer"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Professional Summary</label>
              <textarea
                name="summary"
                className="form-textarea"
                rows={4}
                value={formData.summary}
                onChange={handleChange}
                placeholder="Brief summary of your professional background and career goals..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Skills (comma-separated)</label>
              <textarea
                name="skills"
                className="form-textarea"
                rows={3}
                value={formData.skills}
                onChange={handleChange}
                placeholder="Python, JavaScript, React, Node.js, AWS, Docker, Kubernetes, SQL, Machine Learning, Agile"
              />
              {formData.skills && (
                <div className="mt-2" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {formData.skills.split(',').map((skill, i) => (
                    <span key={i} className="tag tag-primary">{skill.trim()}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group" style={{ maxWidth: 200 }}>
              <label className="form-label">Years of Experience</label>
              <input
                type="number"
                name="experience_years"
                className="form-input"
                value={formData.experience_years}
                onChange={handleChange}
                min={0}
                max={50}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
            >
              {loading ? 'Saving...' : '💾 Save Profile'}
            </button>
          </form>
        </div>

        {/* Sidebar */}
        <div>
          <div className="card mb-4" style={{ textAlign: 'center' }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              color: 'white',
              fontWeight: 700,
              margin: '0 auto 16px',
            }}>
              {(user?.full_name || user?.username || '?')[0].toUpperCase()}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600 }}>{user?.full_name || user?.username}</h3>
            <p className="text-muted text-sm">{user?.email}</p>
            {formData.headline && (
              <p className="text-sm mt-2" style={{ color: 'var(--primary)' }}>{formData.headline}</p>
            )}
          </div>

          <div className="card">
            <h4 className="font-semibold mb-3">Account Info</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="flex-between">
                <span className="text-muted text-sm">Username</span>
                <span className="text-sm font-medium">{user?.username}</span>
              </div>
              <div className="flex-between">
                <span className="text-muted text-sm">Member Since</span>
                <span className="text-sm">-</span>
              </div>
              <div className="flex-between">
                <span className="text-muted text-sm">Skills Count</span>
                <span className="text-sm font-medium">
                  {formData.skills ? formData.skills.split(',').length : 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
