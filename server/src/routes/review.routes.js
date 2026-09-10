import express from 'express';
import {
  getReviewForReservation,
  create,
  getByGuesthouse,
  getByGuest,
  getOwnerReviews,
  respond,
  remove,
  removeOwnerReview,
  removeOwnerResponse,
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

// Delete a guest review from the owning guesthouse dashboard
router.delete('/owner/:reviewId', authenticate, removeOwnerReview);

// Delete the owner's response without deleting the guest review
router.delete('/owner/:reviewId/response', authenticate, removeOwnerResponse);

// Delete the current guest's own review
router.delete('/:reviewId', authenticate, remove);

export default router;