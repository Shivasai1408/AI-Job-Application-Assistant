import React, { useState, useEffect, useRef } from 'react';
import { emailAPI } from '../services/api';

function EmailGenerator() {
  const [activeTab, setActiveTab] = useState('generate');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Generate form
  const [formData, setFormData] = useState({
    email_type: 'follow_up',
    recipient_name: '',
    company_name: '',
    job_title: '',
    your_name: '',
    recipient_email: '',
    additional_details: '',
    tone: 'professional',
  });

  const [generatedEmail, setGeneratedEmail] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Templates
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // History
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const generatedRef = useRef(null);

  const emailTypes = [
    { value: 'follow_up', label: 'Follow-Up' },
    { value: 'application', label: 'Job Application' },
    { value: 'thank_you', label: 'Thank You' },
    { value: 'acceptance', label: 'Offer Acceptance' },
    { value: 'rejection', label: 'Rejection Response' },
    { value: 'networking', label: 'Networking' },
    { value: 'referral', label: 'Referral Request' },
    { value: 'resignation', label: 'Resignation' },
    { value: 'recommendation', label: 'Recommendation Request' },
    { value: 'cold_email', label: 'Cold Email' },
  ];

  const tones = [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'formal', label: 'Formal' },
    { value: 'casual', label: 'Casual' },
    { value: 'enthusiastic', label: 'Enthusiastic' },
    { value: 'confident', label: 'Confident' },
  ];

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [templatesRes, historyRes] = await Promise.all([
          emailAPI.getTemplates(),
          emailAPI.getHistory(),
        ]);
        setTemplates(templatesRes.data || []);
        setHistory(historyRes.data || []);
      } catch (err) {
        console.error('Error loading email data:', err);
      } finally {
        setPageLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const res = await emailAPI.getTemplates();
      setTemplates(res.data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await emailAPI.getHistory();
      setHistory(res.data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setGeneratedEmail(null);
    setLoading(true);

    const payload = {};
    if (formData.email_type) payload.email_type = formData.email_type;
    if (formData.recipient_name) payload.recipient_name = formData.recipient_name;
    if (formData.company_name) payload.company_name = formData.company_name;
    if (formData.job_title) payload.job_title = formData.job_title;
    if (formData.your_name) payload.your_name = formData.your_name;
    if (formData.recipient_email) payload.recipient_email = formData.recipient_email;
    if (formData.additional_details) payload.additional_details = formData.additional_details;
    if (formData.tone) payload.tone = formData.tone;

    try {
      const res = await emailAPI.generate(payload);
      setGeneratedEmail(res.data);

      // Refresh history list
      fetchHistory();

      setSuccess('Email generated successfully!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const handleCopyFullEmail = () => {
    if (!generatedEmail) return;
    const fullText = `Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`;
    handleCopyToClipboard(fullText);
  };

  const handleUseTemplate = (tmpl) => {
    setFormData((prev) => ({
      ...prev,
      email_type: tmpl.email_type || prev.email_type,
    }));
    setActiveTab('generate');
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getEmailTypeLabel = (type) => {
    const found = emailTypes.find((t) => t.value === type);
    return found ? found.label : type;
  };

  const getTypeEmoji = (type) => {
    const emojis = {
      follow_up: '📧',
      application: '📄',
      thank_you: '🙏',
      acceptance: '✅',
      rejection: '💬',
      networking: '🤝',
      referral: '🔗',
      resignation: '📝',
      recommendation: '⭐',
      cold_email: '📨',
    };
    return emojis[type] || '📧';
  };

  const tabBaseStyle = {
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 6,
    border: '1px solid var(--border-color)',
    background: 'var(--bg-glass)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 250ms ease',
  };

  const tabActiveStyle = {
    ...tabBaseStyle,
    background: 'var(--primary-gradient)',
    color: 'var(--text-on-primary)',
    borderColor: 'transparent',
    boxShadow: 'var(--shadow-glow-primary)',
  };

  if (pageLoading) {
    return (
      <div className="spinner-container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex-between mb-6">
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>✉️ Email Generator</h2>
          <p className="text-muted mt-1">Generate professional emails for your job search</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 24 }}>
          <span className="alert-icon">⚠️</span>
          <div className="alert-content">
            <div className="alert-title">Error</div>
            {error}
          </div>
          <button
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 18 }}
            onClick={() => setError('')}
          >
            &times;
          </button>
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ marginBottom: 24 }}>
          <span className="alert-icon">✅</span>
          <div className="alert-content">
            <div className="alert-title">Success</div>
            {success}
          </div>
          <button
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 18 }}
            onClick={() => setSuccess('')}
          >
            &times;
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          style={activeTab === 'generate' ? tabActiveStyle : tabBaseStyle}
          onClick={() => setActiveTab('generate')}
        >
          ✨ Generate Email
        </button>
        <button
          style={activeTab === 'templates' ? tabActiveStyle : tabBaseStyle}
          onClick={() => { setActiveTab('templates'); fetchTemplates(); }}
        >
          📋 Templates ({templates.length})
        </button>
        <button
          style={activeTab === 'history' ? tabActiveStyle : tabBaseStyle}
          onClick={() => { setActiveTab('history'); fetchHistory(); }}
        >
          🕐 History ({history.length})
        </button>
      </div>

      {/* Generate Email Tab */}
      {activeTab === 'generate' && (
        <div className="grid-2" style={{ gap: 24 }}>
          {/* Form */}
          <div className="card">
            <div className="card-header-gradient">
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>✉️ Compose Email</h3>
              <p style={{ opacity: 0.85, fontSize: 13 }}>Fill in the details to generate a professional email</p>
            </div>
            <form onSubmit={handleGenerate}>
              <div className="form-group">
                <label className="form-label">Email Type *</label>
                <select
                  className="form-select"
                  name="email_type"
                  value={formData.email_type}
                  onChange={handleChange}
                  required
                >
                  {emailTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {getTypeEmoji(type.value)} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid-2" style={{ gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Recipient Name</label>
                  <input
                    type="text"
                    className="form-input"
                    name="recipient_name"
                    value={formData.recipient_name}
                    onChange={handleChange}
                    placeholder="e.g. John Smith"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <input
                    type="text"
                    className="form-input"
                    name="your_name"
                    value={formData.your_name}
                    onChange={handleChange}
                    placeholder="e.g. Jane Doe"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    className="form-input"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    placeholder="e.g. Acme Corp"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Job Title</label>
                  <input
                    type="text"
                    className="form-input"
                    name="job_title"
                    value={formData.job_title}
                    onChange={handleChange}
                    placeholder="e.g. Software Engineer"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Recipient Email</label>
                <input
                  type="email"
                  className="form-input"
                  name="recipient_email"
                  value={formData.recipient_email}
                  onChange={handleChange}
                  placeholder="e.g. john@acme.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tone</label>
                <select
                  className="form-select"
                  name="tone"
                  value={formData.tone}
                  onChange={handleChange}
                >
                  {tones.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Additional Details</label>
                <textarea
                  className="form-textarea"
                  name="additional_details"
                  rows={4}
                  value={formData.additional_details}
                  onChange={handleChange}
                  placeholder="Any specific points you'd like to include, context, or personal touches..."
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-sm" /> Generating...
                  </>
                ) : (
                  '✉️ Generate Email'
                )}
              </button>
            </form>
          </div>

          {/* Generated Email */}
          <div>
            {!generatedEmail ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">✉️</div>
                  <h3 className="empty-state-title">Ready to generate</h3>
                  <p className="empty-state-text">
                    Fill in the form and click "Generate Email" to create a professional, AI-powered email tailored to your job search.
                  </p>
                </div>
              </div>
            ) : (
              <div className="card" ref={generatedRef}>
                <div className="card-header-gradient" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 600 }}>📨 Generated Email</h3>
                    <p style={{ opacity: 0.85, fontSize: 13 }}>
                      {getEmailTypeLabel(generatedEmail.email_type)} &middot;{' '}
                      {new Date(generatedEmail.generated_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    className="btn btn-glass btn-sm"
                    onClick={handleCopyFullEmail}
                    style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                  >
                    {copySuccess ? '✅ Copied!' : '📋 Copy'}
                  </button>
                </div>

                <div style={{ padding: '24px 0' }}>
                  {/* Subject line */}
                  <div style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 6,
                    padding: '12px 16px',
                    marginBottom: 20,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Subject</span>
                      <p style={{ color: 'var(--primary-light)', fontWeight: 500, marginTop: 4 }}>{generatedEmail.subject}</p>
                    </div>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleCopyToClipboard(generatedEmail.subject)}
                      style={{ flexShrink: 0 }}
                    >
                      📋 Subject
                    </button>
                  </div>

                  {/* Email body */}
                  <div style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 6,
                    padding: '16px 20px',
                    marginBottom: 20,
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.7,
                    fontSize: 14,
                    color: 'var(--text-primary)',
                  }}>
                    {generatedEmail.body}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleCopyToClipboard(generatedEmail.body)}
                    >
                      📋 Copy Body
                    </button>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={handleCopyFullEmail}
                    >
                      {copySuccess ? '✅ Copied!' : '📋 Copy Full Email'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div>
          {templatesLoading ? (
            <div className="spinner-container">
              <div className="spinner" />
            </div>
          ) : templates.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <h3 className="empty-state-title">No templates available</h3>
                <p className="empty-state-text">Email templates will appear here once configured.</p>
              </div>
            </div>
          ) : (
            <div className="grid-3">
              {templates.map((tmpl) => (
                <div key={tmpl.id} className="card animate-fade-in">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <span style={{ fontSize: 28 }}>{getTypeEmoji(tmpl.email_type)}</span>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 600 }}>{tmpl.name}</h4>
                      <span className="text-muted" style={{ fontSize: 12 }}>
                        {getEmailTypeLabel(tmpl.email_type)}
                      </span>
                    </div>
                  </div>
                  <p className="card-text" style={{ marginBottom: 12 }}>
                    <strong>Subject:</strong> {tmpl.subject_template}
                  </p>
                  <p className="card-text" style={{
                    marginBottom: 16,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {tmpl.body_template}
                  </p>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleUseTemplate(tmpl)}
                    style={{ width: '100%' }}
                  >
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div>
          {historyLoading ? (
            <div className="spinner-container">
              <div className="spinner" />
            </div>
          ) : history.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">🕐</div>
                <h3 className="empty-state-title">No email history yet</h3>
                <p className="empty-state-text">Generate your first email to see it appear here.</p>
              </div>
            </div>
          ) : (
            <div>
              {history.map((item) => (
                <div key={item.id} className="card mb-3 animate-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <span style={{ fontSize: 24 }}>{getTypeEmoji(item.email_type)}</span>
                        <div>
                          <h4 style={{ fontSize: 15, fontWeight: 600 }}>{item.subject}</h4>
                          <p style={{ color: 'var(--primary)', fontWeight: 500, fontSize: 13 }}>
                            {getEmailTypeLabel(item.email_type)}
                            {item.company_name && <> &middot; {item.company_name}</>}
                            {item.recipient_name && <> &middot; {item.recipient_name}</>}
                          </p>
                        </div>
                      </div>
                      <p className="card-text" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        marginBottom: 8,
                      }}>
                        {item.body}
                      </p>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                        <span>🕐 {formatDate(item.created_at)}</span>
                        {item.job_title && <span>📋 {item.job_title}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginLeft: 16 }}>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleCopyToClipboard(item.body)}
                        title="Copy body"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EmailGenerator;
