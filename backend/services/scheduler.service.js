const { CronJob } = require('cron');
const MarketJob = require('../jobs/market');

const JOBS = [
    {
        cron: '*/5 * * * 1-5',
        name: 'market_stock_price',
        func: MarketJob.jobSaveStockPrice
    }
]

function SchedulerService() {
    const SELF = {
        jobs: [],
        startJobs: [],
        endJobs: []
    }
    return {
        startJobs: () => {
            logger.info('Starting scheduled jobs')
            // Start all scheduled jobs
            jobConfig.jobs.forEach(job => {
                logger.info(`Create schedule for job ${job.name}`)
                const schedule = new CronJob(job.cron, async () => {
                    const options = job?.options ?? job?.params ?? {};
                    job.func(options);
                }).start();
                SELF.jobs[job.name] = schedule;
                SELF.jobs[job.name].start(); // Start the schedule

                if (job?.stopWhen) {
                    logger.info(`Create stop schedule for ${job.name}`)
                    const stopSchedule = new CronJob(job.stopWhen, async () => {
                        logger.info(`Stopping job ${job.name}`)
                        SELF.jobs[job.name].stop();
                    })
                    SELF.endJobs[job.name] = stopSchedule;
                    SELF.endJobs[job.name].start(); // Start the stop schedule
                }

                if (job?.startWhen) {
                    logger.info(`Create start schedule for ${job.name}`)
                    const startSchedule = new CronJob(job.startWhen, async () => {
                        logger.info(`Starting job ${job.name}`)
                        if (!SELF.jobs[job.name].isActive)
                            SELF.jobs[job.name].start();
                    })
                    SELF.startJobs[job.name] = startSchedule;
                    SELF.startJobs[job.name].start(); // Start the start schedule
                }
            });
        },
    }

}

module.exports = SchedulerService();