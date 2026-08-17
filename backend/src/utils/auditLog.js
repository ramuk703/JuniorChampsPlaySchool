const auditLogger = require("../config/auditLogger");

const auditLog = ({
  req,
  action,
  resource,
  resourceId = null,
  details = {},
}) => {
  const user = req.user || {};

  auditLogger.info(
    JSON.stringify({
      requestId: req.requestId || null,
      userId: user.id || user._id || null,
      userRole: user.role || null,

      action,
      resource,
      resourceId,

      ip: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress,

      method: req.method,
      path: req.originalUrl,

      details,
    })
  );
};

module.exports = auditLog;
