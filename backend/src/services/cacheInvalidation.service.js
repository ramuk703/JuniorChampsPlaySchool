const cacheService = require("./cache.service");
const redisKeys = require("../constants/redisKeys");

const cacheInvalidationService = {
  async student(studentId) {
    if (!studentId) return; // Guard clause
    return cacheService.invalidateMany([
      redisKeys.student(studentId),
      redisKeys.dashboardStats(),
    ]);
  },

  async teacher(teacherId) {
    if (!teacherId) return;
    return cacheService.invalidateMany([
      redisKeys.teacher(teacherId),
      redisKeys.dashboardStats(),
    ]);
  },

  async parent(parentId) {
    if (!parentId) return;
    return cacheService.invalidateMany([
      redisKeys.parent(parentId),
      redisKeys.dashboardStats(),
    ]);
  },

  async fee(feeId) {
    if (!feeId) return;
    return cacheService.invalidateMany([
      redisKeys.fee(feeId),
      redisKeys.dashboardStats(),
    ]);
  },

  async attendance(studentId, date) {
    if (!studentId || !date) return; // Date validation bhi zaroori hai
    return cacheService.invalidateMany([
      redisKeys.attendance(studentId, date),
      redisKeys.dashboardStats(),
    ]);
  },

  async dashboard() {
    return cacheService.invalidate(redisKeys.dashboardStats());
  },
};

module.exports = cacheInvalidationService;
