const express = require("express");
const upload = require("../middleware/upload.Middleware");
const validate = require("../middleware/validate");

const router = express.Router();

const {
  createTeacher,
  getTeachers,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  restoreTeacher,
  getDeletedTeachers,
  exportTeachersToExcel,
} = require("../controllers/teacher.Controller");

const { protect } = require("../middleware/auth.Middleware");
const adminOnly = require("../middleware/admin.Middleware");

const { teacherValidation } = require("../validators/teacherValidator");

router.use(protect);
router.use(adminOnly);

/**
 * @swagger
 * tags:
 *   name: Teachers
 *   description: Teacher management APIs
 */

/**
 * @swagger
 * /teachers:
 *   post:
 *     summary: Create a teacher
 *     description: Creates a new teacher. An optional teacher photo can be uploaded.
 *     tags:
 *       - Teachers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/TeacherCreate'
 *     responses:
 *       201:
 *         description: Teacher created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /teachers:
 *   get:
 *     summary: Get paginated teachers
 *     description: Returns active teachers with pagination and protected sorting.
 *     tags:
 *       - Teachers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of teachers per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum:
 *             - createdAt
 *             - -createdAt
 *             - firstName
 *             - -firstName
 *             - lastName
 *             - -lastName
 *             - employeeId
 *             - -employeeId
 *             - joiningDate
 *             - -joiningDate
 *             - salary
 *             - -salary
 *           default: -createdAt
 *         description: Sort field. Prefix with '-' for descending order.
 *     responses:
 *       200:
 *         description: Teachers fetched successfully
 *       400:
 *         description: Invalid sort field
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /teachers/all-unpaginated:
 *   get:
 *     summary: Get all active teachers
 *     description: Returns all active teachers without pagination.
 *     tags:
 *       - Teachers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Teachers fetched successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /teachers/deleted:
 *   get:
 *     summary: Get deleted teachers
 *     description: Returns soft-deleted teachers with pagination.
 *     tags:
 *       - Teachers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of deleted teachers per page
 *     responses:
 *       200:
 *         description: Deleted teachers fetched successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /teachers/export:
 *   get:
 *     summary: Export active teachers to Excel
 *     description: Downloads active teacher records as an XLSX file.
 *     tags:
 *       - Teachers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Excel file containing active teachers
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /teachers/{id}:
 *   get:
 *     summary: Get teacher by ID
 *     tags:
 *       - Teachers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Teacher fetched successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Teacher not found
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update teacher
 *     description: Updates an active teacher. An optional new teacher photo can be uploaded.
 *     tags:
 *       - Teachers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/TeacherUpdate'
 *     responses:
 *       200:
 *         description: Teacher updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Teacher not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Soft delete teacher
 *     description: Moves an active teacher to deleted records without permanently removing the database record.
 *     tags:
 *       - Teachers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Teacher deleted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Teacher not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /teachers/{id}/restore:
 *   patch:
 *     summary: Restore deleted teacher
 *     description: Restores a previously soft-deleted teacher.
 *     tags:
 *       - Teachers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Teacher restored successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Deleted teacher not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     TeacherCreate:
 *       type: object
 *       required:
 *         - employeeId
 *         - firstName
 *         - lastName
 *         - gender
 *         - email
 *         - mobile
 *         - qualification
 *         - address
 *       properties:
 *         employeeId:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           example: TCH-001
 *         firstName:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           example: Samay
 *         lastName:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           example: Singh
 *         gender:
 *           type: string
 *           enum:
 *             - Male
 *             - Female
 *             - Other
 *           example: Male
 *         email:
 *           type: string
 *           format: email
 *           example: teacher@juniorchamps.com
 *         mobile:
 *           type: string
 *           pattern: '^[0-9]{10}$'
 *           example: '9876543210'
 *         qualification:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: B.Ed
 *         experience:
 *           type: number
 *           minimum: 0
 *           maximum: 60
 *           example: 5
 *         classTeacher:
 *           type: string
 *           maxLength: 100
 *           example: Nursery
 *         address:
 *           type: string
 *           minLength: 5
 *           maxLength: 500
 *           example: Bagodar, Jharkhand
 *         joiningDate:
 *           type: string
 *           format: date
 *           example: '2025-01-01'
 *         salary:
 *           type: number
 *           minimum: 0
 *           example: 25000
 *         status:
 *           type: string
 *           enum:
 *             - Active
 *             - Inactive
 *           default: Active
 *           example: Active
 *         teacherPhoto:
 *           type: string
 *           format: binary
 *
 *     TeacherUpdate:
 *       allOf:
 *         - $ref: '#/components/schemas/TeacherCreate'
 *
 *     Teacher:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 665a1f3a2c9f2b0012345678
 *         employeeId:
 *           type: string
 *           example: TCH-001
 *         firstName:
 *           type: string
 *           example: Samay
 *         lastName:
 *           type: string
 *           example: Singh
 *         gender:
 *           type: string
 *           enum:
 *             - Male
 *             - Female
 *             - Other
 *         email:
 *           type: string
 *           format: email
 *         mobile:
 *           type: string
 *           example: '9876543210'
 *         qualification:
 *           type: string
 *           example: B.Ed
 *         experience:
 *           type: number
 *           example: 5
 *         classTeacher:
 *           type: string
 *           example: Nursery
 *         joiningDate:
 *           type: string
 *           format: date-time
 *         salary:
 *           type: number
 *           example: 25000
 *         photo:
 *           type: string
 *           example: uploads/teachers/teacher-123.png
 *         status:
 *           type: string
 *           enum:
 *             - Active
 *             - Inactive
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

router.post(
  "/",
  upload.single("teacherPhoto"),
  teacherValidation,
  validate,
  createTeacher
);

router.get("/", getAllTeachers);
router.get("/all-unpaginated", getTeachers);
router.get("/deleted", getDeletedTeachers);
router.get("/export", exportTeachersToExcel);
router.patch("/:id/restore", restoreTeacher);
router.get("/:id", getTeacherById);

router.put(
  "/:id",
  upload.single("teacherPhoto"),
  teacherValidation,
  validate,
  updateTeacher
);

router.delete("/:id", deleteTeacher);

module.exports = router;
