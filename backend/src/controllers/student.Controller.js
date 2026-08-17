const auditLog = require("../utils/auditLog");
const Student = require("../models/Student");

exports.createStudent = async (req, res) => {
  try {
    const studentData = req.body;

    if (req.file) {
      studentData.studentPhoto = req.file.path;
    }

    const student = await Student.create(studentData);

    auditLog({
      req,
      action: "CREATE",
      resource: "Student",
      resourceId: student._id,
      details: {
        admissionNumber: student.admissionNumber,
      },
    });

    res.status(201).json({
      success: true,
      message: "Student Created",

      student,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;

    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const students = await Student.find()

      .skip(skip)

      .limit(limit)

      .sort({ createdAt: -1 });

    const total = await Student.countDocuments();

    res.json({
      success: true,

      page,

      total,

      students,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.searchStudent = async (req, res) => {
  const keyword = req.query.q;

  const students = await Student.find({
    $or: [
      {
        firstName: {
          $regex: keyword,

          $options: "i",
        },
      },

      {
        lastName: {
          $regex: keyword,

          $options: "i",
        },
      },

      {
        admissionNo: {
          $regex: keyword,

          $options: "i",
        },
      },
    ],
  });

  res.json(students);
};
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    // अगर दी गई ID का स्टूडेंट नहीं मिला
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    //  स्टूडेंट मिलने और अपडेट होने के बाद ऑडिट लॉग दर्ज होगा
    auditLog({
      req,
      action: "UPDATE",
      resource: "Student",
      resourceId: student._id,
    });

    res.json(student);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
exports.deleteStudent = async (req, res) => {
  try {
    const studentId = req.params.id;

    // 1. स्टूडेंट को डेटाबेस से ढूंढकर डिलीट करें
    const student = await Student.findByIdAndDelete(studentId);

    // अगर गलत ID की वजह से स्टूडेंट नहीं मिला
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // ==========================================
    // 👇 2. डिलीट सफल होने के बाद Audit Log दर्ज करें
    // ==========================================
    auditLog({
      req,
      action: "DELETE",
      resource: "Student",
      resourceId: studentId,
    });
    // ==========================================

    // 3. क्लाइंट को रिस्पॉन्स भेजें
    res.json({
      success: true,
      message: "Student Deleted",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
