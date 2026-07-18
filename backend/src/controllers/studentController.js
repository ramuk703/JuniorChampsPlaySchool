const Student = require("../models/Student");

exports.createStudent = async (req, res) => {
  try {
    const studentData = req.body;

    if (req.file) {
      studentData.studentPhoto = req.file.path;
    }

    const student = await Student.create(studentData);

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
  const student = await Student.findByIdAndUpdate(
    req.params.id,

    req.body,

    { new: true }
  );

  res.json(student);
};

exports.deleteStudent = async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);

  res.json({
    success: true,

    message: "Student Deleted",
  });
};
