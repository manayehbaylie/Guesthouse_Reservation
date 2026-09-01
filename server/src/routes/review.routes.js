import express from 'express';
import {
  getReviewForReservation,
  create,
  getByGuesthouse,
  getByGuest,
  getOwnerReviews,
  respond,
} from '../controllers/review.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// ============================================================
// REVIEW ROUTES
// ============================================================

// Get review for a specific reservation
router.get('/reservation/:reservationId', authenticate, getReviewForReservation);

// Create a new review (Guest only)
router.post('/', authenticate, create);

// Get reviews for a specific guesthouse (Public)
router.get('/guesthouse/:guesthouseId', getByGuesthouse);

// Get current guest's reviews (Guest only)
router.get('/guest', authenticate, getByGuest);

// Get owner's guesthouse reviews (Owner only)
router.get('/owner-reviews', authenticate, getOwnerReviews);

// Respond to a review (Owner only)
router.put('/:reviewId/respond', authenticate, respond);

export default router;