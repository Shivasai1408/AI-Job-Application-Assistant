const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../auth');

router.use(authMiddleware);

// GET /api/applications/stats
router.get('/stats', (req, res) => {
    try {
        const apps = db.prepare('SELECT * FROM applications WHERE user_id = ?').all(req.user.id);
        res.json({
            total: apps.length,
            draft: apps.filter(a => a.status === 'draft').length,
            applied: apps.filter(a => a.status === 'applied').length,
            interview: apps.filter(a => a.status === 'interview').length,
            offer: apps.filter(a => a.status === 'offer').length,
            rejected: apps.filter(a => a.status === 'rejected').length,
            accepted: apps.filter(a => a.status === 'accepted').length
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/applications
router.post('/', (req, res) => {
    try {
        const { job_id, status, notes } = req.body;
        const now = new Date().toISOString();
        const result = db.prepare(
            'INSERT INTO applications (user_id, job_id, status, notes, created_at) VALUES (?, ?, ?, ?, ?)'
        ).run(req.user.id, job_id || null, status || 'draft', notes || null, now);

        res.status(201).json({
            message: 'Application created',
            application: { id: result.lastInsertRowid, user_id: req.user.id, job_id, status: status || 'draft', created_at: now }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/applications
router.get('/', (req, res) => {
    try {
        const applications = db.prepare('SELECT * FROM applications WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
        res.json(applications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/applications/:id
router.get('/:id', (req, res) => {
    try {
        const application = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
        if (!application) return res.status(404).json({ error: 'Application not found' });
        res.json(application);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/applications/:id
router.put('/:id', (req, res) => {
    try {
        const { status, notes, interview_date, follow_up_date } = req.body;
        const application = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
        if (!application) return res.status(404).json({ error: 'Application not found' });

        db.prepare(
            'UPDATE applications SET status = COALESCE(?, status), notes = COALESCE(?, notes), interview_date = COALESCE(?, interview_date), follow_up_date = COALESCE(?, follow_up_date) WHERE id = ? AND user_id = ?'
        ).run(status || null, notes || null, interview_date || null, follow_up_date || null, req.params.id, req.user.id);

        const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
        res.json({ message: 'Application updated', application: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/applications/:id
router.delete('/:id', (req, res) => {
    try {
        const result = db.prepare('DELETE FROM applications WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
        if (result.changes === 0) return res.status(404).json({ error: 'Application not found' });
        res.json({ message: 'Application deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/applications/:id/cover-letter
router.post('/:id/cover-letter', (req, res) => {
    try {
        const application = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
        if (!application) return res.status(404).json({ error: 'Application not found' });

        const { content, tone } = req.body;
        const now = new Date().toISOString();
        const result = db.prepare(
            'INSERT INTO cover_letters (user_id, job_id, content, tone, created_at) VALUES (?, ?, ?, ?, ?)'
        ).run(req.user.id, application.job_id, content || 'Cover letter content...', tone || 'professional', now);

        res.status(201).json({
            message: 'Cover letter created',
            cover_letter: { id: result.lastInsertRowid, content: content || 'Cover letter content...', tone: tone || 'professional', created_at: now }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/applications/cover-letters/list
router.get('/cover-letters/list', (req, res) => {
    try {
        const letters = db.prepare('SELECT * FROM cover_letters WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
        res.json(letters);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
