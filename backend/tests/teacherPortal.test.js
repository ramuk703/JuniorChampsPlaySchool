const request = require("supertest");
const mongoose = require("mongoose");

jest.setTimeout(30000);

const { connectRedis, redisClient } = require("../src/config/redis");
const connectDB = require("../src/config/db");
const User = require("../src/models/User");
const Teacher = require("../src/models/Teacher");
const TeacherAttendance = require("../src/models/TeacherAttendance");

const RUN_ID = Date.now();
const PREFIX = `TP-${RUN_ID}`;
const ADMIN_EMAIL = `tp-admin-${RUN_ID}@example.com`;
const ADMIN_PASSWORD = "TeacherPortalAdmin123!";
const TEACHER_PASSWORD = "TeacherPortalPassword123!";

const teacherEmail = (suffix) => `tp-${RUN_ID}-${suffix}@example.com`;

const teacherPayload = (suffix) => ({
  employeeId: `${PREFIX}-${suffix}`,
  firstName: "Portal",
  lastName: `Teacher${suffix}`,
  gender: "Other",
  email: teacherEmail(suffix),
  mobile: `${String(9000000000 + Number(suffix)).slice(0, 10)}`,
  qualification: "B.Ed",
  experience: 3,
  classTeacher: "Nursery",
  address: "Teacher Portal Test Address",
  status: "Active",
});

let app;
let adminToken;

async function cleanFixtures() {
  const teachers = await Teacher.find({
    employeeId: { $regex: `^${PREFIX}-` },
  }).select("_id");

  if (teachers.length) {
    await TeacherAttendance.deleteMany({
      teacher: { $in: teachers.map((teacher) => teacher._id) },
    });
  }

  await Teacher.deleteMany({
    employeeId: { $regex: `^${PREFIX}-` },
  });

  await User.deleteMany({
    email: { $regex: `^tp-${RUN_ID}-` },
  });
}

async function createLinkedTeacher(suffix) {
  const teacher = await Teacher.create(teacherPayload(suffix));

  const user = await User.create({
    name: `${teacher.firstName} ${teacher.lastName}`,
    email: teacher.email,
    password: TEACHER_PASSWORD,
    role: "teacher",
    teacherId: teacher._id,
  });

  const response = await request(app)
    .post("/api/v1/teacher-auth/login")
    .send({ email: teacher.email, password: TEACHER_PASSWORD });

  expect(response.status).toBe(200);
  expect(response.body.token).toEqual(expect.any(String));

  return { teacher, user, token: response.body.token };
}

beforeAll(async () => {
  await connectRedis();
  await connectDB();
  app = require("../src/app");

  await User.deleteOne({ email: ADMIN_EMAIL });

  await User.create({
    name: "Teacher Portal Test Admin",
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: "admin",
  });

  const login = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

  expect(login.status).toBe(200);
  adminToken = login.body.token;
});

beforeEach(async () => {
  if (redisClient.isOpen) {
    await redisClient.flushDb();
  }
  await cleanFixtures();
});

afterAll(async () => {
  await cleanFixtures();
  await User.deleteOne({ email: ADMIN_EMAIL });

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (redisClient.isOpen) {
    await redisClient.quit();
  }
});

describe("Teacher Portal authentication", () => {
  test("allows an active linked teacher to log in", async () => {
    const teacher = await Teacher.create(teacherPayload("001"));

    await User.create({
      name: "Portal Teacher",
      email: teacher.email,
      password: TEACHER_PASSWORD,
      role: "teacher",
      teacherId: teacher._id,
    });

    const response = await request(app)
      .post("/api/v1/teacher-auth/login")
      .send({
        email: teacher.email,
        password: TEACHER_PASSWORD,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user.role).toBe("teacher");
    expect(response.body.token).toEqual(expect.any(String));
  });

  test("rejects an incorrect teacher password", async () => {
    const teacher = await Teacher.create(teacherPayload("002"));

    await User.create({
      name: "Portal Teacher",
      email: teacher.email,
      password: TEACHER_PASSWORD,
      role: "teacher",
      teacherId: teacher._id,
    });

    const response = await request(app)
      .post("/api/v1/teacher-auth/login")
      .send({
        email: teacher.email,
        password: "WrongPassword123!",
      });

    expect(response.status).toBe(401);
  });

  test("rejects access to the portal without a token", async () => {
    const response = await request(app)
      .get("/api/v1/teacher-portal/profile");

    expect(response.status).toBe(401);
  });

  test("does not allow an admin token to access the teacher portal", async () => {
    const response = await request(app)
      .get("/api/v1/teacher-portal/profile")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(403);
  });
});

describe("Teacher Portal attendance isolation", () => {
  test("returns only attendance belonging to the logged-in teacher", async () => {
    const first = await createLinkedTeacher("101");
    const second = await createLinkedTeacher("102");

    await TeacherAttendance.create([
      {
        teacher: first.teacher._id,
        date: new Date("2026-09-10T00:00:00.000Z"),
        status: "Present",
        remarks: "First teacher record",
      },
      {
        teacher: second.teacher._id,
        date: new Date("2026-09-11T00:00:00.000Z"),
        status: "Absent",
        remarks: "Second teacher private record",
      },
    ]);

    const response = await request(app)
      .get("/api/v1/teacher-portal/attendance")
      .set("Authorization", `Bearer ${first.token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].status).toBe("Present");
    expect(response.body.data[0].remarks).toBe("First teacher record");
    expect(
      response.body.data.some(
        (record) => record.remarks === "Second teacher private record",
      ),
    ).toBe(false);
  });

  test("allows a linked teacher to view their profile without exposing salary", async () => {
    const linked = await createLinkedTeacher("103");

    const response = await request(app)
      .get("/api/v1/teacher-portal/profile")
      .set("Authorization", `Bearer ${linked.token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(String(response.body.teacher._id)).toBe(
      String(linked.teacher._id),
    );
    expect(response.body.teacher.salary).toBeUndefined();
  });
});

describe("Teacher account provisioning", () => {
  test("allows an admin to provision a login for an active teacher", async () => {
    const teacher = await Teacher.create(teacherPayload("201"));

    const response = await request(app)
      .post("/api/v1/teacher-auth/provision")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ teacherId: String(teacher._id) });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.role).toBe("teacher");

    const user = await User.findOne({ email: teacher.email });
    expect(user).not.toBeNull();
    expect(user.role).toBe("teacher");
    expect(String(user.teacherId)).toBe(String(teacher._id));
  });

  test("does not allow an unauthenticated user to provision accounts", async () => {
    const teacher = await Teacher.create(teacherPayload("202"));

    const response = await request(app)
      .post("/api/v1/teacher-auth/provision")
      .send({ teacherId: String(teacher._id) });

    expect(response.status).toBe(401);
  });
});
