const { createClient } = require("redis");
const logger = require("./logger");

const redisClient = createClient({
  url: process.env.REDIS_URL,
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

    // Redis is an optional infrastructure dependency.
    // Don't crash the entire API if Redis is unavailable.
  }
};

module.exports = {
  redisClient,
  connectRedis,
};
