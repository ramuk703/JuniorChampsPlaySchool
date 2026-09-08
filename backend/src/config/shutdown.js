const mongoose = require("mongoose");
const logger = require("./logger");
const { redisClient } = require("./redis");

let isShuttingDown = false;

const gracefulShutdown = (server, signal) => {
  if (isShuttingDown) {
    logger.warn("Shutdown already in progress.");
    return;
  }

  isShuttingDown = true;

  logger.info(`${signal} received. Starting graceful shutdown...`);

  // 🔴 Step 7: 10-Second Fallback Safety Timeout
  const shutdownTimeout = setTimeout(() => {
    logger.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10000);
  shutdownTimeout.unref();

  if (!server) {
    logger.info("HTTP server is not running.");
    process.exit(0);
  }

  server.close(async () => {
    logger.info("HTTP server closed.");

    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        logger.info("MongoDB connection closed.");
      }

      if (redisClient.isOpen) {
        await redisClient.quit();
        logger.info("Redis connection closed.");
      }

      logger.info("Graceful shutdown completed.");

      process.exit(0);
    } catch (error) {
      logger.error(`Error during shutdown: ${error.stack || error.message}`);

      process.exit(1);
    }
  });
};

module.exports = gracefulShutdown;