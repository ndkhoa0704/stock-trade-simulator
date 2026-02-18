const authService = require('../services/auth.service')();

module.exports = function AuthController() {
    const SELF = {
        cookieOptions: {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        },
    };

    return {
        register: async (req, res, next) => {
            try {
                const { username, email, password } = req.body;
                if (!username || !email || !password) {
                    return res.status(400).json({ error: 'username, email, and password are required' });
                }
                const { user, token } = await authService.register({ username, email, password });
                res.cookie('token', token, SELF.cookieOptions);
                res.status(201).json({ user });
            } catch (err) {
                next(err);
            }
        },

        login: async (req, res, next) => {
            try {
                const { username, password } = req.body;
                if (!username || !password) {
                    return res.status(400).json({ error: 'username and password are required' });
                }
                const { user, token } = await authService.login({ username, password });
                res.cookie('token', token, SELF.cookieOptions);
                res.json({ user });
            } catch (err) {
                next(err);
            }
        },

        logout: (_req, res) => {
            res.clearCookie('token');
            res.json({ message: 'Logged out' });
        },

        me: async (req, res, next) => {
            try {
                const user = await authService.getMe(req.user.id);
                res.json({ user });
            } catch (err) {
                next(err);
            }
        },
    };
};
