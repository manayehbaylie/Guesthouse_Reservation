import express from "express";

import {
  create,
  getAll,
  getById,
  updateStatus,
  initiate,
  getHistory,
} from "../controllers/payment.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

/*
==================================================
PAYMENT ROUTES
==================================================
*/

/**
 * Initiate payment for a pending reservation
 * ("Payment & Confirmation" flow from the booking page)
 */
router.post(
  "/initiate",
  authenticate,
  initiate
);

/**
 * Get the logged-in guest's payment history
 */
router.get(
  "/history",
  authenticate,
  getHistory
);

/**
 * Create a payment request
 *
 * Guest only
 */
router.post(
  "/",
  authenticate,
  authorize("GUEST"),
  create
);

/**
 * Get all payments
 *
 * Admin only
 */
router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  getAll
);

/**
 * Get payment by ID
 *
 * Admin or Guest
 */
router.get(
  "/:id",
  authenticate,
  authorize("ADMIN", "GUEST"),
  getById
);

/**
 * Update payment status
 *
 * Admin only
 */
router.put(
  "/:id/status",
  authenticate,
  authorize("ADMIN"),
  updateStatus
);

export default router;