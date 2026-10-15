const { body, param, query } = require("express-validator");

const validStatuses = ["New", "Contacted", "Visit Scheduled", "Admitted", "Closed"];

const publicAdmissionRules = [
  body("childName").trim().isLength({ min: 2, max: 100 }).withMessage("Child name must be 2–100 characters"),
  body("dateOfBirth").isISO8601({ strict: true }).withMessage("Enter a valid date of birth")
    .custom((value) => new Date(value) <= new Date()).withMessage("Date of birth cannot be in the future"),
  body("requestedClass").trim().isLength({ min: 1, max: 80 }).withMessage("Please select a class"),
  body("guardianName").trim().isLength({ min: 2, max: 100 }).withMessage("Parent/guardian name must be 2–100 characters"),
  body("relationship").isIn(["Father", "Mother", "Guardian", "Other"]).withMessage("Select a valid relationship"),
  body("mobile").trim().matches(/^[6-9]\d{9}$/).withMessage("Enter a valid 10-digit Indian mobile number"),
  body("email").optional({ values: "falsy" }).trim().isEmail().withMessage("Enter a valid email address")
    .isLength({ max: 254 }).withMessage("Email is too long"),
  body("address").optional().trim().isLength({ max: 500 }).withMessage("Address must be at most 500 characters"),
  body("message").optional().trim().isLength({ max: 2000 }).withMessage("Message must be at most 2000 characters"),
];

const listAdmissionRules = [
  query("page").optional().isInt({ min: 1, max: 100000 }).withMessage("page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100"),
  query("status").optional().isIn(validStatuses).withMessage("Invalid status filter"),
  query("search").optional().trim().isLength({ max: 100 }).withMessage("Search must be at most 100 characters"),
];

const admissionIdRules = [
  param("id").isMongoId().withMessage("Invalid admission enquiry ID"),
];

const updateAdmissionRules = [
  ...admissionIdRules,
  body().custom((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const allowed = ["status", "adminNotes"];
    const keys = Object.keys(value);
    return keys.length > 0 && keys.every((key) => allowed.includes(key));
  }).withMessage("Only status and adminNotes may be updated"),
  body("status").optional().isIn(validStatuses).withMessage("Invalid status"),
  body("adminNotes").optional().isString().trim().isLength({ max: 3000 }).withMessage("Admin notes must be at most 3000 characters"),
];

module.exports = {
  validStatuses,
  publicAdmissionRules,
  listAdmissionRules,
  admissionIdRules,
  updateAdmissionRules,
};
