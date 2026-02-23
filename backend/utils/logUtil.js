const { createLogger, format, transports } = require('winston');

function LogUtil() {
    const SELF = {};

    const logger = createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: format.combine(
            format.colorize(),              // add color styling per level
            format.timestamp(),
            format.printf(({ timestamp, level, message }) => 
                `${timestamp} [${level}] ${message}`   // level already colorized
            )
        ),
        transports: [new transports.Console()],
    });

    SELF.info = (message) => logger.info(message);
    SELF.error = (message) => logger.error(message);
    SELF.warn = (message) => logger.warn(message);
    SELF.debug = (message) => logger.debug(message);

    return {
        logger,
        info: SELF.info,
        error: SELF.error,
        warn: SELF.warn,
        debug: SELF.debug,
    };
}

module.exports = LogUtil();
