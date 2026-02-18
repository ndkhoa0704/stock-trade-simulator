module.exports = function ErrorHandler() {
    return (err, _req, res, _next) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || 'Internal Server Error';

        if (status >= 500) {
            console.error('[Error]', err);
        }

        res.status(status).json({ error: message });
    };
};
