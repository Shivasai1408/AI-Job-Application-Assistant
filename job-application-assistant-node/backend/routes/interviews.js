const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../auth');

router.use(authMiddleware);

// POST /api/interviews
router.post('/', (req, res) => {
    try {
        const { application_id, company, position, interview_date, duration_minutes, interview_type, location, notes, prep_notes } = req.body;
        if (!company || !position || !interview_date) {
            return res.status(400).json({ error: 'Company, position, and interview date are required' });
        }

        const now = new Date().toISOString();
        const result = db.prepare(
            'INSERT INTO interviews (application_id, user_id, company, position, interview_date, duration_minutes, interview_type, location, notes, prep_notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(application_id || null, req.user.id, company, position, interview_date, duration_minutes || 60, interview_type || 'phone', location || null, notes || null, prep_notes || null, now);

        res.status(201).json({
            message: 'Interview scheduled',
            interview: { id: result.lastInsertRowid, company, position, interview_date, status: 'scheduled', created_at: now }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/interviews
router.get('/', (req, res) => {
    try {
        const interviews = db.prepare('SELECT * FROM interviews WHERE user_id = ? ORDER BY interview_date DESC').all(req.user.id);
        res.json(interviews);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/interviews/upcoming
router.get('/upcoming', (req, res) => {
    try {
        const now = new Date().toISOString();
        const interviews = db.prepare(
            'SELECT * FROM interviews WHERE user_id = ? AND interview_date > ? AND status = ? ORDER BY interview_date ASC'
        ).all(req.user.id, now, 'scheduled');
        res.json(interviews);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/interviews/:id
router.get('/:id', (req, res) => {
    try {
        const interview = db.prepare('SELECT * FROM interviews WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
        if (!interview) return res.status(404).json({ error: 'Interview not found' });
        res.json(interview);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/interviews/:id
router.put('/:id', (req, res) => {
    try {
        const existing = db.prepare('SELECT * FROM interviews WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
        if (!existing) return res.status(404).json({ error: 'Interview not found' });

        const { interview_date, duration_minutes, interview_type, status, location, notes, prep_notes } = req.body;
        db.prepare(
            'UPDATE interviews SET interview_date = COALESCE(?, interview_date), duration_minutes = COALESCE(?, duration_minutes), interview_type = COALESCE(?, interview_type), status = COALESCE(?, status), location = COALESCE(?, location), notes = COALESCE(?, notes), prep_notes = COALESCE(?, prep_notes) WHERE id = ? AND user_id = ?'
        ).run(interview_date || null, duration_minutes || null, interview_type || null, status || null, location || null, notes || null, prep_notes || null, req.params.id, req.user.id);

        const updated = db.prepare('SELECT * FROM interviews WHERE id = ?').get(req.params.id);
        res.json({ message: 'Interview updated', interview: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/interviews/:id/complete
router.post('/:id/complete', (req, res) => {
    try {
        const existing = db.prepare('SELECT * FROM interviews WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
        if (!existing) return res.status(404).json({ error: 'Interview not found' });

        const { rating, feedback_notes, questions_asked, next_steps } = req.body;
        const now = new Date().toISOString();

        db.prepare('UPDATE interviews SET status = ? WHERE id = ?').run('completed', req.params.id);

        db.prepare(
            'INSERT INTO interview_feedback (interview_id, user_id, rating, feedback_notes, questions_asked, next_steps, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(req.params.id, req.user.id, rating || null, feedback_notes || null, questions_asked || null, next_steps || null, now);

        res.json({ message: 'Interview completed and feedback saved' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/interviews/:id
router.delete('/:id', (req, res) => {
    try {
        const result = db.prepare('DELETE FROM interviews WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
        if (result.changes === 0) return res.status(404).json({ error: 'Interview not found' });
        res.json({ message: 'Interview deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
