const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const JWT_SECRET = process.env.SECRET_KEY || 'fallback-secret';

function hashPassword(password) {
    return bcrypt.hashSync(password, 10);
}

function verifyPassword(password, hash) {
    return bcrypt.compareSync(password, hash);
}

function generateToken(user) {
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    return jwt.sign(
        { sub: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn }
    );
}

function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header provided' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ error: 'Invalid authorization format. Use: Bearer <token>' });
    }

    const token = parts[1];

    try {
        const decoded = verifyToken(token);
        req.user = { id: decoded.sub, username: decoded.username };
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token has expired' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
}

module.exports = {
    hashPassword,
    verifyPassword,
    generateToken,
    verifyToken,
    authMiddleware
};
