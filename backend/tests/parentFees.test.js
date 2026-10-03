const request = require("supertest");
const mongoose = require("mongoose");
const crypto = require("crypto");

jest.setTimeout(30000);

// Mock Razorpay so tests never create a real external payment order.
jest.mock("../src/config/razorpay", () => ({
  orders: {
    create: jest.fn(),
  },
}));

const razorpay = require("../src/config/razorpay");

const { connectRedis, redisClient } = require("../src/config/redis");
const connectDB = require("../src/config/db");

const Parent = require("../src/models/Parent");
const Student = require("../src/models/Student");
const FeePayment = require("../src/models/FeePayment");
const generateToken = require("../src/utils/generateToken");
const { razorpaySecret } = require("../src/config/env");

let app;

let parent;
let parentToken;

let secondParent;
let secondParentToken;

let student;
let secondStudent;

let pendingFee;
let paidFee;
let secondStudentFee;

const TEST_PREFIX = `JEST-PARENT-FEE-${Date.now()}`;

const createStudentPayload = (suffix) => ({
  admissionNo: `${TEST_PREFIX}-${suffix}`,
  firstName: "Fee",
  lastName: `Student${suffix}`,
  gender: "Other",
  dob: new Date("2020-01-01"),
  className: "Nursery",
  section: "A",
  fatherName: "Fee Father",
  motherName: "Fee Mother",
  mobile: "9000099999",
  email: `fee-student-${TEST_PREFIX}-${suffix}@example.com`,
  address: "Fee Test Address",
  status: "Active",
  deletedAt: null,
});

