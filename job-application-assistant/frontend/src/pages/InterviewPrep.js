import React, { useState, useEffect } from 'react';
import { interviewPrepAPI } from '../services/api';

function InterviewPrep() {
  const [activeTab, setActiveTab] = useState('practice');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Practice state
  const [formData, setFormData] = useState({
    job_title: '',
    company: '',
    skills: '',
    difficulty: 'medium',
  });
  const [questions, setQuestions] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState({});

  // Evaluate state
  const [evalQuestion, setEvalQuestion] = useState('');
  const [evalAnswer, setEvalAnswer] = useState('');
  const [evalCategory, setEvalCategory] = useState('');
  const [evalJobTitle, setEvalJobTitle] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [evalError, setEvalError] = useState('');

  // History state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await interviewPrepAPI.getHistory();
      setHistory(res.data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // --- Practice Handlers ---

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!formData.job_title.trim()) {
      setError('Please enter a job title');
      return;
    }
    setLoading(true);
    setError('');
    setQuestions(null);
    setExpandedQuestions({});

    try {
      const payload = {
        job_title: formData.job_title,
        difficulty: formData.difficulty,
      };
      if (formData.company.trim()) payload.company = formData.company.trim();
      if (formData.skills.trim()) payload.skills = formData.skills.trim();

      const res = await interviewPrepAPI.generateQuestions(payload);
      setQuestions(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate interview questions');
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (idx) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const useQuestionForEval = (question) => {
    setEvalQuestion(question.question);
    setEvalCategory(question.category || '');
    setEvalJobTitle(formData.job_title);
    setActiveTab('evaluate');
  };

  // --- Evaluate Handlers ---

  const handleEvaluate = async () => {
    if (!evalQuestion.trim() || !evalAnswer.trim()) {
      setEvalError('Please enter both the question and your answer');
      return;
    }
    setLoading(true);
    setEvalError('');
    setEvaluation(null);

    try {
      const payload = {
        question: evalQuestion,
        answer: evalAnswer,
      };
      if (evalCategory.trim()) payload.category = evalCategory.trim();
      if (evalJobTitle.trim()) payload.job_title = evalJobTitle.trim();

      const res = await interviewPrepAPI.evaluateAnswer(payload);
      setEvaluation(res.data);
    } catch (err) {
      setEvalError(err.response?.data?.detail || 'Failed to evaluate answer');
    } finally {
      setLoading(false);
    }
  };

  // --- Score Ring Helper ---

  const ScoreRing = ({ score, size = 120, label = 'Score' }) => {
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const colorClass = score >= 70 ? 'score-high' : score >= 40 ? 'score-medium' : 'score-low';

    return (
      <div className={`score-ring-container ${colorClass}`} style={{ width: size, height: size }}>
        <svg className="score-ring" width={size} height={size}>
          <defs>
            <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0d9488" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
          </defs>
          <circle
            className="ring-bg"
            cx={size / 2}
            cy={size / 2}
            r={radius}
          />
          <circle
            className="ring-fill"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              stroke: score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444',
            }}
          />
        </svg>
        <div className="score-ring-value">
          <span className="number">{score}</span>
          <span className="label">{label}</span>
        </div>
      </div>
    );
  };

  // --- Tab Style ---

  const tabStyle = (isActive) => ({
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    background: isActive ? 'linear-gradient(135deg, #0d9488, #0891b2)' : 'rgba(255,255,255,0.04)',
    color: isActive ? '#ffffff' : '#94a3b8',
    border: isActive ? 'none' : '1px solid rgba(255,255,255,0.07)',
    boxShadow: isActive ? '0 4px 15px rgba(13,148,136,0.3)' : 'none',
  });

  // --- Render ---

  return (
    <div>
      <div className="mb-6">
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>🎯 Interview Preparation</h2>
        <p className="text-muted mt-1">
          Practice with AI-generated questions, get your answers evaluated, and track your progress
        </p>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}
      {evalError && <div className="alert alert-error mb-4">{evalError}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button style={tabStyle(activeTab === 'practice')} onClick={() => setActiveTab('practice')}>
          📝 Practice
        </button>
        <button style={tabStyle(activeTab === 'evaluate')} onClick={() => setActiveTab('evaluate')}>
          ✅ Evaluate
        </button>
        <button style={tabStyle(activeTab === 'history')} onClick={() => setActiveTab('history')}>
          📊 History
        </button>
      </div>

      {/* ============ PRACTICE TAB ============ */}
      {activeTab === 'practice' && (
        <div className="detail-layout">
          {/* Left: Form */}
          <div>
            <div className="card mb-4">
              <h3 className="card-title mb-4">Generate Practice Questions</h3>
              <form onSubmit={handleGenerate}>
                <div className="form-group">
                  <label className="form-label">Job Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.job_title}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                    placeholder="e.g., Software Engineer, Data Scientist"
                    required
                  />
                </div>
                <div className="grid-2" style={{ gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Company (optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="e.g., Google, Microsoft"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Difficulty</label>
                    <select
                      className="form-select"
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Key Skills (optional, comma-separated)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    placeholder="e.g., Python, React, AWS, System Design"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={loading}
                >
                  {loading ? (
                    <><span className="spinner spinner-sm" style={{ marginRight: 8 }} /> Generating...</>
                  ) : (
                    '🚀 Generate Questions'
                  )}
                </button>
              </form>
            </div>

            {/* Quick presets */}
            <div className="card">
              <h4 className="font-semibold mb-3">Quick Start Presets</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { label: 'Frontend Engineer', title: 'Frontend Engineer', skills: 'React, TypeScript, CSS, JavaScript' },
                  { label: 'Backend Engineer', title: 'Backend Engineer', skills: 'Python, Django, PostgreSQL, REST APIs' },
                  { label: 'Data Scientist', title: 'Data Scientist', skills: 'Python, Machine Learning, SQL, Statistics' },
                  { label: 'DevOps Engineer', title: 'DevOps Engineer', skills: 'Docker, Kubernetes, AWS, CI/CD' },
                  { label: 'Product Manager', title: 'Product Manager', skills: 'Strategy, Roadmap, Agile, Stakeholder Management' },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    className="btn btn-sm btn-secondary"
                    onClick={() => setFormData({
                      ...formData,
                      job_title: preset.title,
                      skills: preset.skills,
                    })}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Questions Display */}
          <div>
            {loading && (
              <div className="card" style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                <div className="spinner spinner-lg" />
              </div>
            )}

            {!loading && !questions && (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon gradient">🎯</div>
                  <h3 className="empty-state-title">Ready to practice?</h3>
                  <p className="empty-state-text">
                    Fill in the job details on the left and generate AI-powered interview questions tailored to your target role.
                  </p>
                </div>
              </div>
            )}

            {questions && !loading && (
              <div className="fade-in">
                {/* Overview */}
                <div className="card mb-4">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ fontSize: 18, fontWeight: 600 }}>Generated Questions</h4>
                    <span className="badge badge-primary">{questions.total_questions} questions</span>
                  </div>
                  {questions.categories_covered && questions.categories_covered.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      {questions.categories_covered.map((cat, i) => (
                        <span key={i} className="tag tag-primary">{cat}</span>
                      ))}
                    </div>
                  )}
                  {questions.prep_tips && questions.prep_tips.length > 0 && (
                    <div style={{
                      background: 'rgba(13,148,136,0.08)',
                      border: '1px solid rgba(13,148,136,0.15)',
                      borderRadius: 6,
                      padding: '12px 16px',
                      marginTop: 8,
                    }}>
                      <p className="font-semibold text-sm mb-2" style={{ color: 'var(--primary-light)' }}>💡 Preparation Tips</p>
                      <ul style={{ paddingLeft: 20 }}>
                        {questions.prep_tips.map((tip, i) => (
                          <li key={i} className="text-sm text-muted" style={{ marginBottom: 4, listStyle: 'disc' }}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Questions grouped by category */}
                {(() => {
                  const grouped = {};
                  (questions.questions || []).forEach((q, idx) => {
                    const cat = q.category || 'General';
                    if (!grouped[cat]) grouped[cat] = [];
                    grouped[cat].push({ ...q, idx });
                  });
                  return Object.entries(grouped).map(([category, catQuestions]) => (
                    <div key={category} className="card mb-3">
                      <h4 className="font-semibold mb-3" style={{ color: 'var(--primary-light)' }}>
                        📂 {category}
                        <span className="badge badge-secondary ml-2" style={{ marginLeft: 8 }}>{catQuestions.length}</span>
                      </h4>
                      {catQuestions.map((q) => (
                        <div key={q.id || q.idx} className="mb-3" style={{
                          border: '1px solid var(--border-color)',
                          borderRadius: 6,
                          padding: '12px 16px',
                          background: 'rgba(255,255,255,0.02)',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <span style={{ fontSize: 16 }}>❓</span>
                                <p className="font-medium" style={{ fontSize: 14 }}>{q.question}</p>
                              </div>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <span className="tag" style={{
                                  background: q.difficulty === 'beginner' ? 'rgba(16,185,129,0.12)' :
                                    q.difficulty === 'medium' ? 'rgba(245,158,11,0.12)' :
                                    q.difficulty === 'hard' ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.12)',
                                  color: q.difficulty === 'beginner' ? 'var(--success-light)' :
                                    q.difficulty === 'medium' ? 'var(--warning-light)' :
                                    'var(--danger-light)',
                                  border: 'none',
                                }}>
                                  {q.difficulty || 'medium'}
                                </span>
                                {q.tips && q.tips.length > 0 && (
                                  <span className="tag tag-info">💡 {q.tips.length} tip{q.tips.length > 1 ? 's' : ''}</span>
                                )}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => toggleQuestion(q.idx)}
                                title={expandedQuestions[q.idx] ? 'Hide sample answer' : 'Show sample answer'}
                              >
                                {expandedQuestions[q.idx] ? '📖 Hide' : '📖 Answer'}
                              </button>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => useQuestionForEval(q)}
                                title="Practice this question"
                              >
                                ✅ Practice
                              </button>
                            </div>
                          </div>

                          {/* Expandable sample answer & tips */}
                          {expandedQuestions[q.idx] && (
                            <div className="fade-in" style={{
                              marginTop: 12,
                              paddingTop: 12,
                              borderTop: '1px solid var(--border-color)',
                            }}>
                              {q.sample_answer && (
                                <div className="mb-3">
                                  <p className="font-semibold text-sm mb-1" style={{ color: 'var(--success-light)' }}>
                                    ✅ Sample Answer
                                  </p>
                                  <p className="text-sm text-muted" style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                                    {q.sample_answer}
                                  </p>
                                </div>
                              )}
                              {q.tips && q.tips.length > 0 && (
                                <div>
                                  <p className="font-semibold text-sm mb-1" style={{ color: 'var(--primary-light)' }}>
                                    💡 Tips
                                  </p>
                                  <ul style={{ paddingLeft: 20 }}>
                                    {q.tips.map((tip, i) => (
                                      <li key={i} className="text-sm text-muted" style={{ marginBottom: 2, listStyle: 'disc' }}>
                                        {tip}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ));
                })()}

                {/* Generate new questions */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                  <button className="btn btn-secondary" onClick={() => {
                    setQuestions(null);
                    setExpandedQuestions({});
                  }}>
                    🔄 Generate New Questions
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ EVALUATE TAB ============ */}
      {activeTab === 'evaluate' && (
        <div className="detail-layout">
          {/* Left: Input */}
          <div>
            <div className="card mb-4">
              <h3 className="card-title mb-4">Evaluate Your Answer</h3>
              <div className="form-group">
                <label className="form-label">Interview Question *</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={evalQuestion}
                  onChange={(e) => setEvalQuestion(e.target.value)}
                  placeholder="Paste the interview question you want to practice..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Your Answer *</label>
                <textarea
                  className="form-textarea"
                  rows={6}
                  value={evalAnswer}
                  onChange={(e) => setEvalAnswer(e.target.value)}
                  placeholder="Write your answer here... Be thorough and structured for the best feedback."
                  style={{ minHeight: 160 }}
                />
              </div>
              <div className="grid-2" style={{ gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Category (optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={evalCategory}
                    onChange={(e) => setEvalCategory(e.target.value)}
                    placeholder="e.g., Technical, Behavioral"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Job Title (optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={evalJobTitle}
                    onChange={(e) => setEvalJobTitle(e.target.value)}
                    placeholder="e.g., Software Engineer"
                  />
                </div>
              </div>
              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleEvaluate}
                disabled={loading}
              >
                {loading ? (
                  <><span className="spinner spinner-sm" style={{ marginRight: 8 }} /> Evaluating...</>
                ) : (
                  '🔍 Evaluate Answer'
                )}
              </button>
            </div>

            {/* Quick fill suggestions */}
            {!evalQuestion && !evalAnswer && (
              <div className="card">
                <h4 className="font-semibold mb-3">Try These Questions</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { q: 'Tell me about yourself and why you want this role?', cat: 'Behavioral' },
                    { q: 'Describe a challenging project you worked on and how you overcame obstacles.', cat: 'Behavioral' },
                    { q: 'Explain the difference between REST and GraphQL.', cat: 'Technical' },
                    { q: 'How would you design a URL shortening service like TinyURL?', cat: 'System Design' },
                    { q: 'Tell me about a time you had a conflict with a teammate. How did you resolve it?', cat: 'Behavioral' },
                  ].map((item, i) => (
                    <button
                      key={i}
                      className="btn btn-sm btn-secondary"
                      style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '10px 14px', height: 'auto' }}
                      onClick={() => {
                        setEvalQuestion(item.q);
                        setEvalCategory(item.cat);
                      }}
                    >
                      <span style={{ fontSize: 14, marginRight: 8 }}>❓</span>
                      <span className="text-sm">{item.q}</span>
                      <span className="tag tag-primary ml-auto" style={{ marginLeft: 'auto', flexShrink: 0 }}>{item.cat}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Evaluation Results */}
          <div>
            {loading && (
              <div className="card" style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                <div className="spinner spinner-lg" />
              </div>
            )}

            {!loading && !evaluation && (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon gradient">✅</div>
                  <h3 className="empty-state-title">Ready for feedback?</h3>
                  <p className="empty-state-text">
                    Paste an interview question and your answer, then get AI-powered evaluation with score, feedback, and suggestions for improvement.
                  </p>
                </div>
              </div>
            )}

            {evaluation && !loading && (
              <div className="fade-in">
                {/* Score Card */}
                <div className="card mb-4" style={{ textAlign: 'center' }}>
                  <h4 className="font-semibold mb-4">Your Score</h4>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ScoreRing score={evaluation.score} size={140} />
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <span className={`badge ${evaluation.score >= 70 ? 'badge-success' : evaluation.score >= 40 ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: 14, padding: '6px 16px' }}>
                      {evaluation.score >= 70 ? '🌟 Great Job!' : evaluation.score >= 40 ? '📈 Good Effort' : '💪 Keep Practicing'}
                    </span>
                  </div>
                </div>

                {/* Feedback */}
                {evaluation.feedback && (
                  <div className="card mb-4">
                    <h4 className="font-semibold mb-3">📝 Feedback</h4>
                    <p className="text-sm text-muted" style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {evaluation.feedback}
                    </p>
                  </div>
                )}

                {/* Strengths */}
                {evaluation.strengths && evaluation.strengths.length > 0 && (
                  <div className="card mb-4">
                    <h4 className="font-semibold mb-3" style={{ color: 'var(--success-light)' }}>✅ Strengths</h4>
                    <ul style={{ paddingLeft: 20 }}>
                      {evaluation.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-muted" style={{ marginBottom: 6, listStyle: 'disc' }}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Areas for Improvement */}
                {evaluation.areas_for_improvement && evaluation.areas_for_improvement.length > 0 && (
                  <div className="card mb-4">
                    <h4 className="font-semibold mb-3" style={{ color: 'var(--warning-light)' }}>📈 Areas for Improvement</h4>
                    <ul style={{ paddingLeft: 20 }}>
                      {evaluation.areas_for_improvement.map((a, i) => (
                        <li key={i} className="text-sm text-muted" style={{ marginBottom: 6, listStyle: 'disc' }}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Key Points Missed */}
                {evaluation.key_points_missed && evaluation.key_points_missed.length > 0 && (
                  <div className="card mb-4">
                    <h4 className="font-semibold mb-3" style={{ color: 'var(--danger-light)' }}>🎯 Key Points Missed</h4>
                    <ul style={{ paddingLeft: 20 }}>
                      {evaluation.key_points_missed.map((k, i) => (
                        <li key={i} className="text-sm text-muted" style={{ marginBottom: 6, listStyle: 'disc' }}>{k}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sample Answer */}
                {evaluation.sample_answer && (
                  <div className="card mb-4">
                    <h4 className="font-semibold mb-3" style={{ color: 'var(--primary-light)' }}>📖 Sample Answer</h4>
                    <p className="text-sm text-muted" style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {evaluation.sample_answer}
                    </p>
                  </div>
                )}

                {/* Suggestions */}
                {evaluation.suggestions && evaluation.suggestions.length > 0 && (
                  <div className="card mb-4">
                    <h4 className="font-semibold mb-3" style={{ color: 'var(--accent-light)' }}>💡 Suggestions</h4>
                    <ul style={{ paddingLeft: 20 }}>
                      {evaluation.suggestions.map((s, i) => (
                        <li key={i} className="text-sm text-muted" style={{ marginBottom: 6, listStyle: 'disc' }}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Confidence Assessment */}
                {evaluation.confidence_assessment && (
                  <div className="card mb-4">
                    <h4 className="font-semibold mb-3">💪 Confidence Assessment</h4>
                    <p className="text-sm text-muted" style={{ lineHeight: 1.7 }}>
                      {evaluation.confidence_assessment}
                    </p>
                  </div>
                )}

                {/* Try Again */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button className="btn btn-secondary" onClick={() => {
                    setEvaluation(null);
                    setEvalAnswer('');
                  }}>
                    🔄 Try Another Answer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ HISTORY TAB ============ */}
      {activeTab === 'history' && (
        <div>
          {historyLoading ? (
            <div className="card" style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
              <div className="spinner spinner-lg" />
            </div>
          ) : history.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <h3 className="empty-state-title">No practice history yet</h3>
                <p className="empty-state-text">
                  Your interview practice sessions and evaluation scores will appear here. Start practicing to build your history!
                </p>
                <button className="btn btn-primary" onClick={() => setActiveTab('practice')}>
                  🎯 Start Practicing
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Summary Stats */}
              <div className="grid-3 mb-4">
                <div className="stat-card stat-primary">
                  <div className="stat-card-icon primary">📝</div>
                  <div className="stat-card-content">
                    <div className="stat-card-value">{history.length}</div>
                    <div className="stat-card-label">Total Sessions</div>
                  </div>
                </div>
                <div className="stat-card stat-success">
                  <div className="stat-card-icon success">⭐</div>
                  <div className="stat-card-content">
                    <div className="stat-card-value">
                      {history.length > 0
                        ? Math.round(history.reduce((sum, h) => sum + (h.score || 0), 0) / history.length)
                        : 0}
                    </div>
                    <div className="stat-card-label">Average Score</div>
                  </div>
                </div>
                <div className="stat-card stat-accent">
                  <div className="stat-card-icon accent">🏆</div>
                  <div className="stat-card-content">
                    <div className="stat-card-value">
                      {history.length > 0 ? Math.max(...history.map((h) => h.score || 0)) : 0}
                    </div>
                    <div className="stat-card-label">Highest Score</div>
                  </div>
                </div>
              </div>

              {/* History List */}
              <div className="card">
                <h4 className="font-semibold mb-4">Session History</h4>
                {history.map((session, idx) => (
                  <div key={session.id || idx} className="fade-in" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '14px 0',
                    borderBottom: idx < history.length - 1 ? '1px solid var(--border-color-light)' : 'none',
                  }}>
                    {/* Score Ring Small */}
                    <div style={{ flexShrink: 0 }}>
                      <ScoreRing score={session.score || 0} size={56} label="" />
                    </div>

                    {/* Session Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="font-semibold text-sm" style={{ marginBottom: 2 }}>
                        {session.job_title || 'Interview Practice'}
                      </p>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {session.category && (
                          <span className="text-xs text-muted">📂 {session.category}</span>
                        )}
                        {session.difficulty && (
                          <span className="text-xs text-muted">📊 {session.difficulty}</span>
                        )}
                        {session.created_at && (
                          <span className="text-xs text-muted">
                            🕐 {new Date(session.created_at).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'short', day: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Score Badge */}
                    <span className={`badge ${(session.score || 0) >= 70 ? 'badge-success' : (session.score || 0) >= 40 ? 'badge-warning' : 'badge-danger'}`}>
                      {(session.score || 0) >= 70 ? '🌟' : (session.score || 0) >= 40 ? '📈' : '💪'} {session.score || 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default InterviewPrep;
