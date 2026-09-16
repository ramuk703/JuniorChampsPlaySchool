const request = require("supertest");

jest.setTimeout(30000);

const { connectRedis, redisClient } = require("../src/config/redis");
const connectDB = require("../src/config/db");
const mongoose = require("mongoose");

const User = require("../src/models/User");
const Student = require("../src/models/Student");

let app;
let adminToken;

const TEST_ADMIN_EMAIL = "student-regression-admin@example.com";
const TEST_ADMIN_PASSWORD = "StudentAdminPassword123!";

const TEST_PREFIX = `JEST-STUDENT-${Date.now()}`;
const TEST_ADMISSION = `${TEST_PREFIX}-001`;

const studentPayload = () => ({
  admissionNo: TEST_ADMISSION,
  firstName: "Test",
  lastName: "Student",
  gender: "Other",
  dob: "2020-01-01",
  className: "Nursery",
  section: "A",
  fatherName: "Test Father",
  motherName: "Test Mother",
  mobile: "9000011111",
  email: "student-regression@example.com",
  address: "Student Test Address",
  status: "Active",
});

const createAdmin = async () => {
  return User.create({
    name: "Student Regression Admin",
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
  await Student.deleteMany({ admissionNo: { $regex: `^${TEST_PREFIX}-` } });

  await createAdmin();
  adminToken = await loginAdmin();
});

beforeEach(async () => {
  if (redisClient.isOpen) {
    await redisClient.flushDb();
  }

  await Student.deleteMany({
    admissionNo: { $regex: `^${TEST_PREFIX}-` },
  });
});

afterAll(async () => {
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

describe("Student API — authentication and authorization", () => {
  test("rejects requests without authentication", async () => {
    const response = await request(app).get("/api/v1/students");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("allows an authenticated admin to access students", async () => {
    const response = await request(app)
      .get("/api/v1/students")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

describe("Student API — create", () => {
  test("creates a student successfully", async () => {
    const response = await request(app)
      .post("/api/v1/students")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(studentPayload());

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Student Created");
    expect(response.body.student).toBeDefined();

    expect(response.body.student.admissionNo).toBe(TEST_ADMISSION);
    expect(response.body.student.firstName).toBe("Test");
    expect(response.body.student.lastName).toBe("Student");
    expect(response.body.student.status).toBe("Active");

    const student = await Student.findOne({
      admissionNo: TEST_ADMISSION,
    });

    expect(student).not.toBeNull();
    expect(student.deletedAt).toBeNull();
  });

  test("rejects a student with missing required fields", async () => {
    const response = await request(app)
      .post("/api/v1/students")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        admissionNo: TEST_ADMISSION,
        firstName: "Test",
      });

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
  });

  test("rejects duplicate admission number", async () => {
    await Student.create(studentPayload());

    const response = await request(app)
      .post("/api/v1/students")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        ...studentPayload(),
        firstName: "Another",
        lastName: "Student",
      });

    expect(response.status).toBe(409);
  });
});

describe("Student API — listing and pagination", () => {
  test("returns active students", async () => {
    const student = await Student.create(studentPayload());

    const response = await request(app)
      .get("/api/v1/students")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.page).toBe(1);
    expect(response.body.limit).toBe(10);
    expect(response.body.total).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(response.body.students)).toBe(true);

    const returned = response.body.students.find(
      (item) => item.admissionNo === student.admissionNo
    );

    expect(returned).toBeDefined();
    expect(returned.admissionNo).toBe(student.admissionNo);
  });

  test("applies pagination parameters", async () => {
    await Student.create([
      studentPayload(),
      {
        ...studentPayload(),
        admissionNo: `${TEST_PREFIX}-002`,
        firstName: "Second",
      },
      {
        ...studentPayload(),
        admissionNo: `${TEST_PREFIX}-003`,
        firstName: "Third",
      },
    ]);

    const response = await request(app)
      .get("/api/v1/students?page=1&limit=2")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.page).toBe(1);
    expect(response.body.limit).toBe(2);
    expect(response.body.total).toBeGreaterThanOrEqual(3);
    expect(response.body.students).toHaveLength(2);
  });

  test("does not return soft-deleted students", async () => {
    const student = await Student.create({
      ...studentPayload(),
      deletedAt: new Date(),
    });

    const response = await request(app)
      .get("/api/v1/students")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(
      response.body.students.some(
        (item) => item.admissionNo === student.admissionNo
      )
    ).toBe(false);
  });

  test("caps an excessive limit at 100", async () => {
    const response = await request(app)
      .get("/api/v1/students?page=1&limit=9999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.limit).toBe(100);
  });
});

describe("Student API — search", () => {
  beforeEach(async () => {
    await Student.create([
      studentPayload(),
      {
        ...studentPayload(),
        admissionNo: `${TEST_PREFIX}-002`,
        firstName: "JestSearch",
        lastName: "Unique",
      },
    ]);
  });

  test("searches by first name", async () => {
    const response = await request(app)
      .get("/api/v1/students/search?q=JestSearch")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].firstName).toBe("JestSearch");
  });

  test("searches by admission number", async () => {
    const response = await request(app)
      .get(`/api/v1/students/search?q=${TEST_ADMISSION}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].admissionNo).toBe(TEST_ADMISSION);
  });

  test("supports the keyword query parameter", async () => {
    const response = await request(app)
      .get("/api/v1/students/search?keyword=Unique")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].lastName).toBe("Unique");
  });

  test("rejects an empty search keyword", async () => {
    const response = await request(app)
      .get("/api/v1/students/search?q=")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Search keyword is required");
  });
});

describe("Student API — update", () => {
  test("updates an active student", async () => {
    const student = await Student.create(studentPayload());

    const response = await request(app)
      .put(`/api/v1/students/${student._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        firstName: "Updated",
        className: "LKG",
        section: "B",
      });

    expect(response.status).toBe(200);
    expect(response.body.firstName).toBe("Updated");
    expect(response.body.className).toBe("LKG");
    expect(response.body.section).toBe("B");

    const updated = await Student.findById(student._id);

    expect(updated.firstName).toBe("Updated");
    expect(updated.className).toBe("LKG");
  });

  test("returns 404 when updating a nonexistent student", async () => {
    const response = await request(app)
      .put("/api/v1/students/507f1f77bcf86cd799439011")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        firstName: "Updated",
      });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Student not found");
  });
});

