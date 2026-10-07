const request = require("supertest");
const mongoose = require("mongoose");

jest.setTimeout(30000);

const { connectRedis, redisClient } = require("../src/config/redis");
const connectDB = require("../src/config/db");

const User = require("../src/models/User");
const Gallery = require("../src/models/Gallery");

const generateToken = require("../src/utils/generateToken");

let app;
let adminUser;
let adminToken;

const TEST_PREFIX = `JEST-GALLERY-${Date.now()}`;

beforeAll(async () => {
  await connectRedis();
  await connectDB();

  app = require("../src/app");

  adminUser = await User.create({
    name: "Gallery Test Admin",
    email: `gallery-admin-${Date.now()}@example.com`,
    password: "GalleryAdminPassword123!",
    role: "admin",
  });

  adminToken = generateToken(
    adminUser._id,
    adminUser.role,
    adminUser.tokenVersion
  );
});

beforeEach(async () => {
  await Gallery.deleteMany({
    title: { $regex: `^${TEST_PREFIX}` },
  });
});

afterAll(async () => {
  await Gallery.deleteMany({
    title: { $regex: `^${TEST_PREFIX}` },
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

const createGallery = async (overrides = {}) => {
  return Gallery.create({
    title: `${TEST_PREFIX}-Annual Function`,
    description: "Annual function gallery",
    status: "Active",
    coverImage: "uploads/gallery/annual-cover.jpg",
    images: [
      {
        url: "uploads/gallery/annual-cover.jpg",
        caption: "Annual function",
      },
      {
        url: "uploads/gallery/children.jpg",
        caption: "Children performing",
      },
    ],
    createdBy: adminUser._id,
    ...overrides,
  });
};

describe("Gallery API — authentication and authorization", () => {
  test("rejects requests without authentication", async () => {
    const response = await request(app).get("/api/v1/galleries");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("allows an authenticated admin to access galleries", async () => {
    const response = await request(app)
      .get("/api/v1/galleries")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

describe("Gallery API — listing", () => {
  test("returns galleries with pagination", async () => {
    await createGallery();

    const response = await request(app)
      .get("/api/v1/galleries?page=1&limit=10")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.galleries).toHaveLength(1);
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(10);
    expect(response.body.pagination.total).toBe(1);
  });

  test("filters galleries by status", async () => {
    await createGallery();

    await createGallery({
      title: `${TEST_PREFIX}-Inactive`,
      status: "Inactive",
    });

    const response = await request(app)
      .get("/api/v1/galleries?status=Active")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(
      response.body.galleries.every((gallery) => gallery.status === "Active")
    ).toBe(true);
  });

  test("does not return soft-deleted galleries", async () => {
    await createGallery({
      title: `${TEST_PREFIX}-Deleted`,
      deletedAt: new Date(),
    });

    const response = await request(app)
      .get("/api/v1/galleries")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.galleries).toHaveLength(0);
  });
});

describe("Gallery API — get by ID", () => {
  test("returns a gallery by ID", async () => {
    const gallery = await createGallery();

    const response = await request(app)
      .get(`/api/v1/galleries/${gallery._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.gallery._id).toBe(gallery._id.toString());
    expect(response.body.gallery.title).toBe(gallery.title);
    expect(response.body.gallery.images).toHaveLength(2);
  });

  test("rejects an invalid gallery ID", async () => {
    const response = await request(app)
      .get("/api/v1/galleries/not-a-valid-id")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("returns 404 for a missing gallery", async () => {
    const id = new mongoose.Types.ObjectId();

    const response = await request(app)
      .get(`/api/v1/galleries/${id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});

describe("Gallery API — update", () => {
  test("updates gallery information", async () => {
    const gallery = await createGallery();

    const response = await request(app)
      .put(`/api/v1/galleries/${gallery._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: `${TEST_PREFIX}-Updated Gallery`,
        description: "Updated description",
        status: "Inactive",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.gallery.title).toBe(
      `${TEST_PREFIX}-Updated Gallery`
    );
    expect(response.body.gallery.description).toBe("Updated description");
    expect(response.body.gallery.status).toBe("Inactive");
  });

  test("rejects an invalid status", async () => {
    const gallery = await createGallery();

    const response = await request(app)
      .put(`/api/v1/galleries/${gallery._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        status: "Invalid",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("rejects a cover image that is not in the gallery", async () => {
    const gallery = await createGallery();

    const response = await request(app)
      .put(`/api/v1/galleries/${gallery._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        coverImage: "uploads/gallery/not-in-gallery.jpg",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});

describe("Gallery API — image management", () => {
  test("updates an image caption", async () => {
    const gallery = await createGallery();
    const imageId = gallery.images[0]._id.toString();

    const response = await request(app)
      .patch(`/api/v1/galleries/${gallery._id}/images/${imageId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        caption: "Updated caption",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const updatedImage = response.body.gallery.images.find(
      (image) => image._id === imageId
    );

    expect(updatedImage.caption).toBe("Updated caption");
  });

  test("deletes an image and updates the cover image", async () => {
    const gallery = await createGallery();

    const imageId = gallery.images[0]._id.toString();

    const response = await request(app)
      .delete(`/api/v1/galleries/${gallery._id}/images/${imageId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.gallery.images).toHaveLength(1);
    expect(response.body.gallery.coverImage).toBe(
      "uploads/gallery/children.jpg"
    );
  });
});

describe("Gallery API — delete", () => {
  test("soft deletes a gallery", async () => {
    const gallery = await createGallery();

    const response = await request(app)
      .delete(`/api/v1/galleries/${gallery._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const deletedGallery = await Gallery.findById(gallery._id);

    expect(deletedGallery).not.toBeNull();
    expect(deletedGallery.deletedAt).not.toBeNull();
  });
});

describe("Public Gallery API", () => {
  test("returns only active, non-deleted galleries without authentication", async () => {
    await createGallery({
      title: `${TEST_PREFIX}-Public Active`,
      status: "Active",
    });

    await createGallery({
      title: `${TEST_PREFIX}-Public Inactive`,
      status: "Inactive",
    });

    await createGallery({
      title: `${TEST_PREFIX}-Public Deleted`,
      status: "Active",
      deletedAt: new Date(),
    });

    const response = await request(app)
      .get("/api/v1/public/galleries");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body.galleries).toHaveLength(1);
    expect(response.body.galleries[0].title).toBe(
      `${TEST_PREFIX}-Public Active`
    );
    expect(response.body.galleries[0].status).toBeUndefined();
  });

  test("supports public gallery pagination", async () => {
    await createGallery({
      title: `${TEST_PREFIX}-Public One`,
    });

    await createGallery({
      title: `${TEST_PREFIX}-Public Two`,
    });

    const response = await request(app)
      .get("/api/v1/public/galleries?page=1&limit=1");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.galleries).toHaveLength(1);
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(1);
    expect(response.body.pagination.total).toBe(2);
    expect(response.body.pagination.pages).toBe(2);
  });

  test("returns an active gallery publicly by ID", async () => {
    const gallery = await createGallery({
      title: `${TEST_PREFIX}-Public Detail`,
    });

    const response = await request(app)
      .get(`/api/v1/public/galleries/${gallery._id}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.gallery._id).toBe(gallery._id.toString());
    expect(response.body.gallery.title).toBe(
      `${TEST_PREFIX}-Public Detail`
    );
    expect(response.body.gallery.images).toHaveLength(2);
    expect(response.body.gallery.status).toBeUndefined();
  });

  test("does not expose inactive gallery publicly", async () => {
    const gallery = await createGallery({
      title: `${TEST_PREFIX}-Public Inactive Detail`,
      status: "Inactive",
    });

    const response = await request(app)
      .get(`/api/v1/public/galleries/${gallery._id}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  test("does not expose deleted gallery publicly", async () => {
    const gallery = await createGallery({
      title: `${TEST_PREFIX}-Public Deleted Detail`,
      deletedAt: new Date(),
    });

    const response = await request(app)
      .get(`/api/v1/public/galleries/${gallery._id}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  test("rejects invalid public gallery ID", async () => {
    const response = await request(app)
      .get("/api/v1/public/galleries/not-a-valid-id");

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
