const request = require("supertest");
const mongoose = require("mongoose");
const ExcelJS = require("exceljs");

jest.setTimeout(30000);

const { connectRedis, redisClient } = require("../src/config/redis");
const connectDB = require("../src/config/db");

const User = require("../src/models/User");
const Student = require("../src/models/Student");
const Attendance = require("../src/models/Attendance");

let app;
let adminToken;

const TEST_ADMIN_EMAIL = `attendance-admin-${Date.now()}@example.com`;
const TEST_ADMIN_PASSWORD = "AttendanceAdminPassword123!";

const TEST_PREFIX = `JEST-ATTENDANCE-${Date.now()}`;
const TEST_CLASS = `Test-${Date.now()}`;

const studentPayload = (suffix = "001") => ({
  admissionNo: `${TEST_PREFIX}-${suffix}`,
  firstName: `Attendance${suffix}`,
  lastName: "Test",
  gender: "Other",
  dob: "2020-01-01",
  className: "Nursery",
  section: "A",
  fatherName: "Test Father",
  motherName: "Test Mother",
  mobile: `90000${String(Date.now()).slice(-5)}`,
  email: `attendance-${TEST_PREFIX.toLowerCase()}-${suffix}@example.com`,
  address: "Attendance Test Address",
  status: "Active",
});

const createAdmin = async () => {
  return User.create({
    name: "Attendance Test Admin",
    email: TEST_ADMIN_EMAIL,
    password: TEST_ADMIN_PASSWORD,
    role: "admin",
  });
};

const loginAdmin = async () => {
  const response = await request(app)
    .post("/api/v1/auth/login")
    .send({
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD,
    });

  expect(response.status).toBe(200);
  expect(response.body.token).toEqual(expect.any(String));

  return response.body.token;
};

beforeAll(async () => {
  await connectRedis();
  await connectDB();

  app = require("../src/app");

  await User.deleteOne({ email: TEST_ADMIN_EMAIL });

  await Student.deleteMany({
    admissionNo: { $regex: `^${TEST_PREFIX}-` },
  });

  await createAdmin();
  adminToken = await loginAdmin();
});

beforeEach(async () => {
  if (redisClient.isOpen) {
    await redisClient.flushDb();
  }

  await Attendance.deleteMany({
    student: {
      $in: await Student.find(
        {
          admissionNo: { $regex: `^${TEST_PREFIX}-` },
        },
        { _id: 1 },
      ).then((students) => students.map((student) => student._id)),
    },
  });

  await Student.deleteMany({
    admissionNo: { $regex: `^${TEST_PREFIX}-` },
  });
});

afterAll(async () => {
  const students = await Student.find(
    {
      admissionNo: { $regex: `^${TEST_PREFIX}-` },
    },
    { _id: 1 },
  );

  if (students.length) {
    await Attendance.deleteMany({
      student: { $in: students.map((student) => student._id) },
    });
  }

  await Student.deleteMany({
    admissionNo: { $regex: `^${TEST_PREFIX}-` },
  });

  await User.deleteOne({ email: TEST_ADMIN_EMAIL });

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (redisClient.isOpen) {
    await redisClient.quit();
  }
});

