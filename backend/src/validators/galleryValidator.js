const { body, param, query } = require("express-validator");

const objectIdParam = (field = "id") =>
  param(field)
    .isMongoId()
    .withMessage(`Invalid ${field}`);

const createGalleryValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Gallery title is required")
    .isLength({ min: 2, max: 120 })
    .withMessage("Gallery title must be between 2 and 120 characters"),

  body("description")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Gallery description cannot exceed 1000 characters"),

  body("status")
    .optional()
    .isIn(["Active", "Inactive"])
    .withMessage("Status must be Active or Inactive"),
];

const updateGalleryValidation = [
  objectIdParam(),

  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Gallery title cannot be empty")
    .isLength({ min: 2, max: 120 })
    .withMessage("Gallery title must be between 2 and 120 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Gallery description cannot exceed 1000 characters"),

  body("status")
    .optional()
    .isIn(["Active", "Inactive"])
    .withMessage("Status must be Active or Inactive"),

  body("coverImage")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Cover image must be a string"),
];

const galleryIdValidation = [objectIdParam()];

const galleryImageValidation = [
  objectIdParam("id"),
  param("imageId")
    .isMongoId()
    .withMessage("Invalid imageId"),
];

const updateGalleryImageValidation = [
  ...galleryImageValidation,

  body("caption")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Image caption cannot exceed 200 characters"),
];

const galleryListValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),

  query("status")
    .optional()
    .isIn(["Active", "Inactive"])
    .withMessage("Status must be Active or Inactive"),
];

module.exports = {
  createGalleryValidation,
  updateGalleryValidation,
  galleryIdValidation,
  galleryImageValidation,
  updateGalleryImageValidation,
  galleryListValidation,
};
