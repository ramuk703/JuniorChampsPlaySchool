const request = require("supertest");
const mongoose = require("mongoose");

jest.setTimeout(30000);

const { connectRedis, redisClient } = require("../src/config/redis");
const connectDB = require("../src/config/db");
const User = require("../src/models/User");
const Admission = require("../src/models/Admission");
const generateToken = require("../src/utils/generateToken");

let app;
let adminUser;
let adminToken;
let nonAdminUser;
let nonAdminToken;

const TEST_PREFIX = `JEST-ADMISSION-${Date.now()}`;

const validPayload = (overrides = {}) => ({
  childName: `${TEST_PREFIX} Child`,
  dateOfBirth: "2021-05-10",
  requestedClass: "Nursery",
  guardianName: "Test Guardian",
  relationship: "Father",
  mobile: "9876543210",
  email: `${TEST_PREFIX.toLowerCase()}@example.com`,
  address: "Test Address",
  message: "Admission test enquiry",
  ...overrides,
});

beforeAll(async () => {
  await connectRedis();
  await connectDB();

  app = require("../src/app");

  adminUser = await User.create({
    name: "Admission Test Admin",
    email: `admission-admin-${Date.now()}@example.com`,
    password: "AdmissionTestPassword123!",
    role: "admin",
  });

  nonAdminUser = await User.create({
    name: "Admission Test Non Admin",
    email: `admission-user-${Date.now()}@example.com`,
    password: "AdmissionTestPassword123!",
    role: "teacher",
  });

  adminToken = generateToken(
    adminUser._id,
    adminUser.role,
    adminUser.tokenVersion
  );

  nonAdminToken = generateToken(
    nonAdminUser._id,
    nonAdminUser.role,
    nonAdminUser.tokenVersion
  );
});


beforeEach(async () => {
  await Admission.deleteMany({
    childName: { $regex: `^${TEST_PREFIX}` },
  });

  if (redisClient.isOpen) {
    let cursor = "0";

    do {
      const result = await redisClient.scan(cursor, {
        MATCH: "rate-limit:admission:*",
        COUNT: 100,
      });

      cursor = result.cursor;

      if (result.keys.length > 0) {
        await redisClient.del(result.keys);
      }
    } while (cursor !== "0");
  }
});


afterAll(async () => {
  await Admission.deleteMany({
    childName: { $regex: `^${TEST_PREFIX}` },
  });

  if (adminUser?._id) {
    await User.deleteOne({ _id: adminUser._id });
  }

  if (nonAdminUser?._id) {
    await User.deleteOne({ _id: nonAdminUser._id });
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (redisClient.isOpen) {
    await redisClient.quit();
  }
});

describe("Admission API — public submission", () => {
  test("accepts a valid enquiry without authentication", async () => {
    const payload = validPayload();

    const response = await request(app)
      .post("/api/v1/admissions/public")
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.childName).toBe(payload.childName);
    expect(response.body.data.status).toBe("New");

    const saved = await Admission.findById(response.body.data.id);
    expect(saved).not.toBeNull();
    expect(saved.mobile).toBe(payload.mobile);
  });

  test("rejects missing required fields", async () => {
    const response = await request(app)
      .post("/api/v1/admissions/public")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("rejects an invalid mobile number", async () => {
    const response = await request(app)
      .post("/api/v1/admissions/public")
      .send(validPayload({ mobile: "12345" }));

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("rejects a future date of birth", async () => {
    const response = await request(app)
      .post("/api/v1/admissions/public")
      .send(validPayload({ dateOfBirth: "2099-01-01" }));

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});

describe("Admission API — authorization", () => {
  test("rejects listing without authentication", async () => {
    const response = await request(app).get("/api/v1/admissions");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("rejects a non-admin user", async () => {
    const response = await request(app)
      .get("/api/v1/admissions")
      .set("Authorization", `Bearer ${nonAdminToken}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  test("allows an admin to list enquiries", async () => {
    await Admission.create({
      ...validPayload(),
      childName: `${TEST_PREFIX} Listing Child`,
    });

    const response = await request(app)
      .get("/api/v1/admissions?page=1&limit=10")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(10);
  });
});

describe("Admission API — administration", () => {
  test("filters enquiries by search term", async () => {
    await Admission.create({
      ...validPayload(),
      childName: `${TEST_PREFIX} Searchable Child`,
    });

    const response = await request(app)
      .get(`/api/v1/admissions?search=${encodeURIComponent(TEST_PREFIX)}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(
      response.body.data.some((item) =>
        item.childName.includes(TEST_PREFIX)
      )
    ).toBe(true);
  });

  test("updates status and admin notes", async () => {
    const admission = await Admission.create({
      ...validPayload(),
      childName: `${TEST_PREFIX} Update Child`,
    });

    const response = await request(app)
      .patch(`/api/v1/admissions/${admission._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        status: "Contacted",
        adminNotes: "Called guardian for follow-up",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("Contacted");
    expect(response.body.data.adminNotes).toBe(
      "Called guardian for follow-up"
    );
  });

  test("rejects an invalid status", async () => {
    const admission = await Admission.create({
      ...validPayload(),
      childName: `${TEST_PREFIX} Invalid Status Child`,
    });

    const response = await request(app)
      .patch(`/api/v1/admissions/${admission._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "NotAStatus" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("rejects unexpected update fields", async () => {
    const admission = await Admission.create({
      ...validPayload(),
      childName: `${TEST_PREFIX} Unexpected Field Child`,
    });

    const response = await request(app)
      .patch(`/api/v1/admissions/${admission._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ childName: "Unauthorized Change" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
