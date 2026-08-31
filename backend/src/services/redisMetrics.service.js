const { redisClient } = require("../config/redis");
const logger = require("../config/logger");

const metrics = {
  hits: 0,
  misses: 0,
  errors: 0,
};

// Helper function to parse Redis INFO output into a clean object
const parseRedisInfo = (info) => {
  const result = {};

  for (const line of info.split("\n")) {
    if (line.startsWith("#") || !line.includes(":")) {
      continue;
    }

    const [key, value] = line.trim().split(":");
    result[key] = value;
  }

  return result;
};

const redisMetricsService = {
  recordHit() {
    metrics.hits += 1;
  },

  recordMiss() {
    metrics.misses += 1;
  },

  recordError() {
    metrics.errors += 1;
  },

  getCacheMetrics() {
    const total = metrics.hits + metrics.misses;

    const hitRate =
      total === 0 ? 0 : Number(((metrics.hits / total) * 100).toFixed(2));

    return {
      hits: metrics.hits,
      misses: metrics.misses,
      errors: metrics.errors,
      totalRequests: total,
      hitRate,
    };
  },

  async getRedisHealth() {
    try {
      if (!redisClient.isOpen) {
        return {
          status: "disconnected",
          connected: false,
        };
      }

      const start = Date.now();
      await redisClient.ping();
      const latency = Date.now() - start;

      return {
        status: "healthy",
        connected: true,
        latencyMs: latency,
      };
    } catch (error) {
      metrics.errors += 1;

      logger.error(`Redis health check failed: ${error.message}`);

      return {
        status: "unhealthy",
        connected: false,
        latencyMs: null,
      };
    }
  },

  async getRedisInfo() {
    try {
      if (!redisClient.isOpen) {
        return null;
      }

      const info = await redisClient.info();
      return info;
    } catch (error) {
      metrics.errors += 1;

      logger.error(`Redis INFO failed: ${error.message}`);

      return null;
    }
  },

  async getMemoryStats() {
    try {
      if (!redisClient.isOpen) {
        return null;
      }

      const info = await redisClient.info("memory");
      const parsed = parseRedisInfo(info);

      return {
        usedMemory: parsed.used_memory || null,
        usedMemoryHuman: parsed.used_memory_human || null,
        peakMemory: parsed.used_memory_peak || null,
        peakMemoryHuman: parsed.used_memory_peak_human || null,
      };
    } catch (error) {
      metrics.errors += 1;

      logger.error(`Redis memory check failed: ${error.message}`);

      return null;
    }
  },
};

module.exports = redisMetricsService;
