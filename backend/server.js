const cluster = require('node:cluster');
const os = require('node:os');
const config = require('./config');

const numWorkers = config.workers > 0 ? config.workers : os.cpus().length;

if (cluster.isPrimary) {
  console.log(`[Master] PID ${process.pid} - spawning ${numWorkers} workers`);

  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`[Master] Worker ${worker.process.pid} exited (${signal || code}). Restarting...`);
    cluster.fork();
  });
} else {
  const db = require('./config/db')();
  const redisConfig = require('./config/redis')();
  const appFactory = require('./app');

  (async () => {
    await db.connect();
    redisConfig.connect();

    const app = appFactory().init();

    app.listen(config.port, () => {
      console.log(`[Worker ${process.pid}] Listening on port ${config.port}`);
    });
  })();
}