describe("Student API — soft delete", () => {
  test("soft-deletes a student", async () => {
    const student = await Student.create(studentPayload());

    const response = await request(app)
      .delete(`/api/v1/students/${student._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Student deleted successfully");

    const deleted = await Student.findById(student._id);

    expect(deleted).not.toBeNull();
    expect(deleted.deletedAt).not.toBeNull();
  });

  test("returns 404 when deleting an already deleted student", async () => {
    const student = await Student.create({
      ...studentPayload(),
      deletedAt: new Date(),
    });

    const response = await request(app)
      .delete(`/api/v1/students/${student._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Student not found");
  });

  test("does not allow updating a deleted student", async () => {
    const student = await Student.create({
      ...studentPayload(),
      deletedAt: new Date(),
    });

    const response = await request(app)
      .put(`/api/v1/students/${student._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        firstName: "ShouldNotUpdate",
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Student not found");
  });
});

describe("Student API — deleted students", () => {
  test("lists soft-deleted students", async () => {
    const student = await Student.create({
      ...studentPayload(),
      deletedAt: new Date(),
    });

    const response = await request(app)
      .get("/api/v1/students/deleted")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const returned = response.body.students.find(
      (item) => item._id === student._id.toString()
    );

    expect(returned).toBeDefined();
    expect(returned.admissionNo).toBe(student.admissionNo);
  });
});

describe("Student API — restore", () => {
  test("restores a deleted student", async () => {
    const student = await Student.create({
      ...studentPayload(),
      deletedAt: new Date(),
    });

    const response = await request(app)
      .patch(`/api/v1/students/${student._id}/restore`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Student restored successfully");
    expect(response.body.student).toBeDefined();

    const restored = await Student.findById(student._id);

    expect(restored.deletedAt).toBeNull();
  });

  test("returns 404 when restoring an active student", async () => {
    const student = await Student.create(studentPayload());

    const response = await request(app)
      .patch(`/api/v1/students/${student._id}/restore`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Deleted student not found");
  });
});