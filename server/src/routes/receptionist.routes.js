import express from "express";

import {
  receptionReservations,
  confirm,
  checkIn,
  checkOut,
  cancel,
  todayArrivals,
  todayDepartures,
} from "../controllers/receptionist.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

/*
 * ========================================
 * RECEPTIONIST ROUTES
 * ========================================
 */

/**
 * @swagger
 * /api/receptionist/reservations:
 *   get:
 *     summary: Get all reservations
 *     description: Get reservations that can be managed by the receptionist.
 *     tags:
 *       - Receptionist
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reservations fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Receptionist access required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/reservations",
  authenticate,
  authorize("RECEPTIONIST"),
  receptionReservations
);

/**
 * @swagger
 * /api/receptionist/reservations/{id}/confirm:
 *   patch:
 *     summary: Confirm a reservation
 *     description: Confirm a pending reservation for a guest.
 *     tags:
 *       - Receptionist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Reservation ID
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Reservation confirmed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Receptionist access required
 *       404:
 *         description: Reservation not found
 *       409:
 *         description: Reservation cannot be confirmed
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/reservations/:id/confirm",
  authenticate,
  authorize("RECEPTIONIST"),
  confirm
);

/**
 * @swagger
 * /api/receptionist/reservations/{id}/check-in:
 *   patch:
 *     summary: Check in a guest
 *     description: Check in a guest who has a confirmed reservation.
 *     tags:
 *       - Receptionist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Reservation ID
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Guest checked in successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Receptionist access required
 *       404:
 *         description: Reservation not found
 *       409:
 *         description: Guest cannot be checked in
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/reservations/:id/check-in",
  authenticate,
  authorize("RECEPTIONIST"),
  checkIn
);

/**
 * @swagger
 * /api/receptionist/reservations/{id}/check-out:
 *   patch:
 *     summary: Check out a guest
 *     description: Check out a guest who is currently staying in the guesthouse.
 *     tags:
 *       - Receptionist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Reservation ID
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Guest checked out successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Receptionist access required
 *       404:
 *         description: Reservation not found
 *       409:
 *         description: Guest cannot be checked out
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/reservations/:id/check-out",
  authenticate,
  authorize("RECEPTIONIST"),
  checkOut
);

/**
 * @swagger
 * /api/receptionist/reservations/{id}/cancel:
 *   patch:
 *     summary: Cancel a reservation
 *     description: Cancel a reservation that has not been checked out.
 *     tags:
 *       - Receptionist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Reservation ID
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Reservation cancelled successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Receptionist access required
 *       404:
 *         description: Reservation not found
 *       409:
 *         description: Reservation cannot be cancelled
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/reservations/:id/cancel",
  authenticate,
  authorize("RECEPTIONIST"),
  cancel
);

/**
 * @swagger
 * /api/receptionist/today-arrivals:
 *   get:
 *     summary: Get today's arrivals
 *     description: Get all guests who are expected to check in today.
 *     tags:
 *       - Receptionist
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's arrivals fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Receptionist access required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/today-arrivals",
  authenticate,
  authorize("RECEPTIONIST"),
  todayArrivals
);

/**
 * @swagger
 * /api/receptionist/today-departures:
 *   get:
 *     summary: Get today's departures
 *     description: Get all guests who are expected to check out today.
 *     tags:
 *       - Receptionist
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's departures fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Receptionist access required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/today-departures",
  authenticate,
  authorize("RECEPTIONIST"),
  todayDepartures
);

export default router;