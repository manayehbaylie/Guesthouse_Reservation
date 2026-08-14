import express from "express";

import {
  approve,
  getUsers,
  updateUserRoleController,
  getReports,
  getActivity,
} from "../controllers/admin.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

/*
==================================================
ADMIN ROUTES
==================================================
*/

/**
 * @swagger
 * /api/admin/guesthouses/{id}/approve:
 *   put:
 *     summary: Approve a guesthouse
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Guesthouse approved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.put(
  "/guesthouses/:id/approve",
  authenticate,
  authorize("ADMIN"),
  approve
);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users fetched successfully
 */
router.get(
  "/users",
  authenticate,
  authorize("ADMIN"),
  getUsers
);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   patch:
 *     summary: Update user role
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User role updated successfully
 */
router.patch(
  "/users/:id/role",
  authenticate,
  authorize("ADMIN"),
  updateUserRoleController
);

/**
 * @swagger
 * /api/admin/reports:
 *   get:
 *     summary: Get platform-wide reports
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform report fetched successfully
 */
router.get(
  "/reports",
  authenticate,
  authorize("ADMIN"),
  getReports
);

/**
 * @swagger
 * /api/admin/activity:
 *   get:
 *     summary: Monitor system activity
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System activity fetched successfully
 */
router.get(
  "/activity",
  authenticate,
  authorize("ADMIN"),
  getActivity
);

export default router;