const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../auth');

router.use(authMiddleware);

// POST /api/alerts
router.post('/', (req, res) => {
    try {
        const { name, keywords, location, job_type, experience_level, salary_min, industry, frequency } = req.body;
        if (!name || !keywords) return res.status(400).json({ error: 'Name and keywords are required' });

        const now = new Date().toISOString();
        const result = db.prepare(
            'INSERT INTO job_alerts (user_id, name, keywords, location, job_type, experience_level, salary_min, industry, frequency, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(req.user.id, name, keywords, location || null, job_type || null, experience_level || null, salary_min || null, industry || null, frequency || 'daily', now);

        res.status(201).json({
            message: 'Job alert created',
            alert: { id: result.lastInsertRowid, name, keywords, frequency: frequency || 'daily', is_active: 1, created_at: now }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/alerts
router.get('/', (req, res) => {
    try {
        const alerts = db.prepare('SELECT * FROM job_alerts WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
        res.json(alerts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/alerts/:id
router.put('/:id', (req, res) => {
    try {
        const existing = db.prepare('SELECT * FROM job_alerts WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
        if (!existing) return res.status(404).json({ error: 'Alert not found' });

        const { name, keywords, location, job_type, experience_level, salary_min, industry, frequency, is_active } = req.body;
        db.prepare(
            'UPDATE job_alerts SET name = COALESCE(?, name), keywords = COALESCE(?, keywords), location = COALESCE(?, location), job_type = COALESCE(?, job_type), experience_level = COALESCE(?, experience_level), salary_min = COALESCE(?, salary_min), industry = COALESCE(?, industry), frequency = COALESCE(?, frequency), is_active = COALESCE(?, is_active) WHERE id = ? AND user_id = ?'
        ).run(name || null, keywords || null, location || null, job_type || null, experience_level || null, salary_min || null, industry || null, frequency || null, is_active !== undefined ? (is_active ? 1 : 0) : null, req.params.id, req.user.id);

        const updated = db.prepare('SELECT * FROM job_alerts WHERE id = ?').get(req.params.id);
        res.json({ message: 'Alert updated', alert: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/alerts/:id
router.delete('/:id', (req, res) => {
    try {
        const result = db.prepare('DELETE FROM job_alerts WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
        if (result.changes === 0) return res.status(404).json({ error: 'Alert not found' });
        res.json({ message: 'Alert deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/alerts/trigger
router.post('/trigger', (req, res) => {
    try {
        const alerts = db.prepare('SELECT * FROM job_alerts WHERE user_id = ? AND is_active = 1').all(req.user.id);
        const now = new Date().toISOString();

        for (const alert of alerts) {
            db.prepare('UPDATE job_alerts SET last_triggered = ? WHERE id = ?').run(now, alert.id);
            db.prepare(
                'INSERT INTO notifications (user_id, title, message, notification_type, reference_type, reference_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
            ).run(req.user.id, `New jobs for: ${alert.name}`, `Found new job matches for "${alert.keywords}"`, 'job_alert', 'job_alert', alert.id, now);
        }

        res.json({ message: `Triggered ${alerts.length} alerts`, alerts_triggered: alerts.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/alerts/notifications
router.get('/notifications', (req, res) => {
    try {
        const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/alerts/notifications/:id/read
router.put('/notifications/:id/read', (req, res) => {
    try {
        db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
        res.json({ message: 'Notification marked as read' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/alerts/notifications/read-all
router.put('/notifications/read-all', (req, res) => {
    try {
        db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/alerts/notifications/unread-count
router.get('/notifications/unread-count', (req, res) => {
    try {
        const row = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id);
        res.json({ unread_count: row.count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
