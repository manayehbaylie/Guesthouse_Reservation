import express from "express";

import {
  revenueReport,
  adminReport,
} from "../controllers/report.controller.js";

import {
  authenticate,
} from "../middleware/auth.middleware.js";

import {
  authorize,
} from "../middleware/role.middleware.js";

const router = express.Router();

// ======================================
// Owner Revenue Report
// ======================================
router.get(
  "/revenue",
  authenticate,
  authorize("OWNER"),
  revenueReport
);

// ======================================
// Admin Report
// ======================================
router.get(
  "/admin",
  authenticate,
  authorize("ADMIN"),
  adminReport
);

export default router;