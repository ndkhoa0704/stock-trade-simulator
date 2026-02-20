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
            console.log('Starting scheduled jobs')
            // Start all scheduled jobs
            JOBS.forEach(job => {
                console.log(`Create schedule for job ${job.name}`)
                const schedule = new CronJob(job.cron, async () => {
                    const options = job?.options ?? job?.params ?? {};
                    job.func(options);
                }).start();
                SELF.jobs[job.name] = schedule;
                SELF.jobs[job.name].start(); // Start the schedule

                if (job?.stopWhen) {
                    console.log(`Create stop schedule for ${job.name}`)
                    const stopSchedule = new CronJob(job.stopWhen, async () => {
                        console.log(`Stopping job ${job.name}`)
                        SELF.jobs[job.name].stop();
                    })
                    SELF.endJobs[job.name] = stopSchedule;
                    SELF.endJobs[job.name].start(); // Start the stop schedule
                }

                if (job?.startWhen) {
                    console.log(`Create start schedule for ${job.name}`)
                    const startSchedule = new CronJob(job.startWhen, async () => {
                        console.log(`Starting job ${job.name}`)
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