const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const { FeeConfig } = require('../models/feeConfig');
const config = require('../config');

function AuthService() {
    const SELF = {
        generateToken: (user) => {
            return jwt.sign(
                { sub: user._id.toString(), username: user.username },
                config.jwt.secret,
                { expiresIn: config.jwt.expiresIn }
            );
        },
    };

    return {
        register: async ({ username, email, password }) => {
            const exists = await User.findOne({ $or: [{ username }, { email }] });
            if (exists) {
                const err = new Error('Username or email already in use');
                err.status = 409;
                throw err;
            }

            const passwordHash = await bcrypt.hash(password, 10);
            const user = await User.create({ username, email, passwordHash });

            await FeeConfig.create({ userId: user._id });

            const token = SELF.generateToken(user);
            return { user: { id: user._id, username: user.username, email: user.email }, token };
        },

        login: async ({ username, password }) => {
            const user = await User.findOne({ username });
            if (!user) {
                const err = new Error('Invalid credentials');
                err.status = 401;
                throw err;
            }

            const valid = await bcrypt.compare(password, user.passwordHash);
            if (!valid) {
                const err = new Error('Invalid credentials');
                err.status = 401;
                throw err;
            }

            const token = SELF.generateToken(user);
            return { user: { id: user._id, username: user.username, email: user.email }, token };
        },

        getMe: async (userId) => {
            const user = await User.findById(userId).select('-passwordHash');
            if (!user) {
                const err = new Error('User not found');
                err.status = 404;
                throw err;
            }
            return user;
        },
    };
};

module.exports = AuthService();