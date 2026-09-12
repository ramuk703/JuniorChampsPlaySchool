const mongoose = require("mongoose");
const redisMetricsService = require("./redisMetrics.service");

const getMongoHealth = () => {
  const state = mongoose.connection.readyState;

  if (state === 1) {
    return {
      status: "healthy",
      connected: true,
    };
  }

  return {
    status: "disconnected",
    connected: false,
  };
};

const getLiveness = () => ({
  status: "ok",
});

const getReadiness = async () => {
  const mongodb = getMongoHealth();
  const redis = await redisMetricsService.getRedisHealth();

  return {
    ready: mongodb.connected,
    checks: {
      mongodb,
      redis: {
        ...redis,
        optional: true,
      },
    },
  };
};

module.exports = {
  getLiveness,
  getReadiness,
};
