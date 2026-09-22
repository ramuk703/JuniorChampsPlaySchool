const request = require("supertest");
const mongoose = require("mongoose");

jest.setTimeout(30000);

const { connectRedis, redisClient } = require("../src/config/redis");
const connectDB = require("../src/config/db");

const User = require("../src/models/User");
const Parent = require("../src/models/Parent");
const Student = require("../src/models/Student");

const generateToken = require("../src/utils/generateToken");

let app;
let adminToken;
let adminUser;
let student;
let secondStudent;

const TEST_PREFIX = `JEST-PARENT-${Date.now()}`;

const studentPayload = (suffix = "001") => ({
  admissionNo: `${TEST_PREFIX}-${suffix}`,
  firstName: "Parent",
  lastName: `Student${suffix}`,
  gender: "Other",
  dob: new Date("2020-01-01"),
  className: "Nursery",
  section: "A",
  fatherName: "Test Father",
  motherName: "Test Mother",
  mobile: "9000012345",
  email: `student-${TEST_PREFIX}-${suffix}@example.com`,
  address: "Parent Test Address",
  status: "Active",
});

const parentPayload = (suffix = "001", studentId = student._id) => ({
  fatherName: "Test Father",
  motherName: "Test Mother",
  email: `parent-${TEST_PREFIX}-${suffix}@example.com`,
  mobile: "9000012345",
  password: "ParentTestPassword123!",
  address: "Parent Test Address",
  student: studentId.toString(),
});

beforeAll(async () => {
  await connectRedis();
  await connectDB();

  app = require("../src/app");

  await User.deleteMany({
    email: /^parent-crud-admin-/,
  });

  await Student.deleteMany({
    admissionNo: { $regex: `^${TEST_PREFIX}-` },
  });

  await Parent.deleteMany({
    email: { $regex: `^parent-${TEST_PREFIX}-` },
  });

  adminUser = await User.create({
    name: "Parent CRUD Admin",
    email: `parent-crud-admin-${Date.now()}@example.com`,
    password: "AdminTestPassword123!",
    role: "admin",
  });

  adminToken = generateToken(
    adminUser._id,
    adminUser.role,
    adminUser.tokenVersion
  );
});

beforeEach(async () => {
  if (redisClient.isOpen) {
    await redisClient.flushDb();
  }

  await Parent.deleteMany({
    email: { $regex: `^parent-${TEST_PREFIX}-` },
  });

  await Student.deleteMany({
    admissionNo: { $regex: `^${TEST_PREFIX}-` },
  });

  student = await Student.create(studentPayload("001"));
  secondStudent = await Student.create(studentPayload("002"));
});

