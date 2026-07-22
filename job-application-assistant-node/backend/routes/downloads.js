const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../auth');

router.use(authMiddleware);

// GET /api/downloads/resume/:id
router.get('/resume/:id', (req, res) => {
    try {
        const resume = db.prepare('SELECT * FROM resumes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
        if (!resume) return res.status(404).json({ error: 'Resume not found' });

        const content = resume.parsed_content || 'Resume content not available';
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${resume.title || 'resume'}.txt"`);
        res.send(content);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/downloads/cover-letter/:id
router.get('/cover-letter/:id', (req, res) => {
    try {
        const letter = db.prepare('SELECT * FROM cover_letters WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
        if (!letter) return res.status(404).json({ error: 'Cover letter not found' });

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="cover-letter-${letter.id}.txt"`);
        res.send(letter.content || 'Cover letter content not available');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/downloads/portfolio/:id
router.get('/portfolio/:id', (req, res) => {
    try {
        const portfolio = db.prepare('SELECT * FROM portfolios WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
        if (!portfolio) return res.status(404).json({ error: 'Portfolio not found' });

        if (portfolio.generated_html) {
            res.setHeader('Content-Type', 'text/html');
            res.setHeader('Content-Disposition', `attachment; filename="portfolio-${portfolio.id}.html"`);
            res.send(portfolio.generated_html);
        } else {
            res.status(404).json({ error: 'No generated HTML found for this portfolio. Generate it first.' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/downloads/application-history
router.get('/application-history', (req, res) => {
    try {
        const applications = db.prepare(`
            SELECT a.*, j.title as job_title, j.company, j.location
            FROM applications a
            LEFT JOIN jobs j ON a.job_id = j.id
            WHERE a.user_id = ?
            ORDER BY a.created_at DESC
        `).all(req.user.id);

        const now = new Date().toISOString();
        let csv = 'Application ID,Job Title,Company,Location,Status,Applied Date,Interview Date,Notes\n';
        for (const app of applications) {
            csv += `${app.id},"${app.job_title || ''}","${app.company || ''}","${app.location || ''}",${app.status},${app.applied_date || ''},${app.interview_date || ''},"${(app.notes || '').replace(/"/g, '""')}"\n`;
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="application-history-${now.substring(0, 10)}.csv"`);
        res.send(csv);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
