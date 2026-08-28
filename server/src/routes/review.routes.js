import express from "express";

import {
  create,
  getByGuesthouse,
  getByGuest,
  getOwnerReviews,
  respond,
  getReviewForReservation,
} from "../controllers/review.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

// Create a review
router.post(
  "/",
  authenticate,
  authorize("GUEST"),
  create
);

// Get reviews for a guesthouse
router.get(
  "/guesthouse/:guesthouseId",
  getByGuesthouse
);

// Get review by reservation ID
router.get(
  "/reservation/:reservationId",
  authenticate,
  authorize("GUEST"),
  getReviewForReservation
);

// Get guest's own reviews
router.get(
  "/my-reviews",
  authenticate,
  authorize("GUEST"),
  getByGuest
);

// Get owner's guesthouse reviews
router.get(
  "/owner-reviews",
  authenticate,
  authorize("OWNER"),
  getOwnerReviews
);

// Owner responds to a review
router.put(
  "/:reviewId/respond",
  authenticate,
  authorize("OWNER"),
  respond
);

export default router;