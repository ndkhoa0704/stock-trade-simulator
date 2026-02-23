const cluster = require('node:cluster');
const os = require('node:os');
const config = require('./config');
const LogUtil = require('./utils/logUtil');

const numWorkers = config.workers > 0 ? config.workers : os.cpus().length;

if (cluster.isPrimary) {
    const SchedulerService = require('./services/scheduler.service');
    LogUtil.info(`[Master] PID ${process.pid} - spawning ${numWorkers} workers`);

    for (let i = 0; i < numWorkers; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        LogUtil.info(`[Master] Worker ${worker.process.pid} exited (${signal || code}). Restarting...`);
        cluster.fork();
    });

    LogUtil.info('[Master] Starting scheduled jobs');
    SchedulerService.startJobs();
} else {
    const db = require('./config/db');
    const redisConfig = require('./config/redis');
    const appFactory = require('./app');
    const fs = require('node:fs');
    const path = require('node:path');
    const express = require('express');

    db.connect().then(() => {
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
            LogUtil.info(`[Worker ${process.pid}] Listening on port ${config.port}`);
        });
    }).catch((err) => {
        LogUtil.error(`[Worker] Error: ${err.message}`);
        process.exit(1);
    });
}
