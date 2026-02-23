const LogUtil = require('../utils/logUtil');

module.exports = (err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    if (status >= 500) {
        LogUtil.error(`[Error] ${err.message}`);
    }

    res.status(status).json({ error: message });
};
