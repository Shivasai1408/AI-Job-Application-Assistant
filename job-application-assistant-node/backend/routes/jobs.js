const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../auth');

router.use(authMiddleware);

const MOCK_JOBS = [
    { id: 1, title: 'Senior Software Engineer', company: 'Google', location: 'Mountain View, CA', description: 'Build and maintain large-scale distributed systems. Work on cutting-edge technologies that serve billions of users.', requirements: 'BS in Computer Science, 5+ years experience in software development, strong algorithms and data structures', salary_range: '$150,000 - $250,000', job_type: 'Full-time', experience_level: 'Senior', industry: 'Technology', source: 'LinkedIn', posted_date: '2026-07-10', skills_required: 'Java,Python,Distributed Systems,Kubernetes,System Design' },
    { id: 2, title: 'Full Stack Developer', company: 'Microsoft', location: 'Redmond, WA', description: 'Develop and maintain web applications using React, Node.js, and Azure services. Collaborate with cross-functional teams.', requirements: '3+ years experience with React, Node.js, and cloud services. Familiarity with agile development.', salary_range: '$120,000 - $180,000', job_type: 'Full-time', experience_level: 'Mid-Level', industry: 'Technology', source: 'Indeed', posted_date: '2026-07-12', skills_required: 'React,Node.js,Azure,TypeScript,SQL' },
    { id: 3, title: 'Data Scientist', company: 'Amazon', location: 'Seattle, WA', description: 'Analyze large datasets to drive business decisions. Build ML models for recommendation systems and forecasting.', requirements: 'MS/PhD in quantitative field, 3+ years experience in data science, proficiency in Python and SQL.', salary_range: '$140,000 - $220,000', job_type: 'Full-time', experience_level: 'Senior', industry: 'Technology', source: 'LinkedIn', posted_date: '2026-07-08', skills_required: 'Python,TensorFlow,SQL,Machine Learning,Statistics' },
    { id: 4, title: 'Frontend Developer', company: 'Apple', location: 'Cupertino, CA', description: 'Create beautiful, responsive user interfaces for Apple services. Focus on performance and accessibility.', requirements: '2+ years experience with React/Vue, strong CSS/HTML skills, understanding of web performance.', salary_range: '$130,000 - $190,000', job_type: 'Full-time', experience_level: 'Mid-Level', industry: 'Technology', source: 'Glassdoor', posted_date: '2026-07-15', skills_required: 'React,TypeScript,CSS,HTML,Webpack' },
    { id: 5, title: 'DevOps Engineer', company: 'Netflix', location: 'Los Gatos, CA', description: 'Design and maintain CI/CD pipelines, manage cloud infrastructure, and ensure high availability of streaming services.', requirements: '4+ years experience with AWS/GCP, Docker, Kubernetes, and infrastructure as code.', salary_range: '$160,000 - $240,000', job_type: 'Full-time', experience_level: 'Senior', industry: 'Technology', source: 'LinkedIn', posted_date: '2026-07-05', skills_required: 'AWS,Docker,Kubernetes,Terraform,CICD' },
    { id: 6, title: 'Product Manager', company: 'Meta', location: 'Menlo Park, CA', description: 'Define product strategy and roadmap for social media features. Work with engineering, design, and data teams.', requirements: '3+ years product management experience, technical background preferred, strong analytical skills.', salary_range: '$140,000 - $210,000', job_type: 'Full-time', experience_level: 'Senior', industry: 'Technology', source: 'Indeed', posted_date: '2026-07-14', skills_required: 'Product Strategy,Analytics,A/B Testing,Agile,Communication' },
    { id: 7, title: 'Backend Engineer', company: 'Stripe', location: 'San Francisco, CA', description: 'Build payment infrastructure APIs and services. Focus on reliability, security, and developer experience.', requirements: '3+ years experience with Python or Go, experience building RESTful APIs, knowledge of distributed systems.', salary_range: '$150,000 - $230,000', job_type: 'Full-time', experience_level: 'Mid-Level', industry: 'Fintech', source: 'LinkedIn', posted_date: '2026-07-11', skills_required: 'Python,Go,PostgreSQL,Redis,REST APIs' },
    { id: 8, title: 'AI/ML Engineer', company: 'OpenAI', location: 'San Francisco, CA', description: 'Research and develop state-of-the-art AI models. Work on large language models and generative AI applications.', requirements: 'MS/PhD in ML/AI, strong Python skills, experience with deep learning frameworks.', salary_range: '$200,000 - $350,000', job_type: 'Full-time', experience_level: 'Senior', industry: 'AI', source: 'LinkedIn', posted_date: '2026-07-01', skills_required: 'Python,PyTorch,Transformers,LLMs,NLP' },
    { id: 9, title: 'Software Engineer Intern', company: 'Salesforce', location: 'San Francisco, CA', description: 'Join our engineering team for a 12-week summer internship. Work on real projects that impact customers.', requirements: 'Currently pursuing BS/MS in Computer Science, strong programming fundamentals.', salary_range: '$40 - $60/hr', job_type: 'Internship', experience_level: 'Entry', industry: 'Technology', source: 'Glassdoor', posted_date: '2026-07-16', skills_required: 'Java,JavaScript,SQL,Problem Solving' },
    { id: 10, title: 'Technical Lead', company: 'Uber', location: 'New York, NY', description: 'Lead a team of engineers building marketplace and mobility platforms. Drive technical architecture and mentorship.', requirements: '7+ years experience, 2+ years in tech lead role, strong system design skills.', salary_range: '$180,000 - $280,000', job_type: 'Full-time', experience_level: 'Lead', industry: 'Technology', source: 'LinkedIn', posted_date: '2026-07-09', skills_required: 'System Design,Java,Microservices,Leadership,Architecture' }
];

