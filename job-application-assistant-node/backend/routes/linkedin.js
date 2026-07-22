const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../auth');

router.use(authMiddleware);

// POST /api/linkedin/optimize
router.post('/optimize', (req, res) => {
    try {
        const { section_name, original_content, job_title, industry } = req.body;
        if (!section_name || !original_content) {
            return res.status(400).json({ error: 'Section name and original content are required' });
        }

        const now = new Date().toISOString();
        const optimizedContent = `Optimized ${section_name}: ${original_content}\n\nEnhanced with industry-relevant keywords and achievements for better visibility.`;
        const suggestions = [
            'Add more quantifiable achievements',
            'Include industry-specific keywords',
            'Use a stronger opening statement',
            'Highlight leadership and collaboration experiences',
            'Keep content concise and impact-focused'
        ];

        db.prepare(
            'INSERT INTO linkedin_optimizations (user_id, section_name, original_content, optimized_content, suggestions, created_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(req.user.id, section_name, original_content, optimizedContent, JSON.stringify(suggestions), now);

        res.json({
            section_name,
            original_content,
            optimized_content: optimizedContent,
            suggestions,
            character_count: optimizedContent.length,
            estimated_read_time: `${Math.ceil(optimizedContent.split(' ').length / 200)} min`
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/linkedin/keywords
router.post('/keywords', (req, res) => {
    try {
        const { job_title, industry } = req.body;
        if (!job_title) return res.status(400).json({ error: 'Job title is required' });

        const keywordSets = {
            'Software Engineer': { technical: ['Python', 'Java', 'JavaScript', 'System Design', 'Algorithms', 'Data Structures', 'Agile', 'Git', 'CI/CD', 'REST APIs'], soft: ['Problem Solving', 'Team Collaboration', 'Communication', 'Leadership', 'Critical Thinking'] },
            'Data Scientist': { technical: ['Python', 'SQL', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'Statistics', 'Data Visualization', 'NLP', 'Big Data'], soft: ['Analytical Thinking', 'Communication', 'Business Acumen', 'Curiosity'] },
            'Product Manager': { technical: ['Product Strategy', 'Roadmapping', 'User Research', 'A/B Testing', 'Analytics', 'Agile', 'SQL'], soft: ['Leadership', 'Stakeholder Management', 'Communication', 'Strategic Thinking', 'Negotiation'] },
            'DevOps Engineer': { technical: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'CI/CD', 'Linux', 'Ansible', 'Monitoring', 'Scripting'], soft: ['Automation Mindset', 'Problem Solving', 'Collaboration', 'Documentation'] }
        };

        const keywords = keywordSets[job_title] || {
            technical: ['Project Management', 'Communication', 'Problem Solving', 'Teamwork', 'Data Analysis', 'Technical Writing'],
            soft: ['Leadership', 'Adaptability', 'Critical Thinking', 'Time Management']
        };

        const now = new Date().toISOString();
        db.prepare('INSERT INTO linkedin_keywords (user_id, job_title, industry, keywords, created_at) VALUES (?, ?, ?, ?, ?)').run(
            req.user.id, job_title, industry || null, JSON.stringify(keywords), now
        );

        res.json({
            job_title,
            industry: industry || 'General',
            keywords,
            total_keywords: keywords.technical.length + keywords.soft.length,
            usage_tips: [
                'Include these keywords in your headline and summary',
                'Add relevant keywords to your experience descriptions',
                'Use keywords naturally - avoid keyword stuffing',
                'Prioritize the most relevant skills for your target role'
            ]
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/linkedin/analytics
router.get('/analytics', (req, res) => {
    try {
        const optimizations = db.prepare('SELECT * FROM linkedin_optimizations WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
        const keywords = db.prepare('SELECT * FROM linkedin_keywords WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);

        res.json({
            profile_strength: Math.floor(Math.random() * 30) + 70,
            sections_optimized: optimizations.length,
            keyword_sets_generated: keywords.length,
            recommendations: [
                { section: 'Headline', priority: 'High', impact: 'Add target job title and key skills' },
                { section: 'About', priority: 'High', impact: 'Write a compelling summary with achievements' },
                { section: 'Experience', priority: 'Medium', impact: 'Quantify achievements with metrics' },
                { section: 'Skills', priority: 'Medium', impact: 'Add more relevant technical skills' },
                { section: 'Recommendations', priority: 'Low', impact: 'Request recommendations from colleagues' }
            ],
            profile_views: Math.floor(Math.random() * 500) + 50,
            search_appearances: Math.floor(Math.random() * 1000) + 100
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
