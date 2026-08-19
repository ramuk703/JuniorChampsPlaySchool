const redisKeys = {
  student: (id) => `student:${id}`,

  teacher: (id) => `teacher:${id}`,

  parent: (id) => `parent:${id}`,

  dashboardStats: () => "dashboard:stats",

  fee: (id) => `fee:${id}`,

  attendance: (studentId, date) => `attendance:${studentId}:${date}`,
};

module.exports = redisKeys;
