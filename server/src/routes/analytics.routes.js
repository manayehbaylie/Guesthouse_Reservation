import express from "express";

import {
  topGuesthouses,
  roomTypeStatistics,
  topRooms,
  mostActiveGuests,
} from "../controllers/analytics.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

/*
 * ========================================
 * ADMIN ROUTES
 * ========================================
 */

/**
 * @swagger
 * /api/analytics/top-guesthouses:
 *   get:
 *     summary: Get top guesthouses
 *     description: Get the top performing guesthouses based on reservation activity.
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top guesthouses fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/top-guesthouses",
  authenticate,
  authorize("ADMIN"),
  topGuesthouses
);

/**
 * @swagger
 * /api/analytics/room-type-statistics:
 *   get:
 *     summary: Get room type statistics
 *     description: Get statistics about different room types in the platform.
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Room type statistics fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/room-type-statistics",
  authenticate,
  authorize("ADMIN"),
  roomTypeStatistics
);

/*
 * ========================================
 * OWNER ROUTES
 * ========================================
 */

/**
 * @swagger
 * /api/analytics/top-rooms:
 *   get:
 *     summary: Get top performing rooms
 *     description: Get the top performing rooms based on reservation activity.
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top rooms fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Owner access required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/top-rooms",
  authenticate,
  authorize("OWNER"),
  topRooms
);

/**
 * @swagger
 * /api/analytics/most-active-guests:
 *   get:
 *     summary: Get most active guests
 *     description: Get guests with the highest reservation activity.
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Most active guests fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Owner access required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/most-active-guests",
  authenticate,
  authorize("OWNER"),
  mostActiveGuests
);

export default router;