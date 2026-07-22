import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumeAPI } from '../services/api';

function Resumes() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(null);
  const navigate = useNavigate();

  const fetchResumes = async () => {
    try {
      const res = await resumeAPI.list();
      setResumes(res.data || []);
    } catch (err) {
      console.error('Error fetching resumes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleDelete = async (id) => {
    try {
      await resumeAPI.delete(id);
      setResumes(resumes.filter((r) => r.id !== id));
      setShowDelete(null);
    } catch (err) {
      console.error('Error deleting resume:', err);
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
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>My Resumes</h2>
          <p className="text-muted mt-1">Manage and tailor your resumes for job applications</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/resumes/new')}>
          ➕ Create Resume
        </button>
      </div>

      {resumes.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <h3 className="empty-state-title">No resumes yet</h3>
            <p className="empty-state-text">
              Create your first resume to start tailoring it for job applications.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/resumes/new')}>
              Create Your First Resume
            </button>
          </div>
        </div>
      ) : (
        <div className="grid-3">
          {resumes.map((resume) => (
            <div key={resume.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="flex-between" style={{ marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600 }}>{resume.title}</h3>
                  <p className="text-muted text-sm mt-1">
                    {resume.is_base ? '📌 Base Resume' : '📄 Custom'} 
                    {resume.ats_score !== null && ` • ATS: ${resume.ats_score}/100`}
                  </p>
                </div>
              </div>

              {resume.parsed_content && (
                <div style={{
                  flex: 1,
                  background: 'var(--gray-50)',
                  borderRadius: 'var(--radius)',
                  padding: 16,
                  fontSize: 12,
                  maxHeight: 200,
                  overflow: 'hidden',
                  position: 'relative',
                  marginBottom: 16,
                }}>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: 'var(--gray-600)' }}>
                    {resume.parsed_content.substring(0, 500)}
                    {resume.parsed_content.length > 500 ? '...' : ''}
                  </pre>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => navigate(`/resumes/${resume.id}`)}
                >
                  ✏️ Edit
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => navigate(`/ats-score?resumeId=${resume.id}`)}
                >
                  🎯 ATS Score
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  style={{ marginLeft: 'auto' }}
                  onClick={() => setShowDelete(resume.id)}
                >
                  🗑️
                </button>
              </div>

              {/* Delete confirmation */}
              {showDelete === resume.id && (
                <div className="alert alert-warning mt-2" style={{ marginBottom: 0 }}>
                  <span>Delete this resume?</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(resume.id)}>
                      Delete
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => setShowDelete(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Resumes;
