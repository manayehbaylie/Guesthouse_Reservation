import express from "express";

import { create,  getAll,  getById,  updateStatus,


 } from "../controllers/payment.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();
router.get(
  "/",
  authenticate,
  getAll
);
router.get(
  "/:id",
  authenticate,
  getById
);
router.patch(
  "/:id/status",
  authenticate,
  updateStatus
);
// Create Payment
router.post(
  "/",
  authenticate,
  create
);

export default router;