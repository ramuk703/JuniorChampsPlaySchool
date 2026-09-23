const request = require("supertest");
const mongoose = require("mongoose");

jest.setTimeout(30000);

const { connectRedis, redisClient } = require("../src/config/redis");
const connectDB = require("../src/config/db");

const User = require("../src/models/User");
const Student = require("../src/models/Student");
const FeePayment = require("../src/models/FeePayment");

const generateToken = require("../src/utils/generateToken");

let app;
let adminUser;
let adminToken;
let student;

const TEST_PREFIX = `JEST-FEE-${Date.now()}`;

const studentPayload = () => ({
  admissionNo: `${TEST_PREFIX}-001`,
  firstName: "Fee",
  lastName: "TestStudent",
  gender: "Other",
  dob: new Date("2020-01-01"),
  className: "Nursery",
  section: "A",
  fatherName: "Fee Father",
  motherName: "Fee Mother",
  mobile: "9000099999",
  email: `fee-student-${Date.now()}@example.com`,
  address: "Fee Test Address",
  status: "Active",
});

const feePayload = (overrides = {}) => ({
  student: student._id.toString(),
  month: 9,
  year: 2026,
  feeType: "Monthly",
  amount: 600,
  discount: 0,
  lateFee: 0,
  paymentMethod: "Cash",
  remarks: "Fee test payment",
  ...overrides,
});

beforeAll(async () => {
  await connectRedis();
  await connectDB();

  app = require("../src/app");

  await User.deleteMany({
    email: { $regex: /^fee-test-admin-/ },
  });

  await Student.deleteMany({
    admissionNo: { $regex: `^${TEST_PREFIX}-` },
  });

  await FeePayment.deleteMany({
    remarks: "Fee test payment",
  });

  adminUser = await User.create({
    name: "Fee Test Admin",
    email: `fee-test-admin-${Date.now()}@example.com`,
    password: "FeeTestAdminPassword123!",
    role: "admin",
  });

  adminToken = generateToken(
    adminUser._id,
    adminUser.role,
    adminUser.tokenVersion,
  );
});

beforeEach(async () => {
  if (redisClient.isOpen) {
    await redisClient.flushDb();
  }

  await FeePayment.deleteMany({
    remarks: "Fee test payment",
  });

  await Student.deleteMany({
    admissionNo: { $regex: `^${TEST_PREFIX}-` },
  });

  student = await Student.create(studentPayload());
});

