const redisMetricsService = require("../services/redisMetrics.service");

exports.getRedisHealth = async (req, res) => {
  const health = await redisMetricsService.getRedisHealth();

  const statusCode = health.connected ? 200 : 503;

  return res.status(statusCode).json({
    success: health.connected,
    redis: health,
  });
};

exports.getRedisMetrics = async (req, res) => {
  const metrics = redisMetricsService.getCacheMetrics();

  const health = await redisMetricsService.getRedisHealth();

  const memory = await redisMetricsService.getMemoryStats();

  return res.status(200).json({
    success: true,
    redis: health,
    cache: metrics,
    memory,
  });
};
