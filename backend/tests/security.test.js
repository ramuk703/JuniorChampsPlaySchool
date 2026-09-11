const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.setTimeout(30000);

const { connectRedis, redisClient } = require("../src/config/redis");
const connectDB = require("../src/config/db");
const mongoose = require("mongoose");

let app;

const User = require("../src/models/User");
const Parent = require("../src/models/Parent");
const Student = require("../src/models/Student");

const {
  jwtSecret,
  jwtAlgorithm,
  jwtIssuer,
  jwtAudience,
} = require("../src/config/env");

const TEST_USER_EMAIL = "security-regression-user@example.com";
const TEST_PARENT_EMAIL = "security-regression-parent@example.com";
const TEST_STUDENT_ADMISSION = "SECURITY-REGRESSION-655";

const TEST_USER_PASSWORD = "SecurityTestPassword123!";
const TEST_PARENT_PASSWORD = "SecurityParentPassword123!";
const TEST_NEW_PASSWORD = "SecurityNewPassword456!";

let testUser;
let testParent;
let testStudent;

const createUser = async () => {
  return User.create({
    name: "Security Regression User",
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
    role: "parent",
  });
};

const createParent = async () => {
  testStudent = await Student.create({
    admissionNo: TEST_STUDENT_ADMISSION,
    firstName: "Security",
    lastName: "Student",
    gender: "Other",
    dob: new Date("2020-01-01"),
    className: "Nursery",
    section: "A",
    fatherName: "Security Father",
    motherName: "Security Mother",
    mobile: "9000012345",
    email: "security-regression-student@example.com",
    address: "Security Test Address",
    status: "Active",
  });

  return Parent.create({
    fatherName: "Security Father",
    motherName: "Security Mother",
    email: TEST_PARENT_EMAIL,
    mobile: "9000012345",
    password: TEST_PARENT_PASSWORD,
    address: "Security Test Address",
    student: testStudent._id,
  });
};

const loginUser = async () => {
  const response = await request(app)
    .post("/api/v1/auth/login")
    .send({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });

  return response.body.token;
};

const loginParent = async () => {
  const response = await request(app)
    .post("/api/v1/parents/login")
    .send({
      email: TEST_PARENT_EMAIL,
      password: TEST_PARENT_PASSWORD,
    });

  return response.body.token;
};

const signedToken = (payload, options = {}) => {
  return jwt.sign(payload, jwtSecret, {
    algorithm: jwtAlgorithm,
    issuer: jwtIssuer,
    audience: jwtAudience,
    expiresIn: "15m",
    ...options,
  });
};

beforeAll(async () => {
  // Infrastructure must be ready before src/app is imported because
  // the application creates Redis-backed rate limiters during startup.
  await connectRedis();
  await connectDB();

  // Import the app only after Redis is connected.
  app = require("../src/app");

  await User.deleteOne({ email: TEST_USER_EMAIL });
  await Parent.deleteOne({ email: TEST_PARENT_EMAIL });
  await Student.deleteOne({ admissionNo: TEST_STUDENT_ADMISSION });
});

beforeEach(async () => {
  // Reset test-only rate-limit state.
  if (redisClient.isOpen) {
    await redisClient.flushDb();
  }

  // Reset test fixtures so tests do not depend on previous test mutations.
  await User.deleteOne({ email: TEST_USER_EMAIL });
  await Parent.deleteOne({ email: TEST_PARENT_EMAIL });
  await Student.deleteOne({ admissionNo: TEST_STUDENT_ADMISSION });

  testUser = await createUser();
  testParent = await createParent();
});

afterAll(async () => {
  await User.deleteOne({ email: TEST_USER_EMAIL });
  await Parent.deleteOne({ email: TEST_PARENT_EMAIL });
  await Student.deleteOne({ admissionNo: TEST_STUDENT_ADMISSION });

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (redisClient.isOpen) {
    await redisClient.quit();
  }
});

