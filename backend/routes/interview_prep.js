const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../auth');

router.use(authMiddleware);

const MOCK_QUESTIONS = [
    { id: 1, category: 'technical', question: 'Explain the difference between REST and GraphQL APIs.', difficulty: 'Intermediate', sample_answer: 'REST uses fixed endpoints for resources and returns predefined data structures, while GraphQL allows clients to query exactly the data they need from a single endpoint. REST typically uses HTTP methods (GET, POST, PUT, DELETE) for CRUD operations, while GraphQL uses queries, mutations, and subscriptions.' },
    { id: 2, category: 'technical', question: 'What is the time complexity of binary search? Explain with an example.', difficulty: 'Beginner', sample_answer: 'Binary search has O(log n) time complexity. It works by repeatedly dividing a sorted array in half and checking which half the target value lies in. For example, searching for a number in a sorted array of 1000 elements takes at most 10 comparisons (log2(1000) ≈ 10).' },
    { id: 3, category: 'technical', question: 'How does garbage collection work in JavaScript?', difficulty: 'Intermediate', sample_answer: 'JavaScript uses automatic garbage collection, primarily through mark-and-sweep. The garbage collector marks all reachable objects starting from roots (global objects, local variables), then sweeps away unmarked objects. Modern engines use generational collection to optimize performance.' },
    { id: 4, category: 'system-design', question: 'Design a URL shortening service like TinyURL.', difficulty: 'Advanced', sample_answer: 'Key components: API gateway for request handling, a hash function to generate short URLs (Base62 encoding), a database to store mappings (using a distributed key-value store like Redis or Cassandra), and redirect logic (HTTP 301/302). Consider rate limiting, analytics tracking, and caching frequently accessed URLs.' },
    { id: 5, category: 'behavioral', question: 'Tell me about a time you had to deal with a difficult team member.', difficulty: 'Beginner', sample_answer: 'Use the STAR method: Situation - describe the context, Task - your responsibility, Action - steps you took to address the issue (e.g., private conversation, focusing on shared goals, involving management if needed), Result - positive outcome like improved collaboration or project success.' },
    { id: 6, category: 'technical', question: 'What is the difference between SQL and NoSQL databases?', difficulty: 'Beginner', sample_answer: 'SQL databases are relational with fixed schemas, support ACID transactions, and use structured query language. NoSQL databases are non-relational with flexible schemas, scale horizontally better, and come in types: document (MongoDB), key-value (Redis), column-family (Cassandra), and graph (Neo4j).' },
    { id: 7, category: 'system-design', question: 'How would you design a real-time chat application?', difficulty: 'Advanced', sample_answer: 'Use WebSocket connections for real-time communication. Architecture includes: message queue (RabbitMQ/Kafka) for message delivery, WebSocket servers for persistent connections, database for message history, and presence service for online status. Consider horizontal scaling with sticky sessions or a shared state store like Redis.' },
    { id: 8, category: 'behavioral', question: 'Describe a project you are most proud of.', difficulty: 'Beginner', sample_answer: 'Choose a project where you made significant impact. Describe: the problem it solved, your specific contributions, technologies used, challenges overcome, and measurable results (e.g., improved performance by 40%, served X users, reduced costs by Y%).' }
];

// POST /api/interview-prep/generate
router.post('/generate', (req, res) => {
    try {
        const { job_title, company, categories, difficulty, count = 5 } = req.body;
        if (!job_title) return res.status(400).json({ error: 'Job title is required' });

        let questions = [...MOCK_QUESTIONS];
        if (categories && Array.isArray(categories)) {
            questions = questions.filter(q => categories.includes(q.category));
        }
        if (difficulty) {
            questions = questions.filter(q => q.difficulty.toLowerCase() === difficulty.toLowerCase());
        }

        const selected = questions.sort(() => 0.5 - Math.random()).slice(0, count);

        const now = new Date().toISOString();
        for (const q of selected) {
            db.prepare(
                'INSERT INTO interview_questions (user_id, job_title, company, category, question, sample_answer, difficulty, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            ).run(req.user.id, job_title, company || null, q.category, q.question, q.sample_answer, q.difficulty, now);
        }

        res.json({
            message: `Generated ${selected.length} interview questions`,
            job_title,
            company: company || null,
            questions: selected,
            preparation_tips: [
                'Practice answering out loud, not just in your head',
                'Time your responses (aim for 2-3 minutes per answer)',
                'Use the STAR method for behavioral questions',
                'Review the company culture and values',
                'Prepare questions to ask the interviewer'
            ]
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/interview-prep/evaluate
router.post('/evaluate', (req, res) => {
    try {
        const { question, answer, job_title, company, category } = req.body;
        if (!question || !answer) return res.status(400).json({ error: 'Question and answer are required' });

        const now = new Date().toISOString();
        const score = Math.floor(Math.random() * 40) + 60;
        const feedback = score >= 90 ? 'Excellent answer! Very comprehensive and well-structured.' :
                        score >= 80 ? 'Good answer with solid structure. Could add more specific examples.' :
                        score >= 70 ? 'Decent answer but needs more detail and structure. Try using the STAR method.' :
                        'Needs improvement. Focus on structuring your answer and providing concrete examples.';

        db.prepare(
            'INSERT INTO interview_sessions (user_id, job_title, company, question, category, user_answer, score, feedback, suggestions, confidence_assessment, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(req.user.id, job_title || null, company || null, question, category || null, answer, score, feedback,
            score >= 80 ? ['Great job! Keep practicing to maintain this level.'] :
            ['Practice structuring your answers with STAR', 'Include more quantifiable achievements', 'Work on pacing and clarity'],
            score >= 80 ? 'Confident' : score >= 70 ? 'Moderate' : 'Needs Practice', now);

        res.json({
            score,
            feedback,
            suggestions: [
                'Use more specific examples from your experience',
                'Quantify your achievements with numbers',
                'Structure your answer with a clear beginning, middle, and end',
                'Connect your experience to the job requirements'
            ],
            strengths: ['Clear communication', 'Relevant experience', 'Problem-solving approach'],
            areas_for_improvement: score < 80 ? ['Structure', 'Specificity', 'Conciseness'] : ['Keep refining your delivery']
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/interview-prep/questions
router.get('/questions', (req, res) => {
    try {
        const { category, difficulty } = req.query;
        let questions = [...MOCK_QUESTIONS];
        if (category) questions = questions.filter(q => q.category === category);
        if (difficulty) questions = questions.filter(q => q.difficulty.toLowerCase() === difficulty.toLowerCase());
        res.json({ questions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
