
const crypto = require("crypto");
const request = require("supertest");
const mongoose = require("mongoose");

jest.setTimeout(30000);

const { connectRedis, redisClient } = require("../src/config/redis");
const connectDB = require("../src/config/db");

const User = require("../src/models/User");
const Parent = require("../src/models/Parent");
const Student = require("../src/models/Student");
const emailService = require("../src/services/email.service");

let app;
let sentEmails = [];

const ADMIN_EMAIL = "password-reset-admin@example.com";
const ADMIN_PASSWORD = "OldAdminPassword123!";
const ADMIN_NEW_PASSWORD = "NewAdminPassword456!";

const PARENT_EMAIL = "password-reset-parent@example.com";
const PARENT_PASSWORD = "OldParentPassword123!";
const PARENT_NEW_PASSWORD = "NewParentPassword456!";

let student;

beforeAll(async () => {
  await connectRedis();
  await connectDB();

  app = require("../src/app");

  await User.deleteOne({ email: ADMIN_EMAIL });
  await Parent.deleteOne({ email: PARENT_EMAIL });

  student = await Student.findOne({
    admissionNo: "PASSWORD-RESET-TEST-STUDENT",
  });

  if (!student) {
    student = await Student.create({
      admissionNo: "PASSWORD-RESET-TEST-STUDENT",
      firstName: "Password",
      lastName: "Reset",
      gender: "Other",
      dob: new Date("2020-01-01"),
      className: "Nursery",
      section: "A",
      fatherName: "Reset Father",
      motherName: "Reset Mother",
      mobile: "9000099999",
      email: "password-reset-student@example.com",
      address: "Password Reset Test Address",
      status: "Active",
    });
  }

  await User.create({
    name: "Password Reset Admin",
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: "admin",
  });

  await Parent.create({
    fatherName: "Reset Father",
    motherName: "Reset Mother",
    email: PARENT_EMAIL,
    mobile: "9000099999",
    password: PARENT_PASSWORD,
    address: "Password Reset Test Address",
    student: student._id,
  });
});

