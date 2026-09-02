require("dotenv").config();
const mongoose = require("mongoose");
const Student = require("../src/models/Student");
const Teacher = require("../src/models/Teacher");
const FeePayment = require("../src/models/FeePayment");
const Attendance = require("../src/models/Attendance");
const TeacherAttendance = require("../src/models/TeacherAttendance");

const syncIndexes = async () => {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://mongo:27017/juniorchamps";
    await mongoose.connect(uri);
    console.log("MongoDB connected");

    await Student.syncIndexes();
    console.log("Student indexes synced");

    await Teacher.syncIndexes();
    console.log("Teacher indexes synced");

    await FeePayment.syncIndexes();
    console.log("FeePayment indexes synced");

    await Attendance.syncIndexes();
    console.log("Attendance indexes synced");

    await TeacherAttendance.syncIndexes();
    console.log("TeacherAttendance indexes synced");

    console.log("All indexes synchronized");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

syncIndexes();
