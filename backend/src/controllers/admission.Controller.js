const mongoose = require("mongoose");
const Admission = require("../models/Admission");

const safeAdmission = (doc) => {
  const value = doc.toObject ? doc.toObject() : doc;
  return value;
};

exports.createPublicAdmission = async (req, res, next) => {
  try {
    const {
      childName, dateOfBirth, requestedClass, guardianName, relationship,
      mobile, email, address, message,
    } = req.body;

    const admission = await Admission.create({
      childName, dateOfBirth, requestedClass, guardianName, relationship,
      mobile, email: email || "", address: address || "", message: message || "",
    });

    return res.status(201).json({
      success: true,
      message: "Your admission enquiry has been submitted. Our team will contact you soon.",
      data: { id: admission._id, childName: admission.childName, status: admission.status, createdAt: admission.createdAt },
    });
  } catch (error) {
    return next(error);
  }
};

exports.listAdmissions = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      const escaped = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [
        { childName: regex }, { guardianName: regex },
        { mobile: regex }, { email: regex }, { requestedClass: regex },
      ];
    }

    const [items, total] = await Promise.all([
      Admission.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
        .populate("reviewedBy", "firstName lastName email").lean(),
      Admission.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return next(error);
  }
};

exports.getAdmission = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid admission enquiry ID" });
    }
    const admission = await Admission.findById(req.params.id)
      .populate("reviewedBy", "firstName lastName email");
    if (!admission) return res.status(404).json({ success: false, message: "Admission enquiry not found" });
    return res.json({ success: true, data: safeAdmission(admission) });
  } catch (error) {
    return next(error);
  }
};

exports.updateAdmission = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid admission enquiry ID" });
    }
    const update = {};
    if (Object.prototype.hasOwnProperty.call(req.body, "status")) update.status = req.body.status;
    if (Object.prototype.hasOwnProperty.call(req.body, "adminNotes")) update.adminNotes = req.body.adminNotes;

    if (update.status || Object.prototype.hasOwnProperty.call(update, "adminNotes")) {
      update.reviewedBy = req.user?._id || req.user?.id || null;
      update.reviewedAt = new Date();
    }

    const admission = await Admission.findByIdAndUpdate(req.params.id, update, {
      returnDocument: 'after', runValidators: true,
    }).populate("reviewedBy", "firstName lastName email");

    if (!admission) return res.status(404).json({ success: false, message: "Admission enquiry not found" });
    return res.json({ success: true, message: "Admission enquiry updated", data: safeAdmission(admission) });
  } catch (error) {
    return next(error);
  }
};
