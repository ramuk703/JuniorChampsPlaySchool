const mongoose = require("mongoose");
const logger = require("./logger");
const { redisClient } = require("./redis");

let isShuttingDown = false;

const readPositiveInteger = (value, fallback) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const SHUTDOWN_TIMEOUT_MS = readPositiveInteger(
  process.env.SHUTDOWN_TIMEOUT_MS,
  10000
);

const closeDatabaseConnections = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    logger.info("MongoDB connection closed.");
  }

  if (redisClient.isOpen) {
    await redisClient.quit();
    logger.info("Redis connection closed.");
  }
};

const gracefulShutdown = (server, signal) => {
  if (isShuttingDown) {
    logger.warn("Shutdown already in progress.");
    return;
  }

  isShuttingDown = true;

  logger.info(`${signal} received. Starting graceful shutdown...`);

  const shutdownTimeout = setTimeout(() => {
    logger.error(
      `Forced shutdown after ${SHUTDOWN_TIMEOUT_MS}ms timeout.`
    );
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  shutdownTimeout.unref();

  const finishShutdown = async () => {
    try {
      await closeDatabaseConnections();

      logger.info("Graceful shutdown completed.");

      clearTimeout(shutdownTimeout);
      process.exit(0);
    } catch (error) {
      logger.error(
        `Error during shutdown: ${error.stack || error.message}`
      );

      clearTimeout(shutdownTimeout);
      process.exit(1);
    }
  };

  if (!server) {
    logger.info("HTTP server is not running.");
    finishShutdown();
    return;
  }

  server.close(async () => {
    logger.info("HTTP server closed.");
    await finishShutdown();
  });

  // Node.js 18+ / 20+: explicitly close idle connections when supported.
  if (typeof server.closeIdleConnections === "function") {
    server.closeIdleConnections();
  }
};

module.exports = gracefulShutdown;
