const { body, query, param } = require("express-validator");

const ATTENDANCE_STATUSES = ["Present", "Absent", "Leave"];

const attendanceValidation = [
  body("studentId")
    .optional()
    .isMongoId()
    .withMessage("Student ID must be a valid MongoDB ID"),

  body("student")
    .optional()
    .isMongoId()
    .withMessage("Student ID must be a valid MongoDB ID"),

  body()
    .custom((value) => {
      if (!value.studentId && !value.student) {
        throw new Error("Student ID is required");
      }

      return true;
    }),

  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO 8601 date"),

  body("status")
    .optional()
    .isIn(ATTENDANCE_STATUSES)
    .withMessage(
      `Status must be one of: ${ATTENDANCE_STATUSES.join(", ")}`
    ),

  body("className")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Class name must be between 1 and 50 characters"),
];

const bulkAttendanceValidation = [
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO 8601 date"),

  body("attendanceData")
    .isArray({ min: 1 })
    .withMessage("Attendance data must contain at least one record"),

  body("attendanceData.*.studentId")
    .isMongoId()
    .withMessage("Each student ID must be a valid MongoDB ID"),

  body("attendanceData.*.status")
    .isIn(ATTENDANCE_STATUSES)
    .withMessage(
      `Status must be one of: ${ATTENDANCE_STATUSES.join(", ")}`
    ),
];

const attendanceQueryValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO 8601 date"),

  query("studentId")
    .optional()
    .isMongoId()
    .withMessage("Student ID must be a valid MongoDB ID"),

  query("status")
    .optional()
    .isIn(ATTENDANCE_STATUSES)
    .withMessage(
      `Status must be one of: ${ATTENDANCE_STATUSES.join(", ")}`
    ),

  query("className")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Class name must be between 1 and 50 characters"),
];

const studentAttendanceParamValidation = [
  param("id")
    .isMongoId()
    .withMessage("Student ID must be a valid MongoDB ID"),
];

const attendanceCalendarValidation = [
  param("id")
    .isMongoId()
    .withMessage("Student ID must be a valid MongoDB ID"),

  query("month")
    .notEmpty()
    .isInt({ min: 1, max: 12 })
    .withMessage("Month must be between 1 and 12"),

  query("year")
    .notEmpty()
    .isInt({ min: 2000, max: 2100 })
    .withMessage("Year must be between 2000 and 2100"),
];

module.exports = {
  ATTENDANCE_STATUSES,
  attendanceValidation,
  bulkAttendanceValidation,
  attendanceQueryValidation,
  studentAttendanceParamValidation,
  attendanceCalendarValidation,
};
