const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const payload = jwt.verify(token, config.jwt.secret);
        req.user = { id: payload.sub, username: payload.username };
        next();
    } catch (_err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};