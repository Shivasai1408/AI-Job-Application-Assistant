import React, { useState, useEffect, useRef } from 'react';
import { linkedinAPI } from '../services/api';

const SECTION_TYPES = [
  { value: 'headline', label: 'Headline' },
  { value: 'about', label: 'About' },
  { value: 'skills', label: 'Skills' },
  { value: 'experience', label: 'Experience' },
];

function LinkedInOptimizer() {
  const [activeTab, setActiveTab] = useState('optimizer');

  // --- Optimizer State ---
  const [sections, setSections] = useState([{ section_type: 'headline', content: '' }]);
  const [optimizeResult, setOptimizeResult] = useState(null);
  const [optimizeLoading, setOptimizeLoading] = useState(false);

  // --- Keyword Finder State ---
  const [keywordForm, setKeywordForm] = useState({ job_title: '', industry: '' });
  const [keywordResult, setKeywordResult] = useState(null);
  const [keywordLoading, setKeywordLoading] = useState(false);

  // --- Analytics State ---
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const analyticsFetched = useRef(false);

  const [error, setError] = useState('');

  // ---- Fetch Analytics on mount ----
  useEffect(() => {
    if (activeTab === 'analytics' && !analyticsFetched.current) {
      fetchAnalytics();
    }
  }, [activeTab]);

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    setError('');
    try {
      const res = await linkedinAPI.getAnalytics();
      setAnalytics(res.data);
      analyticsFetched.current = true;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch LinkedIn analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // ---- Optimizer ----
  const addSection = () => {
    setSections([...sections, { section_type: 'headline', content: '' }]);
  };

  const removeSection = (index) => {
    if (sections.length === 1) return;
    setSections(sections.filter((_, i) => i !== index));
  };

  const updateSection = (index, field, value) => {
    const updated = [...sections];
    updated[index][field] = value;
    setSections(updated);
  };

  const handleOptimize = async (e) => {
    e.preventDefault();
    const valid = sections.filter((s) => s.content.trim());
    if (valid.length === 0) {
      setError('Please add at least one section with content');
      return;
    }
    setOptimizeLoading(true);
    setError('');
    setOptimizeResult(null);

    try {
      const res = await linkedinAPI.optimize({ sections: valid });
      setOptimizeResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to optimize profile');
    } finally {
      setOptimizeLoading(false);
    }
  };

  // ---- Keyword Finder ----
  const handleFindKeywords = async (e) => {
    e.preventDefault();
    if (!keywordForm.job_title.trim()) {
      setError('Please enter a job title');
      return;
    }
    setKeywordLoading(true);
    setError('');
    setKeywordResult(null);

    try {
      const payload = { job_title: keywordForm.job_title };
      if (keywordForm.industry.trim()) payload.industry = keywordForm.industry;
      const res = await linkedinAPI.getKeywords(payload);
      setKeywordResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to find keywords');
    } finally {
      setKeywordLoading(false);
    }
  };

  // ---- Helpers ----
  const getScoreColor = (score) => {
    if (score >= 70) return '#10b981';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getRelevanceColor = (relevance) => {
    const map = {
      high: '#10b981',
      medium: '#f59e0b',
      low: '#64748b',
    };
    return map[relevance] || '#64748b';
  };

  const getRelevanceLabel = (relevance) => {
    const map = {
      high: 'High Relevance',
      medium: 'Medium Relevance',
      low: 'Low Relevance',
    };
    return map[relevance] || relevance;
  };

  // ---- Circular Score Ring ----
  const ScoreRing = ({ score, label, size = 120 }) => {
    const radius = 48;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = getScoreColor(score);

    return (
      <div className="score-ring-container" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="score-ring">
          <defs>
            <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0d9488" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
          </defs>
          <circle className="ring-bg" cx={size / 2} cy={size / 2} r={radius} />
          <circle
            className="ring-fill"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        </svg>
        <div className="score-ring-value">
          <span className="number" style={{ color }}>{score}</span>
          <span className="label">{label}</span>
        </div>
      </div>
    );
  };

  // ---- Tab Style ----
  const tabStyle = (isActive) => ({
    flex: 1,
    padding: '14px 24px',
    fontSize: 14,
    fontWeight: 600,
    color: isActive ? 'var(--primary-light)' : 'var(--text-muted)',
    background: isActive ? 'rgba(13, 148, 136, 0.08)' : 'transparent',
    border: 'none',
    borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  });

  // ---- Render ----
  return (
    <div>
      {/* Header */}
      <div className="flex-between mb-6">
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>🔗 LinkedIn Optimizer</h2>
          <p className="text-muted mt-1">
            Optimize your LinkedIn profile, discover keywords, and track your analytics
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-4">
          <span className="alert-icon">⚠️</span>
          <span className="alert-content">{error}</span>
          <button
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 18 }}
            onClick={() => setError('')}
          >
            ×
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="card mb-6" style={{ padding: 0 }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
          <button
            style={tabStyle(activeTab === 'optimizer')}
            onClick={() => { setActiveTab('optimizer'); setError(''); }}
          >
            ✏️ Profile Optimizer
          </button>
          <button
            style={tabStyle(activeTab === 'keywords')}
            onClick={() => { setActiveTab('keywords'); setError(''); }}
          >
            🔑 Keyword Finder
          </button>
          <button
            style={tabStyle(activeTab === 'analytics')}
            onClick={() => { setActiveTab('analytics'); setError(''); }}
          >
            📊 Analytics
          </button>
        </div>
      </div>

      {/* ================================================================
          TAB 1: PROFILE OPTIMIZER
      ================================================================ */}
      {activeTab === 'optimizer' && (
        <div className="detail-layout">
          {/* Left: Form */}
          <div>
            <div className="card mb-4">
              <div className="flex-between mb-4">
                <h3 className="card-title" style={{ margin: 0 }}>Profile Sections</h3>
                <button type="button" className="btn btn-sm btn-secondary" onClick={addSection}>
                  ➕ Add Section
                </button>
              </div>

              <form onSubmit={handleOptimize}>
                {sections.map((section, index) => (
                  <div key={index} className="card mb-3" style={{ padding: 16, position: 'relative' }}>
                    <div className="flex-between mb-2">
                      <select
                        className="form-select"
                        style={{ width: 'auto', minWidth: 160 }}
                        value={section.section_type}
                        onChange={(e) => updateSection(index, 'section_type', e.target.value)}
                      >
                        {SECTION_TYPES.map((st) => (
                          <option key={st.value} value={st.value}>{st.label}</option>
                        ))}
                      </select>
                      {sections.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => removeSection(index)}
                          style={{ padding: '4px 10px', fontSize: 12 }}
                        >
                          ✕ Remove
                        </button>
                      )}
                    </div>
                    <textarea
                      className="form-textarea"
                      rows={4}
                      value={section.content}
                      onChange={(e) => updateSection(index, 'content', e.target.value)}
                      placeholder={`Enter your ${section.section_type} content...`}
                    />
                  </div>
                ))}

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={optimizeLoading}
                >
                  {optimizeLoading ? (
                    <>
                      <div className="spinner spinner-sm" /> Optimizing...
                    </>
                  ) : (
                    '🚀 Optimize Profile'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right: Results */}
          <div>
            {optimizeLoading ? (
              <div className="card">
                <div className="spinner-container">
                  <div className="spinner" />
                </div>
                <p className="text-center text-muted">Analyzing your profile...</p>
              </div>
            ) : optimizeResult ? (
              <div className="fade-in">
                {/* Overall Score */}
                <div className="card mb-4">
                  <h4 className="font-semibold mb-4">📈 Optimization Results</h4>
                  <div className="flex-center mb-4" style={{ gap: 32, flexWrap: 'wrap' }}>
                    <ScoreRing score={optimizeResult.overall_score} label="Overall" size={130} />
                  </div>

                  {optimizeResult.tips?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold mb-2">💡 Quick Tips</p>
                      <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
                        {optimizeResult.tips.map((tip, i) => (
                          <li key={i} className="text-sm" style={{ color: 'var(--text-secondary)' }}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Suggestions */}
                {optimizeResult.suggestions?.map((suggestion, idx) => (
                  <div key={idx} className="card mb-4 animate-fadeIn">
                    <div className="flex-between mb-3">
                      <h4 className="font-semibold" style={{ textTransform: 'capitalize' }}>
                        {suggestion.section_type}
                      </h4>
                      {suggestion.seo_score_improvement != null && (
                        <span
                          className="badge"
                          style={{
                            background: suggestion.seo_score_improvement > 0
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(239, 68, 68, 0.15)',
                            color: suggestion.seo_score_improvement > 0
                              ? 'var(--success-light)'
                              : 'var(--danger-light)',
                            fontWeight: 600,
                          }}
                        >
                          {suggestion.seo_score_improvement > 0 ? '+' : ''}
                          {suggestion.seo_score_improvement} SEO
                        </span>
                      )}
                    </div>

                    {/* Original vs Optimized */}
                    <div className="grid-2" style={{ gap: 12 }}>
                      <div>
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Original</p>
                        <div
                          className="card"
                          style={{
                            padding: 12,
                            background: 'rgba(239, 68, 68, 0.05)',
                            borderColor: 'rgba(239, 68, 68, 0.15)',
                            fontSize: 13,
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {suggestion.original}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Optimized</p>
                        <div
                          className="card"
                          style={{
                            padding: 12,
                            background: 'rgba(16, 185, 129, 0.05)',
                            borderColor: 'rgba(16, 185, 129, 0.15)',
                            fontSize: 13,
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {suggestion.optimized}
                        </div>
                      </div>
                    </div>

                    {/* Changes */}
                    {suggestion.changes?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Changes Made</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {suggestion.changes.map((change, ci) => (
                            <span key={ci} className="tag tag-primary">{change}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reasoning */}
                    {suggestion.reasoning && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Reasoning</p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          {suggestion.reasoning}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">🔗</div>
                  <h3 className="empty-state-title">Optimize Your Profile</h3>
                  <p className="empty-state-text">
                    Add your LinkedIn profile sections on the left and click "Optimize Profile" to
                    get AI-powered suggestions for improvement.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================
          TAB 2: KEYWORD FINDER
      ================================================================ */}
      {activeTab === 'keywords' && (
        <div className="detail-layout">
          {/* Left: Form */}
          <div>
            <div className="card">
              <h3 className="card-title mb-4">Find Keywords</h3>
              <p className="text-sm text-muted mb-4">
                Discover high-impact keywords for your LinkedIn profile based on your target role
              </p>
              <form onSubmit={handleFindKeywords}>
                <div className="form-group">
                  <label className="form-label">Job Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={keywordForm.job_title}
                    onChange={(e) => setKeywordForm({ ...keywordForm, job_title: e.target.value })}
                    placeholder="e.g. Senior Software Engineer"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Industry</label>
                  <input
                    type="text"
                    className="form-input"
                    value={keywordForm.industry}
                    onChange={(e) => setKeywordForm({ ...keywordForm, industry: e.target.value })}
                    placeholder="e.g. Technology, Healthcare, Finance"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={keywordLoading}
                >
                  {keywordLoading ? (
                    <>
                      <div className="spinner spinner-sm" /> Searching...
                    </>
                  ) : (
                    '🔍 Find Keywords'
                  )}
                </button>
              </form>
            </div>

            {/* Quick presets */}
            <div className="card mt-4">
              <p className="text-sm font-semibold mb-3">Quick Search</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  'Frontend Developer',
                  'Data Scientist',
                  'Product Manager',
                  'DevOps Engineer',
                  'UX Designer',
                ].map((preset) => (
                  <button
                    key={preset}
                    className="btn btn-sm btn-secondary"
                    onClick={() => setKeywordForm({ ...keywordForm, job_title: preset })}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div>
            {keywordLoading ? (
              <div className="card">
                <div className="spinner-container">
                  <div className="spinner" />
                </div>
                <p className="text-center text-muted">Finding optimal keywords...</p>
              </div>
            ) : keywordResult ? (
              <div className="fade-in">
                {/* Header */}
                <div className="card mb-4">
                  <div className="flex-between">
                    <div>
                      <h4 className="font-semibold">Keywords for {keywordResult.job_title}</h4>
                      {keywordResult.industry && (
                        <p className="text-sm text-muted mt-1">Industry: {keywordResult.industry}</p>
                      )}
                    </div>
                    <span className="badge badge-primary">
                      {keywordResult.recommended_keywords?.length || 0} keywords
                    </span>
                  </div>
                </div>

                {/* Keywords by category */}
                {keywordResult.keyword_categories &&
                  Object.entries(keywordResult.keyword_categories).map(([category, categoryKeywords]) => (
                    <div key={category} className="card mb-4 animate-fadeIn">
                      <h4 className="font-semibold mb-3" style={{ textTransform: 'capitalize' }}>
                        {category.replace(/_/g, ' ')}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {(categoryKeywords || []).map((kw, ki) => (
                          <div
                            key={ki}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 12,
                              padding: '10px 12px',
                              background: 'var(--bg-input)',
                              borderRadius: 'var(--radius)',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="flex-between mb-1">
                                <span className="font-semibold text-sm">{kw.keyword}</span>
                                <span
                                  className="tag"
                                  style={{
                                    background: `${getRelevanceColor(kw.relevance)}20`,
                                    color: getRelevanceColor(kw.relevance),
                                    fontWeight: 600,
                                    fontSize: 11,
                                  }}
                                >
                                  {getRelevanceLabel(kw.relevance)}
                                </span>
                              </div>
                              {kw.usage_tips && (
                                <p className="text-xs text-muted mt-1">{kw.usage_tips}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                {/* Flattened keywords list fallback */}
                {!keywordResult.keyword_categories && keywordResult.recommended_keywords?.length > 0 && (
                  <div className="card mb-4">
                    <h4 className="font-semibold mb-3">Recommended Keywords</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {keywordResult.recommended_keywords.map((kw, ki) => (
                        <div
                          key={ki}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 12,
                            padding: '10px 12px',
                            background: 'var(--bg-input)',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="flex-between mb-1">
                              <div>
                                <span className="font-semibold text-sm">{kw.keyword}</span>
                                {kw.category && (
                                  <span className="tag ml-2" style={{ fontSize: 10 }}>
                                    {kw.category}
                                  </span>
                                )}
                              </div>
                              {kw.relevance && (
                                <span
                                  className="tag"
                                  style={{
                                    background: `${getRelevanceColor(kw.relevance)}20`,
                                    color: getRelevanceColor(kw.relevance),
                                    fontWeight: 600,
                                    fontSize: 11,
                                  }}
                                >
                                  {getRelevanceLabel(kw.relevance)}
                                </span>
                              )}
                            </div>
                            {kw.usage_tips && (
                              <p className="text-xs text-muted mt-1">{kw.usage_tips}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optimization Tips */}
                {keywordResult.optimization_tips?.length > 0 && (
                  <div className="card">
                    <h4 className="font-semibold mb-3">💡 Optimization Tips</h4>
                    <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
                      {keywordResult.optimization_tips.map((tip, i) => (
                        <li key={i} className="text-sm" style={{ color: 'var(--text-secondary)' }}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">🔑</div>
                  <h3 className="empty-state-title">Discover Keywords</h3>
                  <p className="empty-state-text">
                    Enter a job title to find the most relevant keywords for your LinkedIn profile,
                    grouped by category with usage tips.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================
          TAB 3: ANALYTICS
      ================================================================ */}
      {activeTab === 'analytics' && (
        <div>
          {analyticsLoading ? (
            <div className="card">
              <div className="spinner-container">
                <div className="spinner spinner-lg" />
              </div>
              <p className="text-center text-muted mt-3">Loading analytics...</p>
            </div>
          ) : analytics ? (
            <div className="fade-in">
              {/* Top Stats Row */}
              <div className="grid-3 mb-6">
                {/* Profile Strength */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px' }}>
                  <h4 className="font-semibold mb-3">Profile Strength</h4>
                  <ScoreRing score={analytics.profile_strength} label="Strength" size={140} />
                </div>

                {/* Sections Complete */}
                <div className="stat-card stat-success">
                  <div className="stat-card-icon success">📋</div>
                  <div className="stat-card-content">
                    <div className="stat-card-value">
                      {analytics.sections_complete}/{analytics.total_sections}
                    </div>
                    <div className="stat-card-label">Sections Complete</div>
                    <div className="progress-bar mt-2">
                      <div
                        className="progress-fill success"
                        style={{
                          width: `${analytics.total_sections > 0
                            ? (analytics.sections_complete / analytics.total_sections) * 100
                            : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Search Appearance */}
                <div className="stat-card stat-accent">
                  <div className="stat-card-icon accent">🔍</div>
                  <div className="stat-card-content">
                    <div className="stat-card-value">
                      {analytics.search_appearance || 0}
                    </div>
                    <div className="stat-card-label">Search Appearances</div>
                    <p className="text-xs text-muted mt-1">Times appeared in search results</p>
                  </div>
                </div>
              </div>

              {/* Profile Views Trend & Recommendations */}
              <div className="grid-2" style={{ gap: 24 }}>
                {/* Profile Views Trend */}
                <div className="card">
                  <h4 className="font-semibold mb-4">👁️ Profile Views Trend</h4>
                  {analytics.profile_views_trend ? (
                    <div>
                      <div className="flex-between mb-3">
                        <span className="text-sm text-muted">Period</span>
                        <span className="text-sm font-semibold">
                          {analytics.profile_views_trend.period || 'Last 30 days'}
                        </span>
                      </div>

                      {/* Views bar chart */}
                      {analytics.profile_views_trend.data?.length > 0 && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100, padding: '0 4px' }}>
                            {analytics.profile_views_trend.data.map((item, i) => {
                              const maxVal = Math.max(...analytics.profile_views_trend.data.map((d) => d.value), 1);
                              const heightPct = (item.value / maxVal) * 100;
                              return (
                                <div
                                  key={i}
                                  style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 4,
                                  }}
                                >
                                  <span className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                                    {item.value}
                                  </span>
                                  <div
                                    style={{
                                      width: '100%',
                                      height: `${heightPct}%`,
                                      minHeight: 4,
                                      borderRadius: '4px 4px 0 0',
                                      background: 'var(--primary-gradient)',
                                      opacity: 0.8,
                                      transition: 'height 0.6s ease',
                                    }}
                                  />
                                  <span
                                    className="text-xs"
                                    style={{
                                      color: 'var(--text-muted)',
                                      transform: 'rotate(-45deg)',
                                      transformOrigin: 'left top',
                                      whiteSpace: 'nowrap',
                                      fontSize: 9,
                                      marginTop: 4,
                                    }}
                                  >
                                    {item.label || item.date || ''}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {analytics.profile_views_trend.change != null && (
                        <div className="mt-3">
                          <span
                            className="stat-card-change"
                            style={{
                              color: analytics.profile_views_trend.change >= 0 ? 'var(--success)' : 'var(--danger)',
                              background: analytics.profile_views_trend.change >= 0
                                ? 'var(--success-bg)'
                                : 'var(--danger-bg)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: 'var(--font-size-xs)',
                              fontWeight: 600,
                            }}
                          >
                            {analytics.profile_views_trend.change >= 0 ? '↑' : '↓'}{' '}
                            {Math.abs(analytics.profile_views_trend.change)}% vs previous
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="empty-state" style={{ padding: '20px 0' }}>
                      <p className="text-sm text-muted">No trend data available yet</p>
                    </div>
                  )}
                </div>

                {/* Recommendations */}
                <div className="card">
                  <h4 className="font-semibold mb-4">💡 Recommendations</h4>
                  {analytics.recommendations?.length > 0 ? (
                    <ul style={{ paddingLeft: 20, lineHeight: 2.4 }}>
                      {analytics.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm" style={{ color: 'var(--text-secondary)' }}>{rec}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="empty-state" style={{ padding: '20px 0' }}>
                      <p className="text-sm text-muted">No recommendations yet</p>
                    </div>
                  )}

                  {/* Sections completion detail */}
                  {analytics.total_sections > 0 && (
                    <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                      <p className="text-sm font-semibold mb-3">Sections Progress</p>
                      <div className="flex-between mb-2">
                        <span className="text-sm text-muted">Completed</span>
                        <span className="text-sm font-semibold" style={{ color: 'var(--success-light)' }}>
                          {analytics.sections_complete}/{analytics.total_sections}
                        </span>
                      </div>
                      <div className="progress-bar progress-bar-lg">
                        <div
                          className="progress-fill success"
                          style={{
                            width: `${(analytics.sections_complete / analytics.total_sections) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Refresh button */}
                  <div className="mt-4">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={fetchAnalytics}
                      disabled={analyticsLoading}
                    >
                      🔄 Refresh Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <h3 className="empty-state-title">No Analytics Yet</h3>
                <p className="empty-state-text">
                  Connect your LinkedIn profile and optimize it to start seeing analytics.
                </p>
                <button className="btn btn-primary" onClick={fetchAnalytics}>
                  🔄 Load Analytics
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LinkedInOptimizer;
