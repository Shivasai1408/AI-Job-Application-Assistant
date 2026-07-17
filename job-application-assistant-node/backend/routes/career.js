const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../auth');

router.use(authMiddleware);

const CAREER_ADVICE = [
    { type: 'networking', title: 'Building a Strong Professional Network', content: 'Networking is crucial for career growth. Attend industry events, join professional organizations, and engage on LinkedIn. Focus on building genuine relationships rather than just collecting contacts.', tips: ['Attend at least 2 networking events per month', 'Follow up with new connections within 48 hours', 'Offer help before asking for favors', 'Join industry-specific Slack communities'] },
    { type: 'resume', title: 'Optimizing Your Resume for ATS', content: 'Applicant Tracking Systems (ATS) screen resumes before they reach human eyes. Use relevant keywords from the job description, keep formatting simple, and use standard section headings.', tips: ['Use a clean, single-column layout', 'Include keywords from job descriptions', 'Save as PDF unless specified otherwise', 'Quantify achievements with numbers'] },
    { type: 'interview', title: 'Acing Your Technical Interview', content: 'Technical interviews typically include coding challenges, system design questions, and behavioral assessments. Practice regularly, study common patterns, and communicate your thought process clearly.', tips: ['Practice on LeetCode and HackerRank', 'Review system design fundamentals', 'Prepare stories for behavioral questions', 'Ask clarifying questions before answering'] },
    { type: 'career-change', title: 'Successfully Switching Careers', content: 'Career transitions require strategic planning. Identify transferable skills, fill knowledge gaps through courses or projects, and leverage your unique background as an advantage.', tips: ['Take online courses to build foundational knowledge', 'Work on personal projects for portfolio', 'Find mentors in your target field', 'Consider internships or contract work'] },
    { type: 'salary', title: 'Negotiating Your Salary', content: 'Salary negotiation is an expected part of the job offer process. Research market rates, know your minimum, and practice your pitch. Remember that total compensation includes more than just base salary.', tips: ['Research salaries on Glassdoor and Levels.fyi', 'Consider total compensation (bonus, equity, benefits)', 'Practice your negotiation conversation', 'Get offers in writing before negotiating'] },
    { type: 'growth', title: 'Planning Your Career Growth', content: 'Take ownership of your career development. Set clear goals, seek regular feedback, and continuously learn new skills. Find mentors and sponsors who can advocate for you.', tips: ['Set quarterly career goals', 'Seek feedback from managers and peers', 'Invest 5-10 hours weekly in learning', 'Find both mentors and sponsors'] }
];

