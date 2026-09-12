const healthService = require("../services/health.service");

exports.getLiveness = (req, res) => {
  const health = healthService.getLiveness();

  return res.status(200).json({
    success: true,
    status: health.status,
  });
};

exports.getReadiness = async (req, res) => {
  const health = await healthService.getReadiness();

  return res.status(health.ready ? 200 : 503).json({
    success: health.ready,
    status: health.ready ? "ready" : "not_ready",
    checks: health.checks,
  });
};
