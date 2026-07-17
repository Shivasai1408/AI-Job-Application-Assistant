import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { coverLettersAPI } from '../services/api';

function CoverLetters() {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generateData, setGenerateData] = useState({
    job_title: '',
    company: '',
    job_description: '',
    tone: 'professional',
  });
  const [generatedContent, setGeneratedContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchLetters = async () => {
    try {
      const res = await coverLettersAPI.list();
      setLetters(res.data || []);
    } catch (err) {
      console.error('Error fetching cover letters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLetters();
  }, []);

  const handleGenerate = async () => {
    if (!generateData.job_description.trim()) {
      setError('Please enter a job description');
      return;
    }
    setGenerating(true);
    setError('');

    try {
      const res = await coverLettersAPI.generate(generateData);
      setGeneratedContent(res.data.content);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate cover letter');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    try {
      await coverLettersAPI.save(generatedContent, 0, generateData.tone);
      setGeneratedContent('');
      setShowGenerate(false);
      fetchLetters();
    } catch (err) {
      setError('Failed to save cover letter');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this cover letter?')) return;
    try {
      await coverLettersAPI.delete(id);
      setLetters(letters.filter((l) => l.id !== id));
    } catch (err) {
      console.error('Error deleting cover letter:', err);
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
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>✉️ Cover Letters</h2>
          <p className="text-muted mt-1">Generate and manage AI-powered cover letters</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowGenerate(true)}>
          ✨ Generate New
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Generate Panel */}
      {showGenerate && (
        <div className="card mb-6 fade-in">
          <h3 className="card-title mb-4">Generate Cover Letter</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Job Title</label>
              <input
                type="text"
                className="form-input"
                value={generateData.job_title}
                onChange={(e) => setGenerateData({ ...generateData, job_title: e.target.value })}
                placeholder="e.g., Software Engineer"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Company</label>
              <input
                type="text"
                className="form-input"
                value={generateData.company}
                onChange={(e) => setGenerateData({ ...generateData, company: e.target.value })}
                placeholder="e.g., Google"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Job Description *</label>
            <textarea
              className="form-textarea"
              rows={8}
              value={generateData.job_description}
              onChange={(e) => setGenerateData({ ...generateData, job_description: e.target.value })}
              placeholder="Paste the job description here..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tone</label>
            <select
              className="form-select"
              value={generateData.tone}
              onChange={(e) => setGenerateData({ ...generateData, tone: e.target.value })}
              style={{ maxWidth: 200 }}
            >
              <option value="professional">Professional</option>
              <option value="enthusiastic">Enthusiastic</option>
              <option value="formal">Formal</option>
            </select>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? 'Generating...' : '✨ Generate Cover Letter'}
          </button>

          {/* Generated Result */}
          {generatedContent && (
            <div className="mt-4">
              <div className="flex-between mb-2">
                <h4 className="font-semibold">Generated Cover Letter</h4>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm btn-primary" onClick={handleSave}>
                    💾 Save
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedContent);
                    }}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
              <div style={{
                background: 'var(--gray-50)',
                padding: 24,
                borderRadius: 'var(--radius)',
                fontSize: 14,
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
                maxHeight: 500,
                overflow: 'auto',
                border: '1px solid var(--gray-200)',
              }}>
                {generatedContent}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Saved Cover Letters */}
      {letters.length === 0 && !showGenerate ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">✉️</div>
            <h3 className="empty-state-title">No cover letters yet</h3>
            <p className="empty-state-text">
              Generate personalized cover letters for your job applications.
            </p>
            <button className="btn btn-primary" onClick={() => setShowGenerate(true)}>
              ✨ Generate Your First Cover Letter
            </button>
          </div>
        </div>
      ) : (
        <div className="grid-2">
          {letters.map((letter) => (
            <div key={letter.id} className="card">
              <div className="flex-between mb-3">
                <div>
                  <div className="tag tag-primary">{letter.tone}</div>
                  <span className="text-sm text-muted ml-2">
                    {letter.created_at ? new Date(letter.created_at).toLocaleDateString() : ''}
                  </span>
                </div>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(letter.id)}
                >
                  🗑️
                </button>
              </div>
              <div style={{
                background: 'var(--gray-50)',
                padding: 16,
                borderRadius: 'var(--radius)',
                fontSize: 13,
                lineHeight: 1.7,
                maxHeight: 300,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
              }}>
                {letter.content?.substring(0, 600)}
                {(letter.content?.length || 0) > 600 ? '...' : ''}
              </div>
              <button
                className="btn btn-sm btn-secondary mt-2"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  navigator.clipboard.writeText(letter.content);
                }}
              >
                📋 Copy to Clipboard
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CoverLetters;
