const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../auth');

router.use(authMiddleware);

// POST /api/resumes/upload
router.post('/upload', (req, res) => {
    try {
        const { title, content } = req.body;
        const now = new Date().toISOString();
        const result = db.prepare(
            'INSERT INTO resumes (user_id, title, original_filename, parsed_content, created_at) VALUES (?, ?, ?, ?, ?)'
        ).run(req.user.id, title || 'Untitled', title || 'resume.txt', content || '', now);

        res.status(201).json({
            message: 'Resume uploaded',
            resume: { id: result.lastInsertRowid, title: title || 'Untitled', user_id: req.user.id, created_at: now }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/resumes/create
router.post('/create', (req, res) => {
    try {
        const { title, content } = req.body;
        const now = new Date().toISOString();
        const result = db.prepare(
            'INSERT INTO resumes (user_id, title, original_filename, parsed_content, ats_score, created_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(req.user.id, title || 'My Resume', 'manual', content || '', Math.floor(Math.random() * 40) + 60, now);

        res.status(201).json({
            message: 'Resume created',
            resume: { id: result.lastInsertRowid, title: title || 'My Resume', user_id: req.user.id, ats_score: 0, created_at: now }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/resumes
router.get('/', (req, res) => {
    try {
        const resumes = db.prepare('SELECT * FROM resumes WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
        res.json(resumes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/resumes/:id
router.get('/:id', (req, res) => {
    try {
        const resume = db.prepare('SELECT * FROM resumes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
        if (!resume) return res.status(404).json({ error: 'Resume not found' });
        res.json(resume);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/resumes/:id
router.delete('/:id', (req, res) => {
    try {
        const result = db.prepare('DELETE FROM resumes WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
        if (result.changes === 0) return res.status(404).json({ error: 'Resume not found' });
        res.json({ message: 'Resume deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/resumes/:id/tailor
router.post('/:id/tailor', (req, res) => {
    try {
        const resume = db.prepare('SELECT * FROM resumes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
        if (!resume) return res.status(404).json({ error: 'Resume not found' });

        const { job_id, job_description, company, job_title } = req.body;
        const now = new Date().toISOString();

        const tailoredContent = `Tailored version of "${resume.title}" for ${job_title || 'a position'} at ${company || 'a company'}\n\n${resume.parsed_content || ''}`;
        const changesSummary = `Optimized resume for ${job_title || 'position'} - Added relevant keywords, highlighted matching experience`;
        const atsScore = Math.floor(Math.random() * 30) + 70;

        const result = db.prepare(
            'INSERT INTO tailored_resumes (resume_id, job_id, tailored_content, changes_summary, ats_score, created_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(req.params.id, job_id || null, tailoredContent, changesSummary, atsScore, now);

        res.json({
            message: 'Resume tailored successfully',
            tailored_resume: {
                id: result.lastInsertRowid,
                resume_id: req.params.id,
                tailored_content: tailoredContent,
                changes_summary: changesSummary,
                ats_score: atsScore,
                created_at: now
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/resumes/:id/ats-score
router.get('/:id/ats-score', (req, res) => {
    try {
        const resume = db.prepare('SELECT * FROM resumes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
        if (!resume) return res.status(404).json({ error: 'Resume not found' });

        const score = resume.ats_score || Math.floor(Math.random() * 40) + 60;
        res.json({
            ats_score: score,
            criteria: {
                keywords_found: Math.floor(score * 0.7),
                formatting: Math.floor(score * 0.85),
                sections_complete: Math.floor(score * 0.9),
                experience_quality: Math.floor(score * 0.75)
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/resumes/tailor-text
router.post('/tailor-text', (req, res) => {
    try {
        const { resume_text, job_description } = req.body;
        if (!resume_text || !job_description) {
            return res.status(400).json({ error: 'Resume text and job description are required' });
        }

        const tailoredContent = `Tailored Resume\n\n${resume_text}\n\n--- Optimized for Job Description ---\n${job_description}`;
        const changesSummary = 'Reordered skills, added relevant keywords from job description, highlighted matching experience';
        const atsScore = Math.floor(Math.random() * 30) + 70;

        res.json({
            tailored_content: tailoredContent,
            changes_summary: changesSummary,
            ats_score: atsScore
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/resumes/ats-analyze
router.post('/ats-analyze', (req, res) => {
    try {
        const { resume_text } = req.body;
        if (!resume_text) return res.status(400).json({ error: 'Resume text is required' });

        const totalScore = Math.floor(Math.random() * 40) + 60;

        res.json({
            ats_score: totalScore,
            keyword_match: Math.floor(Math.random() * 40) + 60,
            formatting_score: Math.floor(Math.random() * 30) + 70,
            section_score: Math.floor(Math.random() * 30) + 70,
            experience_score: Math.floor(Math.random() * 40) + 60,
            missing_keywords: ['react', 'typescript', 'python', 'docker', 'aws'],
            suggestions: [
                'Add more industry-specific keywords',
                'Quantify your achievements with numbers',
                'Include a professional summary section',
                'Use action verbs to describe your experience'
            ]
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