describe("Security regression — authentication", () => {
  test("rejects requests without an Authorization token", async () => {
    const response = await request(app).get("/api/v1/auth/profile");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Not authorized");
  });

  test("rejects malformed JWTs", async () => {
    const response = await request(app)
      .get("/api/v1/auth/profile")
      .set("Authorization", "Bearer not-a-valid-jwt");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Token failed");
  });

  test("rejects forged JWT signatures", async () => {
    const token = jwt.sign(
      {
        id: testUser._id.toString(),
        role: testUser.role,
        tokenVersion: testUser.tokenVersion,
      },
      "wrong-secret",
      {
        algorithm: jwtAlgorithm,
        issuer: jwtIssuer,
        audience: jwtAudience,
        expiresIn: "15m",
      }
    );

    const response = await request(app)
      .get("/api/v1/auth/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Token failed");
  });

  test("rejects expired JWTs", async () => {
    const token = signedToken(
      {
        id: testUser._id.toString(),
        role: testUser.role,
        tokenVersion: testUser.tokenVersion,
      },
      {
        expiresIn: -1,
      }
    );

    const response = await request(app)
      .get("/api/v1/auth/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Token failed");
  });

  test("rejects JWTs signed with the wrong algorithm", async () => {
    const token = jwt.sign(
      {
        id: testUser._id.toString(),
        role: testUser.role,
        tokenVersion: testUser.tokenVersion,
      },
      jwtSecret,
      {
        algorithm: jwtAlgorithm === "HS256" ? "HS384" : "HS256",
        issuer: jwtIssuer,
        audience: jwtAudience,
        expiresIn: "15m",
      }
    );

    const response = await request(app)
      .get("/api/v1/auth/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Token failed");
  });

  test("rejects JWTs with the wrong issuer", async () => {
    const token = jwt.sign(
      {
        id: testUser._id.toString(),
        role: testUser.role,
        tokenVersion: testUser.tokenVersion,
      },
      jwtSecret,
      {
        algorithm: jwtAlgorithm,
        issuer: "wrong-issuer",
        audience: jwtAudience,
        expiresIn: "15m",
      }
    );

    const response = await request(app)
      .get("/api/v1/auth/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Token failed");
  });

  test("rejects JWTs with the wrong audience", async () => {
    const token = jwt.sign(
      {
        id: testUser._id.toString(),
        role: testUser.role,
        tokenVersion: testUser.tokenVersion,
      },
      jwtSecret,
      {
        algorithm: jwtAlgorithm,
        issuer: jwtIssuer,
        audience: "wrong-audience",
        expiresIn: "15m",
      }
    );

    const response = await request(app)
      .get("/api/v1/auth/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Token failed");
  });

  test("rejects JWTs with an invalid tokenVersion", async () => {
    const token = signedToken({
      id: testUser._id.toString(),
      role: testUser.role,
      tokenVersion: -1,
    });

    const response = await request(app)
      .get("/api/v1/auth/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Token failed");
  });

  test("rejects JWTs missing tokenVersion", async () => {
    const token = signedToken({
      id: testUser._id.toString(),
      role: testUser.role,
    });

    const response = await request(app)
      .get("/api/v1/auth/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Token failed");
  });

  test("uses a generic response for nonexistent and invalid credentials", async () => {
    const nonexistent = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "does-not-exist-security@example.com",
        password: TEST_USER_PASSWORD,
      });

    const wrongPassword = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: TEST_USER_EMAIL,
        password: "WrongSecurityPassword123!",
      });

    expect(nonexistent.status).toBe(401);
    expect(wrongPassword.status).toBe(401);
    expect(nonexistent.body.message).toBe("Invalid email or password");
    expect(wrongPassword.body.message).toBe("Invalid email or password");
  });

  test("does not expose password in a successful login response", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });

    expect(response.status).toBe(200);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.password).toBeUndefined();
    expect(response.body.token).toBeDefined();
  });

  test("does not leak JWTs, secrets, or passwords into application logs", async () => {
    const token = await loginUser();

    const response = await request(app)
      .get("/api/v1/auth/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    const fs = require("fs");
    const path = require("path");

    const logDirectory = path.join(process.cwd(), "logs");

    if (fs.existsSync(logDirectory)) {
      const files = fs
        .readdirSync(logDirectory, { recursive: true })
        .filter((file) => typeof file === "string");

      for (const file of files) {
        const filePath = path.join(logDirectory, file);

        if (!fs.existsSync(filePath)) continue;
        if (!fs.statSync(filePath).isFile()) continue;

        const content = fs.readFileSync(filePath, "utf8");

        expect(content).not.toContain(token);
        expect(content).not.toContain(TEST_USER_PASSWORD);
        expect(content).not.toContain(TEST_NEW_PASSWORD);
        expect(content).not.toContain(jwtSecret);
      }
    }

    expect(response.body).not.toHaveProperty("password");
    expect(response.body).not.toHaveProperty("token");
    expect(response.body).not.toHaveProperty("jwtSecret");
    expect(response.body).not.toHaveProperty("secret");
  });
});

