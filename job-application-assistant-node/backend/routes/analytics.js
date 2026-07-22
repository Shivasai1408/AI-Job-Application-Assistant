const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../auth');

router.use(authMiddleware);

// GET /api/analytics/overview
router.get('/overview', (req, res) => {
    try {
        const applications = db.prepare('SELECT * FROM applications WHERE user_id = ?').all(req.user.id);
        const interviews = db.prepare('SELECT * FROM interviews WHERE user_id = ?').all(req.user.id);
        const alerts = db.prepare('SELECT * FROM job_alerts WHERE user_id = ?').all(req.user.id);
        const resumes = db.prepare('SELECT * FROM resumes WHERE user_id = ?').all(req.user.id);

        const applied = applications.filter(a => a.status === 'applied').length;
        const interviewing = applications.filter(a => a.status === 'interview').length;
        const offers = applications.filter(a => a.status === 'offer').length;
        const rejected = applications.filter(a => a.status === 'rejected').length;

        res.json({
            total_applications: applications.length,
            applications_by_status: { applied, interviewing, offers, rejected, draft: applications.filter(a => a.status === 'draft').length },
            total_interviews: interviews.length,
            upcoming_interviews: interviews.filter(i => i.status === 'scheduled').length,
            completed_interviews: interviews.filter(i => i.status === 'completed').length,
            active_alerts: alerts.filter(a => a.is_active).length,
            total_resumes: resumes.length,
            interview_success_rate: interviews.length > 0 ? Math.round((offers / applications.length) * 100) : 0,
            response_rate: applications.length > 0 ? Math.round(((applied + interviewing + offers) / applications.length) * 100) : 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/analytics/monthly
router.get('/monthly', (req, res) => {
    try {
        const now = new Date();
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push(d.toISOString().substring(0, 7));
        }

        const monthlyData = months.map(month => ({
            month,
            applications: Math.floor(Math.random() * 20) + 5,
            interviews: Math.floor(Math.random() * 8) + 1,
            offers: Math.floor(Math.random() * 3),
            rejected: Math.floor(Math.random() * 10) + 2
        }));

        res.json({ monthly: monthlyData });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/analytics/skills-growth
router.get('/skills-growth', (req, res) => {
    try {
        res.json({
            skills_progress: [
                { skill: 'Python', current_level: 85, target_level: 95, growth: 10 },
                { skill: 'JavaScript', current_level: 80, target_level: 90, growth: 15 },
                { skill: 'React', current_level: 75, target_level: 85, growth: 12 },
                { skill: 'Node.js', current_level: 70, target_level: 80, growth: 8 },
                { skill: 'SQL', current_level: 82, target_level: 90, growth: 5 },
                { skill: 'Docker', current_level: 55, target_level: 75, growth: 20 },
                { skill: 'AWS', current_level: 50, target_level: 70, growth: 25 },
                { skill: 'TypeScript', current_level: 65, target_level: 80, growth: 18 }
            ],
            overall_progress: 60,
            skills_added_this_month: 2,
            learning_hours_this_month: 25
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/analytics/ats-trend
router.get('/ats-trend', (req, res) => {
    try {
        const resumes = db.prepare('SELECT ats_score, created_at FROM resumes WHERE user_id = ? AND ats_score IS NOT NULL ORDER BY created_at ASC').all(req.user.id);
        const trend = resumes.map(r => ({ date: r.created_at, score: r.ats_score }));

        res.json({
            ats_trend: trend.length > 0 ? trend : [
                { date: '2026-05-01', score: 65 }, { date: '2026-05-15', score: 68 },
                { date: '2026-06-01', score: 72 }, { date: '2026-06-15', score: 75 },
                { date: '2026-07-01', score: 78 }, { date: '2026-07-15', score: 82 }
            ],
            current_average: resumes.length > 0 ? Math.round(resumes.reduce((s, r) => s + r.ats_score, 0) / resumes.length) : 75,
            improvement: resumes.length >= 2 ? (resumes[resumes.length - 1].ats_score - resumes[0].ats_score) : 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/analytics/success-rate
router.get('/success-rate', (req, res) => {
    try {
        const applications = db.prepare('SELECT * FROM applications WHERE user_id = ?').all(req.user.id);
        const total = applications.length;
        const offers = applications.filter(a => a.status === 'offer' || a.status === 'accepted').length;
        const interviews = applications.filter(a => a.status === 'interview' || a.status === 'offer' || a.status === 'accepted').length;

        res.json({
            application_to_interview_rate: total > 0 ? Math.round((interviews / total) * 100) : 0,
            interview_to_offer_rate: interviews > 0 ? Math.round((offers / interviews) * 100) : 0,
            overall_success_rate: total > 0 ? Math.round((offers / total) * 100) : 0,
            total_applications: total,
            total_interviews: interviews,
            total_offers: offers,
            average_applications_per_offer: offers > 0 ? Math.round(total / offers) : 0,
            by_source: {
                linkedin: { applications: Math.floor(total * 0.4), interviews: Math.floor(interviews * 0.4), offers: Math.floor(offers * 0.4) },
                indeed: { applications: Math.floor(total * 0.3), interviews: Math.floor(interviews * 0.3), offers: Math.floor(offers * 0.3) },
                glassdoor: { applications: Math.floor(total * 0.2), interviews: Math.floor(interviews * 0.2), offers: Math.floor(offers * 0.15) },
                other: { applications: total - Math.floor(total * 0.9), interviews: interviews - Math.floor(interviews * 0.9), offers: offers - Math.floor(offers * 0.85) }
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
