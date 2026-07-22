import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { resumeAPI } from '../services/api';

function ATSScore() {
  const [searchParams] = useSearchParams();
  const initialResumeId = searchParams.get('resumeId') || '';

  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(initialResumeId);
  const [resumeContent, setResumeContent] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [useDirectText, setUseDirectText] = useState(false);

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const res = await resumeAPI.list();
        setResumes(res.data || []);
      } catch (err) {
        console.error('Error fetching resumes:', err);
      } finally {
        setFetchLoading(false);
      }
    };
    fetchResumes();
  }, []);

  useEffect(() => {
    if (selectedResume && !useDirectText) {
      const resume = resumes.find((r) => r.id === parseInt(selectedResume));
      if (resume) {
        setResumeContent(resume.parsed_content || '');
      }
    }
  }, [selectedResume, resumes, useDirectText]);

  const handleAnalyze = async () => {
    if (!resumeContent.trim() || !jobDescription.trim()) {
      setError('Please provide both resume content and job description');
      return;
    }
    setLoading(true);
    setError('');

    try {
      let res;
      if (selectedResume && !useDirectText) {
        res = await resumeAPI.analyzeATS(selectedResume, jobDescription);
      } else {
        res = await resumeAPI.analyzeATSText(resumeContent, jobDescription);
      }
      setAnalysis(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze ATS compatibility');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const CircularScore = ({ score, label, size = 120 }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = getScoreColor(score);

    return (
      <div style={{ textAlign: 'center' }}>
        <div className="score-ring" style={{ width: size, height: size }}>
          <svg width={size} height={size}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--gray-200)"
              strokeWidth={8}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={8}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div className="score-ring-value" style={{ color }}>
            {score}
          </div>
        </div>
        <p style={{ marginTop: 8, fontSize: 14, fontWeight: 600, color }}>{label}</p>
      </div>
    );
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
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>🎯 ATS Score Analyzer</h2>
        <p className="text-muted mt-1">
          Analyze how well your resume matches a job description for Applicant Tracking Systems
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="detail-layout">
        {/* Input Section */}
        <div className="card">
          <h3 className="card-title mb-4">Resume & Job Input</h3>

          {/* Resume Selection */}
          <div className="form-group">
            <div className="flex-between mb-2">
              <label className="form-label" style={{ margin: 0 }}>Resume</label>
              <label className="text-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  checked={useDirectText}
                  onChange={(e) => setUseDirectText(e.target.checked)}
                />
                Paste text directly
              </label>
            </div>

            {!useDirectText && resumes.length > 0 ? (
              <select
                className="form-select"
                value={selectedResume}
                onChange={(e) => setSelectedResume(e.target.value)}
              >
                <option value="">Select a resume...</option>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))}
              </select>
            ) : null}

            <textarea
              className="form-textarea mt-2"
              rows={10}
              value={resumeContent}
              onChange={(e) => setResumeContent(e.target.value)}
              placeholder={
                useDirectText
                  ? 'Paste your resume content here...'
                  : 'Or select a resume above and/or paste content here...'
              }
              style={{ fontFamily: 'monospace', fontSize: 13 }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Job Description</label>
            <textarea
              className="form-textarea"
              rows={10}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here to analyze compatibility..."
              style={{ fontFamily: 'monospace', fontSize: 13 }}
            />
          </div>

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleAnalyze}
            disabled={loading || !resumeContent.trim() || !jobDescription.trim()}
          >
            {loading ? 'Analyzing...' : '🎯 Analyze ATS Compatibility'}
          </button>
        </div>

        {/* Results Section */}
        <div>
          {analysis ? (
            <div className="fade-in">
              {/* Overall Score */}
              <div className="card mb-4" style={{ textAlign: 'center' }}>
                <h4 className="font-semibold mb-4">Overall ATS Score</h4>
                <CircularScore score={analysis.ats_score} label={getScoreLabel(analysis.ats_score)} />
              </div>

              {/* Score Breakdown */}
              <div className="card mb-4">
                <h4 className="font-semibold mb-3">Score Breakdown</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { label: 'Keyword Match', score: analysis.keyword_match },
                    { label: 'Formatting', score: analysis.formatting_score },
                    { label: 'Section Completeness', score: analysis.section_completeness },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex-between mb-1">
                        <span className="text-sm">{item.label}</span>
                        <span className="text-sm font-bold" style={{ color: getScoreColor(item.score) }}>
                          {item.score}%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className={`progress-fill ${
                            item.score >= 80 ? 'high' : item.score >= 60 ? 'medium' : 'low'
                          }`}
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing Keywords */}
              {analysis.missing_keywords?.length > 0 && (
                <div className="card mb-4">
                  <h4 className="font-semibold mb-3">Missing Keywords</h4>
                  <p className="text-sm text-muted mb-2">
                    Add these keywords to your resume for better ATS matching:
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {analysis.missing_keywords.map((kw, i) => (
                      <span key={i} className="tag" style={{ background: '#fee2e2', color: '#dc2626' }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths */}
              {analysis.strengths?.length > 0 && (
                <div className="card mb-4">
                  <h4 className="font-semibold mb-3">✅ Strengths</h4>
                  <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
                    {analysis.strengths.map((s, i) => (
                      <li key={i} className="text-sm">{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {analysis.improvements?.length > 0 && (
                <div className="card">
                  <h4 className="font-semibold mb-3">📈 Improvement Suggestions</h4>
                  <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
                    {analysis.improvements.map((imp, i) => (
                      <li key={i} className="text-sm">{imp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">🎯</div>
                <h3 className="empty-state-title">Ready to Analyze</h3>
                <p className="empty-state-text">
                  Enter your resume and a job description to get an ATS compatibility analysis
                  with actionable improvement suggestions.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ATSScore;
