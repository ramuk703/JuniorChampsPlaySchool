const request = require("supertest");
const mongoose = require("mongoose");

jest.setTimeout(30000);

const { connectRedis, redisClient } = require("../src/config/redis");
const connectDB = require("../src/config/db");
const User = require("../src/models/User");
const Teacher = require("../src/models/Teacher");

let app;
let adminToken;

const TEST_ADMIN_EMAIL = "teacher-regression-admin@example.com";
const TEST_ADMIN_PASSWORD = "TeacherAdminPassword123!";

const TEST_PREFIX = `JEST-TEACHER-${Date.now()}`;

const teacherPayload = (suffix = "001") => ({
  employeeId: `${TEST_PREFIX}-${suffix}`,
  firstName: "Teacher",
  lastName: "Regression",
  gender: "Other",
  email: `teacher-${TEST_PREFIX.toLowerCase()}-${suffix}@example.com`,
  mobile: `9${String(Date.now()).slice(-9)}`,
  qualification: "B.Ed",
  experience: 3,
  classTeacher: "Nursery",
  address: "Teacher Test Address",
  joiningDate: "2025-01-01",
  salary: 25000,
  status: "Active",
});

beforeAll(async () => {
  await connectRedis();
  await connectDB();

  app = require("../src/app");

  await User.deleteOne({ email: TEST_ADMIN_EMAIL });

  await Teacher.deleteMany({
    employeeId: { $regex: `^${TEST_PREFIX}-` },
  });

  await User.create({
    name: "Teacher Regression Admin",
    email: TEST_ADMIN_EMAIL,
    password: TEST_ADMIN_PASSWORD,
    role: "admin",
  });

  const loginResponse = await request(app)
    .post("/api/v1/auth/login")
    .send({
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD,
    });

  expect(loginResponse.status).toBe(200);
  adminToken = loginResponse.body.token;
});

beforeEach(async () => {
  await redisClient.flushDb();

  await Teacher.deleteMany({
    employeeId: { $regex: `^${TEST_PREFIX}-` },
  });
});

afterAll(async () => {
  await Teacher.deleteMany({
    employeeId: { $regex: `^${TEST_PREFIX}-` },
  });

  await User.deleteOne({ email: TEST_ADMIN_EMAIL });

  await mongoose.connection.close();

  if (redisClient.isOpen) {
    await redisClient.quit();
  }
});

describe("Teacher API — authentication and authorization", () => {
  test("rejects requests without authentication", async () => {
    const response = await request(app).get("/api/v1/teachers");

    expect(response.status).toBe(401);
  });

  test("allows an authenticated admin to access teachers", async () => {
    const response = await request(app)
      .get("/api/v1/teachers")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

describe("Teacher API — create", () => {
  test("creates a teacher successfully", async () => {
    const payload = teacherPayload();

    const response = await request(app)
      .post("/api/v1/teachers")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.employeeId).toBe(payload.employeeId);
    expect(response.body.data.email).toBe(payload.email.toLowerCase());
  });

  test("rejects a teacher with missing required fields", async () => {
    const response = await request(app)
      .post("/api/v1/teachers")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        employeeId: `${TEST_PREFIX}-INVALID`,
      });

    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  test("rejects duplicate employee ID", async () => {
    const payload = teacherPayload();

    await Teacher.create(payload);

    const response = await request(app)
      .post("/api/v1/teachers")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        ...payload,
        email: `duplicate-${TEST_PREFIX.toLowerCase()}@example.com`,
      });

    expect(response.status).toBe(500);
  });

  test("rejects duplicate email", async () => {
    const payload = teacherPayload();

    await Teacher.create(payload);

    const response = await request(app)
      .post("/api/v1/teachers")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        ...payload,
        employeeId: `${TEST_PREFIX}-EMAIL-DUP`,
      });

    expect(response.status).toBe(500);
  });
});

