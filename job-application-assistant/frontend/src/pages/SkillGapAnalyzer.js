import React, { useState, useEffect } from 'react';
import { getUser } from '../services/auth';
import { skillsAPI } from '../services/api';

function SkillGapAnalyzer() {
  const [userSkills, setUserSkills] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeResource, setActiveResource] = useState(null);
  const user = getUser();

  useEffect(() => {
    if (user?.skills) {
      setUserSkills(user.skills);
    }
  }, [user]);

  const handleAnalyze = async () => {
    if (!userSkills.trim() || !requiredSkills.trim()) {
      setError('Please enter both your skills and the required skills');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await skillsAPI.analyzeGap(userSkills, requiredSkills);
      setAnalysis(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze skill gap');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };
    return colors[severity] || '#6b7280';
  };

  const getScoreColor = (score) => {
    if (score >= 70) return '#10b981';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const ProgressBar = ({ label, score, color }) => (
    <div className="mb-3">
      <div className="flex-between mb-1">
        <span className="text-sm">{label}</span>
        <span className="text-sm font-bold" style={{ color: color || getScoreColor(score) }}>{score}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{
          width: `${score}%`,
          background: color || getScoreColor(score),
        }} />
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>🧠 Skill Gap Analyzer</h2>
        <p className="text-muted mt-1">
          Analyze the gap between your current skills and job requirements, with personalized learning resources
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="detail-layout">
        {/* Input */}
        <div className="card">
          <h3 className="card-title mb-4">Skills Comparison</h3>
          <div className="form-group">
            <label className="form-label">Your Skills (comma-separated)</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={userSkills}
              onChange={(e) => setUserSkills(e.target.value)}
              placeholder="Python, JavaScript, React, SQL, Docker, Communication, Leadership..."
            />
            <p className="text-xs text-muted mt-1">
              {userSkills ? `${userSkills.split(',').length} skills listed` : 'Add your skills from your profile or type them here'}
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Required Skills (comma-separated)</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={requiredSkills}
              onChange={(e) => setRequiredSkills(e.target.value)}
              placeholder="Kubernetes, AWS, TypeScript, GraphQL, Docker, CI/CD, Microservices..."
            />
            <p className="text-xs text-muted mt-1">
              Paste skills from a job description or type required skills
            </p>
          </div>

          {/* Quick fill suggestions */}
          <div className="mb-4">
            <p className="text-sm font-semibold mb-2">Quick fill with sample job skills:</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'Senior Engineer', skills: 'Python, Java, AWS, Docker, Kubernetes, System Design, Microservices, SQL, Redis, CI/CD' },
                { label: 'Frontend Dev', skills: 'JavaScript, TypeScript, React, CSS, HTML, Webpack, Jest, GraphQL, REST APIs' },
                { label: 'Data Scientist', skills: 'Python, SQL, Machine Learning, TensorFlow, Statistics, Data Visualization, NLP, Spark' },
              ].map((preset) => (
                <button key={preset.label} className="btn btn-sm btn-secondary"
                  onClick={() => setRequiredSkills(preset.skills)}>
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleAnalyze} disabled={loading}>
            {loading ? 'Analyzing...' : '🔍 Analyze Skill Gap'}
          </button>
        </div>

        {/* Results */}
        <div>
          {analysis ? (
            <div className="fade-in">
              {/* Score Overview */}
              <div className="card mb-4">
                <h4 className="font-semibold mb-4">Score Overview</h4>
                <ProgressBar label="Skills Matched" score={analysis.match_score} color="#10b981" />
                <ProgressBar label="Partial Match" score={analysis.partial_match_score} color="#f59e0b" />
                <ProgressBar label="Missing Skills" score={analysis.missing_score} color="#ef4444" />
                <div className="mt-3 flex-between">
                  <span className="text-sm">Gap Severity:</span>
                  <span className="tag" style={{
                    background: `${getSeverityColor(analysis.gap_severity)}20`,
                    color: getSeverityColor(analysis.gap_severity),
                    fontWeight: 600,
                  }}>
                    {analysis.gap_severity.toUpperCase()}
                  </span>
                </div>
                <div className="flex-between mt-2">
                  <span className="text-sm">Estimated Study Time:</span>
                  <span className="font-bold">{analysis.estimated_study_hours} hours</span>
                </div>
                <div className="flex-between mt-2">
                  <span className="text-sm">Required Skills:</span>
                  <span className="font-bold">{analysis.total_required_skills}</span>
                </div>
              </div>

              {/* Missing Skills with Resources */}
              {analysis.missing_skills?.length > 0 && (
                <div className="card mb-4">
                  <h4 className="font-semibold mb-3">📚 Learning Path</h4>
                  <p className="text-sm text-muted mb-3">
                    {analysis.missing_skills.length} skills to learn • Prioritized by category
                  </p>

                  {analysis.learning_path?.map((item, idx) => (
                    <div key={idx} className="card mb-2" style={{ padding: 16, border: '1px solid var(--gray-200)' }}>
                      <div className="flex-between mb-2">
                        <div>
                          <span className="font-semibold">{item.skill}</span>
                          <span className={`tag ml-2 ${item.category === 'foundation' ? 'tag-primary' : ''}`}>
                            {item.category}
                          </span>
                          <span className="tag" style={{
                            background: item.priority === 'high' ? '#fee2e2' : '#fef3c7',
                            color: item.priority === 'high' ? '#dc2626' : '#d97706',
                          }}>
                            {item.priority} priority
                          </span>
                        </div>
                        <span className="text-sm text-muted">~{item.estimated_hours}h</span>
                      </div>

                      {/* Learning Resources */}
                      {analysis.learning_resources?.[item.skill] && (
                        <>
                          <button className="btn btn-sm btn-secondary"
                            onClick={() => setActiveResource(activeResource === item.skill ? null : item.skill)}>
                            📖 Show Resources
                          </button>
                          {activeResource === item.skill && (
                            <div className="mt-2 fade-in">
                              {analysis.learning_resources[item.skill].map((res, ri) => (
                                <div key={ri} className="flex-between mb-1" style={{ padding: '4px 8px', background: 'var(--gray-50)', borderRadius: 4 }}>
                                  <div>
                                    <span className="text-sm">{res.name}</span>
                                    <span className="text-xs text-muted ml-2">({res.platform})</span>
                                  </div>
                                  <a href={res.url} target="_blank" rel="noopener noreferrer"
                                    className="btn btn-sm btn-primary" style={{ textDecoration: 'none' }}>
                                    Open
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations?.length > 0 && (
                <div className="card">
                  <h4 className="font-semibold mb-3">💡 Recommendations</h4>
                  <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
                    {analysis.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">🧠</div>
                <h3 className="empty-state-title">Ready to Analyze</h3>
                <p className="empty-state-text">
                  Enter your current skills and the skills required for your target role to get a detailed gap analysis
                  with prioritized learning resources.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SkillGapAnalyzer;
