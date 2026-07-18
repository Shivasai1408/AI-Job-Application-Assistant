const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../auth');

router.use(authMiddleware);

const MOCK_PORTALS = [
    { id: 1, name: 'LinkedIn', url: 'https://linkedin.com', icon: 'linkedin', is_active: true },
    { id: 2, name: 'Indeed', url: 'https://indeed.com', icon: 'indeed', is_active: true },
    { id: 3, name: 'Glassdoor', url: 'https://glassdoor.com', icon: 'glassdoor', is_active: true },
    { id: 4, name: 'Monster', url: 'https://monster.com', icon: 'monster', is_active: true },
    { id: 5, name: 'ZipRecruiter', url: 'https://ziprecruiter.com', icon: 'ziprecruiter', is_active: true }
];

// GET /api/auto-apply/portals
router.get('/portals', (req, res) => {
    res.json({ portals: MOCK_PORTALS });
});

// GET /api/auto-apply/portals/:id/fields
router.get('/portals/:id/fields', (req, res) => {
    const portal = MOCK_PORTALS.find(p => p.id === parseInt(req.params.id));
    if (!portal) return res.status(404).json({ error: 'Portal not found' });

    const fields = {
        1: [
            { name: 'full_name', label: 'Full Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'phone', label: 'Phone', type: 'tel', required: false },
            { name: 'headline', label: 'Headline', type: 'text', required: false },
            { name: 'summary', label: 'Summary', type: 'textarea', required: false },
            { name: 'resume', label: 'Resume', type: 'file', required: true },
            { name: 'cover_letter', label: 'Cover Letter', type: 'textarea', required: false }
        ],
        2: [
            { name: 'full_name', label: 'Full Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'phone', label: 'Phone', type: 'tel', required: true },
            { name: 'location', label: 'Location', type: 'text', required: false },
            { name: 'resume', label: 'Resume', type: 'file', required: true },
            { name: 'cover_letter', label: 'Cover Letter', type: 'textarea', required: false }
        ]
    };

    res.json({ portal: portal.name, fields: fields[portal.id] || fields[1] });
});

// POST /api/auto-apply/prepare
router.post('/prepare', (req, res) => {
    try {
        const { job_ids, portal_id } = req.body;
        if (!job_ids || !Array.isArray(job_ids) || job_ids.length === 0) {
            return res.status(400).json({ error: 'Job IDs array is required' });
        }

        const now = new Date().toISOString();
        const applications = job_ids.map(jobId => ({
            job_id: jobId,
            status: 'prepared',
            prepared_at: now,
            portal: portal_id ? MOCK_PORTALS.find(p => p.id === portal_id)?.name : 'Manual',
            estimated_time: '5-10 minutes per application'
        }));

        res.json({
            message: `Prepared ${applications.length} applications for submission`,
            applications,
            total_estimated_time: `${applications.length * 5}-${applications.length * 10} minutes`,
            tips: [
                'Review each application before submission',
                'Customize your resume for each position',
                'Write a targeted cover letter',
                'Ensure your contact information is up to date'
            ]
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auto-apply/submit
router.post('/submit', (req, res) => {
    try {
        const { applications } = req.body;
        if (!applications || !Array.isArray(applications) || applications.length === 0) {
            return res.status(400).json({ error: 'Applications array is required' });
        }

        const now = new Date().toISOString();
        const results = applications.map((app, index) => {
            const result = db.prepare(
                'INSERT INTO applications (user_id, job_id, status, applied_date, created_at) VALUES (?, ?, ?, ?, ?)'
            ).run(req.user.id, app.job_id || null, 'applied', now, now);

            return {
                application_id: result.lastInsertRowid,
                job_id: app.job_id,
                status: 'applied',
                submitted_at: now
            };
        });

        res.json({
            message: `Successfully submitted ${results.length} applications`,
            results,
            total_submitted: results.length,
            next_steps: [
                'Track application status in your dashboard',
                'Prepare for potential interviews',
                'Set up job alerts for similar positions',
                'Follow up within 1-2 weeks if no response'
            ]
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
