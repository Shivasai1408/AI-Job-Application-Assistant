const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

async function start() {
    const { initDb } = require('./backend/db');
    await initDb();
    console.log('Database initialized');

    const app = express();
    const PORT = process.env.PORT || 3000;

    app.use(cors());
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(path.join(__dirname, 'frontend')));

    // Import routes AFTER db is initialized
    const authRoutes = require('./backend/routes/auth');
    const resumeRoutes = require('./backend/routes/resumes');
    const jobRoutes = require('./backend/routes/jobs');
    const applicationRoutes = require('./backend/routes/applications');
    const coverLetterRoutes = require('./backend/routes/cover_letters');
    const interviewRoutes = require('./backend/routes/interviews');
    const alertRoutes = require('./backend/routes/alerts');
    const skillGapRoutes = require('./backend/routes/skill_gap');
    const autoApplyRoutes = require('./backend/routes/auto_apply');
    const careerRoutes = require('./backend/routes/career');
    const interviewPrepRoutes = require('./backend/routes/interview_prep');
    const emailRoutes = require('./backend/routes/email');
    const portfolioRoutes = require('./backend/routes/portfolio');
    const linkedinRoutes = require('./backend/routes/linkedin');
    const analyticsRoutes = require('./backend/routes/analytics');
    const adminRoutes = require('./backend/routes/admin');
    const downloadRoutes = require('./backend/routes/downloads');

    app.use('/api/auth', authRoutes);
    app.use('/api/resumes', resumeRoutes);
    app.use('/api/jobs', jobRoutes);
    app.use('/api/applications', applicationRoutes);
    app.use('/api/cover-letters', coverLetterRoutes);
    app.use('/api/interviews', interviewRoutes);
    app.use('/api/alerts', alertRoutes);
    app.use('/api/skills', skillGapRoutes);
    app.use('/api/auto-apply', autoApplyRoutes);
    app.use('/api/career', careerRoutes);
    app.use('/api/interview-prep', interviewPrepRoutes);
    app.use('/api/email', emailRoutes);
    app.use('/api/portfolio', portfolioRoutes);
    app.use('/api/linkedin', linkedinRoutes);
    app.use('/api/analytics', analyticsRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/downloads', downloadRoutes);

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
    });
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
    });

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

start().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