afterAll(async () => {
  await Parent.deleteMany({
    email: { $regex: `^parent-${TEST_PREFIX}-` },
  });

  await Student.deleteMany({
    admissionNo: { $regex: `^${TEST_PREFIX}-` },
  });

  if (adminUser?._id) {
    await User.deleteOne({ _id: adminUser._id });
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (redisClient.isOpen) {
    await redisClient.quit();
  }
});

describe("Parent API — authentication and authorization", () => {
  test("rejects requests without authentication", async () => {
    const response = await request(app).get("/api/v1/parents");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("allows an authenticated admin to access parents", async () => {
    const response = await request(app)
      .get("/api/v1/parents")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

describe("Parent API — create", () => {
  test("creates a parent successfully", async () => {
    const payload = parentPayload();

    const response = await request(app)
      .post("/api/v1/parents")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.parent).toBeDefined();
    expect(response.body.parent.email).toBe(payload.email.toLowerCase());
    expect(response.body.parent.student._id).toBe(student._id.toString());

    expect(response.body.parent.password).toBeUndefined();
    expect(response.body.parent.tokenVersion).toBeUndefined();

    const saved = await Parent.findOne({ email: payload.email });

    expect(saved).not.toBeNull();
    expect(saved.password).not.toBe(payload.password);
  });

  test("rejects missing required fields", async () => {
    const response = await request(app)
      .post("/api/v1/parents")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("rejects an invalid student ID", async () => {
    const response = await request(app)
      .post("/api/v1/parents")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(parentPayload("003", "invalid-student-id"));

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("rejects a nonexistent student", async () => {
    const fakeStudentId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .post("/api/v1/parents")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(parentPayload("004", fakeStudentId));

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/student/i);
  });

  test("rejects duplicate parent email", async () => {
    const payload = parentPayload("005");

    await Parent.create({
      ...payload,
      student: student._id,
    });

    const response = await request(app)
      .post("/api/v1/parents")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        ...payload,
        student: secondStudent._id.toString(),
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/email/i);
  });
});

describe("Parent API — listing and get by ID", () => {
  test("returns paginated active parents", async () => {
    const created = await Parent.create(parentPayload("006"));

    const response = await request(app)
      .get("/api/v1/parents?page=1&limit=10")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.page).toBe(1);
    expect(response.body.limit).toBe(10);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(
      response.body.data.some(
        (item) => item.email === created.email
      )
    ).toBe(true);
  });

  test("supports parent search", async () => {
    const payload = parentPayload("007");

    const created = await Parent.create(payload);

    const response = await request(app)
      .get("/api/v1/parents")
      .query({ search: created.email })
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(
      response.body.data.some(
        (item) => item.email === created.email
      )
    ).toBe(true);
  });

  test("returns a parent by ID", async () => {
    const created = await Parent.create(parentPayload("008"));

    const response = await request(app)
      .get(`/api/v1/parents/${created._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.parent.email).toBe(created.email);
    expect(response.body.parent.student).toBeDefined();

    expect(response.body.parent.password).toBeUndefined();
    expect(response.body.parent.tokenVersion).toBeUndefined();
  });

  test("returns 404 for a nonexistent parent", async () => {
    const id = new mongoose.Types.ObjectId();

    const response = await request(app)
      .get(`/api/v1/parents/${id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });

  test("does not return soft-deleted parents in active list", async () => {
    const created = await Parent.create(parentPayload("009"));

    await Parent.updateOne(
      { _id: created._id },
      { $set: { deletedAt: new Date() } }
    );

    const response = await request(app)
      .get("/api/v1/parents")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);

    const found = response.body.data.find(
      (item) => item._id === created._id.toString()
    );

    expect(found).toBeUndefined();
  });
});

describe("Parent API — update", () => {
  test("updates an active parent", async () => {
    const created = await Parent.create(parentPayload("010"));

    const response = await request(app)
      .put(`/api/v1/parents/${created._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        ...parentPayload("010", secondStudent._id),
        fatherName: "Updated Father",
        email: `updated-${TEST_PREFIX}@example.com`,
        mobile: "9111111111",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.parent.fatherName).toBe("Updated Father");
    expect(response.body.parent.student._id).toBe(
      secondStudent._id.toString()
    );
    expect(response.body.parent.password).toBeUndefined();
  });

  test("updates and hashes a changed password", async () => {
    const created = await Parent.create(parentPayload("011"));

    const newPassword = "UpdatedParentPassword456!";

    const response = await request(app)
      .put(`/api/v1/parents/${created._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        ...parentPayload("011"),
        password: newPassword,
      });

    expect(response.status).toBe(200);

    const saved = await Parent.findById(created._id);

    expect(saved.password).not.toBe(newPassword);
    expect(await saved.matchPassword(newPassword)).toBe(true);
  });

  test("does not allow updating a deleted parent", async () => {
    const created = await Parent.create(parentPayload("012"));

    await Parent.updateOne(
      { _id: created._id },
      { $set: { deletedAt: new Date() } }
    );

    const response = await request(app)
      .put(`/api/v1/parents/${created._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        ...parentPayload("012"),
        fatherName: "Should Not Update",
      });

    expect(response.status).toBe(404);
  });

  test("rejects invalid parent ID", async () => {
    const response = await request(app)
      .put("/api/v1/parents/not-a-valid-id")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(parentPayload("013"));

    expect(response.status).toBe(400);
  });
});

describe("Parent API — soft delete", () => {
  test("soft-deletes a parent", async () => {
    const created = await Parent.create(parentPayload("014"));

    const response = await request(app)
      .delete(`/api/v1/parents/${created._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const saved = await Parent.findById(created._id);

    expect(saved.deletedAt).not.toBeNull();
  });

  test("returns 404 when deleting an already deleted parent", async () => {
    const created = await Parent.create(parentPayload("015"));

    await Parent.updateOne(
      { _id: created._id },
      { $set: { deletedAt: new Date() } }
    );

    const response = await request(app)
      .delete(`/api/v1/parents/${created._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });
});

describe("Parent API — deleted parents", () => {
  test("lists soft-deleted parents", async () => {
    const created = await Parent.create(parentPayload("016"));

    await Parent.updateOne(
      { _id: created._id },
      { $set: { deletedAt: new Date() } }
    );

    const response = await request(app)
      .get("/api/v1/parents/deleted")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.parents)).toBe(true);

    const found = response.body.parents.find(
      (item) => item._id === created._id.toString()
    );

    expect(found).toBeDefined();
    expect(found.password).toBeUndefined();
    expect(found.tokenVersion).toBeUndefined();
  });
});

describe("Parent API — restore", () => {
  test("restores a deleted parent", async () => {
    const created = await Parent.create(parentPayload("017"));

    await Parent.updateOne(
      { _id: created._id },
      { $set: { deletedAt: new Date() } }
    );

    const response = await request(app)
      .patch(`/api/v1/parents/${created._id}/restore`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.parent._id).toBe(created._id.toString());
    expect(response.body.parent.password).toBeUndefined();
    expect(response.body.parent.tokenVersion).toBeUndefined();

    const saved = await Parent.findById(created._id);

    expect(saved.deletedAt).toBeNull();
  });

  test("returns 404 when restoring an active parent", async () => {
    const created = await Parent.create(parentPayload("018"));

    const response = await request(app)
      .patch(`/api/v1/parents/${created._id}/restore`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });
});