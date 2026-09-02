import express from "express";

import {
  receptionReservations,
  receptionistGuesthouse,
  confirm,
  checkIn,
  checkOut,
  cancel,  deleteReceptionReservation,
  todayArrivals,
  todayDepartures,
  dashboardStats,
  receptionistRooms,
  inHouseGuests,
  searchReservationsController,
  updateRoomAvailabilityController,
    updateReceptionistProfile,

} from "../controllers/receptionist.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

/*
 * ========================================
 * RECEPTIONIST ROUTES
 * ========================================
 */

router.get(
  "/guesthouse",
  authenticate,
  authorize("RECEPTIONIST"),
  receptionistGuesthouse
);

/**
 * @swagger
 * /api/receptionist/dashboard:
 *   get:
 *     summary: Get receptionist dashboard stats
 *     description: Get dashboard statistics for the receptionist's assigned guesthouse.
 *     tags:
 *       - Receptionist
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats fetched successfully
 */
router.get(
  "/dashboard",
  authenticate,
  authorize("RECEPTIONIST"),
  dashboardStats
);

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
 * /api/receptionist/reservations/search:
 *   get:
 *     summary: Search reservations
 *     description: Search reservations by guest name, phone, room number, or reservation ID.
 *     tags:
 *       - Receptionist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: term
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results fetched successfully
 */
router.get(
  "/reservations/search",
  authenticate,
  authorize("RECEPTIONIST"),
  searchReservationsController
);

/**
 * @swagger
 * /api/receptionist/arrivals:
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
  "/arrivals",
  authenticate,
  authorize("RECEPTIONIST"),
  todayArrivals
);

/**
 * @swagger
 * /api/receptionist/departures:
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
  "/departures",
  authenticate,
  authorize("RECEPTIONIST"),
  todayDepartures
);

/**
 * @swagger
 * /api/receptionist/in-house:
 *   get:
 *     summary: Get in-house guests
 *     description: Get all guests currently staying in the guesthouse.
 *     tags:
 *       - Receptionist
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: In-house guests fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Receptionist access required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/in-house",
  authenticate,
  authorize("RECEPTIONIST"),
  inHouseGuests
);

/**
 * @swagger
 * /api/receptionist/rooms:
 *   get:
 *     summary: Get receptionist's rooms
 *     description: Get all rooms for the receptionist's assigned guesthouse.
 *     tags:
 *       - Receptionist
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rooms fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Receptionist access required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/rooms",
  authenticate,
  authorize("RECEPTIONIST"),
  receptionistRooms
);

/**
 * @swagger
 * /api/receptionist/rooms/:id/availability:
 *   patch:
 *     summary: Update room availability
 *     description: Update room maintenance status and availability.
 *     tags:
 *       - Receptionist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Room ID
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - maintenanceStatus
 *             properties:
 *               maintenanceStatus:
 *                 type: string
 *                 enum: [AVAILABLE, UNAVAILABLE, CLEANING, MAINTENANCE]
 *     responses:
 *       200:
 *         description: Room availability updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Receptionist access required
 *       404:
 *         description: Room not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/rooms/:id/availability",
  authenticate,
  authorize("RECEPTIONIST"),
  updateRoomAvailabilityController
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
/**
 * @swagger
 * /api/receptionist/reservations/{id}:
 *   delete:
 *     summary: Delete a reservation
 *     description: Permanently delete a cancelled or checked-out reservation.
 *     tags:
 *       - Receptionist
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/reservations/:id",
  authenticate,
  authorize("RECEPTIONIST"),
  deleteReceptionReservation
);
/**
 * Update receptionist profile
 */
router.put(
  "/profile",
  authenticate,
  authorize("RECEPTIONIST"),
  updateReceptionistProfile
);
export default router;