import express from "express";

import {
  create,
  getAll,
  getById,
  updateStatus,
} from "../controllers/reservation.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     summary: Create reservation
 *     description: Guest creates a pending reservation. Room becomes unavailable only after successful payment.
 *     tags:
 *       - Reservations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - checkIn
 *               - checkOut
 *               - roomId
 *             properties:
 *               checkIn:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-08-15T14:00:00.000Z"
 *               checkOut:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-08-18T11:00:00.000Z"
 *               roomId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Reservation created successfully
 *       400:
 *         description: Room is not available
 *       401:
 *         description: Authentication required
 */
router.post(
  "/",
  authenticate,
  create
);

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     summary: Get all reservations
 *     description: Get reservations.
 *     tags:
 *       - Reservations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reservations fetched successfully
 *       401:
 *         description: Authentication required
 */
router.get(
  "/",
  authenticate,
  getAll
);

/**
 * @swagger
 * /api/reservations/{id}:
 *   get:
 *     summary: Get reservation by ID
 *     tags:
 *       - Reservations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Reservation fetched successfully
 *       404:
 *         description: Reservation not found
 */
router.get(
  "/:id",
  authenticate,
  getById
);

/**
 * @swagger
 * /api/reservations/{id}/status:
 *   patch:
 *     summary: Update reservation status
 *     description: Update reservation status through the reservation lifecycle.
 *     tags:
 *       - Reservations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - CHECKED_IN
 *                   - CHECKED_OUT
 *                 example: CHECKED_IN
 *     responses:
 *       200:
 *         description: Reservation status updated successfully
 *       400:
 *         description: Invalid status transition
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Reservation not found
 */
router.patch(
  "/:id/status",
  authenticate,
  updateStatus
);

export default router;