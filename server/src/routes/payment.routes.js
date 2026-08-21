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

/* ==========================================================
   PAYMENT ROUTES
========================================================== */

router.post(
  "/initiate",
  authenticate,
  initiate
);

router.get(
  "/history",
  authenticate,
  getHistory
);

router.post(
  "/",
  authenticate,
  authorize("GUEST"),
  create
);

router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  getAll
);

router.get(
  "/:id",
  authenticate,
  authorize("ADMIN", "GUEST"),
  getById
);

router.put(
  "/:id/status",
  authenticate,
  authorize("ADMIN"),
  updateStatus
);

export default router;