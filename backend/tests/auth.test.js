const request = require("supertest");

jest.setTimeout(30000);

const { connectRedis, redisClient } = require("../src/config/redis");
const connectDB = require("../src/config/db");
const mongoose = require("mongoose");

const User = require("../src/models/User");

const TEST_USER_EMAIL = "auth-regression-user@example.com";
const TEST_USER_PASSWORD = "AuthTestPassword123!";
const TEST_NEW_PASSWORD = "AuthNewPassword456!";

let app;

const createUser = async () => {
  return User.create({
    name: "Auth Regression User",
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
    role: "parent",
  });
};

const loginUser = async (email = TEST_USER_EMAIL, password = TEST_USER_PASSWORD) => {
  return request(app)
    .post("/api/v1/auth/login")
    .send({
      email,
      password,
    });
};

beforeAll(async () => {
  await connectRedis();
  await connectDB();

  app = require("../src/app");

  await User.deleteOne({ email: TEST_USER_EMAIL });
});

beforeEach(async () => {
  if (redisClient.isOpen) {
    await redisClient.flushDb();
  }

  await User.deleteOne({ email: TEST_USER_EMAIL });

  await createUser();
});

afterAll(async () => {
  await User.deleteOne({ email: TEST_USER_EMAIL });

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (redisClient.isOpen) {
    await redisClient.quit();
  }
});

describe("Authentication API — registration", () => {
  test("registers a new user successfully", async () => {
    const email = "new-auth-user@example.com";

    await User.deleteOne({ email });

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "New Auth User",
        email,
        password: "NewUserPassword123!",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toEqual(expect.any(String));

    const user = await User.findOne({ email });

    expect(user).not.toBeNull();
    expect(user.name).toBe("New Auth User");
    expect(user.role).toBe("parent");
    expect(user.password).not.toBe("NewUserPassword123!");

    await User.deleteOne({ email });
  });

  test("rejects duplicate email registration", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Duplicate User",
        email: TEST_USER_EMAIL,
        password: "AnotherPassword123!",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("User already exists");
  });

  test("rejects invalid registration data", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "A",
        email: "not-an-email",
        password: "short",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(Array.isArray(response.body.errors)).toBe(true);
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  test("normalizes registration email", async () => {
    const email = "auth-normalized@example.com";

    await User.deleteOne({ email });

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Normalized User",
        email: "AUTH-NORMALIZED@EXAMPLE.COM",
        password: "NormalizedPassword123!",
      });

    expect(response.status).toBe(201);

    const user = await User.findOne({ email });

    expect(user).not.toBeNull();
    expect(user.email).toBe(email);

    await User.deleteOne({ email });
  });
});

describe("Authentication API — login", () => {
  test("logs in successfully with valid credentials", async () => {
    const response = await loginUser();

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toBeDefined();
    expect(response.body.user.email).toBe(TEST_USER_EMAIL);
    expect(response.body.user.name).toBe("Auth Regression User");
    expect(response.body.user.role).toBe("parent");
  });

  test("does not return the password in the login response", async () => {
    const response = await loginUser();

    expect(response.status).toBe(200);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.password).toBeUndefined();
  });

  test("normalizes login email", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: TEST_USER_EMAIL.toUpperCase(),
        password: TEST_USER_PASSWORD,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("rejects invalid credentials", async () => {
    const response = await loginUser(
      TEST_USER_EMAIL,
      "WrongPassword123!"
    );

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid email or password");
  });

  test("rejects invalid login input", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "invalid-email",
        password: "",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(Array.isArray(response.body.errors)).toBe(true);
    expect(response.body.errors.length).toBeGreaterThan(0);
  });
});

describe("Authentication API — profile", () => {
  test("returns the authenticated user's profile", async () => {
    const loginResponse = await loginUser();

    expect(loginResponse.status).toBe(200);

    const response = await request(app)
      .get("/api/v1/auth/profile")
      .set("Authorization", `Bearer ${loginResponse.body.token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.email).toBe(TEST_USER_EMAIL);
    expect(response.body.user.name).toBe("Auth Regression User");
    expect(response.body.user.password).toBeUndefined();
  });
});

describe("Authentication API — password change", () => {
  test("changes the password successfully", async () => {
    const loginResponse = await loginUser();

    const response = await request(app)
      .patch("/api/v1/auth/password")
      .set("Authorization", `Bearer ${loginResponse.body.token}`)
      .send({
        currentPassword: TEST_USER_PASSWORD,
        newPassword: TEST_NEW_PASSWORD,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Password changed successfully");

    const newLoginResponse = await loginUser(
      TEST_USER_EMAIL,
      TEST_NEW_PASSWORD
    );

    expect(newLoginResponse.status).toBe(200);
    expect(newLoginResponse.body.success).toBe(true);
  });

  test("rejects an incorrect current password", async () => {
    const loginResponse = await loginUser();

    const response = await request(app)
      .patch("/api/v1/auth/password")
      .set("Authorization", `Bearer ${loginResponse.body.token}`)
      .send({
        currentPassword: "WrongCurrentPassword123!",
        newPassword: TEST_NEW_PASSWORD,
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Current password is incorrect");
  });

  test("rejects the same password", async () => {
    const loginResponse = await loginUser();

    const response = await request(app)
      .patch("/api/v1/auth/password")
      .set("Authorization", `Bearer ${loginResponse.body.token}`)
      .send({
        currentPassword: TEST_USER_PASSWORD,
        newPassword: TEST_USER_PASSWORD,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "New password must be different from current password"
    );
  });

  test("rejects password change without authentication", async () => {
    const response = await request(app)
      .patch("/api/v1/auth/password")
      .send({
        currentPassword: TEST_USER_PASSWORD,
        newPassword: TEST_NEW_PASSWORD,
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("rejects a new password shorter than 8 characters", async () => {
    const loginResponse = await loginUser();

    const response = await request(app)
      .patch("/api/v1/auth/password")
      .set("Authorization", `Bearer ${loginResponse.body.token}`)
      .send({
        currentPassword: TEST_USER_PASSWORD,
        newPassword: "short",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(Array.isArray(response.body.errors)).toBe(true);
  });
});

describe("Authentication API — logout", () => {
  test("logs out successfully", async () => {
    const loginResponse = await loginUser();

    const response = await request(app)
      .post("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${loginResponse.body.token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Logged out successfully");
  });

  test("rejects logout without authentication", async () => {
    const response = await request(app)
      .post("/api/v1/auth/logout");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});