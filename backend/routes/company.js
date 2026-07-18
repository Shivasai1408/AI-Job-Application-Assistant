const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../auth');

router.use(authMiddleware);

// Middleware: only company role allowed
function companyOnly(req, res, next) {
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user.id);
    if (!user || user.role !== 'company') {
        return res.status(403).json({ error: 'Company account required' });
    }
    next();
}

// ===== COMPANY PROFILE =====

// GET /api/company/profile
router.get('/profile', companyOnly, (req, res) => {
    try {
        const profile = db.prepare('SELECT * FROM company_profiles WHERE user_id = ?').get(req.user.id);
        const user = db.prepare('SELECT id, username, email, full_name FROM users WHERE id = ?').get(req.user.id);
        res.json({ profile: profile || {}, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/company/profile
router.put('/profile', companyOnly, (req, res) => {
    try {
        const { company_name, industry, company_size, website, description, location } = req.body;
        const now = new Date().toISOString();
        const existing = db.prepare('SELECT id FROM company_profiles WHERE user_id = ?').get(req.user.id);

        if (existing) {
            db.prepare(
                'UPDATE company_profiles SET company_name=?, industry=?, company_size=?, website=?, description=?, location=?, updated_at=? WHERE user_id=?'
            ).run(company_name, industry, company_size, website, description, location, now, req.user.id);
        } else {
            db.prepare(
                'INSERT INTO company_profiles (user_id, company_name, industry, company_size, website, description, location, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)'
            ).run(req.user.id, company_name, industry, company_size, website, description, location, now, now);
        }

        const profile = db.prepare('SELECT * FROM company_profiles WHERE user_id = ?').get(req.user.id);
        res.json({ message: 'Profile updated', profile });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== JOB MANAGEMENT =====

// POST /api/company/jobs
router.post('/jobs', companyOnly, (req, res) => {
    try {
        const { title, location, description, requirements, salary_range, job_type, experience_level, industry, skills_required } = req.body;
        if (!title || !description) return res.status(400).json({ error: 'Title and description are required' });

        const profile = db.prepare('SELECT company_name FROM company_profiles WHERE user_id = ?').get(req.user.id);
        const company = profile ? profile.company_name : 'Unknown Company';
        const now = new Date().toISOString();

        const result = db.prepare(
            'INSERT INTO jobs (posted_by, title, company, location, description, requirements, salary_range, job_type, experience_level, industry, skills_required, posted_date, is_active, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,?)'
        ).run(req.user.id, title, company, location || '', description, requirements || '', salary_range || '', job_type || 'Full-time', experience_level || 'Mid-Level', industry || '', skills_required || '', now.split('T')[0], now);

        res.status(201).json({ message: 'Job posted successfully', job_id: result.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/company/jobs
router.get('/jobs', companyOnly, (req, res) => {
    try {
        const jobs = db.prepare('SELECT * FROM jobs WHERE posted_by = ? ORDER BY created_at DESC').all(req.user.id);
        res.json({ jobs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/company/jobs/:id
router.put('/jobs/:id', companyOnly, (req, res) => {
    try {
        const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND posted_by = ?').get(req.params.id, req.user.id);
        if (!job) return res.status(404).json({ error: 'Job not found' });

        const { title, location, description, requirements, salary_range, job_type, experience_level, industry, skills_required, is_active } = req.body;
        db.prepare(
            'UPDATE jobs SET title=COALESCE(?,title), location=COALESCE(?,location), description=COALESCE(?,description), requirements=COALESCE(?,requirements), salary_range=COALESCE(?,salary_range), job_type=COALESCE(?,job_type), experience_level=COALESCE(?,experience_level), industry=COALESCE(?,industry), skills_required=COALESCE(?,skills_required), is_active=COALESCE(?,is_active) WHERE id=? AND posted_by=?'
        ).run(title, location, description, requirements, salary_range, job_type, experience_level, industry, skills_required, is_active !== undefined ? is_active : null, req.params.id, req.user.id);

        res.json({ message: 'Job updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/company/jobs/:id
router.delete('/jobs/:id', companyOnly, (req, res) => {
    try {
        const result = db.prepare('DELETE FROM jobs WHERE id = ? AND posted_by = ?').run(req.params.id, req.user.id);
        if (result.changes === 0) return res.status(404).json({ error: 'Job not found' });
        res.json({ message: 'Job deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== APPLICANTS =====

// GET /api/company/jobs/:id/applicants
router.get('/jobs/:id/applicants', companyOnly, (req, res) => {
    try {
        const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND posted_by = ?').get(req.params.id, req.user.id);
        if (!job) return res.status(404).json({ error: 'Job not found' });

        const applicants = db.prepare(
            'SELECT a.*, u.full_name, u.email, u.username, u.phone, u.location, u.skills, u.experience_years FROM applications a JOIN users u ON a.user_id = u.id WHERE a.job_id = ? ORDER BY a.created_at DESC'
        ).all(req.params.id);

        res.json({ applicants, job });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/company/applicants/:appId/status
router.put('/applicants/:appId/status', companyOnly, (req, res) => {
    try {
        const { status } = req.body;
        if (!status) return res.status(400).json({ error: 'Status is required' });

        // Verify this application belongs to a job posted by this company
        const app = db.prepare(
            'SELECT a.* FROM applications a JOIN jobs j ON a.job_id = j.id WHERE a.id = ? AND j.posted_by = ?'
        ).get(req.params.appId, req.user.id);

        if (!app) return res.status(404).json({ error: 'Application not found' });

        db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, req.params.appId);
        res.json({ message: 'Status updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/company/stats
router.get('/stats', companyOnly, (req, res) => {
    try {
        const jobs = db.prepare('SELECT * FROM jobs WHERE posted_by = ?').all(req.user.id);
        const jobIds = jobs.map(j => j.id);
        let totalApplicants = 0, shortlisted = 0, hired = 0;

        if (jobIds.length) {
            const placeholders = jobIds.map(() => '?').join(',');
            const apps = db.prepare(`SELECT * FROM applications WHERE job_id IN (${placeholders})`).all(...jobIds);
            totalApplicants = apps.length;
            shortlisted = apps.filter(a => a.status === 'shortlisted' || a.status === 'interviewing').length;
            hired = apps.filter(a => a.status === 'hired' || a.status === 'offer').length;
        }

        res.json({
            total_jobs: jobs.length,
            active_jobs: jobs.filter(j => j.is_active).length,
            total_applicants: totalApplicants,
            shortlisted,
            hired
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
