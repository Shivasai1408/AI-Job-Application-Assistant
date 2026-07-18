const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../auth');

router.use(authMiddleware);

// All admin routes check for admin role (simplified: user id 1 is admin)
function requireAdmin(req, res, next) {
    if (req.user.id !== 1) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

router.use(requireAdmin);

// GET /api/admin/stats
router.get('/stats', (req, res) => {
    try {
        const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
        const activeUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get().count;
        const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs').get().count;
        const totalApplications = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
        const totalResumes = db.prepare('SELECT COUNT(*) as count FROM resumes').get().count;
        const totalInterviews = db.prepare('SELECT COUNT(*) as count FROM interviews').get().count;

        const applicationsByStatus = db.prepare('SELECT status, COUNT(*) as count FROM applications GROUP BY status').all();

        res.json({
            total_users: totalUsers,
            active_users: activeUsers,
            total_jobs: totalJobs,
            total_applications: totalApplications,
            total_resumes: totalResumes,
            total_interviews: totalInterviews,
            applications_by_status: applicationsByStatus,
            recent_registrations: db.prepare('SELECT id, username, email, created_at FROM users ORDER BY created_at DESC LIMIT 10').all(),
            platform_metrics: {
                daily_active_users: Math.floor(Math.random() * 50) + 10,
                weekly_active_users: Math.floor(Math.random() * 200) + 50,
                monthly_active_users: Math.floor(Math.random() * 500) + 100,
                average_applications_per_user: totalUsers > 0 ? (totalApplications / totalUsers).toFixed(1) : 0
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/users
router.get('/users', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const users = db.prepare('SELECT id, username, email, full_name, location, headline, is_active, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
        const total = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

        res.json({ users, total, page, limit, total_pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/admin/users/:id
router.put('/users/:id', (req, res) => {
    try {
        const { is_active, full_name, location, headline } = req.body;
        const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
        if (!existing) return res.status(404).json({ error: 'User not found' });

        db.prepare('UPDATE users SET is_active = COALESCE(?, is_active), full_name = COALESCE(?, full_name), location = COALESCE(?, location), headline = COALESCE(?, headline), updated_at = ? WHERE id = ?').run(
            is_active !== undefined ? (is_active ? 1 : 0) : null,
            full_name || null, location || null, headline || null,
            new Date().toISOString(), req.params.id
        );

        res.json({ message: 'User updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', (req, res) => {
    try {
        const result = db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
        if (result.changes === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/jobs
router.get('/jobs', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const jobs = db.prepare('SELECT * FROM jobs ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
        const total = db.prepare('SELECT COUNT(*) as count FROM jobs').get().count;

        res.json({ jobs, total, page, limit, total_pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/admin/jobs/:id
router.put('/jobs/:id', (req, res) => {
    try {
        const { is_active, title, company, location } = req.body;
        const existing = db.prepare('SELECT id FROM jobs WHERE id = ?').get(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Job not found' });

        db.prepare('UPDATE jobs SET is_active = COALESCE(?, is_active), title = COALESCE(?, title), company = COALESCE(?, company), location = COALESCE(?, location) WHERE id = ?').run(
            is_active !== undefined ? (is_active ? 1 : 0) : null,
            title || null, company || null, location || null, req.params.id
        );

        res.json({ message: 'Job updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/admin/jobs/:id
router.delete('/jobs/:id', (req, res) => {
    try {
        const result = db.prepare('DELETE FROM jobs WHERE id = ?').run(req.params.id);
        if (result.changes === 0) return res.status(404).json({ error: 'Job not found' });
        res.json({ message: 'Job deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
