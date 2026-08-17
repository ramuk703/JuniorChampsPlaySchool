const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");

const auditFormat = winston.format.printf(({ timestamp, level, message }) => {
  return `${timestamp} [${level}] ${message}`;
});

const auditLogger = winston.createLogger({
  level: "info",

  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    auditFormat
  ),

  transports: [
    new DailyRotateFile({
      dirname: "logs/audit",
      filename: "audit-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "90d",
    }),
  ],
});

module.exports = auditLogger;