afterAll(async () => {
  await FeePayment.deleteMany({
    remarks: "Fee test payment",
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

describe("Fee API — generate monthly fees", () => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  test("generates monthly fees for eligible active students", async () => {
    const activeStudents = await Student.find({
      status: "Active",
      deletedAt: null,
    })
      .select("_id")
      .lean();

    const activeStudentIds = activeStudents.map((item) => item._id);

    const existingFees = await FeePayment.find({
      student: { $in: activeStudentIds },
      month: currentMonth,
      year: currentYear,
      feeType: "Monthly",
    })
      .select("student")
      .lean();

    const expectedSkipped = existingFees.length;
    const expectedGenerated = activeStudents.length - expectedSkipped;

    const response = await request(app)
      .post("/api/v1/fees/generate-monthly")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.month).toBe(currentMonth);
    expect(response.body.year).toBe(currentYear);
    expect(response.body.generated).toBe(expectedGenerated);
    expect(response.body.skipped).toBe(expectedSkipped);

    const payment = await FeePayment.findOne({
      student: student._id,
      month: currentMonth,
      year: currentYear,
      feeType: "Monthly",
    });

    expect(payment).not.toBeNull();
    expect(payment.amount).toBe(600);
    expect(payment.discount).toBe(0);
    expect(payment.status).toBe("Pending");
    expect(payment.receiptNumber).toBe(
      `AUTO-${currentYear}-${currentMonth}-${student._id}`,
    );

    const expectedLateFee = currentDate.getDate() > 10 ? 100 : 0;

    expect(payment.lateFee).toBe(expectedLateFee);
    expect(payment.totalAmount).toBe(600 + expectedLateFee);
  });

  test("skips students who already have the current monthly fee", async () => {
    const activeStudents = await Student.find({
      status: "Active",
      deletedAt: null,
    })
      .select("_id")
      .lean();

    const activeStudentIds = activeStudents.map((item) => item._id);

    await FeePayment.create({
      student: student._id,
      month: currentMonth,
      year: currentYear,
      feeType: "Monthly",
      amount: 600,
      discount: 0,
      lateFee: 0,
      totalAmount: 600,
      status: "Pending",
      receiptNumber: `AUTO-${currentYear}-${currentMonth}-${student._id}`,
      remarks: "Fee test payment",
    });

    const existingFees = await FeePayment.find({
      student: { $in: activeStudentIds },
      month: currentMonth,
      year: currentYear,
      feeType: "Monthly",
    })
      .select("student")
      .lean();

    const expectedSkipped = existingFees.length;
    const expectedGenerated = activeStudents.length - expectedSkipped;

    const response = await request(app)
      .post("/api/v1/fees/generate-monthly")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.generated).toBe(expectedGenerated);
    expect(response.body.skipped).toBe(expectedSkipped);

    const payments = await FeePayment.find({
      student: student._id,
      month: currentMonth,
      year: currentYear,
      feeType: "Monthly",
    });

    expect(payments).toHaveLength(1);
  });

  test("does not generate a monthly fee for a deleted student", async () => {
    await Student.updateOne(
      { _id: student._id },
      {
        deletedAt: new Date(),
        status: "Inactive",
      },
    );

    const eligibleStudents = await Student.find({
      status: "Active",
      deletedAt: null,
    })
      .select("_id")
      .lean();

    const eligibleStudentIds = eligibleStudents.map((item) => item._id);

    const existingFees = await FeePayment.find({
      student: { $in: eligibleStudentIds },
      month: currentMonth,
      year: currentYear,
      feeType: "Monthly",
    })
      .select("student")
      .lean();

    const expectedSkipped = existingFees.length;
    const expectedGenerated = eligibleStudents.length - expectedSkipped;

    const response = await request(app)
      .post("/api/v1/fees/generate-monthly")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.generated).toBe(expectedGenerated);
    expect(response.body.skipped).toBe(expectedSkipped);

    const payment = await FeePayment.findOne({
      student: student._id,
      month: currentMonth,
      year: currentYear,
      feeType: "Monthly",
    });

    expect(payment).toBeNull();
  });

  test("rejects monthly fee generation without authentication", async () => {
    const response = await request(app).post(
      "/api/v1/fees/generate-monthly",
    );

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});

describe("Fee API — authentication and authorization", () => {
  test("rejects fee requests without authentication", async () => {
    const response = await request(app)
      .post("/api/v1/fees")
      .send(feePayload());

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("allows an authenticated admin to access fees", async () => {
    const response = await request(app)
      .get("/api/v1/fees")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

describe("Fee API — validation", () => {
  test("rejects missing student", async () => {
    const payload = feePayload();
    delete payload.student;

    const response = await request(app)
      .post("/api/v1/fees")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("rejects invalid student ID", async () => {
    const response = await request(app)
      .post("/api/v1/fees")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(feePayload({ student: "invalid-id" }));

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("rejects invalid month", async () => {
    const response = await request(app)
      .post("/api/v1/fees")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(feePayload({ month: 13 }));

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("rejects invalid year", async () => {
    const response = await request(app)
      .post("/api/v1/fees")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(feePayload({ year: 1999 }));

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("rejects invalid fee type", async () => {
    const response = await request(app)
      .post("/api/v1/fees")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(feePayload({ feeType: "InvalidFee" }));

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("rejects negative amount", async () => {
    const response = await request(app)
      .post("/api/v1/fees")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(feePayload({ amount: -100 }));

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("rejects invalid payment method", async () => {
    const response = await request(app)
      .post("/api/v1/fees")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(feePayload({ paymentMethod: "Bitcoin" }));

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("rejects excessively long remarks", async () => {
    const response = await request(app)
      .post("/api/v1/fees")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(
        feePayload({
          remarks: "A".repeat(501),
        }),
      );

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});

describe("Fee API — create", () => {
  test("creates a monthly fee successfully", async () => {
    const response = await request(app)
      .post("/api/v1/fees")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(feePayload());

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.payment).toBeDefined();

    expect(response.body.payment.student.toString()).toBe(
      student._id.toString(),
    );

    expect(response.body.payment.feeType).toBe("Monthly");
    expect(response.body.payment.amount).toBe(600);
    expect(response.body.payment.totalAmount).toBe(600);
    expect(response.body.payment.status).toBe("Pending");
    expect(response.body.payment.receiptNumber).toMatch(/^JCPS-/);

    const savedPayment = await FeePayment.findById(
      response.body.payment._id,
    );

    expect(savedPayment).not.toBeNull();
    expect(savedPayment.totalAmount).toBe(600);
  });

  test("calculates total amount on the server", async () => {
    const response = await request(app)
      .post("/api/v1/fees")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(
        feePayload({
          amount: 1000,
          discount: 100,
          lateFee: 50,
        }),
      );

    expect(response.status).toBe(201);
    expect(response.body.payment.totalAmount).toBe(950);
  });

  test("rejects a deleted/nonexistent student", async () => {
    const fakeStudentId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .post("/api/v1/fees")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(feePayload({ student: fakeStudentId.toString() }));

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  test("prevents duplicate monthly fees for the same student/month/year", async () => {
    const firstResponse = await request(app)
      .post("/api/v1/fees")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(feePayload());

    expect(firstResponse.status).toBe(201);

    const secondResponse = await request(app)
      .post("/api/v1/fees")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(feePayload());

    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body.success).toBe(false);
    expect(secondResponse.body.message).toMatch(/fee already exists/i);
  });
});

describe("Fee API — listing", () => {
  test("returns paginated fee payments", async () => {
    await FeePayment.create({
      ...feePayload(),
      student: student._id,
      receiptNumber: `JCPS-${Date.now()}-LIST`,
      totalAmount: 600,
    });

    const response = await request(app)
      .get("/api/v1/fees?page=1&limit=10")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.page).toBe(1);
    expect(response.body.limit).toBe(10);
    expect(response.body.total).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(response.body.payments)).toBe(true);
  });
});

describe("Fee API — mark paid", () => {
  test("marks a pending fee as paid", async () => {
    const payment = await FeePayment.create({
      ...feePayload(),
      student: student._id,
      receiptNumber: `JCPS-${Date.now()}-PAID`,
      totalAmount: 600,
      status: "Pending",
    });

    const response = await request(app)
      .put(`/api/v1/fees/${payment._id}/pay`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.payment.status).toBe("Paid");

    const savedPayment = await FeePayment.findById(payment._id);

    expect(savedPayment.status).toBe("Paid");
    expect(savedPayment.paidBy.toString()).toBe(adminUser._id.toString());
    expect(savedPayment.paymentDate).toBeInstanceOf(Date);
  });

  test("rejects an already-paid fee", async () => {
    const payment = await FeePayment.create({
      ...feePayload(),
      student: student._id,
      receiptNumber: `JCPS-${Date.now()}-ALREADY-PAID`,
      totalAmount: 600,
      status: "Paid",
      paymentDate: new Date(),
      paidBy: adminUser._id,
    });

    const response = await request(app)
      .put(`/api/v1/fees/${payment._id}/pay`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/already marked as paid/i);

    const savedPayment = await FeePayment.findById(payment._id);

    expect(savedPayment.status).toBe("Paid");
  });

  test("rejects an invalid payment ID", async () => {
    const response = await request(app)
      .put("/api/v1/fees/not-a-valid-id/pay")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