describe("Attendance API — authentication and authorization", () => {
  test("rejects requests without authentication", async () => {
    const response = await request(app).get("/api/v1/attendance");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("allows an authenticated admin to access attendance", async () => {
    const response = await request(app)
      .get("/api/v1/attendance")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

describe("Attendance API — listing", () => {
  test("returns paginated attendance with populated student and markedBy", async () => {
    const student = await Student.create(studentPayload("001"));

    const attendance = await Attendance.create({
      student: student._id,
      className: TEST_CLASS,
      date: new Date("2026-06-24T00:00:00.000Z"),
      status: "Present",
      markedBy: (
        await User.findOne({ email: TEST_ADMIN_EMAIL })
      )._id,
    });

    const response = await request(app)
      .get(`/api/v1/attendance?page=1&limit=10&className=${encodeURIComponent(TEST_CLASS)}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.page).toBe(1);
    expect(response.body.limit).toBe(10);
    expect(response.body.total).toBe(1);
    expect(response.body.totalPages).toBe(1);
    expect(response.body.attendance).toHaveLength(1);

    const returned = response.body.attendance[0];

    expect(returned._id).toBe(attendance._id.toString());
    expect(returned.student._id).toBe(student._id.toString());
    expect(returned.student.admissionNo).toBe(student.admissionNo);
    expect(returned.student.firstName).toBe(student.firstName);
    expect(returned.student.lastName).toBe(student.lastName);
    expect(returned.student.className).toBe(student.className);
    expect(returned.markedBy._id).toBeDefined();
    expect(returned.markedBy.email).toBe(TEST_ADMIN_EMAIL);
    expect(returned.status).toBe("Present");
  });

  test("applies pagination consistently", async () => {
    const student = await Student.create(studentPayload("001"));

    await Attendance.create([
      {
        student: student._id,
        className: TEST_CLASS,
        date: new Date("2026-06-21T00:00:00.000Z"),
        status: "Present",
      },
      {
        student: student._id,
        className: TEST_CLASS,
        date: new Date("2026-06-22T00:00:00.000Z"),
        status: "Absent",
      },
      {
        student: student._id,
        className: TEST_CLASS,
        date: new Date("2026-06-23T00:00:00.000Z"),
        status: "Leave",
      },
    ]);

    const pageOne = await request(app)
      .get(`/api/v1/attendance?page=1&limit=2&className=${encodeURIComponent(TEST_CLASS)}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(pageOne.status).toBe(200);
    expect(pageOne.body.total).toBe(3);
    expect(pageOne.body.totalPages).toBe(2);
    expect(pageOne.body.attendance).toHaveLength(2);

    const pageTwo = await request(app)
      .get(`/api/v1/attendance?page=2&limit=2&className=${encodeURIComponent(TEST_CLASS)}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(pageTwo.status).toBe(200);
    expect(pageTwo.body.total).toBe(3);
    expect(pageTwo.body.totalPages).toBe(2);
    expect(pageTwo.body.attendance).toHaveLength(1);
  });

  test("filters by studentId", async () => {
    const firstStudent = await Student.create(studentPayload("001"));
    const secondStudent = await Student.create(studentPayload("002"));

    await Attendance.create([
      {
        student: firstStudent._id,
        className: firstStudent.className,
        date: new Date("2026-06-24T00:00:00.000Z"),
        status: "Present",
      },
      {
        student: secondStudent._id,
        className: secondStudent.className,
        date: new Date("2026-06-24T00:00:00.000Z"),
        status: "Absent",
      },
    ]);

    const response = await request(app)
      .get(`/api/v1/attendance?studentId=${firstStudent._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.attendance).toHaveLength(1);
    expect(response.body.attendance[0].student._id).toBe(
      firstStudent._id.toString(),
    );
  });

  test("filters by status", async () => {
    const student = await Student.create(studentPayload("001"));

    await Attendance.create([
      {
        student: student._id,
        className: TEST_CLASS,
        date: new Date("2026-06-21T00:00:00.000Z"),
        status: "Present",
      },
      {
        student: student._id,
        className: TEST_CLASS,
        date: new Date("2026-06-22T00:00:00.000Z"),
        status: "Absent",
      },
      {
        student: student._id,
        className: TEST_CLASS,
        date: new Date("2026-06-23T00:00:00.000Z"),
        status: "Leave",
      },
    ]);

    const response = await request(app)
      .get(`/api/v1/attendance?status=Absent&className=${encodeURIComponent(TEST_CLASS)}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.attendance).toHaveLength(1);
    expect(response.body.attendance[0].status).toBe("Absent");
  });

  test("filters by className case-insensitively", async () => {
    const nurseryStudent = await Student.create({
      ...studentPayload("001"),
      className: TEST_CLASS,
    });

    const lkgStudent = await Student.create({
      ...studentPayload("002"),
      className: "LKG",
    });

    await Attendance.create([
      {
        student: nurseryStudent._id,
        className: TEST_CLASS,
        date: new Date("2026-06-24T00:00:00.000Z"),
        status: "Present",
      },
      {
        student: lkgStudent._id,
        className: "LKG",
        date: new Date("2026-06-24T00:00:00.000Z"),
        status: "Present",
      },
    ]);

    const response = await request(app)
      .get(`/api/v1/attendance?className=${encodeURIComponent(TEST_CLASS.toLowerCase())}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.attendance).toHaveLength(1);
    expect(response.body.attendance[0].className).toBe(TEST_CLASS);
  });

  test("filters by date", async () => {
    const student = await Student.create(studentPayload("001"));

    await Attendance.create([
      {
        student: student._id,
        className: TEST_CLASS,
        date: new Date("2026-06-23T00:00:00.000Z"),
        status: "Present",
      },
      {
        student: student._id,
        className: TEST_CLASS,
        date: new Date("2026-06-24T00:00:00.000Z"),
        status: "Absent",
      },
    ]);

    const response = await request(app)
      .get(`/api/v1/attendance?date=2026-06-24&className=${encodeURIComponent(TEST_CLASS)}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.attendance).toHaveLength(1);
    expect(response.body.attendance[0].status).toBe("Absent");
  });

  test("does not return attendance for soft-deleted students", async () => {
    const activeStudent = await Student.create(studentPayload("001"));

    const deletedStudent = await Student.create({
      ...studentPayload("002"),
      deletedAt: new Date(),
    });

    await Attendance.create([
      {
        student: activeStudent._id,
        className: TEST_CLASS,
        date: new Date("2026-06-24T00:00:00.000Z"),
        status: "Present",
      },
      {
        student: deletedStudent._id,
        className: TEST_CLASS,
        date: new Date("2026-06-24T00:00:00.000Z"),
        status: "Absent",
      },
    ]);

    const response = await request(app)
      .get(`/api/v1/attendance?className=${encodeURIComponent(TEST_CLASS)}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.attendance).toHaveLength(1);
    expect(response.body.attendance[0].student._id).toBe(
      activeStudent._id.toString(),
    );
  });
});

describe("Attendance API — bulk attendance", () => {
  test("successfully marks bulk attendance for multiple students", async () => {
    const student1 = await Student.create(studentPayload("001"));
    const student2 = await Student.create(studentPayload("002"));

    const response = await request(app)
      .post("/api/v1/attendance/bulk")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        date: "2026-06-24",
        attendanceData: [
          { studentId: student1._id.toString(), status: "Present" },
          { studentId: student2._id.toString(), status: "Absent" },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.total).toBe(2);
    expect(response.body.attendance).toHaveLength(2);
  });

  test("rejects bulk attendance if duplicate student IDs are provided", async () => {
    const student1 = await Student.create(studentPayload("001"));

    const response = await request(app)
      .post("/api/v1/attendance/bulk")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        date: "2026-06-24",
        attendanceData: [
          { studentId: student1._id.toString(), status: "Present" },
          { studentId: student1._id.toString(), status: "Absent" },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/Duplicate student IDs/i);
  });

  test("rejects bulk attendance if any student is not found or inactive", async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .post("/api/v1/attendance/bulk")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        date: "2026-06-24",
        attendanceData: [
          { studentId: fakeId.toString(), status: "Present" },
        ],
      });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/One or more students were not found/i);
  });

  test("rejects bulk attendance if records already exist for date", async () => {
    const student1 = await Student.create(studentPayload("001"));

    // Mark attendance beforehand
    await Attendance.create({
      student: student1._id,
      className: student1.className,
      date: new Date("2026-06-24T00:00:00.000Z"),
      status: "Present",
    });

    const response = await request(app)
      .post("/api/v1/attendance/bulk")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        date: "2026-06-24",
        attendanceData: [
          { studentId: student1._id.toString(), status: "Absent" },
        ],
      });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/already exists/i);
  });
});

describe("Attendance API — student attendance", () => {
  test("returns attendance history for a specific student", async () => {
    const student = await Student.create(studentPayload("001"));

    await Attendance.create([
      {
        student: student._id,
        className: student.className,
        date: new Date("2026-06-24T00:00:00.000Z"),
        status: "Present",
      },
      {
        student: student._id,
        className: student.className,
        date: new Date("2026-06-25T00:00:00.000Z"),
        status: "Absent",
      },
    ]);

    const response = await request(app)
      .get(`/api/v1/attendance/student/${student._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.total).toBe(2);
    expect(response.body.student._id).toBe(student._id.toString());
    expect(response.body.attendance).toHaveLength(2);
  });

  test("returns 404 if student does not exist", async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .get(`/api/v1/attendance/student/${fakeId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Student not found");
  });

  test("returns 404 if student is soft-deleted", async () => {
    const deletedStudent = await Student.create({
      ...studentPayload("001"),
      deletedAt: new Date(),
    });

    const response = await request(app)
      .get(`/api/v1/attendance/student/${deletedStudent._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Student not found");
  });

  test("applies pagination to student attendance history", async () => {
    const student = await Student.create(studentPayload("001"));

    await Attendance.create([
      {
        student: student._id,
        className: student.className,
        date: new Date("2026-06-23T00:00:00.000Z"),
        status: "Present",
      },
      {
        student: student._id,
        className: student.className,
        date: new Date("2026-06-24T00:00:00.000Z"),
        status: "Absent",
      },
      {
        student: student._id,
        className: student.className,
        date: new Date("2026-06-25T00:00:00.000Z"),
        status: "Leave",
      },
    ]);

    const response = await request(app)
      .get(`/api/v1/attendance/student/${student._id}?page=1&limit=2`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(3);
    expect(response.body.totalPages).toBe(2);
    expect(response.body.attendance).toHaveLength(2);
  });

  test("filters student attendance by status", async () => {
    const student = await Student.create(studentPayload("001"));

    await Attendance.create([
      {
        student: student._id,
        className: student.className,
        date: new Date("2026-06-24T00:00:00.000Z"),
        status: "Present",
      },
      {
        student: student._id,
        className: student.className,
        date: new Date("2026-06-25T00:00:00.000Z"),
        status: "Absent",
      },
    ]);

    const response = await request(app)
      .get(`/api/v1/attendance/student/${student._id}?status=Present`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.attendance).toHaveLength(1);
    expect(response.body.attendance[0].status).toBe("Present");
  });

  test("filters student attendance by date", async () => {
    const student = await Student.create(studentPayload("001"));

    await Attendance.create([
      {
        student: student._id,
        className: student.className,
        date: new Date("2026-06-24T00:00:00.000Z"),
        status: "Present",
      },
      {
        student: student._id,
        className: student.className,
        date: new Date("2026-06-25T00:00:00.000Z"),
        status: "Absent",
      },
    ]);

    const response = await request(app)
      .get(`/api/v1/attendance/student/${student._id}?date=2026-06-25`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.attendance).toHaveLength(1);
    expect(response.body.attendance[0].status).toBe("Absent");
  });
});

describe("Attendance API — attendance percentage & stats", () => {
  test("calculates attendance percentage correctly, including zero attendance", async () => {
    const studentWithData = await Student.create(studentPayload("001"));
    const studentZero = await Student.create(studentPayload("002"));

    await Attendance.create([
      {
        student: studentWithData._id,
        className: studentWithData.className,
        date: new Date("2026-06-24T00:00:00.000Z"),
        status: "Present",
      },
      {
        student: studentWithData._id,
        className: studentWithData.className,
        date: new Date("2026-06-25T00:00:00.000Z"),
        status: "Absent",
      },
    ]);

    const resWithData = await request(app)
      .get(`/api/v1/attendance/percentage/${studentWithData._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(resWithData.status).toBe(200);
    expect(resWithData.body.success).toBe(true);
    expect(resWithData.body.total).toBe(2);
    expect(resWithData.body.present).toBe(1);
    expect(resWithData.body.percentage).toBe(50);

    const resZero = await request(app)
      .get(`/api/v1/attendance/percentage/${studentZero._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(resZero.status).toBe(200);
    expect(resZero.body.success).toBe(true);
    expect(resZero.body.total).toBe(0);
    expect(resZero.body.present).toBe(0);
    expect(resZero.body.percentage).toBe(0);
  });

  test("rejects invalid or non-existent student ID in percentage endpoint", async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const invalidRes = await request(app)
      .get("/api/v1/attendance/percentage/invalid-id")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.success).toBe(false);

    const notFoundRes = await request(app)
      .get(`/api/v1/attendance/percentage/${fakeId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(notFoundRes.status).toBe(404);
    expect(notFoundRes.body.success).toBe(false);
  });

  test("returns today's attendance stats and excludes soft-deleted students", async () => {
    const activeStudent = await Student.create(studentPayload("001"));
    const deletedStudent = await Student.create({
      ...studentPayload("002"),
      deletedAt: new Date(),
    });

    const today = new Date();

    await Attendance.create([
      {
        student: activeStudent._id,
        className: activeStudent.className,
        date: today,
        status: "Present",
      },
      {
        student: deletedStudent._id,
        className: deletedStudent.className,
        date: today,
        status: "Present",
      },
    ]);

    const response = await request(app)
      .get("/api/v1/attendance/stats")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.todayPresent).toBe(1);
    expect(response.body.todayAbsent).toBe(0);
    expect(response.body.todayLeave).toBe(0);
    expect(response.body.attendancePercentage).toBe(100);
  });
});

describe("Attendance API — monthly attendance", () => {
  test("returns attendance for the requested month and year", async () => {
    const adminUser = await User.findOne({ email: TEST_ADMIN_EMAIL });
    const student = await Student.create({
      ...studentPayload("001"),
      className: TEST_CLASS,
    });

    await Attendance.create([
      {
        student: student._id,
        className: TEST_CLASS,
        date: new Date("2026-06-10T09:00:00.000Z"),
        status: "Present",
        markedBy: adminUser._id,
      },
      {
        student: student._id,
        className: TEST_CLASS,
        date: new Date("2026-06-20T09:00:00.000Z"),
        status: "Absent",
        markedBy: adminUser._id,
      },
      {
        student: student._id,
        className: TEST_CLASS,
        date: new Date("2026-07-01T09:00:00.000Z"),
        status: "Leave",
        markedBy: adminUser._id,
      },
    ]);

    const response = await request(app)
      .get(
        `/api/v1/attendance/monthly?month=6&year=2026&className=${encodeURIComponent(TEST_CLASS)}`,
      )
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.month).toBe(6);
    expect(response.body.year).toBe(2026);
    expect(response.body.total).toBe(2);
    expect(response.body.attendance).toHaveLength(2);

    response.body.attendance.forEach((record) => {
      expect(new Date(record.date).getUTCMonth()).toBe(5);
      expect(new Date(record.date).getUTCFullYear()).toBe(2026);
    });
  });

  test("filters monthly attendance by student", async () => {
    const adminUser = await User.findOne({ email: TEST_ADMIN_EMAIL });
    const firstStudent = await Student.create({
      ...studentPayload("001"),
      className: TEST_CLASS,
    });

    const secondStudent = await Student.create({
      ...studentPayload("002"),
      className: TEST_CLASS,
    });

    await Attendance.create([
      {
        student: firstStudent._id,
        className: TEST_CLASS,
        date: new Date("2026-06-10T09:00:00.000Z"),
        status: "Present",
        markedBy: adminUser._id,
      },
      {
        student: secondStudent._id,
        className: TEST_CLASS,
        date: new Date("2026-06-11T09:00:00.000Z"),
        status: "Absent",
        markedBy: adminUser._id,
      },
    ]);

    const response = await request(app)
      .get(
        `/api/v1/attendance/monthly?month=6&year=2026&studentId=${firstStudent._id}&className=${encodeURIComponent(TEST_CLASS)}`,
      )
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.total).toBe(1);
    expect(response.body.attendance).toHaveLength(1);
    expect(
      response.body.attendance[0].student._id.toString(),
    ).toBe(firstStudent._id.toString());
  });

  test("filters monthly attendance by status", async () => {
    const adminUser = await User.findOne({ email: TEST_ADMIN_EMAIL });
    const student = await Student.create({
      ...studentPayload("001"),
      className: TEST_CLASS,
    });

    await Attendance.create([
      {
        student: student._id,
        className: TEST_CLASS,
        date: new Date("2026-06-10T09:00:00.000Z"),
        status: "Present",
        markedBy: adminUser._id,
      },
      {
        student: student._id,
        className: TEST_CLASS,
        date: new Date("2026-06-11T09:00:00.000Z"),
        status: "Absent",
        markedBy: adminUser._id,
      },
    ]);

    const response = await request(app)
      .get(
        `/api/v1/attendance/monthly?month=6&year=2026&status=Absent&className=${encodeURIComponent(TEST_CLASS)}`,
      )
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.total).toBe(1);
    expect(response.body.attendance).toHaveLength(1);
    expect(response.body.attendance[0].status).toBe("Absent");
  });

  test("applies pagination to monthly attendance", async () => {
    const adminUser = await User.findOne({ email: TEST_ADMIN_EMAIL });
    const student = await Student.create({
      ...studentPayload("001"),
      className: TEST_CLASS,
    });

    await Attendance.create([
      {
        student: student._id,
        className: TEST_CLASS,
        date: new Date("2026-06-10T09:00:00.000Z"),
        status: "Present",
        markedBy: adminUser._id,
      },
      {
        student: student._id,
        className: TEST_CLASS,
        date: new Date("2026-06-11T09:00:00.000Z"),
        status: "Absent",
        markedBy: adminUser._id,
      },
      {
        student: student._id,
        className: TEST_CLASS,
        date: new Date("2026-06-12T09:00:00.000Z"),
        status: "Leave",
        markedBy: adminUser._id,
      },
    ]);

    const pageOne = await request(app)
      .get(
        `/api/v1/attendance/monthly?month=6&year=2026&className=${encodeURIComponent(TEST_CLASS)}&page=1&limit=2`,
      )
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const pageTwo = await request(app)
      .get(
        `/api/v1/attendance/monthly?month=6&year=2026&className=${encodeURIComponent(TEST_CLASS)}&page=2&limit=2`,
      )
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(pageOne.body.total).toBe(3);
    expect(pageOne.body.totalPages).toBe(2);
    expect(pageOne.body.attendance).toHaveLength(2);

    expect(pageTwo.body.total).toBe(3);
    expect(pageTwo.body.totalPages).toBe(2);
    expect(pageTwo.body.attendance).toHaveLength(1);
  });

  test("does not return attendance for soft-deleted students", async () => {
    const adminUser = await User.findOne({ email: TEST_ADMIN_EMAIL });
    const activeStudent = await Student.create({
      ...studentPayload("001"),
      className: TEST_CLASS,
    });

    const deletedStudent = await Student.create({
      ...studentPayload("002"),
      className: TEST_CLASS,
    });

    await Attendance.create([
      {
        student: activeStudent._id,
        className: TEST_CLASS,
        date: new Date("2026-06-10T09:00:00.000Z"),
        status: "Present",
        markedBy: adminUser._id,
      },
      {
        student: deletedStudent._id,
        className: TEST_CLASS,
        date: new Date("2026-06-11T09:00:00.000Z"),
        status: "Absent",
        markedBy: adminUser._id,
      },
    ]);

    await Student.updateOne(
      { _id: deletedStudent._id },
      {
        $set: {
          deletedAt: new Date(),
          status: "Inactive",
        },
      },
    );

    const response = await request(app)
      .get(
        `/api/v1/attendance/monthly?month=6&year=2026&className=${encodeURIComponent(TEST_CLASS)}`,
      )
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.total).toBe(1);
    expect(response.body.attendance).toHaveLength(1);
    expect(
      response.body.attendance[0].student._id.toString(),
    ).toBe(activeStudent._id.toString());
  });

  test("rejects an invalid month", async () => {
    const response = await request(app)
      .get("/api/v1/attendance/monthly?month=13&year=2026")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  test("rejects an invalid year", async () => {
    const response = await request(app)
      .get("/api/v1/attendance/monthly?month=6&year=1999")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(400);

    expect(response.body.success).toBe(false);
  });
});

describe("Attendance API — validation", () => {
  test("rejects an invalid studentId", async () => {
    const response = await request(app)
      .get("/api/v1/attendance?studentId=abc")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "studentId",
          msg: "Student ID must be a valid MongoDB ID",
        }),
      ]),
    );
  });

  test("rejects a limit above 100", async () => {
    const response = await request(app)
      .get("/api/v1/attendance?limit=999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "limit",
          msg: "Limit must be between 1 and 100",
        }),
      ]),
    );
  });

  test("rejects an invalid status", async () => {
    const response = await request(app)
      .get("/api/v1/attendance?status=Unknown")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("rejects an invalid date", async () => {
    const response = await request(app)
      .get("/api/v1/attendance?date=not-a-date")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
describe("Attendance API — calendar", () => {
  test("returns attendance calendar for a valid student and month", async () => {
    const student = await Student.create(studentPayload("CAL001"));

    await Attendance.create([
      {
        student: student._id,
        className: TEST_CLASS,
        date: new Date("2026-06-05T00:00:00.000Z"),
        status: "Present",
      },
      {
        student: student._id,
        className: TEST_CLASS,
        date: new Date("2026-06-15T00:00:00.000Z"),
        status: "Absent",
      },
      {
        student: student._id,
        className: TEST_CLASS,
        date: new Date("2026-07-01T00:00:00.000Z"),
        status: "Leave",
      },
    ]);

    const response = await request(app)
      .get(`/api/v1/attendance/calendar/${student._id}?month=6&year=2026`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.month).toBe(6);
    expect(response.body.year).toBe(2026);
    expect(response.body.attendance).toHaveLength(2);

    expect(response.body.attendance).toEqual([
      {
        date: "2026-06-05",
        status: "Present",
      },
      {
        date: "2026-06-15",
        status: "Absent",
      },
    ]);
  });

  test("rejects an invalid calendar month", async () => {
    const student = await Student.create(studentPayload("CAL002"));

    const response = await request(app)
      .get(`/api/v1/attendance/calendar/${student._id}?month=13&year=2026`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("rejects an invalid calendar year", async () => {
    const student = await Student.create(studentPayload("CAL003"));

    const response = await request(app)
      .get(`/api/v1/attendance/calendar/${student._id}?month=6&year=1999`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("returns 404 for a soft-deleted student", async () => {
    const student = await Student.create(studentPayload("CAL004"));

    student.deletedAt = new Date();
    await student.save();

    const response = await request(app)
      .get(`/api/v1/attendance/calendar/${student._id}?month=6&year=2026`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Student not found");
  });
});

describe("Attendance API — Excel export", () => {
  test("rejects Excel export without authentication", async () => {
    const response = await request(app).get(
      "/api/v1/attendance/export/excel",
    );

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("exports attendance as a valid XLSX workbook", async () => {
    const student = await Student.create(studentPayload("EXP001"));

    await Attendance.create([
      {
        student: student._id,
        className: TEST_CLASS,
        date: new Date("2026-06-20T00:00:00.000Z"),
        status: "Present",
      },
      {
        student: student._id,
        className: TEST_CLASS,
        date: new Date("2026-06-21T00:00:00.000Z"),
        status: "Absent",
      },
    ]);

    const response = await request(app)
      .get("/api/v1/attendance/export/excel")
      .set("Authorization", `Bearer ${adminToken}`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];

        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => callback(null, Buffer.concat(chunks)));
        res.on("error", callback);
      });

    expect(response.status).toBe(200);

    expect(response.headers["content-type"]).toMatch(
      /application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/,
    );

    expect(response.headers["content-disposition"]).toContain(
      "attachment; filename=attendance-report.xlsx",
    );

    expect(Buffer.isBuffer(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);

    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(response.body);

    const worksheet = workbook.getWorksheet("Attendance Report");

    expect(worksheet).toBeDefined();

    expect(worksheet.getRow(1).values).toEqual([
      undefined,
      "Date",
      "Admission No",
      "Student Name",
      "Status",
    ]);

    const rows = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        rows.push(row.values);
      }
    });

    const exportedStudentRows = rows.filter(
      (row) => row[2] === student.admissionNo,
    );

    expect(exportedStudentRows).toHaveLength(2);

    expect(exportedStudentRows[0][3]).toBe(
      `${student.firstName} ${student.lastName}`,
    );

    expect(exportedStudentRows.map((row) => row[4])).toEqual(
      expect.arrayContaining(["Present", "Absent"]),
    );
  });

  test("does not export attendance belonging to a soft-deleted student", async () => {
    const activeStudent = await Student.create(studentPayload("EXP002"));
    const deletedStudent = await Student.create(studentPayload("EXP003"));

    await Attendance.create([
      {
        student: activeStudent._id,
        className: TEST_CLASS,
        date: new Date("2026-06-22T00:00:00.000Z"),
        status: "Present",
      },
      {
        student: deletedStudent._id,
        className: TEST_CLASS,
        date: new Date("2026-06-23T00:00:00.000Z"),
        status: "Absent",
      },
    ]);

    deletedStudent.deletedAt = new Date();
    await deletedStudent.save();

    const response = await request(app)
      .get("/api/v1/attendance/export/excel")
      .set("Authorization", `Bearer ${adminToken}`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];

        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => callback(null, Buffer.concat(chunks)));
        res.on("error", callback);
      });

    expect(response.status).toBe(200);

    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(response.body);

    const worksheet = workbook.getWorksheet("Attendance Report");

    expect(worksheet).toBeDefined();

    const admissionNumbers = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        admissionNumbers.push(row.getCell(2).value);
      }
    });

    expect(admissionNumbers).toContain(activeStudent.admissionNo);
    expect(admissionNumbers).not.toContain(deletedStudent.admissionNo);
  });
});
