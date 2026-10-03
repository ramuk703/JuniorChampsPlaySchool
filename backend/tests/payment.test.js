const request = require("supertest");
const mongoose = require("mongoose");
const crypto = require("crypto");

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
let testStudent;
let testFeePayment;

beforeAll(async () => {
  await connectRedis();
  await connectDB();

  app = require("../src/app");

  await User.deleteMany({
    email: { $regex: /^payment-test-admin-/ },
  });

  adminUser = await User.create({
    name: "Payment Test Admin",
    email: `payment-test-admin-${Date.now()}@example.com`,
    password: "PaymentTestAdminPassword123!",
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

  await FeePayment.deleteMany({
    receiptNumber: { $regex: /^PAYMENT-TEST-/ },
  });

  await Student.deleteMany({
    admissionNo: { $regex: /^PAYMENT-TEST-/ },
  });

  testStudent = await Student.create({
    firstName: "Payment",
    lastName: "Test Student",
    admissionNo: `PAYMENT-TEST-${Date.now()}`,
    gender: "Male",
    dob: new Date("2020-01-15"),
    className: "Nursery",
    section: "A",
    fatherName: "Test Father",
    motherName: "Test Mother",
    mobile: "9876543210",
    address: "Payment Test Address",
    status: "Active",
    deletedAt: null,
  });

  testFeePayment = await FeePayment.create({
    student: testStudent._id,
    month: 9,
    year: 2026,
    feeType: "Monthly",
    amount: 600,
    discount: 50,
    lateFee: 100,
    totalAmount: 650,
    status: "Pending",
    paymentMethod: "Cash",
    receiptNumber: `PAYMENT-TEST-${Date.now()}`,
  });
});

afterAll(async () => {
  await FeePayment.deleteMany({
    receiptNumber: { $regex: /^PAYMENT-TEST-/ },
  });

  await Student.deleteMany({
    admissionNo: { $regex: /^PAYMENT-TEST-/ },
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

describe("Payment API — authentication", () => {
  test("rejects create-order without authentication", async () => {
    const response = await request(app)
      .post("/api/v1/payments/create-order")
      .send({
        feePaymentId: testFeePayment._id,
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("rejects verify without authentication", async () => {
    const response = await request(app)
      .post("/api/v1/payments/verify")
      .send({
        feePaymentId: testFeePayment._id,
        razorpay_order_id: "order_test",
        razorpay_payment_id: "pay_test",
        razorpay_signature: "signature_test",
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});

describe("Payment API — create order validation", () => {
  test("rejects missing fee payment ID", async () => {
    const response = await request(app)
      .post("/api/v1/payments/create-order")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("rejects invalid fee payment ID", async () => {
    const response = await request(app)
      .post("/api/v1/payments/create-order")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        feePaymentId: "invalid-id",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("returns not found for a non-existent fee payment", async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .post("/api/v1/payments/create-order")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        feePaymentId: fakeId,
      });

    expect([404, 503]).toContain(response.status);
    expect(response.body).toBeDefined();
  });

  test("does not accept a client-supplied amount", async () => {
    const response = await request(app)
      .post("/api/v1/payments/create-order")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        feePaymentId: testFeePayment._id,
        amount: 1,
      });

    expect([200, 500, 503]).toContain(response.status);

    if (response.status === 200) {
      expect(response.body.payment.amount).toBe(650);
    }
  });
});

describe("Payment API — paid fee protection", () => {
  test("rejects creating an order for an already paid fee", async () => {
    testFeePayment.status = "Paid";
    await testFeePayment.save();

    const response = await request(app)
      .post("/api/v1/payments/create-order")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        feePaymentId: testFeePayment._id,
      });

    expect([409, 503]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });

  test("rejects verifying an already paid fee", async () => {
    testFeePayment.status = "Paid";
    await testFeePayment.save();

    const response = await request(app)
      .post("/api/v1/payments/verify")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        feePaymentId: testFeePayment._id,
        razorpay_order_id: "order_test",
        razorpay_payment_id: "pay_test",
        razorpay_signature: "signature_test",
      });

    expect([409, 503]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });
});

describe("Payment API — verify validation", () => {
  test("rejects missing fee payment ID", async () => {
    const response = await request(app)
      .post("/api/v1/payments/verify")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        razorpay_order_id: "order_test",
        razorpay_payment_id: "pay_test",
        razorpay_signature: "signature_test",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("rejects missing order ID", async () => {
    const response = await request(app)
      .post("/api/v1/payments/verify")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        feePaymentId: testFeePayment._id,
        razorpay_payment_id: "pay_test",
        razorpay_signature: "signature_test",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("rejects missing payment ID", async () => {
    const response = await request(app)
      .post("/api/v1/payments/verify")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        feePaymentId: testFeePayment._id,
        razorpay_order_id: "order_test",
        razorpay_signature: "signature_test",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("rejects missing signature", async () => {
    const response = await request(app)
      .post("/api/v1/payments/verify")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        feePaymentId: testFeePayment._id,
        razorpay_order_id: "order_test",
        razorpay_payment_id: "pay_test",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});

describe("Payment API — signature verification", () => {
  test("rejects an invalid signature", async () => {
    const response = await request(app)
      .post("/api/v1/payments/verify")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        feePaymentId: testFeePayment._id,
        razorpay_order_id: "order_test",
        razorpay_payment_id: "pay_test",
        razorpay_signature: "definitely-invalid-signature",
      });

    expect([400, 503]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });

  test("handles a valid signature according to the configured Razorpay service", async () => {
    const orderId = "order_test";
    const paymentId = "pay_test";

    const { razorpaySecret } = require("../src/config/env");

    const signature = razorpaySecret
      ? crypto
          .createHmac("sha256", razorpaySecret)
          .update(`${orderId}|${paymentId}`)
          .digest("hex")
      : "test-signature";

    const response = await request(app)
      .post("/api/v1/payments/verify")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        feePaymentId: testFeePayment._id,
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      });

    if (response.status === 200) {
      const updatedPayment = await FeePayment.findById(testFeePayment._id);

      expect(response.body.success).toBe(true);
      expect(updatedPayment.status).toBe("Paid");
      expect(updatedPayment.paymentMethod).toBe("Razorpay");
      expect(updatedPayment.razorpayOrderId).toBe(orderId);
      expect(updatedPayment.razorpayPaymentId).toBe(paymentId);
      expect(updatedPayment.razorpaySignature).toBe(signature);
      expect(updatedPayment.paymentDate).toBeDefined();
      expect(updatedPayment.paidBy.toString()).toBe(
        adminUser._id.toString()
      );
    } else {
      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
    }
  });
});
