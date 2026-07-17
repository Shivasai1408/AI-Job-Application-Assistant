const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../auth');

router.use(authMiddleware);

const EMAIL_TEMPLATES = [
    { id: 1, email_type: 'application', name: 'Job Application', subject_template: 'Application for {job_title} - {full_name}', body_template: 'Dear Hiring Manager,\n\nI am writing to apply for the {job_title} position at {company}. I have attached my resume and cover letter for your review.\n\nBest regards,\n{full_name}' },
    { id: 2, email_type: 'follow_up', name: 'Follow Up After Interview', subject_template: 'Thank You - Interview for {job_title}', body_template: 'Dear {recipient_name},\n\nThank you for taking the time to interview me for the {job_title} position. I enjoyed learning more about the role and {company}.\n\nI look forward to hearing from you.\n\nBest regards,\n{full_name}' },
    { id: 3, email_type: 'networking', name: 'Networking Outreach', subject_template: 'Connecting regarding opportunities at {company}', body_template: 'Hi {recipient_name},\n\nI came across your profile and was impressed by your work at {company}. I am currently exploring opportunities in {field} and would love to connect and learn more about your experience.\n\nBest,\n{full_name}' },
    { id: 4, email_type: 'acceptance', name: 'Offer Acceptance', subject_template: 'Offer Acceptance - {job_title}', body_template: 'Dear {recipient_name},\n\nI am pleased to accept the offer for the {job_title} position at {company}. I look forward to joining the team and contributing to {company}\'s success.\n\nBest regards,\n{full_name}' },
    { id: 5, email_type: 'rejection', name: 'Application Withdrawal', subject_template: 'Application Withdrawal - {job_title}', body_template: 'Dear {recipient_name},\n\nI wish to withdraw my application for the {job_title} position at {company}. I appreciate your consideration and wish you the best in finding the right candidate.\n\nBest regards,\n{full_name}' },
    { id: 6, email_type: 'referral', name: 'Referral Request', subject_template: 'Referral request - {job_title} at {company}', body_template: 'Hi {recipient_name},\n\nI hope this message finds you well. I am very interested in the {job_title} role at {company} and was wondering if you would be comfortable referring me.\n\nBest,\n{full_name}' }
];

// POST /api/email/generate
router.post('/generate', (req, res) => {
    try {
        const { email_type, recipient_name, company_name, job_title, tone } = req.body;
        if (!email_type) return res.status(400).json({ error: 'Email type is required' });

        const template = EMAIL_TEMPLATES.find(t => t.email_type === email_type);
        if (!template) return res.status(400).json({ error: 'Invalid email type' });

        const now = new Date().toISOString();
        const subject = template.subject_template
            .replace('{job_title}', job_title || 'the position')
            .replace('{full_name}', req.user.username || 'Applicant')
            .replace('{company}', company_name || 'the company')
            .replace('{recipient_name}', recipient_name || 'Hiring Manager');
        const body = template.body_template
            .replace('{job_title}', job_title || 'the position')
            .replace('{full_name}', req.user.username || 'Applicant')
            .replace('{company}', company_name || 'the company')
            .replace('{recipient_name}', recipient_name || 'Hiring Manager')
            .replace('{field}', 'technology');

        db.prepare(
            'INSERT INTO email_history (user_id, email_type, recipient_name, company_name, job_title, subject, body, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(req.user.id, email_type, recipient_name || null, company_name || null, job_title || null, subject, body, now);

        res.json({
            email_type,
            subject,
            body,
            tone: tone || 'professional',
            generated_at: now
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/email/templates
router.get('/templates', (req, res) => {
    res.json({ templates: EMAIL_TEMPLATES });
});

// GET /api/email/history
router.get('/history', (req, res) => {
    try {
        const history = db.prepare('SELECT * FROM email_history WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