describe("Teacher API — listing", () => {
  test("returns paginated teachers", async () => {
    const first = teacherPayload("001");
    const second = teacherPayload("002");

    await Teacher.create([first, second]);

    const response = await request(app)
      .get("/api/v1/teachers")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.page).toBe(1);
    expect(response.body.limit).toBe(10);
    expect(response.body.totalRecords).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(response.body.data)).toBe(true);

    const ids = response.body.data.map((teacher) => teacher.employeeId);

    expect(ids).toEqual(
      expect.arrayContaining([first.employeeId, second.employeeId])
    );
  });

  test("applies pagination parameters", async () => {
    await Teacher.create([
      teacherPayload("001"),
      teacherPayload("002"),
      teacherPayload("003"),
    ]);

    const response = await request(app)
      .get("/api/v1/teachers?page=1&limit=2")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.page).toBe(1);
    expect(response.body.limit).toBe(2);
    expect(response.body.totalRecords).toBeGreaterThanOrEqual(3);
    expect(response.body.data).toHaveLength(2);
  });

  test("caps excessive limit at 100", async () => {
    const response = await request(app)
      .get("/api/v1/teachers?page=1&limit=9999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.limit).toBe(100);
  });

  test("rejects an invalid sort field", async () => {
    const response = await request(app)
      .get("/api/v1/teachers?sort=password")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid sort field");
  });

  test("accepts an allowed sort field", async () => {
    await Teacher.create([
      {
        ...teacherPayload("001"),
        firstName: "Alpha",
      },
      {
        ...teacherPayload("002"),
        firstName: "Zulu",
      },
    ]);

    const response = await request(app)
      .get("/api/v1/teachers?sort=firstName")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const testTeachers = response.body.data.filter((teacher) =>
      teacher.employeeId.startsWith(TEST_PREFIX)
    );

    expect(testTeachers.length).toBeGreaterThanOrEqual(2);
  });

  test("does not return soft-deleted teachers", async () => {
    const deleted = await Teacher.create({
      ...teacherPayload("001"),
      deletedAt: new Date(),
    });

    const response = await request(app)
      .get("/api/v1/teachers")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);

    expect(
      response.body.data.some(
        (teacher) => teacher.employeeId === deleted.employeeId
      )
    ).toBe(false);
  });
});

describe("Teacher API — unpaginated list", () => {
  test("returns active teachers in unpaginated format", async () => {
    const teacher = await Teacher.create(teacherPayload());

    const response = await request(app)
      .get("/api/v1/teachers/all-unpaginated")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);

    const found = response.body.data.find(
      (item) => item.employeeId === teacher.employeeId
    );

    expect(found).toBeDefined();
  });
});

describe("Teacher API — get by ID", () => {
  test("returns a teacher by ID", async () => {
    const teacher = await Teacher.create(teacherPayload());

    const response = await request(app)
      .get(`/api/v1/teachers/${teacher._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.teacher).toBeDefined();
    expect(response.body.teacher.employeeId).toBe(teacher.employeeId);
  });

  test("returns 404 for a nonexistent teacher", async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .get(`/api/v1/teachers/${fakeId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Teacher not found");
  });
});

describe("Teacher API — update", () => {
  test("updates an active teacher", async () => {
    const teacher = await Teacher.create(teacherPayload());

    const response = await request(app)
      .put(`/api/v1/teachers/${teacher._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        ...teacherPayload(),
        employeeId: teacher.employeeId,
        email: teacher.email,
        mobile: teacher.mobile,
        firstName: "UpdatedTeacher",
        qualification: "M.Ed",
        experience: 5,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.teacher.firstName).toBe("UpdatedTeacher");
    expect(response.body.teacher.qualification).toBe("M.Ed");
    expect(response.body.teacher.experience).toBe(5);
  });

  test("returns 404 when updating a nonexistent teacher", async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .put(`/api/v1/teachers/${fakeId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        ...teacherPayload("NONEXISTENT"),
        firstName: "UpdatedTeacher",
      });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Teacher not found");
  });

  test("does not allow updating a deleted teacher", async () => {
    const teacher = await Teacher.create({
      ...teacherPayload(),
      deletedAt: new Date(),
    });

    const response = await request(app)
      .put(`/api/v1/teachers/${teacher._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        ...teacherPayload("DELETED"),
        firstName: "ShouldNotUpdate",
      });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});

describe("Teacher API — soft delete", () => {
  test("soft-deletes a teacher", async () => {
    const teacher = await Teacher.create(teacherPayload());

    const response = await request(app)
      .delete(`/api/v1/teachers/${teacher._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Teacher deleted successfully");

    const deletedTeacher = await Teacher.findById(teacher._id);

    expect(deletedTeacher.deletedAt).not.toBeNull();
  });

  test("returns 404 when deleting an already deleted teacher", async () => {
    const teacher = await Teacher.create({
      ...teacherPayload(),
      deletedAt: new Date(),
    });

    const response = await request(app)
      .delete(`/api/v1/teachers/${teacher._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});

describe("Teacher API — deleted teachers", () => {
  test("lists soft-deleted teachers", async () => {
    const teacher = await Teacher.create({
      ...teacherPayload(),
      deletedAt: new Date(),
    });

    const response = await request(app)
      .get("/api/v1/teachers/deleted")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const found = response.body.teachers.find(
      (item) => item.employeeId === teacher.employeeId
    );

    expect(found).toBeDefined();
  });
});

describe("Teacher API — restore", () => {
  test("restores a deleted teacher", async () => {
    const teacher = await Teacher.create({
      ...teacherPayload(),
      deletedAt: new Date(),
    });

    const response = await request(app)
      .patch(`/api/v1/teachers/${teacher._id}/restore`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Teacher restored successfully");

    const restored = await Teacher.findById(teacher._id);

    expect(restored.deletedAt).toBeNull();
  });

  test("returns 404 when restoring an active teacher", async () => {
    const teacher = await Teacher.create(teacherPayload());

    const response = await request(app)
      .patch(`/api/v1/teachers/${teacher._id}/restore`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});