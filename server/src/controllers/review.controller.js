import {
  getReviewByReservationId,
  createReview,
  getReviewsByGuesthouse,
  getOwnerReviews as getOwnerReviewsService,
  respondToReview,
  getGuestReviews,
} from '../services/review.service.js';

// ============================================================
// GET REVIEW FOR RESERVATION
// ============================================================

export const getReviewForReservation = async (req, res, next) => {
  try {
    const { reservationId } = req.params;
    
    if (!reservationId) {
      return res.status(400).json({
        success: false,
        message: 'Reservation ID is required.',
      });
    }
    
    const review = await getReviewByReservationId(reservationId);
    
    return res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// CREATE REVIEW
// ============================================================

export const create = async (req, res, next) => {
  try {
    const { guesthouseId, reservationId, rating, comment } = req.body;

    if (!guesthouseId) {
      throw new Error('Guesthouse ID is required.');
    }
    if (!reservationId) {
      throw new Error('Reservation ID is required.');
    }
    if (!rating || rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5.');
    }
    if (!comment || !String(comment).trim()) {
      throw new Error('Review comment is required.');
    }

    const review = await createReview({
      guesthouseId,
      reservationId,
      rating,
      comment,
    });

    return res.status(201).json({
      success: true,
      data: review,
      message: 'Review submitted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET REVIEWS BY GUESTHOUSE
// ============================================================

export const getByGuesthouse = async (req, res, next) => {
  try {
    const { guesthouseId } = req.params;
    
    if (!guesthouseId) {
      throw new Error('Guesthouse ID is required.');
    }
    
    const reviews = await getReviewsByGuesthouse(guesthouseId);
    
    return res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET GUEST'S OWN REVIEWS
// ============================================================

export const getByGuest = async (req, res, next) => {
  try {
    const guestId = req.user?.id;
    
    if (!guestId) {
      throw new Error('Guest ID is required.');
    }
    
    const reviews = await getGuestReviews(guestId);
    
    return res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET OWNER REVIEWS
// ============================================================

export const getOwnerReviews = async (req, res, next) => {
  try {
    const ownerId = req.user?.id;
    
    if (!ownerId) {
      throw new Error('Owner ID is required.');
    }
    
    const reviews = await getOwnerReviewsService(ownerId);
    
    return res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// RESPOND TO REVIEW
// ============================================================

export const respond = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { response } = req.body;
    
    if (!reviewId) {
      throw new Error('Review ID is required.');
    }
    
    if (!response || !String(response).trim()) {
      throw new Error('Response text is required.');
    }
    
    const review = await respondToReview(reviewId, response);
    
    return res.status(200).json({
      success: true,
      data: review,
      message: 'Response submitted successfully.',
    });
  } catch (error) {
    next(error);
  }
};