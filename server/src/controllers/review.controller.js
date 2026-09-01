// server/src/controllers/review.controller.js

import {
  getReviewByReservationId,
  createReview,
  getReviewsByGuesthouse,
  getOwnerReviews as getOwnerReviewsService,
  respondToReview,
  getGuestReviews,
} from '../services/review.service.js';
import { createNotification } from '../services/notification.service.js';
import prisma from '../config/prisma.js';

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
    const guestId = req.user.id;

    console.log('📝 Creating review with data:', { guesthouseId, reservationId, rating, comment, guestId });

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

    // Check if review already exists for this reservation
    const existingReview = await prisma.review.findFirst({
      where: {
        reservationId: Number(reservationId),
      },
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this reservation.',
      });
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        rating: Number(rating),
        comment: String(comment).trim(),
        guestId: Number(guestId),
        guesthouseId: Number(guesthouseId),
        reservationId: Number(reservationId),
      },
      include: {
        guest: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        guesthouse: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
        reservation: {
          select: {
            id: true,
            checkIn: true,
            checkOut: true,
          },
        },
      },
    });

    console.log('✅ Review created successfully:', review);

    // Create notification for the owner
    try {
      await createNotification({
        title: '⭐ New Review Received',
        message: `Guest ${review.guest.fullName} has left a ${review.rating}-star review for "${review.guesthouse.name}".`,
        userId: review.guesthouse.ownerId,
        guesthouseId: review.guesthouse.id,
        type: 'review',
      });
      console.log('✅ Notification sent to owner');
    } catch (notificationError) {
      console.error('❌ Failed to create notification:', notificationError);
    }

    return res.status(201).json({
      success: true,
      data: review,
      message: 'Review submitted successfully.',
    });
  } catch (error) {
    console.error('❌ Error in create review:', error);
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
    
    console.log('🔍 Fetching owner reviews for owner:', ownerId);

    if (!ownerId) {
      throw new Error('Owner ID is required.');
    }

    // Get the owner's guesthouse
    const guesthouse = await prisma.guesthouse.findFirst({
      where: {
        ownerId: Number(ownerId),
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!guesthouse) {
      console.log('ℹ️ No guesthouse found for owner:', ownerId);
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No guesthouse found for this owner.',
      });
    }

    console.log('🏠 Owner guesthouse found:', guesthouse.id, guesthouse.name);

    // Get all reviews for the owner's guesthouse
    const reviews = await prisma.review.findMany({
      where: {
        guesthouseId: guesthouse.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        guest: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        guesthouse: {
          select: {
            id: true,
            name: true,
          },
        },
        reservation: {
          select: {
            id: true,
            checkIn: true,
            checkOut: true,
          },
        },
      },
    });

    console.log(`✅ Found ${reviews.length} reviews for owner's guesthouse`);

    // Format reviews for frontend
    const formattedReviews = reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      ownerResponse: review.ownerResponse,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      guest: {
        id: review.guest.id,
        fullName: review.guest.fullName,
        email: review.guest.email,
      },
      guesthouse: {
        id: review.guesthouse.id,
        name: review.guesthouse.name,
      },
      guesthouseName: review.guesthouse.name,
      reservation: {
        id: review.reservation?.id,
        checkIn: review.reservation?.checkIn,
        checkOut: review.reservation?.checkOut,
      },
    }));

    return res.status(200).json({
      success: true,
      data: formattedReviews,
    });
  } catch (error) {
    console.error('❌ Error in getOwnerReviews:', error);
    next(error);
  }
};

// ============================================================
// RESPOND TO REVIEW - FIXED WITH FULL RESPONSE IN NOTIFICATION
// ============================================================

export const respond = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { response } = req.body;
    const ownerId = req.user?.id;
    
    console.log(`📝 Responding to review ${reviewId} by owner ${ownerId}`);
    console.log('📝 Response text:', response);

    if (!reviewId) {
      return res.status(400).json({
        success: false,
        message: 'Review ID is required.',
      });
    }
    
    if (!response || !String(response).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Response text is required.',
      });
    }

    if (String(response).trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Response must be at least 10 characters long.',
      });
    }

    // Get the review with related data
    const existingReview = await prisma.review.findUnique({
      where: {
        id: Number(reviewId),
      },
      include: {
        guest: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        guesthouse: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
      },
    });

    if (!existingReview) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.',
      });
    }

    // Check if the owner owns this guesthouse
    if (existingReview.guesthouse.ownerId !== Number(ownerId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to respond to this review.',
      });
    }

    // Update the review with owner response
    const updatedReview = await prisma.review.update({
      where: {
        id: Number(reviewId),
      },
      data: {
        ownerResponse: String(response).trim(),
        updatedAt: new Date(),
      },
      include: {
        guest: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        guesthouse: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
      },
    });

    console.log('✅ Review response submitted:', updatedReview.id);

    // ✅ CREATE NOTIFICATION FOR THE GUEST - SHOWS FULL RESPONSE
    try {
      const notification = await createNotification({
        title: '📝 Owner Responded to Your Review',
        message: `"${String(response).trim()}"`,  // ✅ Shows the full response
        userId: existingReview.guest.id,
        guesthouseId: existingReview.guesthouse.id,
        type: 'review_response',
      });
      console.log('✅ Notification sent to guest:', notification);
    } catch (notificationError) {
      console.error('❌ Failed to create notification:', notificationError);
    }
    
    return res.status(200).json({
      success: true,
      data: updatedReview,
      message: 'Response submitted successfully. The guest has been notified.',
    });
  } catch (error) {
    console.error('❌ Error in respond to review:', error);
    next(error);
  }
};