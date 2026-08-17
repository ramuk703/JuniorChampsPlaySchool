const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}] ${stack || message}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  levels: winston.config.npm.levels,

  format: combine(
    timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.errors({ stack: true }),
    logFormat
  ),

  transports: [
    new DailyRotateFile({
      dirname: "logs/app",
      filename: "application-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "30d",
    }),

    new DailyRotateFile({
      dirname: "logs/error",
      filename: "error-%DATE%.log",
      level: "error",
      datePattern: "YYYY-MM-DD",
      maxFiles: "30d",
    }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), logFormat),
    })
  );
}

logger.request = (req, level, message) => {
  logger.log({
    level,
    message: `[${req.requestId}] ${message}`,
  });
};

logger.http = (message) => {
  logger.log({
    level: "http",
    message,
  });
};
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

module.exports = logger;
