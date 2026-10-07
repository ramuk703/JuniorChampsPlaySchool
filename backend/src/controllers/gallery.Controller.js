const fs = require("fs-extra");
const mongoose = require("mongoose");
const Gallery = require("../models/Gallery");

const removeFile = async (filePath) => {
  if (!filePath) return;

  try {
    await fs.remove(filePath);
  } catch (error) {
    // Do not fail the main request if cleanup fails.
    console.error("Gallery file cleanup failed:", error.message);
  }
};

const normalizeFilePath = (filePath) => {
  if (!filePath) return "";

  return String(filePath).replace(/\\/g, "/");
};

exports.createGallery = async (req, res, next) => {
  const uploadedFiles = req.files || [];

  try {
    const { title, description, status } = req.body;

    if (!title || !String(title).trim()) {
      await Promise.all(uploadedFiles.map((file) => removeFile(file.path)));

      return res.status(400).json({
        success: false,
        message: "Gallery title is required",
      });
    }

    const images = uploadedFiles.map((file) => ({
      url: normalizeFilePath(file.path),
      caption: "",
    }));

    const gallery = await Gallery.create({
      title: String(title).trim(),
      description: description ? String(description).trim() : "",
      status: status === "Inactive" ? "Inactive" : "Active",
      coverImage: images[0]?.url || "",
      images,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Gallery created successfully",
      gallery,
    });
  } catch (error) {
    await Promise.all(uploadedFiles.map((file) => removeFile(file.path)));
    return next(error);
  }
};

exports.getGalleries = async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 10, 1),
      50
    );

    const skip = (page - 1) * limit;

    const filter = {
      deletedAt: null,
    };

    if (req.query.status === "Active" || req.query.status === "Inactive") {
      filter.status = req.query.status;
    }

    const [galleries, total] = await Promise.all([
      Gallery.find(filter)
        .populate("createdBy", "_id firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Gallery.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      galleries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.getGalleryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gallery ID",
      });
    }

    const gallery = await Gallery.findOne({
      _id: id,
      deletedAt: null,
    }).populate("createdBy", "_id firstName lastName email");

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery not found",
      });
    }

    return res.json({
      success: true,
      gallery,
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateGallery = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gallery ID",
      });
    }

    const gallery = await Gallery.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery not found",
      });
    }

    const { title, description, status, coverImage } = req.body;

    if (title !== undefined) {
      const trimmedTitle = String(title).trim();

      if (!trimmedTitle) {
        return res.status(400).json({
          success: false,
          message: "Gallery title cannot be empty",
        });
      }

      gallery.title = trimmedTitle;
    }

    if (description !== undefined) {
      gallery.description = String(description).trim();
    }

    if (status !== undefined) {
      if (!["Active", "Inactive"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be Active or Inactive",
        });
      }

      gallery.status = status;
    }

    if (coverImage !== undefined) {
      const coverExists = gallery.images.some(
        (image) => image.url === String(coverImage)
      );

      if (coverImage && !coverExists) {
        return res.status(400).json({
          success: false,
          message: "Cover image must belong to this gallery",
        });
      }

      gallery.coverImage = String(coverImage);
    }

    await gallery.save();

    return res.json({
      success: true,
      message: "Gallery updated successfully",
      gallery,
    });
  } catch (error) {
    return next(error);
  }
};

exports.addGalleryImages = async (req, res, next) => {
  const uploadedFiles = req.files || [];

  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      await Promise.all(uploadedFiles.map((file) => removeFile(file.path)));

      return res.status(400).json({
        success: false,
        message: "Invalid gallery ID",
      });
    }

    const gallery = await Gallery.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!gallery) {
      await Promise.all(uploadedFiles.map((file) => removeFile(file.path)));

      return res.status(404).json({
        success: false,
        message: "Gallery not found",
      });
    }

    if (!uploadedFiles.length) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
    }

    const newImages = uploadedFiles.map((file) => ({
      url: normalizeFilePath(file.path),
      caption: "",
    }));

    gallery.images.push(...newImages);

    if (!gallery.coverImage) {
      gallery.coverImage = newImages[0].url;
    }

    await gallery.save();

    return res.status(201).json({
      success: true,
      message: "Gallery images added successfully",
      gallery,
    });
  } catch (error) {
    await Promise.all(uploadedFiles.map((file) => removeFile(file.path)));
    return next(error);
  }
};

exports.updateGalleryImage = async (req, res, next) => {
  try {
    const { id, imageId } = req.params;

    if (
      !mongoose.isValidObjectId(id) ||
      !mongoose.isValidObjectId(imageId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid gallery or image ID",
      });
    }

    const gallery = await Gallery.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery not found",
      });
    }

    const image = gallery.images.id(imageId);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Gallery image not found",
      });
    }

    if (req.body.caption !== undefined) {
      image.caption = String(req.body.caption).trim();
    }

    await gallery.save();

    return res.json({
      success: true,
      message: "Gallery image updated successfully",
      gallery,
    });
  } catch (error) {
    return next(error);
  }
};

exports.deleteGalleryImage = async (req, res, next) => {
  try {
    const { id, imageId } = req.params;

    if (
      !mongoose.isValidObjectId(id) ||
      !mongoose.isValidObjectId(imageId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid gallery or image ID",
      });
    }

    const gallery = await Gallery.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery not found",
      });
    }

    const image = gallery.images.id(imageId);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Gallery image not found",
      });
    }

    const imageUrl = image.url;
    const wasCover = gallery.coverImage === imageUrl;

    image.deleteOne();

    if (wasCover) {
      gallery.coverImage = gallery.images[0]?.url || "";
    }

    await gallery.save();
    await removeFile(imageUrl);

    return res.json({
      success: true,
      message: "Gallery image deleted successfully",
      gallery,
    });
  } catch (error) {
    return next(error);
  }
};

exports.deleteGallery = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gallery ID",
      });
    }

    const gallery = await Gallery.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery not found",
      });
    }

    gallery.deletedAt = new Date();
    await gallery.save();

    return res.json({
      success: true,
      message: "Gallery deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

exports.getPublicGalleries = async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 9, 1),
      30
    );

    const skip = (page - 1) * limit;

    const filter = {
      status: "Active",
      deletedAt: null,
    };

    const [galleries, total] = await Promise.all([
      Gallery.find(filter)
        .select("title description coverImage images createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Gallery.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      galleries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.getPublicGalleryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gallery ID",
      });
    }

    const gallery = await Gallery.findOne({
      _id: id,
      status: "Active",
      deletedAt: null,
    })
      .select("title description coverImage images createdAt")
      .lean();

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery not found",
      });
    }

    return res.json({
      success: true,
      gallery,
    });
  } catch (error) {
    return next(error);
  }
};
