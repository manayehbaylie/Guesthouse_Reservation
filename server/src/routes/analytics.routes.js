import express from "express";

import {
  topGuesthouses,
  roomTypeStatistics,
  topRooms,
  mostActiveGuests,
} from "../controllers/analytics.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();


// ========================================
// ADMIN
// ========================================

router.get(
  "/top-guesthouses",
  authenticate,
  authorize("ADMIN"),
  topGuesthouses
);

router.get(
  "/room-type-statistics",
  authenticate,
  authorize("ADMIN"),
  roomTypeStatistics
);


// ========================================
// OWNER
// ========================================

router.get(
  "/top-rooms",
  authenticate,
  authorize("OWNER"),
  topRooms
);

router.get(
  "/most-active-guests",
  authenticate,
  authorize("OWNER"),
  mostActiveGuests
);


export default router;