import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumeAPI } from '../services/api';

const TEMPLATES = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean, contemporary design with a professional color accent',
    color: '#4f46e5',
    icon: '🎨',
    preview: {
      header: { bg: '#4f46e5', text: '#ffffff' },
      sections: ['Summary', 'Skills', 'Experience', 'Education', 'Certifications'],
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Traditional ATS-friendly layout optimized for all industries',
    color: '#1f2937',
    icon: '💼',
    preview: {
      header: { bg: '#1f2937', text: '#ffffff' },
      sections: ['Professional Summary', 'Core Competencies', 'Work Experience', 'Education', 'Achievements'],
    },
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Bold design with unique layout for creative roles',
    color: '#ec4899',
    icon: '✨',
    preview: {
      header: { bg: 'linear-gradient(135deg, #ec4899, #8b5cf6)', text: '#ffffff' },
      sections: ['Personal Brand', 'Skills Showcase', 'Featured Work', 'Experience', 'Education'],
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple, clean, and elegant - lets your experience speak',
    color: '#64748b',
    icon: '◻️',
    preview: {
      header: { bg: '#ffffff', text: '#1f2937', border: true },
      sections: ['About', 'Skills', 'Experience', 'Education'],
    },
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Sophisticated design for senior leadership positions',
    color: '#1e3a5f',
    icon: '👔',
    preview: {
      header: { bg: '#1e3a5f', text: '#ffffff' },
      sections: ['Executive Summary', 'Leadership Highlights', 'Career Timeline', 'Board Positions', 'Education'],
    },
  },
  {
    id: 'technical',
    name: 'Technical',
    description: 'Optimized for engineers with skills-focused layout',
    color: '#059669',
    icon: '⚡',
    preview: {
      header: { bg: '#059669', text: '#ffffff' },
      sections: ['Technical Summary', 'Tech Stack', 'Projects', 'Experience', 'Open Source', 'Education'],
    },
  },
];

const SECTION_TEMPLATES = {
  'Summary': 'Results-driven professional with [X] years of experience in [industry/field]. Proven track record of [key achievement]. Skilled in [top 3 skills].',
  'Professional Summary': 'Accomplished [job title] with [X]+ years of progressive experience in [industry]. Demonstrated expertise in [key areas] with a focus on [specific outcome].',
  'Technical Summary': 'Engineer with [X] years of experience building [type of systems]. Proficient in [languages], [frameworks], and [tools]. Passionate about [area].',
  'Executive Summary': 'C-suite executive with [X]+ years of experience driving [industry] transformation. Track record of [specific results] and leading teams of [size].',
  'Skills': '- Technical Skill 1: Proficient\n- Technical Skill 2: Advanced\n- Technical Skill 3: Expert\n- Tool/Platform 1\n- Tool/Platform 2',
  'Tech Stack': 'Languages: Python, JavaScript, TypeScript\nFrameworks: React, Node.js, FastAPI\nCloud: AWS, Docker, Kubernetes\nDatabases: PostgreSQL, MongoDB, Redis',
  'Core Competencies': '• Strategic Planning\n• Team Leadership\n• Project Management\n• Stakeholder Communication\n• Data Analysis\n• Process Optimization',
  'Experience': '## [Job Title] | [Company]\n[Start Date] - [End Date]\n- Key achievement with measurable impact\n- Another significant accomplishment\n- Led initiative that resulted in [outcome]',
};

