const config = require('./config');
const path = require('node:path');
const fs = require('node:fs');
const express = require('express');


const db = require('./config/db')();
const redisConfig = require('./config/redis')();
const appFactory = require('./app');

(async () => {
    await db.connect();
    redisConfig.connect();

    const app = appFactory().init();
    // Serve static files from Vue build in production
    const clientDistPath = path.join(__dirname, '../frontend/dist');
    if (fs.existsSync(clientDistPath)) {
        app.use(express.static(clientDistPath));

        // Handle SPA routing
        app.get('*', (_req, res) => {
            res.sendFile(path.join(clientDistPath, 'index.html'));
        });
    }

    app.listen(config.port, () => {
        console.log(`Listening on port ${config.port}`);
    });
})();