const createFee = (
  studentId,
  suffix,
  status = "Pending",
  overrides = {}
) =>
  FeePayment.create({
    student: studentId,
    month: 9,
    year: 2026,
    feeType: "Monthly",
    amount: 600,
    discount: 50,
    lateFee: 100,
    totalAmount: 650,
    status,
    paymentMethod: status === "Paid" ? "Razorpay" : "Cash",
    receiptNumber: `${TEST_PREFIX}-${suffix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    ...(status === "Paid"
      ? {
          paymentDate: new Date(),
          razorpayPaymentId: `pay_test_${suffix}`,
        }
      : {}),
    ...overrides,
  });

beforeAll(async () => {
  await connectRedis();
  await connectDB();

  app = require("../src/app");
});

beforeEach(async () => {
  if (redisClient.isOpen) {
    await redisClient.flushDb();
  }

  await Parent.deleteMany({
    email: {
      $in: [
        `${TEST_PREFIX}-parent-one@example.com`,
        `${TEST_PREFIX}-parent-two@example.com`,
      ],
    },
  });

  await FeePayment.deleteMany({
    receiptNumber: { $regex: TEST_PREFIX },
  });

  await Student.deleteMany({
    admissionNo: { $regex: TEST_PREFIX },
  });

  student = await Student.create(createStudentPayload("001"));
  secondStudent = await Student.create(createStudentPayload("002"));

  parent = await Parent.create({
    fatherName: "Parent One",
    motherName: "Mother One",
    email: `${TEST_PREFIX}-parent-one@example.com`,
    mobile: "9000011111",
    password: "ParentTestPassword123!",
    address: "Parent One Address",
    student: student._id,
  });

  secondParent = await Parent.create({
    fatherName: "Parent Two",
    motherName: "Mother Two",
    email: `${TEST_PREFIX}-parent-two@example.com`,
    mobile: "9000022222",
    password: "ParentTestPassword123!",
    address: "Parent Two Address",
    student: secondStudent._id,
  });

  parentToken = generateToken(
    parent._id,
    "parent",
    parent.tokenVersion
  );

  secondParentToken = generateToken(
    secondParent._id,
    "parent",
    secondParent.tokenVersion
  );

  pendingFee = await createFee(student._id, "pending", "Pending", {
    month: 9,
    year: 2026,
    feeType: "Monthly",
  });

  paidFee = await createFee(student._id, "paid", "Paid", {
    month: 10,
    year: 2026,
    feeType: "Monthly",
  });

  secondStudentFee = await createFee(
    secondStudent._id,
    "other-student",
    "Pending",
    {
      month: 9,
      year: 2026,
      feeType: "Monthly",
    }
  );

  jest.clearAllMocks();

  razorpay.orders.create.mockResolvedValue({
    id: `order_test_${Date.now()}`,
    entity: "order",
    amount: 65000,
    amount_paid: 0,
    amount_due: 65000,
    currency: "INR",
    receipt: `JCPS-${pendingFee._id}`,
    status: "created",
  });
});

afterAll(async () => {
  await FeePayment.deleteMany({
    receiptNumber: { $regex: TEST_PREFIX },
  });

  await Parent.deleteMany({
    email: { $regex: TEST_PREFIX },
  });

  await Student.deleteMany({
    admissionNo: { $regex: TEST_PREFIX },
  });

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (redisClient.isOpen) {
    await redisClient.quit();
  }
});


describe("Parent Fees API — authentication", () => {
  test("rejects fee list without authentication", async () => {
    const response = await request(app)
      .get("/api/v1/parents/fees");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("rejects fee details without authentication", async () => {
    const response = await request(app)
      .get(`/api/v1/parents/fees/${pendingFee._id}`);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});


describe("Parent Fees API — student ownership", () => {
  test("returns only fees belonging to the logged-in parent's child", async () => {
    const response = await request(app)
      .get("/api/v1/parents/fees")
      .set("Authorization", `Bearer ${parentToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.fees)).toBe(true);

    expect(response.body.fees).toHaveLength(2);

    for (const fee of response.body.fees) {
      expect(fee.student.toString()).toBe(student._id.toString());
    }

    expect(
      response.body.fees.some(
        (fee) => fee._id.toString() === secondStudentFee._id.toString()
      )
    ).toBe(false);
  });

  test("returns a fee belonging to the parent's child", async () => {
    const response = await request(app)
      .get(`/api/v1/parents/fees/${pendingFee._id}`)
      .set("Authorization", `Bearer ${parentToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.fee._id).toBe(pendingFee._id.toString());
    expect(response.body.fee.student).toBe(student._id.toString());
  });

  test("does not allow access to another student's fee", async () => {
    const response = await request(app)
      .get(`/api/v1/parents/fees/${secondStudentFee._id}`)
      .set("Authorization", `Bearer ${parentToken}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  test("rejects an invalid fee payment ID", async () => {
    const response = await request(app)
      .get("/api/v1/parents/fees/not-a-valid-id")
      .set("Authorization", `Bearer ${parentToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});


describe("Parent Fees API — summary", () => {
  test("returns correct fee summary for the parent's child", async () => {
    const response = await request(app)
      .get("/api/v1/parents/fees")
      .set("Authorization", `Bearer ${parentToken}`);

    expect(response.status).toBe(200);

    expect(response.body.summary).toEqual(
      expect.objectContaining({
        total: 2,
        paid: 1,
        pending: 1,
        totalAmount: 1300,
        paidAmount: 650,
        pendingAmount: 650,
      })
    );
  });
});


describe("Parent Fees API — Razorpay order", () => {
  test("creates an order only for the parent's pending fee", async () => {
    const response = await request(app)
      .post(`/api/v1/parents/fees/${pendingFee._id}/create-order`)
      .set("Authorization", `Bearer ${parentToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body.payment.id).toBe(pendingFee._id.toString());
    expect(response.body.payment.amount).toBe(650);

    expect(razorpay.orders.create).toHaveBeenCalledTimes(1);

    const options = razorpay.orders.create.mock.calls[0][0];

    expect(options.amount).toBe(65000);
    expect(options.currency).toBe("INR");
    expect(options.receipt).toBe(`JCPS-${pendingFee._id}`);

    const saved = await FeePayment.findById(pendingFee._id);

    expect(saved.razorpayOrderId).toBe(response.body.order.id);
    expect(saved.paymentMethod).toBe("Razorpay");
  });

  test("does not create an order for another student's fee", async () => {
    const response = await request(app)
      .post(
        `/api/v1/parents/fees/${secondStudentFee._id}/create-order`
      )
      .set("Authorization", `Bearer ${parentToken}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(razorpay.orders.create).not.toHaveBeenCalled();
  });

  test("rejects creating another order for an already paid fee", async () => {
    const response = await request(app)
      .post(`/api/v1/parents/fees/${paidFee._id}/create-order`)
      .set("Authorization", `Bearer ${parentToken}`);

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(razorpay.orders.create).not.toHaveBeenCalled();
  });
});


describe("Parent Fees API — Razorpay verification", () => {
  test("rejects an invalid Razorpay signature", async () => {
    pendingFee.razorpayOrderId = "order_verify_test";
    await pendingFee.save();

    const response = await request(app)
      .post(`/api/v1/parents/fees/${pendingFee._id}/verify`)
      .set("Authorization", `Bearer ${parentToken}`)
      .send({
        razorpay_order_id: "order_verify_test",
        razorpay_payment_id: "pay_verify_test",
        razorpay_signature: "invalid_signature",
      });

    if (razorpaySecret) {
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);

      const saved = await FeePayment.findById(pendingFee._id);
      expect(saved.status).toBe("Pending");
    } else {
      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
    }
  });

  test("rejects verification for another student's fee", async () => {
    const response = await request(app)
      .post(`/api/v1/parents/fees/${secondStudentFee._id}/verify`)
      .set("Authorization", `Bearer ${parentToken}`)
      .send({
        razorpay_order_id: "order_test",
        razorpay_payment_id: "pay_test",
        razorpay_signature: "signature_test",
      });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
