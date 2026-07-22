import React, { useState, useEffect, useRef } from 'react';
import { portfolioAPI } from '../services/api';

const THEMES = [
  { id: 'modern', label: 'Modern', icon: '🎨', desc: 'Clean teal & blue gradient theme' },
  { id: 'classic', label: 'Classic', icon: '🏛️', desc: 'Traditional navy & burgundy palette' },
  { id: 'minimalist', label: 'Minimalist', icon: '⚪', desc: 'Monochrome, clean & simple' },
  { id: 'creative', label: 'Creative', icon: '✨', desc: 'Bold purple & pink accents' },
];

const SECTION_OPTIONS = [
  { id: 'about', label: 'About Me', icon: '👤' },
  { id: 'experience', label: 'Experience', icon: '💼' },
  { id: 'education', label: 'Education', icon: '🎓' },
  { id: 'skills', label: 'Skills', icon: '🔧' },
  { id: 'projects', label: 'Projects', icon: '📁' },
  { id: 'certifications', label: 'Certifications', icon: '📜' },
  { id: 'github', label: 'GitHub', icon: '🐙' },
  { id: 'linkedin', label: 'LinkedIn', icon: '🔗' },
  { id: 'contact', label: 'Contact', icon: '📧' },
];

function PortfolioBuilder() {
  const [view, setView] = useState('builder'); // 'builder' | 'preview'
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const iframeRef = useRef(null);

  const [portfolio, setPortfolio] = useState(null);
  const [theme, setTheme] = useState('modern');
  const [customCss, setCustomCss] = useState('');
  const [selectedSections, setSelectedSections] = useState(
    SECTION_OPTIONS.map((s) => s.id)
  );
  const [sectionOrder, setSectionOrder] = useState(
    SECTION_OPTIONS.map((s) => s.id)
  );
  const [previewHtml, setPreviewHtml] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  const fetchPortfolio = async () => {
    try {
      const res = await portfolioAPI.get();
      const data = res.data;
      setPortfolio(data);
      setTheme(data.theme || 'modern');
      setCustomCss(data.custom_css || '');
      setIsPublished(data.is_published || false);

      if (data.sections) {
        try {
          const parsed = JSON.parse(data.sections);
          setSelectedSections(parsed);
        } catch {
          setSelectedSections(SECTION_OPTIONS.map((s) => s.id));
        }
      }

      if (data.section_order) {
        try {
          const parsed = JSON.parse(data.section_order);
          setSectionOrder(parsed);
        } catch {
          setSectionOrder(SECTION_OPTIONS.map((s) => s.id));
        }
      }

      if (data.generated_html) {
        setPreviewHtml(data.generated_html);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error('Error fetching portfolio:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  useEffect(() => {
    if (view === 'preview' && previewHtml && iframeRef.current) {
      const iframe = iframeRef.current;
      iframe.srcdoc = previewHtml;
    }
  }, [view, previewHtml]);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleToggleSection = (sectionId) => {
    setSelectedSections((prev) => {
      if (prev.includes(sectionId)) {
        return prev.filter((s) => s !== sectionId);
      }
      return [...prev, sectionId];
    });
  };

  const moveSection = (index, direction) => {
    const newOrder = [...sectionOrder];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    setSectionOrder(newOrder);
  };

  const handleGenerate = async () => {
    clearMessages();
    setGenerating(true);
    try {
      const ordered = sectionOrder.filter((s) => selectedSections.includes(s));
      const res = await portfolioAPI.generate({
        theme,
        custom_css: customCss || null,
        sections: ordered,
        section_order: ordered,
      });
      setPreviewHtml(res.data.html);
      setPortfolio((prev) => ({ ...prev, id: res.data.portfolio_id }));
      setSuccess('Portfolio generated successfully! Switch to Preview to see it.');
      setView('preview');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate portfolio');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    clearMessages();
    try {
      const ordered = sectionOrder.filter((s) => selectedSections.includes(s));
      await portfolioAPI.update({
        theme,
        custom_css: customCss || null,
        sections: ordered,
        section_order: ordered,
      });
      setSuccess('Portfolio customizations saved!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save portfolio');
    }
  };

  const handlePublishToggle = async () => {
    clearMessages();
    setPublishing(true);
    try {
      // Toggle publish status via update
      await portfolioAPI.update({ is_published: !isPublished });
      setIsPublished(!isPublished);
      setSuccess(isPublished ? 'Portfolio unpublished.' : 'Portfolio published!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update publish status');
    } finally {
      setPublishing(false);
    }
  };

  const getThemePreviewStyle = (themeId) => {
    const styles = {
      modern: { primary: '#0d9488', secondary: '#0891b2' },
      classic: { primary: '#1a365d', secondary: '#c53030' },
      minimalist: { primary: '#000000', secondary: '#4a5568' },
      creative: { primary: '#6b46c1', secondary: '#d53f8c' },
    };
    return styles[themeId] || styles.modern;
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
      {/* Header */}
      <div className="flex-between mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>🖥️ Portfolio Builder</h2>
          <p className="text-muted mt-1">Create and customize your personal portfolio website</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn ${view === 'builder' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView('builder')}
          >
            🛠️ Builder
          </button>
          <button
            className={`btn ${view === 'preview' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView('preview')}
            disabled={!previewHtml}
          >
            👁️ Preview
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-4">
          <span className="alert-icon">⚠️</span>
          <span className="alert-content">{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-4">
          <span className="alert-icon">✅</span>
          <span className="alert-content">{success}</span>
        </div>
      )}

      {/* Builder View */}
      {view === 'builder' && (
        <div className="detail-layout">
          {/* Main Builder Area */}
          <div className="detail-main">
            {/* Theme Selection */}
            <div className="card mb-4">
              <div className="card-header">
                <h3>🎨 Choose Theme</h3>
              </div>
              <div className="grid-2">
                {THEMES.map((t) => (
                  <div
                    key={t.id}
                    className={`card-glass pointer`}
                    style={{
                      padding: 20,
                      border: theme === t.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => setTheme(t.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          background: `linear-gradient(135deg, ${getThemePreviewStyle(t.id).primary}, ${getThemePreviewStyle(t.id).secondary})`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 20,
                        }}
                      >
                        {t.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{t.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.desc}</div>
                      </div>
                    </div>
                    {theme === t.id && (
                      <div
                        className="badge badge-gradient"
                        style={{ fontSize: 11 }}
                      >
                        ✓ Selected
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Sections Configuration */}
            <div className="card mb-4">
              <div className="card-header">
                <h3>📋 Sections</h3>
              </div>
              <p className="text-muted text-sm mb-4">
                Check sections to include, drag to reorder.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sectionOrder.map((sectionId, index) => {
                  const section = SECTION_OPTIONS.find((s) => s.id === sectionId);
                  if (!section) return null;
                  const isChecked = selectedSections.includes(sectionId);
                  return (
                    <div
                      key={sectionId}
                      className="card-glass"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 16px',
                        opacity: isChecked ? 1 : 0.5,
                        transition: 'opacity 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <button
                          className="btn-icon btn-icon-sm"
                          style={{ fontSize: 10, width: 24, height: 20 }}
                          onClick={() => moveSection(index, -1)}
                          disabled={index === 0}
                          title="Move up"
                        >
                          ▲
                        </button>
                        <button
                          className="btn-icon btn-icon-sm"
                          style={{ fontSize: 10, width: 24, height: 20 }}
                          onClick={() => moveSection(index, 1)}
                          disabled={index === sectionOrder.length - 1}
                          title="Move down"
                        >
                          ▼
                        </button>
                      </div>
                      <label className="form-checkbox" style={{ flex: 1, margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSection(sectionId)}
                        />
                        <span style={{ fontSize: 15 }}>
                          {section.icon} {section.label}
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom CSS */}
            <div className="card mb-4">
              <div className="card-header">
                <h3>🎨 Custom CSS</h3>
              </div>
              <p className="text-muted text-sm mb-3">
                Add your own CSS to override portfolio styles (optional).
              </p>
              <textarea
                className="form-textarea"
                rows={8}
                value={customCss}
                onChange={(e) => setCustomCss(e.target.value)}
                placeholder="/* Add custom CSS here */
body {
  /* your custom styles */
}
.my-section {
  background: #f0f0f0;
}"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleGenerate}
                disabled={generating}
                style={{ flex: 1, minWidth: 200 }}
              >
                {generating ? (
                  <>
                    <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
                    Generating...
                  </>
                ) : (
                  '⚡ Generate Portfolio'
                )}
              </button>
              <button
                className="btn btn-secondary btn-lg"
                onClick={handleSave}
              >
                💾 Save Customizations
              </button>
            </div>
          </div>

          {/* Sidebar - Publish Info */}
          <div className="detail-sidebar">
            <div className="card mb-4">
              <div className="card-header">
                <h3>📡 Publish</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: isPublished
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'rgba(239, 68, 68, 0.1)',
                    borderRadius: 8,
                    border: `1px solid ${
                      isPublished
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(239, 68, 68, 0.2)'
                    }`,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {isPublished ? '🌐 Published' : '🔒 Not Published'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {isPublished
                        ? 'Your portfolio is live'
                        : 'Only you can see it'}
                    </div>
                  </div>
                  <button
                    className={`btn btn-sm ${isPublished ? 'btn-danger' : 'btn-success'}`}
                    onClick={handlePublishToggle}
                    disabled={publishing || !previewHtml}
                  >
                    {publishing
                      ? '...'
                      : isPublished
                      ? 'Unpublish'
                      : 'Publish'}
                  </button>
                </div>

                {isPublished && (
                  <div className="alert alert-info" style={{ margin: 0 }}>
                    <span className="alert-icon">🔗</span>
                    <div className="alert-content">
                      <div className="alert-title">Your portfolio is live!</div>
                      Share the link with recruiters and employers.
                    </div>
                  </div>
                )}

                {!previewHtml && (
                  <div className="alert alert-warning" style={{ margin: 0 }}>
                    <span className="alert-icon">💡</span>
                    <div className="alert-content">
                      Generate your portfolio first before publishing.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3>💡 Tips</h3>
              </div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                <li>🎯 Choose a theme that matches your industry</li>
                <li>📝 Select sections relevant to your experience</li>
                <li>🔢 Reorder sections to highlight your strengths</li>
                <li>🎨 Use custom CSS for a unique personal touch</li>
                <li>🌐 Publish when ready to share with employers</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Preview View */}
      {view === 'preview' && (
        <div>
          {/* Preview Toolbar */}
          <div
            className="card-glass mb-4"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 20px',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>👁️</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Portfolio Preview</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Theme: <span className="badge badge-primary" style={{ fontSize: 10 }}>{theme}</span>
                  {isPublished && <span className="badge badge-success" style={{ fontSize: 10, marginLeft: 6 }}>Published</span>}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setView('builder')}
              >
                ← Back to Builder
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? 'Regenerating...' : '🔄 Regenerate'}
              </button>
            </div>
          </div>

          {/* Iframe Preview */}
          <div
            className="card"
            style={{
              padding: 0,
              overflow: 'hidden',
              background: 'white',
              minHeight: 500,
            }}
          >
            {previewHtml ? (
              <iframe
                ref={iframeRef}
                title="Portfolio Preview"
                style={{
                  width: '100%',
                  height: '80vh',
                  border: 'none',
                  display: 'block',
                }}
                sandbox="allow-scripts"
                srcDoc={previewHtml}
              />
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🖥️</div>
                <h3>No portfolio generated yet</h3>
                <p>Switch to Builder view, customize your preferences, and generate your portfolio.</p>
                <button className="btn btn-primary" onClick={() => setView('builder')}>
                  Go to Builder
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PortfolioBuilder;
