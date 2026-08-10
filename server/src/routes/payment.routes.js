import express from "express";

import {
  create,
  getAll,
  getById,
  updateStatus,
} from "../controllers/payment.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Create a payment
 *     description: Guest creates a payment for a pending reservation.
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reservationId
 *               - amount
 *               - paymentMethod
 *             properties:
 *               reservationId:
 *                 type: integer
 *                 example: 1
 *               amount:
 *                 type: number
 *                 example: 1500
 *               paymentMethod:
 *                 type: string
 *                 example: CASH
 *
 *     responses:
 *       201:
 *         description: Payment created successfully
 *       400:
 *         description: Reservation is not pending or payment already exists
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
 * /api/payments:
 *   get:
 *     summary: Get all payments
 *     description: Get all payments in the system.
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Payments fetched successfully
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
 * /api/payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     description: Get a specific payment using its ID.
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *
 *     responses:
 *       200:
 *         description: Payment fetched successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Payment not found
 */
router.get(
  "/:id",
  authenticate,
  getById
);

/**
 * @swagger
 * /api/payments/{id}/status:
 *   patch:
 *     summary: Update payment status
 *     description: OWNER or ADMIN can update a payment status. When payment becomes PAID, the reservation becomes CONFIRMED and the room becomes unavailable. When payment becomes FAILED, the reservation remains PENDING and the room becomes available.
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *
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
 *                   - PENDING
 *                   - PAID
 *                   - FAILED
 *                 example: PAID
 *
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 *       400:
 *         description: Invalid payment status or paid payment cannot be changed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied. OWNER or ADMIN role required
 *       404:
 *         description: Payment not found
 */
router.patch(
  "/:id/status",
  authenticate,
  authorize("OWNER", "ADMIN"),
  updateStatus
);

export default router;