// GET /api/jobs/search
router.get('/search', (req, res) => {
    const { q, location, job_type, experience_level, page = 1, limit = 10 } = req.query;
    let filtered = [...MOCK_JOBS];

    if (q) {
        const query = q.toLowerCase();
        filtered = filtered.filter(j =>
            j.title.toLowerCase().includes(query) ||
            j.company.toLowerCase().includes(query) ||
            j.skills_required.toLowerCase().includes(query)
        );
    }
    if (location) filtered = filtered.filter(j => j.location.toLowerCase().includes(location.toLowerCase()));
    if (job_type) filtered = filtered.filter(j => j.job_type.toLowerCase() === job_type.toLowerCase());
    if (experience_level) filtered = filtered.filter(j => j.experience_level.toLowerCase() === experience_level.toLowerCase());

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + parseInt(limit));

    res.json({
        jobs: paged,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(total / limit)
    });
});

// GET /api/jobs/recommended
router.get('/recommended', (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const shuffled = [...MOCK_JOBS].sort(() => 0.5 - Math.random());
    res.json({ jobs: shuffled.slice(0, 5) });
});

// GET /api/jobs/:id
router.get('/:id', (req, res) => {
    const job = MOCK_JOBS.find(j => j.id === parseInt(req.params.id));
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
});

// POST /api/jobs/extract-skills
router.post('/extract-skills', (req, res) => {
    const { job_description } = req.body;
    if (!job_description) return res.status(400).json({ error: 'Job description is required' });

    res.json({
        skills: ['Python', 'JavaScript', 'React', 'Node.js', 'SQL', 'AWS', 'Docker', 'TypeScript', 'Git', 'REST APIs'],
        certifications: ['AWS Certified Developer', 'Google Cloud Professional', 'Azure Developer Associate'],
        experience_level: 'Mid-Senior',
        suggested_keywords: ['full stack', 'agile', 'microservices', 'CI/CD', 'test-driven development']
    });
});

// POST /api/jobs/save
router.post('/save', (req, res) => {
    try {
        const { job_id } = req.body;
        if (!job_id) return res.status(400).json({ error: 'Job ID is required' });

        const existing = db.prepare('SELECT * FROM user_saved_jobs WHERE user_id = ? AND job_id = ?').get(req.user.id, job_id);
        if (existing) return res.json({ message: 'Job already saved' });

        db.prepare('INSERT INTO user_saved_jobs (user_id, job_id, saved_at) VALUES (?, ?, ?)').run(
            req.user.id, job_id, new Date().toISOString()
        );
        res.json({ message: 'Job saved successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/jobs/saved/list
router.get('/saved/list', (req, res) => {
    try {
        const saved = db.prepare('SELECT job_id FROM user_saved_jobs WHERE user_id = ?').all(req.user.id);
        const savedIds = saved.map(s => s.job_id);
        const jobs = MOCK_JOBS.filter(j => savedIds.includes(j.id));
        res.json({ jobs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/jobs/saved/:id
router.delete('/saved/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM user_saved_jobs WHERE user_id = ? AND job_id = ?').run(req.user.id, req.params.id);
        res.json({ message: 'Job unsaved' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/jobs/analyze
router.post('/analyze', (req, res) => {
    const { job_description, resume_text } = req.body;
    if (!job_description) return res.status(400).json({ error: 'Job description is required' });

    const matchScore = Math.floor(Math.random() * 40) + 60;
    res.json({
        match_percentage: matchScore,
        matching_skills: ['Python', 'JavaScript', 'Communication', 'Teamwork'],
        missing_skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform'],
        experience_match: Math.floor(Math.random() * 30) + 70,
        education_match: Math.floor(Math.random() * 20) + 80,
        recommendations: [
            'Add AWS experience to your resume',
            'Highlight your experience with containerization',
            'Include specific metrics and achievements'
        ]
    });
});

// POST /api/jobs/match
router.post('/match', (req, res) => {
    const { job_ids } = req.body;
    if (!job_ids || !Array.isArray(job_ids)) return res.status(400).json({ error: 'Job IDs array is required' });

    const matches = job_ids.map(id => ({
        job_id: id,
        match_score: Math.floor(Math.random() * 40) + 60,
        matching_skills: ['Python', 'JavaScript', 'React'],
        missing_skills: ['Docker', 'AWS']
    }));
    res.json({ matches });
});

// POST /api/jobs/improve
router.post('/improve', (req, res) => {
    const { resume_text, job_title } = req.body;
    if (!resume_text) return res.status(400).json({ error: 'Resume text is required' });

    res.json({
        original_sections: ['contact', 'summary', 'experience', 'education', 'skills'],
        suggested_order: ['summary', 'skills', 'experience', 'education', 'contact'],
        improvements: [
            'Move skills section above experience to highlight relevant technologies',
            'Add a professional summary focusing on achievements',
            'Quantify experience with specific metrics',
            'Include relevant certifications and courses'
        ],
        optimized_content: resume_text + '\n\n--- Optimized with improved section ordering ---'
    });
});

module.exports = router;
