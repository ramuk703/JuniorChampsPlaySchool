const mongoose = require("mongoose");

const galleryImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    caption: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
  },
  { _id: true }
);

const gallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    coverImage: {
      type: String,
      trim: true,
      default: "",
    },

    images: {
      type: [galleryImageSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

gallerySchema.index({ status: 1, createdAt: -1 });
gallerySchema.index({ deletedAt: 1, createdAt: -1 });

module.exports = mongoose.model("Gallery", gallerySchema);
