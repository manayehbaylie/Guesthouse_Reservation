import express from "express";

import {
  create,
  getAll,
  getById,
  updateStatus,
} from "../controllers/reservation.controller.js";

import {
  authenticate,
} from "../middleware/auth.middleware.js";

const router =
  express.Router();


// ============================================================
// CREATE RESERVATION
// ============================================================

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     summary: Create reservation
 *     description: Creates a pending reservation for an authenticated guest.
 *     tags:
 *       - Reservations
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/",
  authenticate,
  create
);


// ============================================================
// GET ALL RESERVATIONS
// ============================================================

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     summary: Get all reservations
 *     tags:
 *       - Reservations
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/",
  authenticate,
  getAll
);


// ============================================================
// GET RESERVATION BY ID
// ============================================================

/**
 * @swagger
 * /api/reservations/{id}:
 *   get:
 *     summary: Get reservation by ID
 *     tags:
 *       - Reservations
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/:id",
  authenticate,
  getById
);


// ============================================================
// UPDATE RESERVATION STATUS
// ============================================================

/**
 * @swagger
 * /api/reservations/{id}/status:
 *   patch:
 *     summary: Update reservation status
 *     description: Moves a reservation from CONFIRMED to CHECKED_IN or CHECKED_IN to CHECKED_OUT.
 *     tags:
 *       - Reservations
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  "/:id/status",
  authenticate,
  updateStatus
);


export default router;