
import express from "express";

import {
  approve,
  getUsers,
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
 */
router.get(
  "/users",
  authenticate,
  authorize("ADMIN"),
  getUsers
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
 */
router.get(
  "/activity",
  authenticate,
  authorize("ADMIN"),
  getActivity
);

export default router;