describe("Security regression — password policy", () => {
  test("rejects passwords shorter than 8 characters", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Weak Password User",
        email: `weak-${Date.now()}@example.com`,
        password: "1234567",
      });

    expect(response.status).toBe(400);
  });

  test("rejects passwords longer than 128 characters", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Long Password User",
        email: `long-${Date.now()}@example.com`,
        password: "A".repeat(129),
      });

    expect(response.status).toBe(400);
  });
});

describe("Security regression — user password change", () => {
  let token;

  beforeEach(async () => {
    token = await loginUser();
  });

  test("rejects an incorrect current password", async () => {
    const response = await request(app)
      .patch("/api/v1/auth/password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "WrongCurrentPassword123!",
        newPassword: TEST_NEW_PASSWORD,
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Current password is incorrect");
  });

  test("successfully changes the password", async () => {
    const response = await request(app)
      .patch("/api/v1/auth/password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: TEST_USER_PASSWORD,
        newPassword: TEST_NEW_PASSWORD,
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Password changed successfully");
    expect(response.body.token).toBeUndefined();

    const updatedUser = await User.findOne({ email: TEST_USER_EMAIL });

    expect(updatedUser.tokenVersion).toBe(1);
    expect(await updatedUser.matchPassword(TEST_NEW_PASSWORD)).toBe(true);
  });

  test("invalidates the previous JWT after password change", async () => {
    const response = await request(app)
      .patch("/api/v1/auth/password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: TEST_USER_PASSWORD,
        newPassword: TEST_NEW_PASSWORD,
      });

    expect(response.status).toBe(200);

    const oldTokenResponse = await request(app)
      .get("/api/v1/auth/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(oldTokenResponse.status).toBe(401);
    expect(oldTokenResponse.body.message).toBe("Token has been invalidated");
  });
});

describe("Security regression — user logout", () => {
  test("invalidates the current user session", async () => {
    const token = await loginUser();

    const logoutResponse = await request(app)
      .post("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body.message).toBe("Logged out successfully");

    const updatedUser = await User.findOne({ email: TEST_USER_EMAIL });
    expect(updatedUser.tokenVersion).toBe(1);

    const oldTokenResponse = await request(app)
      .get("/api/v1/auth/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(oldTokenResponse.status).toBe(401);
    expect(oldTokenResponse.body.message).toBe("Token has been invalidated");

    const freshToken = await loginUser();

    const freshTokenResponse = await request(app)
      .get("/api/v1/auth/profile")
      .set("Authorization", `Bearer ${freshToken}`);

    expect(freshTokenResponse.status).toBe(200);
  });
});

describe("Security regression — parent authentication", () => {
  test("rejects an invalid parent JWT", async () => {
    const token = jwt.sign(
      {
        id: testParent._id.toString(),
        role: "parent",
        tokenVersion: testParent.tokenVersion,
      },
      "wrong-secret",
      {
        algorithm: jwtAlgorithm,
        issuer: jwtIssuer,
        audience: jwtAudience,
        expiresIn: "15m",
      }
    );

    const response = await request(app)
      .get("/api/v1/parents/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Token failed");
  });

  test("invalidates a parent session after logout", async () => {
    const token = await loginParent();

    const logoutResponse = await request(app)
      .post("/api/v1/parents/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body.message).toBe("Logged out successfully");

    const updatedParent = await Parent.findOne({ email: TEST_PARENT_EMAIL });
    expect(updatedParent.tokenVersion).toBe(1);

    const oldTokenResponse = await request(app)
      .get("/api/v1/parents/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(oldTokenResponse.status).toBe(401);
    expect(oldTokenResponse.body.message).toBe("Token has been invalidated");

    const freshToken = await loginParent();

    const freshTokenResponse = await request(app)
      .get("/api/v1/parents/dashboard")
      .set("Authorization", `Bearer ${freshToken}`);

    expect(freshTokenResponse.status).toBe(200);
  });
});