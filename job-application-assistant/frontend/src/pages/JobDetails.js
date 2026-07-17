import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobsAPI, applicationsAPI, resumeAPI } from '../services/api';

function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState([]);
  const [showApply, setShowApply] = useState(false);
  const [selectedResume, setSelectedResume] = useState('');
  const [applyNotes, setApplyNotes] = useState('');
  const [applying, setApplying] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [generatingCL, setGeneratingCL] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobRes, resumesRes] = await Promise.all([
          jobsAPI.getDetails(id),
          resumeAPI.list().catch(() => ({ data: [] })),
        ]);
        setJob(jobRes.data);
        setResumes(resumesRes.data || []);
      } catch (err) {
        setError('Failed to load job details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleApply = async () => {
    if (!selectedResume) {
      setError('Please select a resume to use for this application');
      return;
    }
    setApplying(true);
    setError('');

    try {
      await applicationsAPI.create({
        job_id: parseInt(id),
        tailored_resume_id: parseInt(selectedResume) || null,
        notes: applyNotes || undefined,
      });
      setSuccess('Application created successfully! You can track it in Applications.');
      setShowApply(false);
      setTimeout(() => navigate('/applications'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create application');
    } finally {
      setApplying(false);
    }
  };

  const handleGenerateCL = async () => {
    setGeneratingCL(true);
    try {
      const res = await applicationsAPI.generateCoverLetter({
        job_id: parseInt(id),
        tone: 'professional',
      });
      setCoverLetter(res.data.content);
    } catch (err) {
      setError('Failed to generate cover letter');
    } finally {
      setGeneratingCL(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="card">
        <div className="empty-state">
          <h3>Job not found</h3>
          <button className="btn btn-primary mt-4" onClick={() => navigate('/jobs')}>
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="detail-layout">
        {/* Main content */}
        <div>
          <div className="card mb-4">
            <div className="flex-between mb-4">
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 700 }}>{job.title}</h2>
                <p style={{ fontSize: 16, color: 'var(--primary)', fontWeight: 500, marginTop: 4 }}>
                  {job.company}
                </p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowApply(true)}>
                📋 Apply Now
              </button>
            </div>

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 20 }}>
              <div className="text-sm">
                <span className="text-muted">📍 Location:</span>{' '}
                <strong>{job.location || 'Remote'}</strong>
              </div>
              <div className="text-sm">
                <span className="text-muted">💰 Salary:</span>{' '}
                <strong>{job.salary_range || 'Not specified'}</strong>
              </div>
              <div className="text-sm">
                <span className="text-muted">⏰ Type:</span>{' '}
                <strong>{job.job_type}</strong>
              </div>
              <div className="text-sm">
                <span className="text-muted">📊 Level:</span>{' '}
                <strong>{job.experience_level}</strong>
              </div>
              <div className="text-sm">
                <span className="text-muted">🏢 Industry:</span>{' '}
                <strong>{job.industry}</strong>
              </div>
            </div>

            <h4 className="font-semibold mb-2">Job Description</h4>
            <p style={{ lineHeight: 1.7, color: 'var(--gray-700)', fontSize: 14 }}>
              {job.description}
            </p>

            {job.requirements && (
              <>
                <h4 className="font-semibold mt-4 mb-2">Requirements</h4>
                <p style={{ lineHeight: 1.7, color: 'var(--gray-700)', fontSize: 14 }}>
                  {job.requirements}
                </p>
              </>
            )}

            {job.skills_required && (
              <>
                <h4 className="font-semibold mt-4 mb-2">Required Skills</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {job.skills_required.split(',').map((skill, i) => (
                    <span key={i} className="tag tag-primary">{skill.trim()}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Cover Letter Section */}
          <div className="card">
            <div className="flex-between mb-4">
              <h3 className="card-title" style={{ margin: 0 }}>✉️ Cover Letter</h3>
              <button
                className="btn btn-sm btn-primary"
                onClick={handleGenerateCL}
                disabled={generatingCL}
              >
                {generatingCL ? 'Generating...' : 'Generate'}
              </button>
            </div>
            {coverLetter ? (
              <div style={{
                background: 'var(--gray-50)',
                padding: 20,
                borderRadius: 'var(--radius)',
                fontSize: 14,
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
                maxHeight: 400,
                overflow: 'auto',
              }}>
                {coverLetter}
              </div>
            ) : (
              <p className="text-muted text-sm">
                Click "Generate" to create an AI-powered cover letter tailored for this position.
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="card mb-4">
            <h4 className="font-semibold mb-3">Job Summary</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="flex-between">
                <span className="text-muted text-sm">Source</span>
                <span className="text-sm">{job.source}</span>
              </div>
              <div className="flex-between">
                <span className="text-muted text-sm">Posted</span>
                <span className="text-sm">
                  {job.posted_date ? new Date(job.posted_date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex-between">
                <span className="text-muted text-sm">Status</span>
                <span className={`tag ${job.is_active ? 'tag-success' : ''}`}>
                  {job.is_active ? 'Active' : 'Closed'}
                </span>
              </div>
            </div>
            <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid var(--gray-200)' }} />
            <button
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => navigate('/jobs')}
            >
              ← Back to Jobs
            </button>
          </div>

          {/* Quick actions */}
          <div className="card">
            <h4 className="font-semibold mb-3">Quick Actions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                className="btn btn-sm btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setShowApply(true)}
              >
                📋 Apply for This Job
              </button>
              <button
                className="btn btn-sm btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => navigate(`/cover-letters?jobId=${id}`)}
              >
                ✉️ Generate Cover Letter
              </button>
              <button
                className="btn btn-sm btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => navigate(`/ats-score?jobId=${id}`)}
              >
                🎯 Check ATS Compatibility
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApply && (
        <div className="modal-overlay" onClick={() => setShowApply(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Apply for {job.title}</h3>
            <p style={{ color: 'var(--gray-500)', marginBottom: 20 }}>
              at {job.company} • {job.location || 'Remote'}
            </p>

            {resumes.length === 0 ? (
              <div className="alert alert-warning">
                No resumes found.{' '}
                <button className="btn btn-sm btn-primary" onClick={() => navigate('/resumes/new')}>
                  Create One
                </button>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Select Resume</label>
                <select
                  className="form-select"
                  value={selectedResume}
                  onChange={(e) => setSelectedResume(e.target.value)}
                >
                  <option value="">Choose a resume...</option>
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} {r.ats_score ? `(ATS: ${r.ats_score})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={applyNotes}
                onChange={(e) => setApplyNotes(e.target.value)}
                placeholder="Any notes about this application..."
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowApply(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleApply}
                disabled={applying || resumes.length === 0}
              >
                {applying ? 'Creating...' : 'Create Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobDetails;
