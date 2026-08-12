import express from "express";

import {
  search,
  roomSearch,
  reservationSearch,
} from "../controllers/search.controller.js";

const router = express.Router();

/*
 * ========================================
 * SEARCH ROUTES
 * ========================================
 */

/**
 * @swagger
 * /api/search/guesthouses:
 *   get:
 *     summary: Search guesthouses
 *     description: Search and filter guesthouses based on available search criteria.
 *     tags:
 *       - Search
 *     parameters:
 *       - in: query
 *         name: name
 *         required: false
 *         description: Guesthouse name
 *         schema:
 *           type: string
 *         example: Sunrise Guesthouse
 *       - in: query
 *         name: location
 *         required: false
 *         description: Guesthouse location
 *         schema:
 *           type: string
 *         example: Addis Ababa
 *     responses:
 *       200:
 *         description: Guesthouses fetched successfully
 *       400:
 *         description: Invalid search parameters
 *       500:
 *         description: Internal server error
 */
router.get(
  "/guesthouses",
  search
);

/**
 * @swagger
 * /api/search/rooms:
 *   get:
 *     summary: Search rooms
 *     description: Search and filter rooms by room type, price, and availability.
 *     tags:
 *       - Search
 *     parameters:
 *       - in: query
 *         name: roomType
 *         required: false
 *         description: Type of room
 *         schema:
 *           type: string
 *         example: SINGLE
 *       - in: query
 *         name: minPrice
 *         required: false
 *         description: Minimum room price
 *         schema:
 *           type: number
 *         example: 500
 *       - in: query
 *         name: maxPrice
 *         required: false
 *         description: Maximum room price
 *         schema:
 *           type: number
 *         example: 2000
 *       - in: query
 *         name: available
 *         required: false
 *         description: Filter rooms by availability
 *         schema:
 *           type: boolean
 *         example: true
 *     responses:
 *       200:
 *         description: Rooms fetched successfully
 *       400:
 *         description: Invalid search parameters
 *       500:
 *         description: Internal server error
 */
router.get(
  "/rooms",
  roomSearch
);

/**
 * @swagger
 * /api/search/reservations:
 *   get:
 *     summary: Search reservations
 *     description: Search reservations using reservation-related criteria.
 *     tags:
 *       - Search
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         description: Reservation status
 *         schema:
 *           type: string
 *           enum:
 *             - PENDING
 *             - CONFIRMED
 *             - CHECKED_IN
 *             - CHECKED_OUT
 *             - CANCELLED
 *         example: CONFIRMED
 *       - in: query
 *         name: guestId
 *         required: false
 *         description: Guest ID
 *         schema:
 *           type: integer
 *         example: 5
 *       - in: query
 *         name: roomId
 *         required: false
 *         description: Room ID
 *         schema:
 *           type: integer
 *         example: 2
 *       - in: query
 *         name: checkIn
 *         required: false
 *         description: Check-in date
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-08-10"
 *       - in: query
 *         name: checkOut
 *         required: false
 *         description: Check-out date
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-08-12"
 *     responses:
 *       200:
 *         description: Reservations fetched successfully
 *       400:
 *         description: Invalid search parameters
 *       500:
 *         description: Internal server error
 */
router.get(
  "/reservations",
  reservationSearch
);

export default router;