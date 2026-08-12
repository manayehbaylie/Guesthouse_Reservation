import express from "express";

import {
  revenueReport,
  adminReport,
} from "../controllers/report.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

/*
 * ========================================
 * OWNER REVENUE REPORT
 * ========================================
 */

/**
 * @swagger
 * /api/reports/revenue:
 *   get:
 *     summary: Get owner revenue report
 *     description: Get the revenue report for the authenticated owner's guesthouses.
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Revenue report fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Owner access required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/revenue",
  authenticate,
  authorize("OWNER"),
  revenueReport
);

/*
 * ========================================
 * ADMIN REPORT
 * ========================================
 */

/**
 * @swagger
 * /api/reports/admin:
 *   get:
 *     summary: Get platform-wide admin report
 *     description: Get overall system statistics and revenue information for the administrator.
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin report fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/admin",
  authenticate,
  authorize("ADMIN"),
  adminReport
);

export default router;