beforeEach(async () => {
  if (redisClient.isOpen) {
    await redisClient.flushDb();
  }

  sentEmails = [];

  jest
    .spyOn(emailService, "sendEmail")
    .mockImplementation(async (options) => {
      sentEmails.push(options);

      return {
        sent: true,
        skipped: false,
      };
    });
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(async () => {
  await User.deleteOne({ email: ADMIN_EMAIL });
  await Parent.deleteOne({ email: PARENT_EMAIL });

  if (student?._id) {
    await Student.deleteOne({ _id: student._id });
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (redisClient.isOpen) {
    await redisClient.quit();
  }
});

const extractTokenFromEmail = (email) => {
  expect(email).toBeDefined();
  expect(email.text).toBeDefined();

  const match = email.text.match(
    /\/auth\/reset-password\?token=([a-fA-F0-9]{64})/,
  );

  if (!match) {
    throw new Error(
      `Could not extract admin reset token from email text:\n${email.text}`,
    );
  }

  return match[1];
};

const extractParentTokenFromEmail = (email) => {
  expect(email).toBeDefined();
  expect(email.text).toBeDefined();

  const match = email.text.match(
    /\/parent\/reset-password\?token=([a-fA-F0-9]{64})/,
  );

  if (!match) {
    throw new Error(
      `Could not extract parent reset token from email text:\n${email.text}`,
    );
  }

  return match[1];
};

describe("Password Reset API — admin/user", () => {
  test("returns generic success and sends reset email for an existing user", async () => {
    const response = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({
        email: ADMIN_EMAIL,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "If an account with that email exists, a password reset link has been sent.",
    );

    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].to).toBe(ADMIN_EMAIL);
    expect(sentEmails[0].subject).toBe("Password Reset Request");

    const user = await User.findOne({ email: ADMIN_EMAIL });

    expect(user.resetPasswordToken).toEqual(expect.any(String));
    expect(user.resetPasswordToken).toHaveLength(64);
    expect(user.resetPasswordExpires).toBeInstanceOf(Date);
    expect(user.resetPasswordExpires.getTime()).toBeGreaterThan(Date.now());
  });

  test("returns the same generic response for a nonexistent user", async () => {
    const response = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({
        email: "does-not-exist-password-reset@example.com",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "If an account with that email exists, a password reset link has been sent.",
    );

    expect(sentEmails).toHaveLength(0);
  });

  test("validates forgot-password email input", async () => {
    const response = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({
        email: "invalid-email",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(Array.isArray(response.body.errors)).toBe(true);
  });

  test("resets the user password using the emailed token", async () => {
    await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({
        email: ADMIN_EMAIL,
      });

    const token = extractTokenFromEmail(sentEmails[0]);

    const response = await request(app)
      .post("/api/v1/auth/reset-password")
      .send({
        token,
        newPassword: ADMIN_NEW_PASSWORD,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Password reset successfully");

    const oldLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });

    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: ADMIN_EMAIL,
        password: ADMIN_NEW_PASSWORD,
      });

    expect(newLogin.status).toBe(200);
    expect(newLogin.body.success).toBe(true);

    const user = await User.findOne({ email: ADMIN_EMAIL });

    expect(user.resetPasswordToken).toBeNull();
    expect(user.resetPasswordExpires).toBeNull();
    expect(user.tokenVersion).toBe(1);
  });

  test("rejects an invalid user reset token", async () => {
    const response = await request(app)
      .post("/api/v1/auth/reset-password")
      .send({
        token: crypto.randomBytes(32).toString("hex"),
        newPassword: ADMIN_NEW_PASSWORD,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "Invalid or expired password reset token",
    );
  });

  test("rejects a reused user reset token", async () => {
    await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({
        email: ADMIN_EMAIL,
      });

    const token = extractTokenFromEmail(sentEmails[0]);

    const firstReset = await request(app)
      .post("/api/v1/auth/reset-password")
      .send({
        token,
        newPassword: ADMIN_NEW_PASSWORD,
      });

    expect(firstReset.status).toBe(200);

    const secondReset = await request(app)
      .post("/api/v1/auth/reset-password")
      .send({
        token,
        newPassword: "AnotherAdminPassword789!",
      });

    expect(secondReset.status).toBe(400);
    expect(secondReset.body.success).toBe(false);
    expect(secondReset.body.message).toBe(
      "Invalid or expired password reset token",
    );
  });
});

describe("Password Reset API — parent", () => {
  test("returns generic success and sends reset email for an existing parent", async () => {
    const response = await request(app)
      .post("/api/v1/parents/forgot-password")
      .send({
        email: PARENT_EMAIL,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "If an account with that email exists, a password reset link has been sent.",
    );

    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].to).toBe(PARENT_EMAIL);
    expect(sentEmails[0].subject).toBe("Password Reset Request");

    const parent = await Parent.findOne({ email: PARENT_EMAIL });

    expect(parent.resetPasswordToken).toEqual(expect.any(String));
    expect(parent.resetPasswordToken).toHaveLength(64);
    expect(parent.resetPasswordExpires).toBeInstanceOf(Date);
    expect(parent.resetPasswordExpires.getTime()).toBeGreaterThan(Date.now());
  });

  test("returns the same generic response for a nonexistent parent", async () => {
    const response = await request(app)
      .post("/api/v1/parents/forgot-password")
      .send({
        email: "does-not-exist-parent-password-reset@example.com",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "If an account with that email exists, a password reset link has been sent.",
    );

    expect(sentEmails).toHaveLength(0);
  });

  test("resets the parent password using the emailed token", async () => {
    await request(app)
      .post("/api/v1/parents/forgot-password")
      .send({
        email: PARENT_EMAIL,
      });

    const token = extractParentTokenFromEmail(sentEmails[0]);

    const response = await request(app)
      .post("/api/v1/parents/reset-password")
      .send({
        token,
        newPassword: PARENT_NEW_PASSWORD,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Password reset successfully");

    const parent = await Parent.findOne({ email: PARENT_EMAIL });

    expect(parent.resetPasswordToken).toBeNull();
    expect(parent.resetPasswordExpires).toBeNull();
    expect(parent.tokenVersion).toBe(1);

    const loginResponse = await request(app)
      .post("/api/v1/parents/login")
      .send({
        email: PARENT_EMAIL,
        password: PARENT_NEW_PASSWORD,
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.success).toBe(true);
    expect(loginResponse.body.token).toEqual(expect.any(String));
  });

  test("rejects an invalid parent reset token", async () => {
    const response = await request(app)
      .post("/api/v1/parents/reset-password")
      .send({
        token: crypto.randomBytes(32).toString("hex"),
        newPassword: PARENT_NEW_PASSWORD,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "Invalid or expired password reset token",
    );
  });

  test("rejects an invalid parent reset-password payload", async () => {
    const response = await request(app)
      .post("/api/v1/parents/reset-password")
      .send({
        token: "invalid-token",
        newPassword: "short",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(Array.isArray(response.body.errors)).toBe(true);
  });
});
