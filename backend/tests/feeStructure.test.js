const request = require("supertest");
const mongoose = require("mongoose");

jest.setTimeout(30000);

const { connectRedis, redisClient } = require("../src/config/redis");
const connectDB = require("../src/config/db");

const User = require("../src/models/User");
const FeeStructure = require("../src/models/FeeStructure");

const generateToken = require("../src/utils/generateToken");

let app;
let adminUser;
let adminToken;

const TEST_PREFIX = `JEST-FEE-STRUCTURE-${Date.now()}`;

beforeAll(async () => {
  await connectRedis();
  await connectDB();

  app = require("../src/app");

  adminUser = await User.create({
    name: "Fee Structure Test Admin",
    email: `fee-structure-admin-${Date.now()}@example.com`,
    password: "FeeStructureAdminPassword123!",
    role: "admin",
  });

  adminToken = generateToken(
    adminUser._id,
    adminUser.role,
    adminUser.tokenVersion
  );
});

beforeEach(async () => {
  await FeeStructure.deleteMany({
    className: { $regex: `^${TEST_PREFIX}` },
  });
});

afterAll(async () => {
  await FeeStructure.deleteMany({
    className: { $regex: `^${TEST_PREFIX}` },
  });

  if (adminUser) {
    await User.deleteOne({ _id: adminUser._id });
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (redisClient.isOpen) {
    await redisClient.quit();
  }
});

describe("Fee Structure API", () => {
  describe("GET /api/v1/fee-structures", () => {
    it("returns fee structures for admin", async () => {
      await FeeStructure.create({
        className: `${TEST_PREFIX}-Nursery`,
        admissionFee: 1000,
        monthlyFee: 600,
        transportFee: 400,
        annualFee: 500,
        examFee: 200,
      });

      const response = await request(app)
        .get("/api/v1/fee-structures")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      const matchingStructures = response.body.feeStructures.filter(
        (item) => item.className === `${TEST_PREFIX}-Nursery`
      );

      expect(matchingStructures).toHaveLength(1);
      expect(matchingStructures[0].className).toBe(
        `${TEST_PREFIX}-Nursery`
      );
    });
  });

  describe("POST /api/v1/fee-structures", () => {
    it("creates a fee structure", async () => {
      const response = await request(app)
        .post("/api/v1/fee-structures")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          className: `${TEST_PREFIX}-LKG`,
          admissionFee: 1000,
          monthlyFee: 600,
          transportFee: 400,
          annualFee: 500,
          examFee: 200,
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.feeStructure.className).toBe(
        `${TEST_PREFIX}-LKG`
      );
      expect(response.body.feeStructure.monthlyFee).toBe(600);
    });

    it("rejects duplicate class fee structure", async () => {
      await FeeStructure.create({
        className: `${TEST_PREFIX}-Duplicate`,
        admissionFee: 1000,
        monthlyFee: 600,
      });

      const response = await request(app)
        .post("/api/v1/fee-structures")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          className: `${TEST_PREFIX}-Duplicate`,
          admissionFee: 1200,
          monthlyFee: 700,
        });

      expect(response.statusCode).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it("rejects invalid fee values", async () => {
      const response = await request(app)
        .post("/api/v1/fee-structures")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          className: `${TEST_PREFIX}-Invalid`,
          admissionFee: -100,
          monthlyFee: 600,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});