const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../auth');

router.use(authMiddleware);

// GET /api/portfolio
router.get('/', (req, res) => {
    try {
        let portfolio = db.prepare('SELECT * FROM portfolios WHERE user_id = ?').get(req.user.id);
        if (!portfolio) {
            const now = new Date().toISOString();
            const defaultSections = ['about', 'experience', 'education', 'skills', 'projects', 'contact'];
            db.prepare(
                'INSERT INTO portfolios (user_id, theme, sections, section_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
            ).run(req.user.id, 'modern', JSON.stringify(defaultSections), JSON.stringify(defaultSections), now, now);
            portfolio = db.prepare('SELECT * FROM portfolios WHERE user_id = ?').get(req.user.id);
        }
        if (portfolio.sections) portfolio.sections = JSON.parse(portfolio.sections);
        if (portfolio.section_order) portfolio.section_order = JSON.parse(portfolio.section_order);
        res.json(portfolio);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/portfolio/generate
router.post('/generate', (req, res) => {
    try {
        const { theme, sections } = req.body;
        const now = new Date().toISOString();
        const sectionOrder = sections || ['about', 'experience', 'education', 'skills', 'projects', 'contact'];

        const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Portfolio</title>
<style>
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f8f9fa; color: #333; }
.container { max-width: 1200px; margin: 0 auto; padding: 20px; }
header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 60px 0; text-align: center; }
h1 { margin: 0; font-size: 2.5em; }
.section { background: white; margin: 30px 0; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
h2 { color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
</style></head>
<body>
<header><div class="container"><h1>My Portfolio</h1><p>Welcome to my professional portfolio</p></div></header>
<div class="container">
<div class="section"><h2>About Me</h2><p>Passionate professional with experience in technology and innovation.</p></div>
<div class="section"><h2>Experience</h2><p>Details about professional experience go here.</p></div>
<div class="section"><h2>Skills</h2><p>Technical skills and competencies.</p></div>
<div class="section"><h2>Projects</h2><p>Notable projects and achievements.</p></div>
<div class="section"><h2>Contact</h2><p>Contact information and links.</p></div>
</div></body></html>`;

        const existing = db.prepare('SELECT id FROM portfolios WHERE user_id = ?').get(req.user.id);
        if (existing) {
            db.prepare('UPDATE portfolios SET theme = ?, sections = ?, section_order = ?, generated_html = ?, updated_at = ? WHERE user_id = ?').run(
                theme || 'modern', JSON.stringify(sectionOrder), JSON.stringify(sectionOrder), html, now, req.user.id
            );
        } else {
            db.prepare('INSERT INTO portfolios (user_id, theme, sections, section_order, generated_html, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
                req.user.id, theme || 'modern', JSON.stringify(sectionOrder), JSON.stringify(sectionOrder), html, now, now
            );
        }

        res.json({
            message: 'Portfolio generated',
            html,
            theme: theme || 'modern',
            sections: sectionOrder,
            preview_url: `/api/portfolio/preview`
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/portfolio
router.put('/', (req, res) => {
    try {
        const { theme, custom_css, sections, section_order } = req.body;
        const now = new Date().toISOString();
        const existing = db.prepare('SELECT id FROM portfolios WHERE user_id = ?').get(req.user.id);

        if (existing) {
            db.prepare('UPDATE portfolios SET theme = COALESCE(?, theme), custom_css = COALESCE(?, custom_css), sections = COALESCE(?, sections), section_order = COALESCE(?, section_order), updated_at = ? WHERE user_id = ?').run(
                theme || null, custom_css || null, sections ? JSON.stringify(sections) : null, section_order ? JSON.stringify(section_order) : null, now, req.user.id
            );
        } else {
            const defaultSections = ['about', 'experience', 'education', 'skills', 'projects', 'contact'];
            db.prepare('INSERT INTO portfolios (user_id, theme, custom_css, sections, section_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
                req.user.id, theme || 'modern', custom_css || null, JSON.stringify(sections || defaultSections), JSON.stringify(section_order || defaultSections), now, now
            );
        }

        const portfolio = db.prepare('SELECT * FROM portfolios WHERE user_id = ?').get(req.user.id);
        if (portfolio.sections) portfolio.sections = JSON.parse(portfolio.sections);
        if (portfolio.section_order) portfolio.section_order = JSON.parse(portfolio.section_order);
        res.json({ message: 'Portfolio updated', portfolio });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/portfolio/preview
router.get('/preview', (req, res) => {
    try {
        const portfolio = db.prepare('SELECT generated_html FROM portfolios WHERE user_id = ?').get(req.user.id);
        if (portfolio && portfolio.generated_html) {
            res.setHeader('Content-Type', 'text/html');
            res.send(portfolio.generated_html);
        } else {
            res.status(404).json({ error: 'No portfolio has been generated yet. POST /api/portfolio/generate first.' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
