import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewsAPI, applicationsAPI } from '../services/api';

function InterviewScheduler() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [applications, setApplications] = useState([]);
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    application_id: '',
    company: '',
    position: '',
    interview_date: '',
    interview_time: '',
    duration_minutes: 60,
    interview_type: 'video',
    location: '',
    notes: '',
  });

  const [feedbackData, setFeedbackData] = useState({
    rating: 5,
    feedback_notes: '',
    questions_asked: '',
    next_steps: '',
  });

  const fetchInterviews = async () => {
    try {
      const res = await interviewsAPI.list();
      setInterviews(res.data || []);
    } catch (err) {
      console.error('Error fetching interviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const openSchedule = async () => {
    try {
      const appsRes = await applicationsAPI.list();
      setApplications(appsRes.data || []);
      setShowSchedule(true);
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const interviewDate = new Date(`${formData.interview_date}T${formData.interview_time || '09:00'}`);
      await interviewsAPI.create({
        application_id: parseInt(formData.application_id),
        company: formData.company,
        position: formData.position,
        interview_date: interviewDate.toISOString(),
        duration_minutes: formData.duration_minutes,
        interview_type: formData.interview_type,
        location: formData.location,
        notes: formData.notes,
      });
      setShowSchedule(false);
      setFormData({
        application_id: '', company: '', position: '', interview_date: '',
        interview_time: '', duration_minutes: 60, interview_type: 'video', location: '', notes: '',
      });
      fetchInterviews();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to schedule interview');
    }
  };

  const handleComplete = async (interviewId) => {
    try {
      await interviewsAPI.complete(interviewId, feedbackData);
      setFeedbackModal(null);
      fetchInterviews();
    } catch (err) {
      setError('Failed to save feedback');
    }
  };

  const getTypeIcon = (type) => {
    const icons = { video: '📹', phone: '📞', 'in-person': '🏢' };
    return icons[type] || '📅';
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: '#2563eb',
      completed: '#059669',
      cancelled: '#dc2626',
      rescheduled: '#d97706',
    };
    return colors[status] || '#6b7280';
  };

  const groupByDate = (interviews) => {
    const groups = {};
    interviews.forEach((inv) => {
      const date = new Date(inv.interview_date).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(inv);
    });
    return groups;
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
      <div className="flex-between mb-6">
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>📅 Interview Scheduler</h2>
          <p className="text-muted mt-1">Schedule, track, and manage your job interviews</p>
        </div>
        <button className="btn btn-primary" onClick={openSchedule}>
          ➕ Schedule Interview
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Schedule Modal */}
      {showSchedule && (
        <div className="modal-overlay" onClick={() => setShowSchedule(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <h3 className="modal-title">Schedule Interview</h3>
            <form onSubmit={handleSchedule}>
              <div className="form-group">
                <label className="form-label">Application</label>
                <select
                  className="form-select"
                  value={formData.application_id}
                  onChange={(e) => {
                    const app = applications.find((a) => a.id === parseInt(e.target.value));
                    setFormData({
                      ...formData,
                      application_id: e.target.value,
                      company: app?.job?.company || '',
                      position: app?.job?.title || '',
                    });
                  }}
                  required
                >
                  <option value="">Select an application...</option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.job?.title || 'Unknown'} at {app.job?.company || 'Unknown'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid-2" style={{ gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Company *</label>
                  <input type="text" className="form-input" value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Position *</label>
                  <input type="text" className="form-input" value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input type="date" className="form-input" value={formData.interview_date}
                    onChange={(e) => setFormData({ ...formData, interview_date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input type="time" className="form-input" value={formData.interview_time}
                    onChange={(e) => setFormData({ ...formData, interview_time: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (min)</label>
                  <select className="form-select" value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-select" value={formData.interview_type}
                    onChange={(e) => setFormData({ ...formData, interview_type: e.target.value })}>
                    <option value="video">📹 Video Call</option>
                    <option value="phone">📞 Phone Call</option>
                    <option value="in-person">🏢 In-Person</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Location / Link</label>
                <input type="text" className="form-input" value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Video meeting link or office address" />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" rows={3} value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Preparation notes, contact person, etc." />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSchedule(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule Interview</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interview List */}
      {interviews.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <h3 className="empty-state-title">No interviews scheduled</h3>
            <p className="empty-state-text">Schedule your first interview to start tracking.</p>
            <button className="btn btn-primary" onClick={openSchedule}>Schedule Interview</button>
          </div>
        </div>
      ) : (
        Object.entries(groupByDate(interviews)).map(([date, dayInterviews]) => (
          <div key={date} className="mb-4">
            <h3 className="font-semibold mb-3" style={{ color: 'var(--gray-600)' }}>{date}</h3>
            {dayInterviews.map((inv) => (
              <div key={inv.id} className="card mb-3 fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <span style={{ fontSize: 24 }}>{getTypeIcon(inv.interview_type)}</span>
                      <div>
                        <h4 style={{ fontSize: 16, fontWeight: 600 }}>{inv.position}</h4>
                        <p style={{ color: 'var(--primary)', fontWeight: 500 }}>{inv.company}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: 'var(--gray-500)' }}>
                      <span>🕐 {new Date(inv.interview_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({inv.duration_minutes} min)</span>
                      <span>{getTypeIcon(inv.interview_type)} {inv.interview_type}</span>
                      {inv.location && <span>📍 {inv.location}</span>}
                      {inv.job_title && <span>📋 {inv.job_title}</span>}
                    </div>
                    {inv.notes && (
                      <p className="text-sm mt-2" style={{ color: 'var(--gray-500)' }}>📝 {inv.notes}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                    <span className="status-badge" style={{
                      background: `${getStatusColor(inv.status)}20`,
                      color: getStatusColor(inv.status),
                    }}>
                      {inv.status}
                    </span>
                    {inv.status === 'scheduled' && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-sm btn-success"
                          onClick={() => setFeedbackModal(inv)}>✅ Complete</button>
                        <button className="btn btn-sm btn-danger"
                          onClick={async () => {
                            await interviewsAPI.update(inv.id, { status: 'cancelled' });
                            fetchInterviews();
                          }}>Cancel</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))
      )}

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="modal-overlay" onClick={() => setFeedbackModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <h3 className="modal-title">Interview Feedback - {feedbackModal.position}</h3>
            <p className="text-muted mb-4">at {feedbackModal.company}</p>

            <div className="form-group">
              <label className="form-label">Rating</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button"
                    style={{
                      fontSize: 28, background: 'none', border: 'none', cursor: 'pointer',
                      opacity: feedbackData.rating >= star ? 1 : 0.2,
                    }}
                    onClick={() => setFeedbackData({ ...feedbackData, rating: star })}>
                    ⭐
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">How did it go?</label>
              <textarea className="form-textarea" rows={3} value={feedbackData.feedback_notes}
                onChange={(e) => setFeedbackData({ ...feedbackData, feedback_notes: e.target.value })}
                placeholder="Share your thoughts about the interview..." />
            </div>
            <div className="form-group">
              <label className="form-label">Questions Asked</label>
              <textarea className="form-textarea" rows={3} value={feedbackData.questions_asked}
                onChange={(e) => setFeedbackData({ ...feedbackData, questions_asked: e.target.value })}
                placeholder="What questions were you asked?" />
            </div>
            <div className="form-group">
              <label className="form-label">Next Steps</label>
              <textarea className="form-textarea" rows={2} value={feedbackData.next_steps}
                onChange={(e) => setFeedbackData({ ...feedbackData, next_steps: e.target.value })}
                placeholder="Any next steps mentioned?" />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setFeedbackModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleComplete(feedbackModal.id)}>
                Save Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InterviewScheduler;
