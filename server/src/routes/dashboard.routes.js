import express from "express";

import {
  getStats,
  monthlyRevenue,
  recentReservations,
  recentPayments,
  ownerDashboard,
  ownerRevenue,
  ownerMonthlyRevenue,
  ownerRecentReservations,
  ownerRecentPayments,
} from "../controllers/dashboard.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

/*
 * ========================================
 * ADMIN DASHBOARD
 * ========================================
 */

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get admin dashboard statistics
 *     description: Get overall platform statistics for the administrator.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  getStats
);

/**
 * @swagger
 * /api/dashboard/monthly-revenue:
 *   get:
 *     summary: Get monthly revenue
 *     description: Get platform monthly revenue statistics.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly revenue fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/monthly-revenue",
  authenticate,
  authorize("ADMIN"),
  monthlyRevenue
);

/**
 * @swagger
 * /api/dashboard/recent-reservations:
 *   get:
 *     summary: Get recent reservations
 *     description: Get the most recent reservations on the platform.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent reservations fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/recent-reservations",
  authenticate,
  authorize("ADMIN"),
  recentReservations
);

/**
 * @swagger
 * /api/dashboard/recent-payments:
 *   get:
 *     summary: Get recent payments
 *     description: Get the most recent payments on the platform.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent payments fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/recent-payments",
  authenticate,
  authorize("ADMIN"),
  recentPayments
);

/*
 * ========================================
 * OWNER DASHBOARD
 * ========================================
 */

/**
 * @swagger
 * /api/dashboard/owner:
 *   get:
 *     summary: Get owner dashboard
 *     description: Get dashboard information for the authenticated owner.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Owner dashboard fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Owner access required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/owner",
  authenticate,
  authorize("OWNER"),
  ownerDashboard
);

/**
 * @swagger
 * /api/dashboard/owner/revenue:
 *   get:
 *     summary: Get owner revenue
 *     description: Get revenue information for the authenticated owner's guesthouses.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Owner revenue fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Owner access required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/owner/revenue",
  authenticate,
  authorize("OWNER"),
  ownerRevenue
);

/**
 * @swagger
 * /api/dashboard/owner/monthly-revenue:
 *   get:
 *     summary: Get owner monthly revenue
 *     description: Get monthly revenue statistics for the authenticated owner's guesthouses.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Owner monthly revenue fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Owner access required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/owner/monthly-revenue",
  authenticate,
  authorize("OWNER"),
  ownerMonthlyRevenue
);

/**
 * @swagger
 * /api/dashboard/owner/recent-reservations:
 *   get:
 *     summary: Get owner's recent reservations
 *     description: Get recent reservations belonging to the authenticated owner's guesthouses.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Owner recent reservations fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Owner access required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/owner/recent-reservations",
  authenticate,
  authorize("OWNER"),
  ownerRecentReservations
);

/**
 * @swagger
 * /api/dashboard/owner/recent-payments:
 *   get:
 *     summary: Get owner's recent payments
 *     description: Get recent payments related to the authenticated owner's guesthouses.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Owner recent payments fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Owner access required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/owner/recent-payments",
  authenticate,
  authorize("OWNER"),
  ownerRecentPayments
);

export default router;