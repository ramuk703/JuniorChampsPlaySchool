const { createClient } = require("redis");
const logger = require("./logger");

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      // Retry Redis connections with exponential backoff,
      // capped at 5 seconds. Stop after 10 attempts.
      if (retries > 10) {
        logger.error("Redis reconnect limit reached");
        return new Error("Redis reconnect limit reached");
      }

      const delay = Math.min(100 * 2 ** retries, 5000);
      logger.warn(
        `Redis reconnect attempt ${retries + 1}, retrying in ${delay}ms`
      );

      return delay;
    },
  },
});

redisClient.on("connect", () => {
  logger.info("Redis connecting...");
});

redisClient.on("ready", () => {
  logger.info("Redis connected and ready");
});

redisClient.on("reconnecting", () => {
  logger.warn("Redis reconnecting...");
});

redisClient.on("error", (error) => {
  logger.error(`Redis error: ${error.message}`);
});

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (error) {
    logger.error(`Redis connection failed: ${error.message}`);

    if (redisClient.isOpen) {
      await redisClient.quit().catch(() => {});
    }

    // Redis is an optional infrastructure dependency.
    // The API continues without Redis when it is unavailable.
  }
};

module.exports = {
  redisClient,
  connectRedis,
};
