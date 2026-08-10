import express from "express";

import {
  getProfile,
  updateProfile,
  getReservations,
} from "../controllers/guest.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/guest/profile:
 *   get:
 *     summary: Get guest profile
 *     tags:
 *       - Guest
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 */
router.get(
  "/profile",
  authenticate,
  authorize("GUEST"),
  getProfile
);

/**
 * @swagger
 * /api/guest/profile:
 *   put:
 *     summary: Update guest profile
 *     tags:
 *       - Guest
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put(
  "/profile",
  authenticate,
  authorize("GUEST"),
  updateProfile
);

/**
 * @swagger
 * /api/guest/reservations:
 *   get:
 *     summary: Get guest reservation history
 *     tags:
 *       - Guest
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reservation history fetched successfully
 */
router.get(
  "/reservations",
  authenticate,
  authorize("GUEST"),
  getReservations
);

export default router;