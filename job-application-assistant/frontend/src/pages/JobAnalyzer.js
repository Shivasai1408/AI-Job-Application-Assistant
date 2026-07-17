import React, { useState } from 'react';
import { jobAnalyzerAPI } from '../services/api';

const TABS = [
  { id: 'analyze', label: '📊 Job Analyzer', icon: '🔍' },
  { id: 'match', label: '🎯 Skill Match', icon: '📋' },
  { id: 'improve', label: '📈 Skill Improver', icon: '🚀' },
];

function JobAnalyzer() {
  const [activeTab, setActiveTab] = useState('analyze');

  // --- Analyzer State ---
  const [analyzeData, setAnalyzeData] = useState({ job_description: '', job_title: '', company: '' });
  const [analysisResult, setAnalysisResult] = useState(null);

  // --- Match State ---
  const [matchData, setMatchData] = useState({ job_description: '', user_skills: '' });
  const [matchResult, setMatchResult] = useState(null);

  // --- Improve State ---
  const [improveData, setImproveData] = useState({ job_description: '', current_skills: '' });
  const [improveResult, setImproveResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- Tab style helpers ---
  const tabStyle = (tabId) => ({
    padding: '10px 20px',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    borderRadius: '8px 8px 0 0',
    background: activeTab === tabId ? 'var(--primary-gradient)' : 'transparent',
    color: activeTab === tabId ? '#fff' : 'var(--text-secondary)',
    transition: 'all 0.3s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    borderBottom: activeTab === tabId ? '2px solid var(--primary)' : '2px solid transparent',
  });

  // --- Handler: Analyze ---
  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!analyzeData.job_description.trim()) {
      setError('Please enter a job description');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await jobAnalyzerAPI.analyze({
        job_description: analyzeData.job_description,
        job_title: analyzeData.job_title || undefined,
        company: analyzeData.company || undefined,
      });
      setAnalysisResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze job');
    } finally {
      setLoading(false);
    }
  };

  // --- Handler: Match ---
  const handleMatch = async (e) => {
    e.preventDefault();
    if (!matchData.job_description.trim() || !matchData.user_skills.trim()) {
      setError('Please enter both job description and your skills');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await jobAnalyzerAPI.match({
        job_description: matchData.job_description,
        user_skills: matchData.user_skills,
      });
      setMatchResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to match skills');
    } finally {
      setLoading(false);
    }
  };

  // --- Handler: Improve ---
  const handleImprove = async (e) => {
    e.preventDefault();
    if (!improveData.job_description.trim() || !improveData.current_skills.trim()) {
      setError('Please enter both job description and your current skills');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await jobAnalyzerAPI.improve({
        job_description: improveData.job_description,
        current_skills: improveData.current_skills,
      });
      setImproveResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to get improvement suggestions');
    } finally {
      setLoading(false);
    }
  };

  // --- Render: Difficulty scale ---
  const renderDifficulty = (level) => {
    const max = 10;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary-light)' }}>{level}/10</span>
        <div style={{ display: 'flex', gap: 3 }}>
          {Array.from({ length: max }, (_, i) => (
            <div key={i} style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: i < level ? 'var(--primary-gradient)' : 'var(--bg-input)',
              border: `1px solid ${i < level ? 'var(--primary)' : 'var(--border-color)'}`,
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>
      </div>
    );
  };

  // --- Render: Circular score ---
  const CircularScore = ({ percentage, label, color = 'var(--primary)' }) => {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--bg-input)" strokeWidth="10" />
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 70 70)"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
          <text x="70" y="70" textAnchor="middle" dominantBaseline="central"
            style={{ fontSize: 28, fontWeight: 700, fill: 'var(--text-primary)' }}>
            {Math.round(percentage)}%
          </text>
        </svg>
        <span className="text-sm text-muted">{label}</span>
      </div>
    );
  };

  // --- Render: Match breakdown item ---
  const BreakdownItem = ({ item }) => {
    const scoreColor = item.score >= 70 ? 'var(--success-light)' : item.score >= 40 ? 'var(--warning-light)' : 'var(--danger-light)';
    return (
      <div className="card mb-2" style={{ padding: 16, border: '1px solid var(--border-color)' }}>
        <div className="flex-between mb-2">
          <span className="font-semibold">{item.category}</span>
          <span style={{ fontWeight: 700, color: scoreColor }}>{Math.round(item.score)}%</span>
        </div>
        <div style={{ height: 6, background: 'var(--bg-input)', borderRadius: 3, marginBottom: 12, overflow: 'hidden' }}>
          <div style={{
            width: `${item.score}%`,
            height: '100%',
            background: scoreColor,
            borderRadius: 3,
            transition: 'width 0.8s ease',
          }} />
        </div>
        {item.matched?.length > 0 && (
          <div className="mb-2">
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--success-light)' }}>✅ Matched</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {item.matched.map((s, i) => (
                <span key={i} className="tag tag-success">{s}</span>
              ))}
            </div>
          </div>
        )}
        {item.missing?.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--danger-light)' }}>❌ Missing</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {item.missing.map((s, i) => (
                <span key={i} className="tag tag-danger">{s}</span>
              ))}
            </div>
          </div>
        )}
        {item.weight && (
          <p className="text-xs text-muted mt-1">Weight: {(item.weight * 100).toFixed(0)}%</p>
        )}
      </div>
    );
  };

  // --- Render: Learning resource card ---
  const ResourceCard = ({ resource }) => (
    <div className="card" style={{ padding: 16, border: '1px solid var(--border-color)' }}>
      <div className="flex-between mb-1">
        <span className="font-semibold">{resource.name}</span>
        <span className="tag tag-primary">{resource.type}</span>
      </div>
      {resource.description && (
        <p className="text-sm text-muted mt-1">{resource.description}</p>
      )}
      {resource.url && (
        <a href={resource.url} target="_blank" rel="noopener noreferrer"
          className="btn btn-sm btn-primary mt-2" style={{ textDecoration: 'none', display: 'inline-flex' }}>
          Open Resource
        </a>
      )}
    </div>
  );

  // --- Render: Course card ---
  const CourseCard = ({ course }) => (
    <div className="card" style={{ padding: 16, border: '1px solid var(--border-color)' }}>
      <div className="flex-between mb-1">
        <span className="font-semibold">{course.name}</span>
        <span className="tag">{course.provider}</span>
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
        {course.duration && <span>⏱ {course.duration}</span>}
        {course.cost && <span>💰 {course.cost}</span>}
      </div>
      {course.url && (
        <a href={course.url} target="_blank" rel="noopener noreferrer"
          className="btn btn-sm btn-primary mt-2" style={{ textDecoration: 'none', display: 'inline-flex' }}>
          View Course
        </a>
      )}
    </div>
  );

  // --- Loading overlay ---
  if (loading) {
    return (
      <div className="spinner-container" style={{ minHeight: 400 }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in visible">
      {/* Header */}
      <div className="mb-6">
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>
          <span className="text-gradient-primary">🔍 Job Analyzer</span>
        </h2>
        <p className="text-muted mt-1">
          Analyze job descriptions, match your skills, and discover learning opportunities
        </p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          {error}
          <button onClick={() => setError('')} style={{
            marginLeft: 12, background: 'none', border: 'none', color: 'var(--danger-light)',
            cursor: 'pointer', fontWeight: 600, fontSize: 13,
          }}>Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, borderBottom: '1px solid var(--border-color)',
        marginBottom: 24, paddingBottom: 2,
      }}>
        {TABS.map((tab) => (
          <button key={tab.id} style={tabStyle(tab.id)}
            onClick={() => { setActiveTab(tab.id); setError(''); }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ============ TAB 1: Job Analyzer ============ */}
      {activeTab === 'analyze' && (
        <div>
          <div className="grid-2" style={{ alignItems: 'start' }}>
            {/* Input Column */}
            <div className="card">
              <h3 className="card-title mb-3">📝 Analyze Job Description</h3>
              <div className="form-group">
                <label className="form-label">Job Description *</label>
                <textarea
                  className="form-textarea"
                  rows={8}
                  value={analyzeData.job_description}
                  onChange={(e) => setAnalyzeData({ ...analyzeData, job_description: e.target.value })}
                  placeholder="Paste the full job description here..."
                />
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Job Title</label>
                  <input type="text" className="form-input"
                    value={analyzeData.job_title}
                    onChange={(e) => setAnalyzeData({ ...analyzeData, job_title: e.target.value })}
                    placeholder="e.g. Senior Software Engineer" />
                </div>
                <div className="form-group">
                  <label className="form-label">Company</label>
                  <input type="text" className="form-input"
                    value={analyzeData.company}
                    onChange={(e) => setAnalyzeData({ ...analyzeData, company: e.target.value })}
                    placeholder="e.g. Acme Corp" />
                </div>
              </div>
              <button className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                onClick={handleAnalyze} disabled={loading}>
                {loading ? 'Analyzing...' : '🔍 Analyze Job'}
              </button>
            </div>

            {/* Results Column */}
            <div>
              {analysisResult ? (
                <div className="fade-in">
                  {/* Required Skills */}
                  {analysisResult.required_skills?.length > 0 && (
                    <div className="card mb-3">
                      <h4 className="font-semibold mb-2">🎯 Required Skills</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {analysisResult.required_skills.map((skill, i) => (
                          <span key={i} className="tag tag-primary">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preferred Skills */}
                  {analysisResult.preferred_skills?.length > 0 && (
                    <div className="card mb-3">
                      <h4 className="font-semibold mb-2">⭐ Preferred Skills</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {analysisResult.preferred_skills.map((skill, i) => (
                          <span key={i} className="tag">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Responsibilities */}
                  {analysisResult.responsibilities?.length > 0 && (
                    <div className="card mb-3">
                      <h4 className="font-semibold mb-2">📋 Responsibilities</h4>
                      <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
                        {analysisResult.responsibilities.map((item, i) => (
                          <li key={i} className="text-sm">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Key Details */}
                  <div className="card mb-3">
                    <h4 className="font-semibold mb-3">📌 Key Details</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {analysisResult.experience_needed && (
                        <div className="flex-between">
                          <span className="text-sm text-muted">Experience Needed</span>
                          <span className="font-semibold">{analysisResult.experience_needed}</span>
                        </div>
                      )}
                      {analysisResult.education && (
                        <div className="flex-between">
                          <span className="text-sm text-muted">Education</span>
                          <span className="font-semibold">{analysisResult.education}</span>
                        </div>
                      )}
                      {analysisResult.industry && (
                        <div className="flex-between">
                          <span className="text-sm text-muted">Industry</span>
                          <span className="font-semibold">{analysisResult.industry}</span>
                        </div>
                      )}
                      {analysisResult.role_focus && (
                        <div className="flex-between">
                          <span className="text-sm text-muted">Role Focus</span>
                          <span className="font-semibold">{analysisResult.role_focus}</span>
                        </div>
                      )}
                      {analysisResult.estimated_interview_difficulty && (
                        <div className="flex-between">
                          <span className="text-sm text-muted">Interview Difficulty</span>
                          {renderDifficulty(analysisResult.estimated_interview_difficulty)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Keywords */}
                  {analysisResult.keywords?.length > 0 && (
                    <div className="card mb-3">
                      <h4 className="font-semibold mb-2">🔑 Keywords</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {analysisResult.keywords.map((kw, i) => (
                          <span key={i} className="tag tag-warning">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Soft Skills */}
                  {analysisResult.soft_skills?.length > 0 && (
                    <div className="card mb-3">
                      <h4 className="font-semibold mb-2">🤝 Soft Skills</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {analysisResult.soft_skills.map((skill, i) => (
                          <span key={i} className="tag tag-success">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {analysisResult.certifications_preferred?.length > 0 && (
                    <div className="card mb-3">
                      <h4 className="font-semibold mb-2">📜 Certifications Preferred</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {analysisResult.certifications_preferred.map((cert, i) => (
                          <span key={i} className="tag tag-danger">{cert}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="card">
                  <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <h3 className="empty-state-title">Analyze a Job</h3>
                    <p className="empty-state-text">
                      Paste a job description to get detailed analysis including required skills,
                      responsibilities, keywords, and interview difficulty.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ TAB 2: Skill Match ============ */}
      {activeTab === 'match' && (
        <div>
          <div className="grid-2" style={{ alignItems: 'start' }}>
            {/* Input Column */}
            <div className="card">
              <h3 className="card-title mb-3">🎯 Match Your Skills</h3>
              <div className="form-group">
                <label className="form-label">Job Description *</label>
                <textarea
                  className="form-textarea"
                  rows={6}
                  value={matchData.job_description}
                  onChange={(e) => setMatchData({ ...matchData, job_description: e.target.value })}
                  placeholder="Paste the job description to match against..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Your Skills *</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={matchData.user_skills}
                  onChange={(e) => setMatchData({ ...matchData, user_skills: e.target.value })}
                  placeholder="List your skills separated by commas..."
                />
                <p className="text-xs text-muted mt-1">
                  {matchData.user_skills ? `${matchData.user_skills.split(',').filter(s => s.trim()).length} skills listed` : 'e.g. Python, React, SQL, Docker, Communication'}
                </p>
              </div>
              <button className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                onClick={handleMatch} disabled={loading}>
                {loading ? 'Matching...' : '🎯 Calculate Match'}
              </button>
            </div>

            {/* Results Column */}
            <div>
              {matchResult ? (
                <div className="fade-in">
                  {/* Overall Score */}
                  <div className="card mb-3" style={{ textAlign: 'center' }}>
                    <CircularScore
                      percentage={matchResult.match_percentage}
                      label="Overall Match"
                      color={matchResult.match_percentage >= 70 ? 'var(--success)' : matchResult.match_percentage >= 40 ? 'var(--warning)' : 'var(--danger)'}
                    />
                    {matchResult.overall_assessment && (
                      <p className="text-sm text-muted mt-3" style={{ maxWidth: 400, margin: '12px auto 0' }}>
                        {matchResult.overall_assessment}
                      </p>
                    )}
                  </div>

                  {/* Strengths */}
                  {matchResult.strengths?.length > 0 && (
                    <div className="card mb-3">
                      <h4 className="font-semibold mb-2">💪 Strengths</h4>
                      <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
                        {matchResult.strengths.map((s, i) => (
                          <li key={i} className="text-sm" style={{ color: 'var(--success-light)' }}>✅ {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Gaps */}
                  {matchResult.gaps?.length > 0 && (
                    <div className="card mb-3">
                      <h4 className="font-semibold mb-2">📉 Gaps</h4>
                      <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
                        {matchResult.gaps.map((g, i) => (
                          <li key={i} className="text-sm" style={{ color: 'var(--danger-light)' }}>❌ {g}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Breakdown */}
                  {matchResult.breakdown?.length > 0 && (
                    <div className="card mb-3">
                      <h4 className="font-semibold mb-3">📊 Detailed Breakdown</h4>
                      {matchResult.breakdown.map((item, i) => (
                        <BreakdownItem key={i} item={item} />
                      ))}
                    </div>
                  )}

                  {/* Recommendations */}
                  {matchResult.recommendations?.length > 0 && (
                    <div className="card">
                      <h4 className="font-semibold mb-2">💡 Recommendations</h4>
                      <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
                        {matchResult.recommendations.map((rec, i) => (
                          <li key={i} className="text-sm">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="card">
                  <div className="empty-state">
                    <div className="empty-state-icon">🎯</div>
                    <h3 className="empty-state-title">Match Your Skills</h3>
                    <p className="empty-state-text">
                      Enter a job description and your skills to see how well you match,
                      with detailed breakdown by category.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ TAB 3: Skill Improver ============ */}
      {activeTab === 'improve' && (
        <div>
          <div className="grid-2" style={{ alignItems: 'start' }}>
            {/* Input Column */}
            <div className="card">
              <h3 className="card-title mb-3">🚀 Skill Improvement Plan</h3>
              <div className="form-group">
                <label className="form-label">Job Description *</label>
                <textarea
                  className="form-textarea"
                  rows={6}
                  value={improveData.job_description}
                  onChange={(e) => setImproveData({ ...improveData, job_description: e.target.value })}
                  placeholder="Paste the job description for your target role..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Your Current Skills *</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={improveData.current_skills}
                  onChange={(e) => setImproveData({ ...improveData, current_skills: e.target.value })}
                  placeholder="List your current skills separated by commas..."
                />
                <p className="text-xs text-muted mt-1">
                  {improveData.current_skills ? `${improveData.current_skills.split(',').filter(s => s.trim()).length} skills listed` : 'e.g. Python, JavaScript, SQL'}
                </p>
              </div>
              <button className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                onClick={handleImprove} disabled={loading}>
                {loading ? 'Analyzing...' : '🚀 Generate Improvement Plan'}
              </button>
            </div>

            {/* Results Column */}
            <div>
              {improveResult ? (
                <div className="fade-in">
                  {/* Estimated Time */}
                  {improveResult.estimated_time_to_acquire && (
                    <div className="card mb-3">
                      <div className="flex-between">
                        <span className="font-semibold">⏱ Estimated Time to Acquire Skills</span>
                        <span className="badge badge-gradient">{improveResult.estimated_time_to_acquire}</span>
                      </div>
                    </div>
                  )}

                  {/* Missing Skills */}
                  {improveResult.missing_skills?.length > 0 && (
                    <div className="card mb-3">
                      <h4 className="font-semibold mb-2">📋 Missing Skills</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {improveResult.missing_skills.map((skill, i) => (
                          <span key={i} className="tag tag-danger">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Priority Skills */}
                  {improveResult.priority_skills?.length > 0 && (
                    <div className="card mb-3">
                      <h4 className="font-semibold mb-2">⭐ Priority Skills</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {improveResult.priority_skills.map((skill, i) => (
                          <span key={i} className="tag tag-primary">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Learning Resources */}
                  {improveResult.learning_resources?.length > 0 && (
                    <div className="card mb-3">
                      <h4 className="font-semibold mb-3">📚 Learning Resources</h4>
                      <div className="grid-auto">
                        {improveResult.learning_resources.map((res, i) => (
                          <ResourceCard key={i} resource={res} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Courses */}
                  {improveResult.recommended_courses?.length > 0 && (
                    <div className="card mb-3">
                      <h4 className="font-semibold mb-3">🎓 Recommended Courses</h4>
                      <div className="grid-auto">
                        {improveResult.recommended_courses.map((course, i) => (
                          <CourseCard key={i} course={course} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="card">
                  <div className="empty-state">
                    <div className="empty-state-icon">🚀</div>
                    <h3 className="empty-state-title">Improve Your Skills</h3>
                    <p className="empty-state-text">
                      Get a personalized improvement plan with missing skills, priority areas,
                      learning resources, and recommended courses.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobAnalyzer;
