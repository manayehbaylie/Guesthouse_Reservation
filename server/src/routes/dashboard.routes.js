import express from "express";

import { getStats,  monthlyRevenue,  recentReservations,  recentPayments,  ownerDashboard,
ownerRevenue,
 } from "../controllers/dashboard.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  getStats
);
router.get(
  "/monthly-revenue",
  authenticate,
  authorize("ADMIN"),
  monthlyRevenue
);
router.get(
  "/recent-reservations",
  authenticate,
  authorize("ADMIN"),
  recentReservations
);
router.get(
  "/recent-payments",
  authenticate,
  authorize("ADMIN"),
  recentPayments
);
router.get(
  "/owner",
  authenticate,
  authorize("OWNER"),
  ownerDashboard
);
router.get(
  "/owner/revenue",
  authenticate,
  authorize("OWNER"),
  ownerRevenue
);
export default router;