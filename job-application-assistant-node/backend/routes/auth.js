const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { hashPassword, verifyPassword, generateToken, authMiddleware } = require('../auth');

// POST /api/auth/register
router.post('/register', (req, res) => {
    try {
        const { username, email, password, full_name } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
        if (existing) {
            return res.status(409).json({ error: 'Username or email already exists' });
        }

        const hashed = hashPassword(password);
        const now = new Date().toISOString();
        const result = db.prepare(
            'INSERT INTO users (username, email, hashed_password, full_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(username, email, hashed, full_name || null, now, now);

        const user = { id: result.lastInsertRowid, username, email, full_name: full_name || null };
        const token = generateToken(user);

        res.status(201).json({ message: 'User registered successfully', user, token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (!verifyPassword(password, user.hashed_password)) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = generateToken(user);
        const { hashed_password, ...userData } = user;

        res.json({ message: 'Login successful', user: userData, token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
    try {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const { hashed_password, ...userData } = user;
        res.json(userData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/auth/me
router.put('/me', authMiddleware, (req, res) => {
    try {
        const allowed = ['full_name', 'phone', 'location', 'headline', 'summary', 'skills', 'experience_years'];
        const updates = [];
        const values = [];

        for (const field of allowed) {
            if (req.body[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(req.body[field]);
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push('updated_at = ?');
        values.push(new Date().toISOString());
        values.push(req.user.id);

        db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
        const { hashed_password, ...userData } = user;
        res.json({ message: 'Profile updated', user: userData });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(404).json({ error: 'No account found with this email' });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const resetToken = require('crypto').randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        const now = new Date().toISOString();

        db.prepare(
            'INSERT INTO otps (user_id, email, otp_code, reset_token, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(user.id, email, otpCode, resetToken, expiresAt, now);

        res.json({ message: 'OTP sent to email', otp: otpCode, reset_token: resetToken });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required' });
        }

        const record = db.prepare(
            'SELECT * FROM otps WHERE email = ? AND otp_code = ? AND is_used = 0 AND expires_at > ?'
        ).get(email, otp, new Date().toISOString());

        if (!record) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        res.json({ message: 'OTP verified successfully', reset_token: record.reset_token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/reset-password
router.post('/reset-password', (req, res) => {
    try {
        const { email, reset_token, new_password } = req.body;
        if (!email || !reset_token || !new_password) {
            return res.status(400).json({ error: 'Email, reset token, and new password are required' });
        }

        const record = db.prepare(
            'SELECT * FROM otps WHERE email = ? AND reset_token = ? AND is_used = 0 AND expires_at > ?'
        ).get(email, reset_token, new Date().toISOString());

        if (!record) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        const hashed = hashPassword(new_password);
        db.prepare('UPDATE users SET hashed_password = ?, updated_at = ? WHERE id = ?').run(
            hashed, new Date().toISOString(), record.user_id
        );
        db.prepare('UPDATE otps SET is_used = 1 WHERE id = ?').run(record.id);

        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
