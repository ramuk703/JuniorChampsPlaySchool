const { audit } = require("../services/audit.service");

const auditLog = (options) => audit(options);

module.exports = auditLog;