function ResumeTemplates() {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    sections: {},
  });
  const [generated, setGenerated] = useState(null);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState('browse'); // browse, customize, preview

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    // Initialize sections from template
    const sections = {};
    template.preview.sections.forEach((section) => {
      sections[section] = SECTION_TEMPLATES[section] || '';
    });
    setFormData({ ...formData, sections });
    setStep('customize');
  };

  const handleSectionChange = (section, value) => {
    setFormData({
      ...formData,
      sections: { ...formData.sections, [section]: value },
    });
  };

  const generateResumeContent = () => {
    const { fullName, email, phone, location, sections } = formData;
    let content = `# ${fullName}\n${email} | ${phone} | ${location}\n\n`;

    Object.entries(sections).forEach(([section, text]) => {
      if (text.trim()) {
        content += `## ${section.toUpperCase()}\n${text}\n\n`;
      }
    });

    return content;
  };

  const handlePreview = () => {
    const content = generateResumeContent();
    setGenerated(content);
    setStep('preview');
  };

  const handleSave = async () => {
    if (!generated) return;
    setSaving(true);
    try {
      const title = `${selectedTemplate.name} Resume - ${formData.fullName || 'Untitled'}`;
      await resumeAPI.create(title, generated, true);
      navigate('/resumes');
    } catch (err) {
      console.error('Error saving resume:', err);
    } finally {
      setSaving(false);
    }
  };

  const renderPreview = (content) => {
    // Simple markdown-like rendering to HTML
    const html = content
      .split('\n')
      .map((line) => {
        if (line.startsWith('# ')) return `<h1 style="font-size:24px;font-weight:700;margin-bottom:4px;">${line.slice(2)}</h1>`;
        if (line.startsWith('## ')) return `<h2 style="font-size:16px;font-weight:600;margin-top:16px;margin-bottom:8px;color:${selectedTemplate?.color || '#4f46e5'};">${line.slice(3)}</h2>`;
        if (line.startsWith('- ')) return `<li style="margin-left:16px;font-size:13px;line-height:1.6;">${line.slice(2)}</li>`;
        if (line.startsWith('•')) return `<li style="margin-left:16px;font-size:13px;line-height:1.6;">${line.slice(1)}</li>`;
        if (line.trim() === '') return '<br/>';
        return `<p style="font-size:13px;line-height:1.6;margin:2px 0;">${line}</p>`;
      })
      .join('\n');
    return html;
  };

  return (
    <div>
      <div className="mb-6">
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>📄 Resume Builder with Templates</h2>
        <p className="text-muted mt-1">
          Choose from professional templates and build your resume with AI-powered suggestions
        </p>
      </div>

      {/* Step: Browse Templates */}
      {step === 'browse' && (
        <>
          <p className="font-semibold mb-4">Choose a template to get started:</p>
          <div className="grid-3">
            {TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="card"
                style={{
                  cursor: 'pointer',
                  border: selectedTemplate?.id === template.id ? `2px solid ${template.color}` : '1px solid var(--gray-200)',
                  transition: 'all 0.2s',
                }}
                onClick={() => handleSelectTemplate(template)}
              >
                {/* Template header preview */}
                <div style={{
                  height: 60,
                  borderRadius: 'var(--radius) var(--radius) 0 0',
                  background: template.preview.header.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: template.preview.header.text,
                  fontSize: 18,
                  fontWeight: 700,
                  margin: -24,
                  marginBottom: 16,
                  borderBottom: template.preview.header.border ? '2px solid #1f2937' : 'none',
                }}>
                  {template.icon} {template.name}
                </div>

                <div className="mb-3">
                  <h4 style={{ fontSize: 16, fontWeight: 600 }}>{template.name}</h4>
                  <p className="text-sm text-muted mt-1">{template.description}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold mb-2">Sections:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {template.preview.sections.map((section) => (
                      <span key={section} className="tag tag-primary" style={{ fontSize: 11 }}>{section}</span>
                    ))}
                  </div>
                </div>

                <button className="btn btn-sm btn-primary mt-3" style={{ width: '100%', justifyContent: 'center' }}>
                  Use This Template
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Step: Customize */}
      {step === 'customize' && selectedTemplate && (
        <div className="detail-layout">
          <div className="card">
            <div className="flex-between mb-4">
              <h3 className="card-title" style={{ margin: 0 }}>
                {selectedTemplate.icon} {selectedTemplate.name} Template
              </h3>
              <button className="btn btn-sm btn-secondary" onClick={() => setStep('browse')}>
                Change Template
              </button>
            </div>

            {/* Personal Info */}
            <div className="grid-2" style={{ gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="John Doe" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input type="tel" className="form-input" value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567" />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input type="text" className="form-input" value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="San Francisco, CA" />
              </div>
            </div>

            <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid var(--gray-200)' }} />

            {/* Sections */}
            {Object.entries(formData.sections).map(([section, content]) => (
              <div key={section} className="form-group">
                <div className="flex-between mb-1">
                  <label className="form-label" style={{ margin: 0 }}>{section}</label>
                  <span className="text-xs text-muted">{content ? `${content.split('\n').length} lines` : 'empty'}</span>
                </div>
                <textarea
                  className="form-textarea"
                  rows={section === 'Experience' || section === 'Career Timeline' ? 8 : 4}
                  value={content}
                  onChange={(e) => handleSectionChange(section, e.target.value)}
                  placeholder={`Enter your ${section.toLowerCase()}...`}
                  style={{ fontFamily: 'monospace', fontSize: 13 }}
                />
              </div>
            ))}

            <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}
              onClick={handlePreview}>
              👁️ Preview Resume
            </button>
          </div>

          {/* Tips sidebar */}
          <div className="card">
            <h4 className="font-semibold mb-3">💡 Tips for a Great Resume</h4>
            <ul style={{ paddingLeft: 20, lineHeight: 2.2, fontSize: 13 }}>
              <li>Use action verbs (led, developed, implemented)</li>
              <li>Quantify achievements with numbers</li>
              <li>Keep to 1-2 pages maximum</li>
              <li>Tailor content to each job application</li>
              <li>Include relevant keywords from job description</li>
              <li>Proofread for errors and consistency</li>
              <li>Use consistent date formatting</li>
              <li>Highlight impact, not just responsibilities</li>
            </ul>

            <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid var(--gray-200)' }} />

            <h4 className="font-semibold mb-3">📋 {selectedTemplate.name} Sections</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedTemplate.preview.sections.map((section, i) => (
                <div key={section} className="flex-between" style={{
                  padding: '6px 10px', background: 'var(--gray-50)', borderRadius: 6,
                }}>
                  <span className="text-sm">{i + 1}. {section}</span>
                  <span className="text-xs" style={{ color: formData.sections[section]?.trim() ? 'var(--success)' : 'var(--gray-400)' }}>
                    {formData.sections[section]?.trim() ? '✓' : 'empty'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && generated && selectedTemplate && (
        <div className="card">
          <div className="flex-between mb-4">
            <h3 className="card-title" style={{ margin: 0 }}>
              👁️ Resume Preview - {selectedTemplate.name}
            </h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm btn-secondary" onClick={() => setStep('customize')}>
                ✏️ Edit
              </button>
              <button className="btn btn-sm btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : '💾 Save Resume'}
              </button>
            </div>
          </div>

          {/* Styled preview */}
          <div style={{
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            maxHeight: 700,
            overflowY: 'auto',
          }}>
            {/* Header */}
            <div style={{
              background: selectedTemplate.preview.header.bg,
              color: selectedTemplate.preview.header.text,
              padding: '32px 40px',
              textAlign: 'center',
              borderBottom: selectedTemplate.preview.header.border ? '2px solid #1f2937' : 'none',
            }}>
              <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{formData.fullName || 'Your Name'}</h2>
              <p style={{ fontSize: 14, opacity: 0.85 }}>
                {[formData.email, formData.phone, formData.location].filter(Boolean).join(' | ') || 'email@example.com | (555) 123-4567 | Location'}
              </p>
            </div>

            {/* Content */}
            <div style={{ padding: '24px 40px' }}>
              {Object.entries(formData.sections).map(([section, content]) => (
                content.trim() && (
                  <div key={section} className="mb-4" dangerouslySetInnerHTML={{
                    __html: renderPreview(`## ${section}\n${content}`),
                  }} />
                )
              ))}
            </div>
          </div>

          {/* Raw content */}
          <details className="mt-4">
            <summary className="font-semibold text-sm" style={{ cursor: 'pointer' }}>
              📝 View Raw Content
            </summary>
            <pre style={{
              background: 'var(--gray-50)',
              padding: 16,
              borderRadius: 'var(--radius)',
              fontSize: 12,
              marginTop: 8,
              overflow: 'auto',
              maxHeight: 300,
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
            }}>
              {generated}
            </pre>
            <button className="btn btn-sm btn-secondary mt-2"
              onClick={() => navigator.clipboard.writeText(generated)}>
              📋 Copy to Clipboard
            </button>
          </details>
        </div>
      )}
    </div>
  );
}

export default ResumeTemplates;
