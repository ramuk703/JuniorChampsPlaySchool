const express = require("express");

const router = express.Router();

const {
  getPublicGalleries,
  getPublicGalleryById,
} = require("../controllers/gallery.Controller");

router.get("/", getPublicGalleries);
router.get("/:id", getPublicGalleryById);

module.exports = router;
