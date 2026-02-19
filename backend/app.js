const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');


module.exports = function AppFactory() {
    const SELF = {
        app: express(),
    };

    return {
        init: () => {
            SELF.app.use(cors({
                origin: config.nodeEnv === 'development' ? 'http://localhost:5173' : false,
                credentials: true,
            }));
            SELF.app.use(express.json());
            SELF.app.use(cookieParser());

            SELF.app.use('/api', routes);

            SELF.app.use(errorHandler);

            return SELF.app;
        },
    };
};
