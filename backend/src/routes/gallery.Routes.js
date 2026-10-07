const express = require("express");

const router = express.Router();

const upload = require("../middleware/upload.Middleware");
const { protect } = require("../middleware/auth.Middleware");
const adminOnly = require("../middleware/admin.Middleware");
const validate = require("../middleware/validate");

const {
  createGallery,
  getGalleries,
  getGalleryById,
  updateGallery,
  addGalleryImages,
  updateGalleryImage,
  deleteGalleryImage,
  deleteGallery,
} = require("../controllers/gallery.Controller");

const {
  createGalleryValidation,
  updateGalleryValidation,
  galleryIdValidation,
  galleryImageValidation,
  updateGalleryImageValidation,
  galleryListValidation,
} = require("../validators/galleryValidator");

router.use(protect);
router.use(adminOnly);

router.post(
  "/",
  upload.array("galleryImages", 20),
  createGalleryValidation,
  validate,
  createGallery
);

router.get(
  "/",
  galleryListValidation,
  validate,
  getGalleries
);

router.get(
  "/:id",
  galleryIdValidation,
  validate,
  getGalleryById
);

router.put(
  "/:id",
  updateGalleryValidation,
  validate,
  updateGallery
);

router.post(
  "/:id/images",
  galleryIdValidation,
  validate,
  upload.array("galleryImages", 20),
  addGalleryImages
);

router.patch(
  "/:id/images/:imageId",
  updateGalleryImageValidation,
  validate,
  updateGalleryImage
);

router.delete(
  "/:id/images/:imageId",
  galleryImageValidation,
  validate,
  deleteGalleryImage
);

router.delete(
  "/:id",
  galleryIdValidation,
  validate,
  deleteGallery
);

module.exports = router;
