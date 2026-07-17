import React, { useState } from 'react';
import { careerAPI } from '../services/api';

function CareerAdvisor() {
  const [activeTab, setActiveTab] = useState('advice');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Career Advice form
  const [adviceForm, setAdviceForm] = useState({
    skills: '',
    experience: '',
    education: '',
    interests: '',
    current_role: '',
  });
  const [adviceResult, setAdviceResult] = useState(null);

  // Salary Predictor form
  const [salaryForm, setSalaryForm] = useState({
    job_title: '',
    location: '',
    experience_years: '',
  });
  const [salaryResult, setSalaryResult] = useState(null);

  // Trending Skills
  const [trendingField, setTrendingField] = useState('');
  const [trendingSkills, setTrendingSkills] = useState(null);
  const [trendingLoading, setTrendingLoading] = useState(false);

  // Certifications
  const [certRole, setCertRole] = useState('');
  const [certifications, setCertifications] = useState(null);
  const [certLoading, setCertLoading] = useState(false);

  // ---- Career Advice ----
  const handleGetAdvice = async (e) => {
    e.preventDefault();
    if (!adviceForm.skills.trim() || !adviceForm.experience.trim()) {
      setError('Please enter at least your skills and experience');
      return;
    }
    setLoading(true);
    setError('');
    setAdviceResult(null);

    try {
      const payload = {
        skills: adviceForm.skills,
        experience: adviceForm.experience,
      };
      if (adviceForm.education.trim()) payload.education = adviceForm.education;
      if (adviceForm.interests.trim()) payload.interests = adviceForm.interests;
      if (adviceForm.current_role.trim()) payload.current_role = adviceForm.current_role;

      const res = await careerAPI.getAdvice(payload);
      setAdviceResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to get career advice');
    } finally {
      setLoading(false);
    }
  };

  // ---- Salary Predictor ----
  const handlePredictSalary = async (e) => {
    e.preventDefault();
    if (!salaryForm.job_title.trim() || !salaryForm.experience_years) {
      setError('Please enter at least job title and years of experience');
      return;
    }
    setLoading(true);
    setError('');
    setSalaryResult(null);

    try {
      const payload = {
        job_title: salaryForm.job_title,
        experience_years: parseFloat(salaryForm.experience_years),
      };
      if (salaryForm.location.trim()) payload.location = salaryForm.location;

      const res = await careerAPI.predictSalary(payload);
      setSalaryResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to predict salary');
    } finally {
      setLoading(false);
    }
  };

  // ---- Trending Skills ----
  const handleGetTrendingSkills = async () => {
    if (!trendingField.trim()) {
      setError('Please enter a field to search for trending skills');
      return;
    }
    setTrendingLoading(true);
    setError('');

    try {
      const res = await careerAPI.getTrendingSkills(trendingField);
      setTrendingSkills(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch trending skills');
    } finally {
      setTrendingLoading(false);
    }
  };

  // ---- Certifications ----
  const handleGetCertifications = async () => {
    if (!certRole.trim()) {
      setError('Please enter a role to search for certifications');
      return;
    }
    setCertLoading(true);
    setError('');

    try {
      const res = await careerAPI.getCertifications(certRole);
      setCertifications(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch certifications');
    } finally {
      setCertLoading(false);
    }
  };

  const getGrowthColor = (outlook) => {
    const colors = {
      excellent: '#10b981',
      good: '#0d9488',
      moderate: '#f59e0b',
      limited: '#ef4444',
    };
    return colors[outlook?.toLowerCase()] || '#6b7280';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      beginner: '#10b981',
      intermediate: '#f59e0b',
      advanced: '#ef4444',
      expert: '#8b5cf6',
    };
    return colors[difficulty?.toLowerCase()] || '#6b7280';
  };

  const formatCurrency = (value) => {
    if (value == null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="spinner-container">
      <div className="spinner spinner-lg" />
      <p className="text-muted mt-3">Processing your request...</p>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>🧭 Career Advisor</h2>
        <p className="text-muted mt-1">
          Get personalized career guidance, salary insights, trending skills, and certification recommendations
        </p>
      </div>

      {error && (
        <div className="alert alert-danger mb-4">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="card mb-6" style={{ padding: 0 }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
          <button
            style={{
              flex: 1,
              padding: '14px 24px',
              fontSize: 14,
              fontWeight: 600,
              color: activeTab === 'advice' ? 'var(--primary-light)' : 'var(--text-muted)',
              background: activeTab === 'advice' ? 'rgba(13, 148, 136, 0.08)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'advice' ? '2px solid var(--primary)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onClick={() => { setActiveTab('advice'); setError(''); }}
          >
            💡 Career Advice
          </button>
          <button
            style={{
              flex: 1,
              padding: '14px 24px',
              fontSize: 14,
              fontWeight: 600,
              color: activeTab === 'salary' ? 'var(--primary-light)' : 'var(--text-muted)',
              background: activeTab === 'salary' ? 'rgba(13, 148, 136, 0.08)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'salary' ? '2px solid var(--primary)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onClick={() => { setActiveTab('salary'); setError(''); }}
          >
            💰 Salary Predictor
          </button>
        </div>
      </div>

      {/* ========== TAB: Career Advice ========== */}
      {activeTab === 'advice' && (
        <div className="detail-layout">
          {/* Left: Form */}
          <div>
            <div className="card">
              <h3 className="card-title mb-4">Your Profile</h3>
              <form onSubmit={handleGetAdvice}>
                <div className="form-group">
                  <label className="form-label">Skills *</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={adviceForm.skills}
                    onChange={(e) => setAdviceForm({ ...adviceForm, skills: e.target.value })}
                    placeholder="Python, JavaScript, React, SQL, Machine Learning, AWS..."
                    required
                  />
                  <p className="text-xs text-muted mt-1">
                    List your key skills separated by commas
                  </p>
                </div>
                <div className="form-group">
                  <label className="form-label">Experience *</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={adviceForm.experience}
                    onChange={(e) => setAdviceForm({ ...adviceForm, experience: e.target.value })}
                    placeholder="5 years as a full-stack developer, 2 years leading a team of 4 engineers..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Education</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={adviceForm.education}
                    onChange={(e) => setAdviceForm({ ...adviceForm, education: e.target.value })}
                    placeholder="B.S. in Computer Science, M.S. in Data Science, certifications..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Interests</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={adviceForm.interests}
                    onChange={(e) => setAdviceForm({ ...adviceForm, interests: e.target.value })}
                    placeholder="AI/ML, DevOps, Cloud Architecture, Product Management..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Role</label>
                  <input
                    type="text"
                    className="form-input"
                    value={adviceForm.current_role}
                    onChange={(e) => setAdviceForm({ ...adviceForm, current_role: e.target.value })}
                    placeholder="e.g. Senior Software Engineer"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={loading}
                >
                  {loading ? 'Analyzing...' : '🔍 Get Career Advice'}
                </button>
              </form>
            </div>

            {/* Trending Skills Section */}
            <div className="card mt-6">
              <h3 className="card-title mb-4">📈 Trending Skills</h3>
              <div className="form-group">
                <label className="form-label">Field / Industry</label>
                <input
                  type="text"
                  className="form-input"
                  value={trendingField}
                  onChange={(e) => setTrendingField(e.target.value)}
                  placeholder="e.g. Data Science, DevOps, Frontend"
                />
              </div>
              <button
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleGetTrendingSkills}
                disabled={trendingLoading}
              >
                {trendingLoading ? 'Fetching...' : '🚀 Get Trending Skills'}
              </button>

              {trendingSkills && (
                <div className="mt-4 fade-in">
                  {Array.isArray(trendingSkills) ? (
                    <div className="tags-list">
                      {trendingSkills.map((skill, idx) => (
                        <span key={idx} className="tag tag-primary">{skill}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted">{String(trendingSkills)}</p>
                  )}
                </div>
              )}
            </div>

            {/* Certifications Section */}
            <div className="card mt-6">
              <h3 className="card-title mb-4">🎓 Certifications</h3>
              <div className="form-group">
                <label className="form-label">Target Role</label>
                <input
                  type="text"
                  className="form-input"
                  value={certRole}
                  onChange={(e) => setCertRole(e.target.value)}
                  placeholder="e.g. Data Engineer, Cloud Architect"
                />
              </div>
              <button
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleGetCertifications}
                disabled={certLoading}
              >
                {certLoading ? 'Searching...' : '📜 Find Certifications'}
              </button>

              {certifications && (
                <div className="mt-4 fade-in">
                  {Array.isArray(certifications) && certifications.length > 0 ? (
                    <div className="grid-auto">
                      {certifications.map((cert, idx) => (
                        <div key={idx} className="card" style={{ padding: 16 }}>
                          <div className="flex-between mb-2">
                            <span className="font-semibold text-sm">{cert.name}</span>
                            <span className="tag" style={{
                              background: `${getDifficultyColor(cert.difficulty)}20`,
                              color: getDifficultyColor(cert.difficulty),
                              border: 'none',
                            }}>
                              {cert.difficulty}
                            </span>
                          </div>
                          {cert.provider && (
                            <p className="text-xs text-muted mb-1">By {cert.provider}</p>
                          )}
                          {cert.description && (
                            <p className="text-xs text-muted mb-2">{cert.description}</p>
                          )}
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: 'var(--text-muted)' }}>
                            {cert.duration && <span>⏱ {cert.duration}</span>}
                            {cert.estimated_cost && (
                              <span>💰 {cert.estimated_cost === 'free' || cert.estimated_cost === 'Free' ? 'Free' : formatCurrency(Number(cert.estimated_cost))}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted">{typeof certifications === 'string' ? certifications : 'No certifications found'}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Results */}
          <div>
            {loading && <LoadingSpinner />}

            {adviceResult && !loading && (
              <div className="fade-in">
                {/* Career Paths */}
                {adviceResult.suggested_paths?.length > 0 && (
                  <div className="card mb-4">
                    <div className="card-header-gradient">
                      <h3 style={{ color: '#fff', fontSize: 16 }}>🛤️ Suggested Career Paths</h3>
                    </div>
                    <div style={{ padding: '4px 0' }}>
                      {adviceResult.suggested_paths.map((path, idx) => (
                        <div key={idx} className="card mb-3" style={{ padding: 16, border: '1px solid var(--border-color)' }}>
                          <div className="flex-between mb-2">
                            <h4 className="font-semibold">{path.title}</h4>
                            {path.growth_outlook && (
                              <span className="badge" style={{
                                background: `${getGrowthColor(path.growth_outlook)}20`,
                                color: getGrowthColor(path.growth_outlook),
                              }}>
                                {path.growth_outlook} outlook
                              </span>
                            )}
                          </div>
                          {path.description && (
                            <p className="text-sm text-muted mb-3">{path.description}</p>
                          )}
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 }}>
                            {path.avg_salary_range && (
                              <span className="text-success font-semibold">💰 {path.avg_salary_range}</span>
                            )}
                            {path.time_to_transition && (
                              <span className="text-muted">⏳ {path.time_to_transition}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Salary Ranges */}
                {adviceResult.salary_ranges && Object.keys(adviceResult.salary_ranges).length > 0 && (
                  <div className="card mb-4">
                    <h4 className="font-semibold mb-3">💰 Salary Ranges by Role</h4>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Role</th>
                            <th>Salary Range</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(adviceResult.salary_ranges).map(([role, range]) => (
                            <tr key={role}>
                              <td className="font-medium">{role}</td>
                              <td className="text-success font-semibold">{range}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Trending Skills */}
                {adviceResult.trending_skills?.length > 0 && (
                  <div className="card mb-4">
                    <h4 className="font-semibold mb-3">📈 Trending Skills</h4>
                    <div className="tags-list">
                      {adviceResult.trending_skills.map((skill, idx) => (
                        <span key={idx} className="tag tag-primary">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {adviceResult.certifications?.length > 0 && (
                  <div className="card mb-4">
                    <h4 className="font-semibold mb-3">🎓 Recommended Certifications</h4>
                    <div className="grid-auto">
                      {adviceResult.certifications.map((cert, idx) => (
                        <div key={idx} className="card" style={{ padding: 16 }}>
                          <div className="flex-between mb-2">
                            <span className="font-semibold text-sm">{cert.name}</span>
                            {cert.difficulty && (
                              <span className="tag" style={{
                                background: `${getDifficultyColor(cert.difficulty)}20`,
                                color: getDifficultyColor(cert.difficulty),
                                border: 'none',
                              }}>
                                {cert.difficulty}
                              </span>
                            )}
                          </div>
                          {cert.provider && <p className="text-xs text-muted mb-1">By {cert.provider}</p>}
                          {cert.description && <p className="text-xs text-muted mb-2">{cert.description}</p>}
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: 'var(--text-muted)' }}>
                            {cert.duration && <span>⏱ {cert.duration}</span>}
                            {cert.estimated_cost && (
                              <span>💰 {String(cert.estimated_cost).toLowerCase() === 'free' ? 'Free' : formatCurrency(Number(cert.estimated_cost))}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Promotion Roadmap */}
                {adviceResult.promotion_roadmap?.length > 0 && (
                  <div className="card mb-4">
                    <h4 className="font-semibold mb-3">📋 Promotion Roadmap</h4>
                    <div className="timeline">
                      {adviceResult.promotion_roadmap.map((step, idx) => (
                        <div key={idx} className="timeline-item active">
                          <div className="timeline-header">
                            <span className="timeline-title">{step.title || step.role || `Step ${idx + 1}`}</span>
                            {step.timeline && <span className="timeline-time">{step.timeline}</span>}
                          </div>
                          {step.description && (
                            <p className="timeline-content">{step.description}</p>
                          )}
                          {step.skills_needed && (
                            <div className="tags-list mt-2">
                              {Array.isArray(step.skills_needed)
                                ? step.skills_needed.map((s, si) => <span key={si} className="tag">{s}</span>)
                                : <span className="tag">{step.skills_needed}</span>
                              }
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Market Demand */}
                {adviceResult.market_demand && (
                  <div className="card mb-4">
                    <h4 className="font-semibold mb-3">📊 Market Demand</h4>
                    <p className="text-sm text-muted">{adviceResult.market_demand}</p>
                  </div>
                )}
              </div>
            )}

            {!adviceResult && !loading && (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">🧭</div>
                  <h3 className="empty-state-title">Ready for Insights</h3>
                  <p className="empty-state-text">
                    Fill in your profile details on the left to get personalized career path
                    recommendations, salary insights, and skill development guidance.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== TAB: Salary Predictor ========== */}
      {activeTab === 'salary' && (
        <div className="detail-layout">
          {/* Left: Form */}
          <div>
            <div className="card bg-dots-light">
              <h3 className="card-title mb-4">💰 Salary Prediction</h3>
              <p className="text-sm text-muted mb-4">
                Get data-driven salary estimates based on job title, location, and experience
              </p>
              <form onSubmit={handlePredictSalary}>
                <div className="form-group">
                  <label className="form-label">Job Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={salaryForm.job_title}
                    onChange={(e) => setSalaryForm({ ...salaryForm, job_title: e.target.value })}
                    placeholder="e.g. Senior Software Engineer, Data Scientist"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-input"
                    value={salaryForm.location}
                    onChange={(e) => setSalaryForm({ ...salaryForm, location: e.target.value })}
                    placeholder="e.g. San Francisco, CA (optional)"
                  />
                  <p className="text-xs text-muted mt-1">City, state, or remote</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Years of Experience *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={salaryForm.experience_years}
                    onChange={(e) => setSalaryForm({ ...salaryForm, experience_years: e.target.value })}
                    placeholder="e.g. 5"
                    min="0"
                    step="0.5"
                    required
                  />
                </div>

                {/* Quick fill suggestions */}
                <div className="mb-4">
                  <p className="text-sm font-semibold mb-2">Quick fill examples:</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[
                      { label: 'SWE', data: { job_title: 'Senior Software Engineer', location: 'San Francisco, CA', experience_years: '5' } },
                      { label: 'DS', data: { job_title: 'Data Scientist', location: 'New York, NY', experience_years: '3' } },
                      { label: 'PM', data: { job_title: 'Product Manager', location: 'Seattle, WA', experience_years: '4' } },
                      { label: 'MLE', data: { job_title: 'Machine Learning Engineer', location: 'Austin, TX', experience_years: '6' } },
                    ].map((preset) => (
                      <button key={preset.label} type="button" className="btn btn-sm btn-secondary"
                        onClick={() => setSalaryForm(preset.data)}>
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={loading}
                >
                  {loading ? 'Calculating...' : '🔮 Predict Salary'}
                </button>
              </form>
            </div>
          </div>

          {/* Right: Results */}
          <div>
            {loading && <LoadingSpinner />}

            {salaryResult && !loading && (
              <div className="fade-in">
                <div className="card mb-4">
                  <div className="card-header-gradient">
                    <div className="flex-between">
                      <h3 style={{ color: '#fff', fontSize: 16 }}>💰 Salary Estimate</h3>
                      {salaryResult.confidence_score != null && (
                        <span className="badge badge-gradient" style={{ fontSize: 12 }}>
                          {Math.round(salaryResult.confidence_score * 100)}% confidence
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ padding: '8px 0' }}>
                    {salaryResult.job_title && (
                      <p className="text-lg font-semibold mb-1">{salaryResult.job_title}</p>
                    )}
                    {salaryResult.location && (
                      <p className="text-sm text-muted mb-4">📍 {salaryResult.location}</p>
                    )}
                    {salaryResult.experience_years != null && (
                      <p className="text-sm text-muted mb-4">⏱ {salaryResult.experience_years} years of experience</p>
                    )}

                    {/* Salary Range Cards */}
                    <div className="grid-3 mb-4">
                      <div className="stat-card stat-primary">
                        <div className="stat-card-content" style={{ textAlign: 'center' }}>
                          <div className="stat-card-label">Minimum</div>
                          <div className="stat-card-value" style={{ fontSize: 22 }}>
                            {formatCurrency(salaryResult.predicted_min_salary)}
                          </div>
                        </div>
                      </div>
                      <div className="stat-card stat-success">
                        <div className="stat-card-content" style={{ textAlign: 'center' }}>
                          <div className="stat-card-label">Average</div>
                          <div className="stat-card-value" style={{ fontSize: 22 }}>
                            {formatCurrency(salaryResult.predicted_avg_salary)}
                          </div>
                        </div>
                      </div>
                      <div className="stat-card stat-warning">
                        <div className="stat-card-content" style={{ textAlign: 'center' }}>
                          <div className="stat-card-label">Maximum</div>
                          <div className="stat-card-value" style={{ fontSize: 22 }}>
                            {formatCurrency(salaryResult.predicted_max_salary)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Percentiles */}
                    <div className="card" style={{ padding: 16, background: 'var(--bg-input)' }}>
                      <h4 className="font-semibold mb-3 text-sm">Percentile Breakdown</h4>
                      <div className="flex-between mb-2">
                        <span className="text-sm text-muted">25th Percentile</span>
                        <span className="font-semibold">{formatCurrency(salaryResult.percentile_25)}</span>
                      </div>
                      <div className="progress-bar mb-3">
                        <div className="progress-fill" style={{
                          width: salaryResult.percentile_25 && salaryResult.predicted_max_salary
                            ? `${(salaryResult.percentile_25 / salaryResult.predicted_max_salary) * 100}%`
                            : '25%',
                        }} />
                      </div>
                      <div className="flex-between mb-2">
                        <span className="text-sm text-muted">75th Percentile</span>
                        <span className="font-semibold">{formatCurrency(salaryResult.percentile_75)}</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill success" style={{
                          width: salaryResult.percentile_75 && salaryResult.predicted_max_salary
                            ? `${(salaryResult.percentile_75 / salaryResult.predicted_max_salary) * 100}%`
                            : '75%',
                        }} />
                      </div>
                    </div>

                    {salaryResult.currency && (
                      <p className="text-xs text-muted mt-3">
                        All values shown in {salaryResult.currency}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!salaryResult && !loading && (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">💰</div>
                  <h3 className="empty-state-title">Salary Explorer</h3>
                  <p className="empty-state-text">
                    Enter a job title and experience level to get an estimated salary range
                    with percentile breakdown and confidence score.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CareerAdvisor;
