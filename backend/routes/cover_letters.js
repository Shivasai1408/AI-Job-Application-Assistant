const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../auth');

router.use(authMiddleware);

// POST /api/cover-letters/generate
router.post('/generate', (req, res) => {
    try {
        const { job_title, company, job_description, resume_content, tone } = req.body;
        if (!job_title || !company) {
            return res.status(400).json({ error: 'Job title and company are required' });
        }

        const content = `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${job_title} position at ${company}. With my background and skills, I am confident that I would be a valuable addition to your team.\n\nThroughout my career, I have developed expertise that aligns perfectly with the requirements of this role. My experience includes delivering high-quality results and collaborating effectively with cross-functional teams.\n\nI am particularly drawn to ${company}'s mission and would be excited to contribute to your continued success. I look forward to the opportunity to discuss how my skills and experience can benefit ${company}.\n\nThank you for your time and consideration.\n\nBest regards,\n[Your Name]`;

        const now = new Date().toISOString();
        const result = db.prepare(
            'INSERT INTO cover_letters (user_id, job_id, content, tone, created_at) VALUES (?, ?, ?, ?, ?)'
        ).run(req.user.id, null, content, tone || 'professional', now);

        res.json({
            message: 'Cover letter generated',
            cover_letter: {
                id: result.lastInsertRowid,
                content,
                tone: tone || 'professional',
                created_at: now
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/cover-letters/save
router.post('/save', (req, res) => {
    try {
        const { job_id, content, tone } = req.body;
        if (!content) return res.status(400).json({ error: 'Content is required' });

        const now = new Date().toISOString();
        const result = db.prepare(
            'INSERT INTO cover_letters (user_id, job_id, content, tone, created_at) VALUES (?, ?, ?, ?, ?)'
        ).run(req.user.id, job_id || null, content, tone || 'professional', now);

        res.status(201).json({
            message: 'Cover letter saved',
            cover_letter: { id: result.lastInsertRowid, content, tone: tone || 'professional', created_at: now }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/cover-letters
router.get('/', (req, res) => {
    try {
        const letters = db.prepare('SELECT * FROM cover_letters WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
        res.json(letters);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/cover-letters/:id
router.delete('/:id', (req, res) => {
    try {
        const result = db.prepare('DELETE FROM cover_letters WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
        if (result.changes === 0) return res.status(404).json({ error: 'Cover letter not found' });
        res.json({ message: 'Cover letter deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
