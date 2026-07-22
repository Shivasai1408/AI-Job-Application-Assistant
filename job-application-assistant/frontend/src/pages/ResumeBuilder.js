import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { resumeAPI } from '../services/api';

function ResumeBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEditing);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tailorMode, setTailorMode] = useState(false);
  const [tailorData, setTailorData] = useState({
    job_title: '',
    company: '',
    job_description: '',
  });
  const [tailorResult, setTailorResult] = useState(null);
  const [tailorLoading, setTailorLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      const fetchResume = async () => {
        try {
          const res = await resumeAPI.get(id);
          const resume = res.data;
          setFormData({
            title: resume.title || '',
            content: resume.parsed_content || '',
          });
        } catch (err) {
          setError('Failed to load resume');
        } finally {
          setFetchLoading(false);
        }
      };
      fetchResume();
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isEditing) {
        // For editing, we'd need an update endpoint; for now recreate
        await resumeAPI.delete(id);
      }
      await resumeAPI.create(formData.title, formData.content, !isEditing);
      setSuccess('Resume saved successfully!');
      setTimeout(() => navigate('/resumes'), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save resume');
    } finally {
      setLoading(false);
    }
  };

  const handleTailor = async () => {
    if (!tailorData.job_description.trim()) {
      setError('Please enter a job description to tailor the resume');
      return;
    }
    setTailorLoading(true);
    setError('');

    try {
      const res = await resumeAPI.tailorText(
        formData.content,
        tailorData.job_description,
        tailorData.job_title,
        tailorData.company
      );
      setTailorResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to tailor resume');
    } finally {
      setTailorLoading(false);
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
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>
          {isEditing ? 'Edit Resume' : 'Create New Resume'}
        </h2>
        <p className="text-muted mt-1">
          {isEditing
            ? 'Edit and tailor your resume for job applications.'
            : 'Create a new resume to start tailoring for job applications.'}
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="detail-layout">
        {/* Main form */}
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Resume Title</label>
              <input
                type="text"
                name="title"
                className="form-input"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Software Engineer Resume"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Resume Content (plain text)</label>
              <textarea
                name="content"
                className="form-textarea"
                value={formData.content}
                onChange={handleChange}
                placeholder={`Paste your resume content here...

Example format:
John Doe
john@email.com | (555) 123-4567

SUMMARY
Results-driven software engineer with 5+ years...

EXPERIENCE
Senior Software Engineer | TechCorp
Jan 2021 - Present
- Led development of microservices...
`}
                rows={20}
                required
                style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 1.5 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : '💾 Save Resume'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/resumes')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* AI Tailoring Panel */}
        <div className="card">
          <h3 className="card-title mb-4">🤖 AI Resume Tailor</h3>
          <p className="text-muted text-sm mb-4">
            Paste a job description to automatically tailor your resume for that specific role.
          </p>

          <div className="form-group">
            <label className="form-label">Job Title (optional)</label>
            <input
              type="text"
              className="form-input"
              value={tailorData.job_title}
              onChange={(e) => setTailorData({ ...tailorData, job_title: e.target.value })}
              placeholder="e.g., Senior Software Engineer"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Company (optional)</label>
            <input
              type="text"
              className="form-input"
              value={tailorData.company}
              onChange={(e) => setTailorData({ ...tailorData, company: e.target.value })}
              placeholder="e.g., Google"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Job Description *</label>
            <textarea
              className="form-textarea"
              value={tailorData.job_description}
              onChange={(e) => setTailorData({ ...tailorData, job_description: e.target.value })}
              placeholder="Paste the full job description here..."
              rows={10}
            />
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleTailor}
            disabled={tailorLoading || !formData.content}
          >
            {tailorLoading ? 'Tailoring...' : '🎯 Tailor Resume'}
          </button>

          {!formData.content && (
            <p className="text-sm text-muted mt-2">
              Add resume content above first to enable tailoring.
            </p>
          )}
        </div>
      </div>

      {/* Tailored Result */}
      {tailorResult && (
        <div className="card mt-4 fade-in">
          <div className="card-header">
            <h3 className="card-title">✅ Tailored Resume</h3>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => {
                setFormData({
                  title: `${formData.title} (Tailored)`,
                  content: tailorResult.tailored_content,
                });
                setTailorResult(null);
              }}
            >
              Use This Version
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <h4 className="font-semibold mb-2">Tailored Content</h4>
              <div style={{
                background: 'var(--gray-50)',
                padding: 16,
                borderRadius: 'var(--radius)',
                fontSize: 13,
                maxHeight: 500,
                overflow: 'auto',
                fontFamily: 'monospace',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
              }}>
                {tailorResult.tailored_content}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Changes Made</h4>
              <div style={{
                background: 'var(--gray-50)',
                padding: 16,
                borderRadius: 'var(--radius)',
                fontSize: 13,
                maxHeight: 500,
                overflow: 'auto',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}>
                {tailorResult.changes_summary || 'AI optimized your resume for this specific role.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResumeBuilder;
