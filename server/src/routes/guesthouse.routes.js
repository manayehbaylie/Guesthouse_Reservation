import express from "express";

import {
  create,
  getAll,
  getById,
  update,
  remove,
  pendingGuesthouses,
  approve,
  reject,
} from "../controllers/guesthouse.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

// ==========================================================
// OWNER
// ==========================================================

// Create a guesthouse
router.post(
  "/",
  authenticate,
  authorize("OWNER"),
  upload.single("image"),
  create
);

// ==========================================================
// PUBLIC / GUEST
// ==========================================================

// Get verified guesthouses
// Supports:
// ?q=keyword
// ?city=Addis Ababa
// ?checkIn=2026-08-20
// ?checkOut=2026-08-22
// ?maxPrice=1500
router.get(
  "/",
  getAll
);

// ==========================================================
// ADMIN
// ==========================================================

// Get pending guesthouses
router.get(
  "/pending",
  authenticate,
  authorize("ADMIN"),
  pendingGuesthouses
);

// Approve guesthouse
router.put(
  "/:id/approve",
  authenticate,
  authorize("ADMIN"),
  approve
);

// Reject guesthouse
router.put(
  "/:id/reject",
  authenticate,
  authorize("ADMIN"),
  reject
);

// ==========================================================
// SINGLE GUESTHOUSE
// ==========================================================

// Get guesthouse details
router.get(
  "/:id",
  getById
);

// Update guesthouse
router.put(
  "/:id",
  authenticate,
  authorize("OWNER", "ADMIN"),
  upload.single("image"),
  update
);

// Delete guesthouse
router.delete(
  "/:id",
  authenticate,
  authorize("OWNER", "ADMIN"),
  remove
);

export default router;