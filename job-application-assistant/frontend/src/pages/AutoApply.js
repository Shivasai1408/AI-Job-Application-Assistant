import React, { useState, useEffect } from 'react';
import { autoApplyAPI } from '../services/api';

function AutoApply() {
  const [portals, setPortals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPortal, setSelectedPortal] = useState(null);
  const [portalFields, setPortalFields] = useState([]);
  const [preparedApp, setPreparedApp] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [result, setResult] = useState(null);
  const [step, setStep] = useState('select'); // select, prepare, review, done
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPortals = async () => {
      try {
        const res = await autoApplyAPI.getPortals();
        setPortals(res.data || []);
      } catch (err) {
        console.error('Error fetching portals:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPortals();
  }, []);

  const handleSelectPortal = async (portal) => {
    setSelectedPortal(portal);
    setStep('prepare');
    try {
      const fieldsRes = await autoApplyAPI.getPortalFields(portal.id);
      setPortalFields(fieldsRes.data?.fields || []);
    } catch (err) {
      setError('Failed to load portal fields');
    }
  };

  const handlePrepare = async () => {
    if (!selectedPortal) return;
    try {
      const res = await autoApplyAPI.prepare({
        portal_id: selectedPortal.id,
        cover_letter: coverLetter,
      });
      setPreparedApp(res.data);
      setStep('review');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to prepare application');
    }
  };

  const handleSubmit = async () => {
    if (!selectedPortal || !preparedApp) return;
    try {
      const res = await autoApplyAPI.submit({
        portal_id: selectedPortal.id,
        job_title: 'Target Position',
        company: 'Target Company',
        application_data: preparedApp,
      });
      setResult(res.data);
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit application');
    }
  };

  const reset = () => {
    setSelectedPortal(null);
    setPortalFields([]);
    setPreparedApp(null);
    setCoverLetter('');
    setResult(null);
    setStep('select');
    setError('');
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
      <div className="mb-6">
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>⚡ Auto-Apply Assistant</h2>
        <p className="text-muted mt-1">
          Quickly prepare and submit applications to popular job portals with auto-filled information
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, alignItems: 'center' }}>
        {['select', 'prepare', 'review', 'done'].map((s, i) => (
          <React.Fragment key={s}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: step === s ? 'var(--primary)' : ['select', 'prepare', 'review', 'done'].indexOf(step) > i ? 'var(--success)' : 'var(--gray-200)',
              color: step === s || ['select', 'prepare', 'review', 'done'].indexOf(step) > i ? 'white' : 'var(--gray-500)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 600,
            }}>
              {['select', 'prepare', 'review', 'done'].indexOf(step) > i ? '✓' : i + 1}
            </div>
            <span className="text-sm" style={{
              fontWeight: step === s ? 600 : 400,
              color: step === s ? 'var(--gray-900)' : 'var(--gray-500)',
            }}>
              {s === 'select' ? 'Select Portal' : s === 'prepare' ? 'Prepare' : s === 'review' ? 'Review' : 'Done'}
            </span>
            {i < 3 && <div style={{ flex: 1, height: 2, background: 'var(--gray-200)', minWidth: 40 }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Select Portal */}
      {step === 'select' && (
        <div>
          <h3 className="font-semibold mb-4">Choose a job portal to apply through:</h3>
          <div className="grid-3">
            {portals.map((portal) => (
              <div key={portal.id} className="card" style={{ cursor: 'pointer', textAlign: 'center' }}
                onClick={() => handleSelectPortal(portal)}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>{portal.icon}</div>
                <h4 style={{ fontSize: 16, fontWeight: 600, color: portal.color }}>{portal.name}</h4>
                <p className="text-sm text-muted mt-2">Auto-fill application for {portal.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Prepare */}
      {step === 'prepare' && selectedPortal && (
        <div className="card">
          <div className="flex-between mb-4">
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>
                {selectedPortal.icon} {selectedPortal.name} Application
              </h3>
              <p className="text-sm text-muted mt-1">
                Review and customize the information before applying
              </p>
            </div>
            <button className="btn btn-sm btn-secondary" onClick={() => setStep('select')}>Change Portal</button>
          </div>

          {/* Auto-fill preview */}
          <div className="alert alert-info mb-4">
            Your profile information will be used to auto-fill fields. Edit any field before proceeding.
          </div>

          {portalFields.map((field, idx) => (
            <div key={idx} className="form-group">
              <label className="form-label">
                {field.name}
                {field.auto_fill && <span className="text-xs text-muted ml-2">(auto-fill)</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea className="form-textarea" rows={3}
                  placeholder={field.name} />
              ) : field.type === 'select' ? (
                <select className="form-select">
                  <option value="">Select...</option>
                  {field.options?.map((opt, oi) => (
                    <option key={oi} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input type={field.type} className="form-input" placeholder={field.name} />
              )}
            </div>
          ))}

          <div className="form-group">
            <label className="form-label">Cover Letter (optional)</label>
            <textarea className="form-textarea" rows={5}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Paste or generate a cover letter for this application..." />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setStep('select')}>Back</button>
            <button className="btn btn-primary" onClick={handlePrepare}>
              🔍 Preview & Review
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 'review' && preparedApp && (
        <div className="card">
          <div className="flex-between mb-4">
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>
                📋 Review Application
              </h3>
              <p className="text-sm text-muted mt-1">
                {preparedApp.portal_name} • {preparedApp.auto_fill_percentage}% auto-filled
              </p>
            </div>
          </div>

          {/* Auto-fill status */}
          <div className="mb-4">
            <div className="flex-between mb-2">
              <span className="text-sm font-semibold">Auto-fill Progress</span>
              <span className="text-sm font-bold" style={{ color: preparedApp.auto_fill_percentage > 70 ? 'var(--success)' : 'var(--warning)' }}>
                {preparedApp.auto_fill_percentage}%
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{
                width: `${preparedApp.auto_fill_percentage}%`,
                background: preparedApp.auto_fill_percentage > 70 ? 'var(--success)' : 'var(--warning)',
              }} />
            </div>
          </div>

          {/* Fields */}
          <h4 className="font-semibold mb-3">Application Fields</h4>
          {preparedApp.fields?.map((field, idx) => (
            <div key={idx} className="flex-between mb-2" style={{
              padding: '8px 12px',
              background: field.auto_filled ? '#f0fdf4' : '#fef3c7',
              borderRadius: 6,
            }}>
              <div>
                <span className="text-sm">{field.field}</span>
                {field.auto_filled && <span className="text-xs text-muted ml-2">✅ Auto-filled</span>}
                {!field.auto_filled && <span className="text-xs ml-2" style={{ color: '#d97706' }}>⚠️ Needs input</span>}
              </div>
              <span className="text-sm text-muted">{field.value || '(empty)'}</span>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
            <button className="btn btn-secondary" onClick={() => setStep('prepare')}>Edit</button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              🚀 Submit Application
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 'done' && result && (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h3 className="modal-title">Application Prepared!</h3>
          <p className="text-muted mb-4">{result.message}</p>

          <div className="card mb-4" style={{ background: '#f0fdf4', border: '1px solid #a7f3d0', textAlign: 'left' }}>
            <h4 className="font-semibold mb-2">✅ Application Summary</h4>
            <div className="flex-between mb-1"><span className="text-sm">Portal:</span><span className="text-sm font-medium">{result.portal}</span></div>
            <div className="flex-between mb-1"><span className="text-sm">Position:</span><span className="text-sm font-medium">{result.job_title}</span></div>
            <div className="flex-between mb-1"><span className="text-sm">Company:</span><span className="text-sm font-medium">{result.company}</span></div>
            <div className="flex-between mb-1"><span className="text-sm">Tracking ID:</span><span className="text-sm font-medium">{result.tracking_id}</span></div>
            <div className="flex-between"><span className="text-sm">Time:</span><span className="text-sm font-medium">{new Date(result.submitted_at).toLocaleString()}</span></div>
          </div>

          <h4 className="font-semibold mb-3">📋 Next Steps</h4>
          <div style={{ textAlign: 'left' }}>
            {result.next_steps?.map((step, i) => (
              <div key={i} className="flex-between mb-2" style={{ padding: '8px 12px', background: 'var(--gray-50)', borderRadius: 6 }}>
                <span className="text-sm">{step}</span>
                <span className="text-sm">{i + 1}</span>
              </div>
            ))}
          </div>

          <button className="btn btn-primary mt-4" onClick={reset}>
            🔄 Start Another Application
          </button>
        </div>
      )}
    </div>
  );
}

export default AutoApply;
