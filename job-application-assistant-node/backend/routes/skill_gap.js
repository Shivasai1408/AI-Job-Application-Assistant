const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../auth');

router.use(authMiddleware);

// POST /api/skills/analyze-gap
router.post('/analyze-gap', (req, res) => {
    try {
        const { target_role, current_skills, experience_level } = req.body;
        if (!target_role || !current_skills) {
            return res.status(400).json({ error: 'Target role and current skills are required' });
        }

        const skillData = {
            'Software Engineer': {
                required: ['Python', 'Java', 'Data Structures', 'Algorithms', 'System Design', 'SQL', 'Git', 'Agile'],
                recommended: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Microservices', 'TypeScript']
            },
            'Data Scientist': {
                required: ['Python', 'SQL', 'Machine Learning', 'Statistics', 'Data Visualization', 'Deep Learning'],
                recommended: ['TensorFlow', 'PyTorch', 'Spark', 'NLP', 'Computer Vision', 'Big Data']
            },
            'Product Manager': {
                required: ['Product Strategy', 'User Research', 'Analytics', 'A/B Testing', 'Agile', 'Communication'],
                recommended: ['SQL', 'Python', 'Wireframing', 'Roadmapping', 'Stakeholder Management']
            },
            'DevOps Engineer': {
                required: ['Linux', 'Docker', 'Kubernetes', 'CI/CD', 'Cloud', 'Scripting'],
                recommended: ['Terraform', 'Ansible', 'Prometheus', 'Grafana', 'Service Mesh']
            }
        };

        const roleSkills = skillData[target_role] || {
            required: ['Communication', 'Problem Solving', 'Teamwork', 'Technical Skills'],
            recommended: ['Leadership', 'Project Management', 'Domain Knowledge']
        };

        const currentSet = current_skills.split(',').map(s => s.trim().toLowerCase());
        const missingRequired = roleSkills.required.filter(s => !currentSet.includes(s.toLowerCase()));
        const missingRecommended = roleSkills.recommended.filter(s => !currentSet.includes(s.toLowerCase()));
        const matchedRequired = roleSkills.required.filter(s => currentSet.includes(s.toLowerCase()));
        const skillGapPercent = Math.round((matchedRequired.length / roleSkills.required.length) * 100);

        const learningResources = [
            { skill: 'Docker', courses: ['Docker Mastery on Udemy', 'Docker & Kubernetes: The Practical Guide'], duration: '2-4 weeks' },
            { skill: 'Kubernetes', courses: ['Kubernetes for Developers', 'Certified Kubernetes Administrator (CKA)'], duration: '4-8 weeks' },
            { skill: 'AWS', courses: ['AWS Solutions Architect Associate', 'AWS Developer Associate'], duration: '4-12 weeks' },
            { skill: 'Python', courses: ['Python for Everybody', 'Advanced Python Mastery'], duration: '4-8 weeks' },
            { skill: 'Machine Learning', courses: ['Machine Learning by Stanford (Coursera)', 'Fast.ai Practical Deep Learning'], duration: '8-16 weeks' }
        ];

        res.json({
            target_role,
            skill_gap_percentage: skillGapPercent,
            matched_skills: matchedRequired,
            missing_required: missingRequired,
            missing_recommended: missingRecommended,
            total_required: roleSkills.required.length,
            total_recommended: roleSkills.recommended.length,
            learning_resources: learningResources.filter(r => missingRequired.concat(missingRecommended).includes(r.skill)),
            recommendations: [
                'Focus on learning the most requested skills first',
                'Build projects that demonstrate proficiency in missing areas',
                'Consider obtaining relevant certifications',
                'Practice with real-world problems and case studies'
            ]
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/skills/learning-resources
router.post('/learning-resources', (req, res) => {
    try {
        const { skills, target_role } = req.body;
        if (!skills || !Array.isArray(skills)) {
            return res.status(400).json({ error: 'Skills array is required' });
        }

        const resources = skills.map(skill => ({
            skill,
            courses: [
                { name: `${skill} Fundamentals`, platform: 'Coursera', duration: '4-6 weeks', difficulty: 'Beginner', url: `https://example.com/courses/${skill.toLowerCase().replace(/\s+/g, '-')}-fundamentals` },
                { name: `Advanced ${skill}`, platform: 'Udemy', duration: '6-8 weeks', difficulty: 'Advanced', url: `https://example.com/courses/advanced-${skill.toLowerCase().replace(/\s+/g, '-')}` }
            ],
            books: [`${skill}: The Complete Guide`, `Mastering ${skill}`],
            certifications: skill === 'AWS' ? ['AWS Certified Solutions Architect'] :
                            skill === 'Python' ? ['PCAP - Certified Python Programmer'] :
                            skill === 'Docker' ? ['Docker Certified Associate'] :
                            [`${skill} Professional Certificate`],
            estimated_time: '4-12 weeks',
            difficulty: skill === 'Machine Learning' || skill === 'Kubernetes' ? 'Advanced' : 'Intermediate'
        }));

        res.json({ target_role: target_role || null, resources });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