// POST /api/career/advice
router.post('/advice', (req, res) => {
    try {
        const { advice_type, question } = req.body;
        if (advice_type) {
            const advice = CAREER_ADVICE.find(a => a.type === advice_type);
            if (advice) return res.json({ advice });
        }

        const now = new Date().toISOString();
        if (question) {
            db.prepare(
                'INSERT INTO career_advice (user_id, advice_type, input_data, result_data, created_at) VALUES (?, ?, ?, ?, ?)'
            ).run(req.user.id, 'query', question, JSON.stringify({ response: `Here's advice regarding: ${question}` }), now);
        }

        res.json({ advice: CAREER_ADVICE, count: CAREER_ADVICE.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/career/salary-prediction
router.post('/salary-prediction', (req, res) => {
    try {
        const { job_title, location, experience_years } = req.body;
        if (!job_title || !location || experience_years === undefined) {
            return res.status(400).json({ error: 'Job title, location, and experience years are required' });
        }

        const baseByRole = {
            'Software Engineer': { min: 80000, max: 200000 },
            'Senior Software Engineer': { min: 120000, max: 280000 },
            'Data Scientist': { min: 90000, max: 220000 },
            'Product Manager': { min: 100000, max: 230000 },
            'DevOps Engineer': { min: 95000, max: 210000 },
            'Full Stack Developer': { min: 75000, max: 180000 },
            'Frontend Developer': { min: 70000, max: 170000 },
            'Engineering Manager': { min: 150000, max: 350000 },
            'AI Engineer': { min: 130000, max: 300000 },
            'Technical Lead': { min: 140000, max: 280000 }
        };

        const roleData = baseByRole[job_title] || { min: 60000, max: 150000 };
        const expFactor = Math.min(experience_years / 10, 1);
        const locationFactor = location.includes('San Francisco') || location.includes('New York') ? 1.3 :
                              location.includes('Seattle') || location.includes('Boston') ? 1.2 :
                              location.includes('Austin') || location.includes('Denver') ? 1.1 : 0.9;

        const avgMin = roleData.min + (roleData.max - roleData.min) * 0.2 * expFactor;
        const avgMax = roleData.min + (roleData.max - roleData.min) * 0.8 * expFactor;
        const avgSalary = (avgMin + avgMax) / 2 * locationFactor;

        const prediction = {
            job_title,
            location,
            experience_years,
            predicted_min_salary: Math.round(avgMin * locationFactor),
            predicted_max_salary: Math.round(avgMax * locationFactor),
            predicted_avg_salary: Math.round(avgSalary),
            currency: 'USD',
            percentile_25: Math.round(avgMin * locationFactor * 0.85),
            percentile_75: Math.round(avgMax * locationFactor * 1.15),
            confidence_score: experience_years >= 5 ? 'High' : experience_years >= 2 ? 'Medium' : 'Low'
        };

        db.prepare(
            'INSERT INTO salary_predictions (user_id, job_title, location, experience_years, predicted_min_salary, predicted_max_salary, predicted_avg_salary, currency, percentile_25, percentile_75, confidence_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(req.user.id, job_title, location, experience_years, prediction.predicted_min_salary, prediction.predicted_max_salary, prediction.predicted_avg_salary, prediction.currency, prediction.percentile_25, prediction.percentile_75, prediction.confidence_score);

        res.json(prediction);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/career/trending-skills
router.get('/trending-skills', (req, res) => {
    res.json({
        trending_skills: [
            { skill: 'Generative AI', growth: 320, category: 'AI', demand: 'Very High' },
            { skill: 'Large Language Models', growth: 280, category: 'AI', demand: 'Very High' },
            { skill: 'Python', growth: 45, category: 'Programming', demand: 'High' },
            { skill: 'TypeScript', growth: 65, category: 'Programming', demand: 'High' },
            { skill: 'Kubernetes', growth: 85, category: 'DevOps', demand: 'High' },
            { skill: 'Data Engineering', growth: 95, category: 'Data', demand: 'High' },
            { skill: 'Machine Learning', growth: 55, category: 'AI', demand: 'High' },
            { skill: 'Cybersecurity', growth: 120, category: 'Security', demand: 'Very High' },
            { skill: 'Cloud Computing', growth: 70, category: 'DevOps', demand: 'High' },
            { skill: 'React', growth: 30, category: 'Frontend', demand: 'High' }
        ],
        categories: ['AI', 'Programming', 'DevOps', 'Data', 'Security', 'Frontend'],
        last_updated: new Date().toISOString()
    });
});

// GET /api/career/certifications
router.get('/certifications', (req, res) => {
    res.json({
        certifications: [
            { name: 'AWS Certified Solutions Architect - Associate', provider: 'Amazon', category: 'Cloud', difficulty: 'Intermediate', estimated_study_time: '3-6 months', cost: 150, url: 'https://aws.amazon.com/certification/' },
            { name: 'Google Cloud Professional Data Engineer', provider: 'Google', category: 'Data', difficulty: 'Advanced', estimated_study_time: '3-6 months', cost: 200, url: 'https://cloud.google.com/certification/' },
            { name: 'Microsoft Certified: Azure Developer Associate', provider: 'Microsoft', category: 'Cloud', difficulty: 'Intermediate', estimated_study_time: '2-4 months', cost: 165, url: 'https://learn.microsoft.com/en-us/certifications/' },
            { name: 'Certified Kubernetes Administrator (CKA)', provider: 'CNCF', category: 'DevOps', difficulty: 'Advanced', estimated_study_time: '2-4 months', cost: 375, url: 'https://www.cncf.io/certification/cka/' },
            { name: 'CompTIA Security+', provider: 'CompTIA', category: 'Security', difficulty: 'Beginner', estimated_study_time: '2-3 months', cost: 392, url: 'https://www.comptia.org/certifications/security' },
            { name: 'TensorFlow Developer Certificate', provider: 'Google', category: 'AI', difficulty: 'Intermediate', estimated_study_time: '2-4 months', cost: 70, url: 'https://www.tensorflow.org/certificate/' },
            { name: 'PMP (Project Management Professional)', provider: 'PMI', category: 'Management', difficulty: 'Advanced', estimated_study_time: '4-8 months', cost: 555, url: 'https://www.pmi.org/certifications/project-management-pmp' },
            { name: 'Certified ScrumMaster (CSM)', provider: 'Scrum Alliance', category: 'Agile', difficulty: 'Beginner', estimated_study_time: '2-4 weeks', cost: 995, url: 'https://www.scrumalliance.org/get-certified' }
        ]
    });
});

module.exports = router;
