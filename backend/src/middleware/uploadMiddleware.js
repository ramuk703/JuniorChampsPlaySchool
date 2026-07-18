const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    if (file.fieldname === "teacherPhoto") {
      cb(null, "uploads/teachers");
    } else if (file.fieldname === "studentPhoto") {
      cb(null, "uploads/students");
    } else {
      cb(null, "uploads/gallery");
    }
  },

  filename(req, file, cb) {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

function fileFilter(req, file, cb) {
  const allowed = /jpg|jpeg|png|webp/i;

  const ext = path.extname(file.originalname);

  if (!allowed.test(ext)) {
    return cb(new Error("Only image files are allowed"));
  }

  cb(null, true);
}

const upload = multer({
  storage,

  fileFilter,

  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

module.exports = upload;
