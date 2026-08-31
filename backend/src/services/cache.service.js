const redisMetricsService = require("./redisMetrics.service");
const redisService = require("./redis.service");
const logger = require("../config/logger");

const cacheService = {
  /**
   * Cache-Aside Implementation with Resilience
   * @param {string} key - Cache key
   * @param {Function} fetchFunction - Fallback database/API call
   * @param {number} ttl - Time to live in seconds
   */
  async remember(key, fetchFunction, ttl) {
    let cachedValue = null;

    // 1. Safe Cache Fetch
    try {
      cachedValue = await redisService.get(key);
    } catch (error) {
      logger.error(
        `[Cache Error] Failed to GET key "${key}": ${error.message}`
      );
      // Application continue karegi bina crash hue
    }

    // 2. Cache HIT
    if (cachedValue !== null && cachedValue !== undefined) {
      redisMetricsService.recordHit();

      logger.info(`[Cache HIT] key: ${key}`);
      return {
        data:
          typeof cachedValue === "string"
            ? JSON.parse(cachedValue)
            : cachedValue,
        source: "cache",
      };
    }

    // 3. Cache MISS - Database Fetch
    redisMetricsService.recordMiss();

    logger.info(`[Cache MISS] key: ${key}`);
    const freshValue = await fetchFunction();

    // 4. Safe Cache Write
    if (freshValue !== null && freshValue !== undefined) {
      try {
        const payload =
          typeof freshValue === "object"
            ? JSON.stringify(freshValue)
            : freshValue;
        await redisService.set(key, payload, ttl);
      } catch (error) {
        logger.error(
          `[Cache Error] Failed to SET key "${key}": ${error.message}`
        );
      }
    }

    return {
      data: freshValue,
      source: "database",
    };
  },

  /**
   * Single Key Invalidation
   */
  async invalidate(key) {
    try {
      return await redisService.delete(key);
    } catch (error) {
      logger.error(
        `[Cache Error] Failed to DELETE key "${key}": ${error.message}`
      );
      return false;
    }
  },

  /**
   * High-Performance Parallel Multi-Key Invalidation
   */
  async invalidateMany(keys = []) {
    if (!Array.isArray(keys) || keys.length === 0) return [];

    try {
      // Single network round-trip via parallel execution
      return await Promise.all(keys.map((key) => redisService.delete(key)));
    } catch (error) {
      logger.error(
        `[Cache Error] Failed to invalidate multiple keys: ${error.message}`
      );
      return [];
    }
  },
};

module.exports = cacheService;
