const { redisClient } = require("../config/redis");
const logger = require("../config/logger");

const redisService = {
  async set(key, value, expiryInSeconds = null) {
    try {
      const serializedValue =
        typeof value === "string" ? value : JSON.stringify(value);

      if (expiryInSeconds) {
        await redisClient.set(key, serializedValue, {
          EX: expiryInSeconds,
        });
      } else {
        await redisClient.set(key, serializedValue);
      }

      return true;
    } catch (error) {
      logger.error(`Redis SET failed for key "${key}": ${error.message}`);

      return false;
    }
  },

  async get(key) {
    try {
      const value = await redisClient.get(key);

      if (value === null) {
        return null;
      }

      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      logger.error(`Redis GET failed for key "${key}": ${error.message}`);

      return null;
    }
  },

  async delete(key) {
    try {
      await redisClient.del(key);

      return true;
    } catch (error) {
      logger.error(`Redis DELETE failed for key "${key}": ${error.message}`);

      return false;
    }
  },

  async exists(key) {
    try {
      return (await redisClient.exists(key)) === 1;
    } catch (error) {
      logger.error(`Redis EXISTS failed for key "${key}": ${error.message}`);

      return false;
    }
  },

  async expire(key, expiryInSeconds) {
    try {
      return await redisClient.expire(key, expiryInSeconds);
    } catch (error) {
      logger.error(`Redis EXPIRE failed for key "${key}": ${error.message}`);

      return false;
    }
  },

  async clear(key) {
    return this.delete(key);
  },
};

module.exports = redisService;
