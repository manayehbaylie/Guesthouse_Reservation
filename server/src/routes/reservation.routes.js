import express from "express";

import { create,  getAll,  getById,  updateStatus,  cancel,


} from "../controllers/reservation.controller.js";

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
router.patch(
  "/:id/cancel",
  authenticate,
  cancel
);
// Create Reservation
router.post(
  "/",
  authenticate,
  create
);


export default router;