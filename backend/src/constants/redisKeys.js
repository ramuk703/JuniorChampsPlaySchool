const PREFIX = "jc";

const redisKeys = {
  student: (id) => `${PREFIX}:student:${String(id).trim()}`,

  teacher: (id) => `${PREFIX}:teacher:${String(id).trim()}`,

  parent: (id) => `${PREFIX}:parent:${String(id).trim()}`,

  dashboardStats: () => `${PREFIX}:dashboard:stats`,

  fee: (id) => `${PREFIX}:fee:${String(id).trim()}`,

  attendance: (studentId, date) =>
    `${PREFIX}:attendance:${String(studentId).trim()}:${date}`,

  otp: (purpose, identifier) =>
    `${PREFIX}:otp:${purpose}:${String(identifier).toLowerCase().trim()}`,

  authFailed: (accountType, protectionHash) =>
    `${PREFIX}:auth:failed:${String(accountType).toLowerCase()}:${String(
      protectionHash
    ).trim()}`,

  authBlocked: (accountType, protectionHash) =>
    `${PREFIX}:auth:blocked:${String(accountType).toLowerCase()}:${String(
      protectionHash
    ).trim()}`,

  schoolSettings: () => `${PREFIX}:school:settings`,
};

module.exports = Object.freeze(redisKeys);