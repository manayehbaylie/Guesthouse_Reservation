import express from "express";

import {
  receptionReservations,confirm,  checkIn,  checkOut,  cancel,  todayArrivals,  todayDepartures,
} from "../controllers/receptionist.controller.js";

import {
  authenticate,
} from "../middleware/auth.middleware.js";

import {
  authorize,
} from "../middleware/role.middleware.js";

const router = express.Router();

// ===================================
// Reservation List
// ===================================
router.get(

  "/reservations",

  authenticate,

  authorize("RECEPTIONIST"),

  receptionReservations

);
// ===================================
// Confirm Reservation
// ===================================
router.patch(

  "/reservations/:id/confirm",

  authenticate,

  authorize("RECEPTIONIST"),

  confirm

);
// ===================================
// Check In Guest
// ===================================
router.patch(

  "/reservations/:id/check-in",

  authenticate,

  authorize("RECEPTIONIST"),

  checkIn

);
// ===================================
// Check Out Guest
// ===================================
router.patch(

  "/reservations/:id/check-out",

  authenticate,

  authorize("RECEPTIONIST"),

  checkOut

);
// ===================================
// Cancel Reservation
// ===================================
router.patch(

  "/reservations/:id/cancel",

  authenticate,

  authorize("RECEPTIONIST"),

  cancel

);
// ===================================
// Today's Arrivals
// ===================================
router.get(

  "/today-arrivals",

  authenticate,

  authorize("RECEPTIONIST"),

  todayArrivals

);
// ===================================
// Today's Departures
// ===================================
router.get(

  "/today-departures",

  authenticate,

  authorize("RECEPTIONIST"),

  todayDepartures

);

export default router;