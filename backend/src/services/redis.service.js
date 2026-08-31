const { redisClient } = require("../config/redis");
const logger = require("../config/logger");

const redisService = {
  // ==========================================
  // NORMAL CACHE OPERATIONS
  // ==========================================

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

  // ==========================================
  // TEMPORARY DATA OPERATIONS (OTP, TOKENS)
  // ==========================================

  /**
   * Temporary data store with strict TTL validation
   */
  async setTemporary(key, value, ttl) {
    if (!ttl || typeof ttl !== "number" || ttl <= 0) {
      throw new Error(
        "Temporary Redis data requires a positive numeric TTL in seconds"
      );
    }

    return this.set(key, value, ttl);
  },

  /**
   * Atomic Fetch & Delete for single-use verification data (OTP)
   */
  async getAndDelete(key) {
    try {
      let rawValue = null;

      // Fast-path: Native Redis GETDEL (Node-Redis v4+)
      if (typeof redisClient.getDel === "function") {
        rawValue = await redisClient.getDel(key);
      } else {
        // Fallback: Atomic multi-command pipeline
        const [getRes] = await redisClient.multi().get(key).del(key).exec();
        rawValue = Array.isArray(getRes) ? getRes[1] : getRes;
      }

      if (rawValue === null || rawValue === undefined) {
        return null;
      }

      try {
        return JSON.parse(rawValue);
      } catch {
        return rawValue;
      }
    } catch (error) {
      logger.error(
        `Redis GET+DELETE failed for key "${key}": ${error.message}`
      );
      return null;
    }
  },
};

module.exports = redisService;
