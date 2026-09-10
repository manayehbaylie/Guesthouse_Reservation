import prisma from '../config/prisma.js';

// ============================================================
// GET REVIEW BY RESERVATION ID
// ============================================================

export const getReviewByReservationId = async (reservationId) => {
  if (!reservationId) {
    throw new Error('Reservation ID is required.');
  }

  const review = await prisma.review.findFirst({
    where: {
      reservationId: Number(reservationId),
    },
    include: {
      guest: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
      guesthouse: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
        },
      },
    },
  });

  return review;
};

// ============================================================
// CREATE REVIEW
// ============================================================

export const createReview = async (data) => {
  const { guesthouseId, reservationId, rating, comment } = data;
  const reviewComment = String(comment || '').trim();

  if (reviewComment.length < 1 || reviewComment.length > 1000) {
    throw new Error('Review comment must be 1 to 1000 characters.');
  }

  // Check if review already exists
  const existing = await prisma.review.findFirst({
    where: { reservationId: Number(reservationId) },
  });

  if (existing) {
    throw new Error('A review already exists for this reservation.');
  }

  // Check if reservation exists and is completed
  const reservation = await prisma.reservation.findUnique({
    where: { id: Number(reservationId) },
    include: { guest: true, room: true },
  });

  if (!reservation) {
    throw new Error('Reservation not found.');
  }

  if (
    reservation.status !== 'CHECKED_IN' &&
    reservation.status !== 'checked_in' &&
    reservation.status !== 'CHECKED_OUT' &&
    reservation.status !== 'checked_out'
  ) {
    throw new Error('You can only review after checking in.');
  }

  if (Number(reservation.room?.guesthouseId) !== Number(guesthouseId)) {
    throw new Error('The reservation does not belong to this guesthouse.');
  }

  // Create review
  const review = await prisma.review.create({
    data: {
      rating: Number(rating),
      comment: reviewComment,
      guestId: reservation.guestId,
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
        },
      },
    },
  });

  return review;
};

// ============================================================
// GET REVIEWS BY GUESTHOUSE
// ============================================================

export const getReviewsByGuesthouse = async (guesthouseId) => {
  if (!guesthouseId) {
    throw new Error('Guesthouse ID is required.');
  }

  const reviews = await prisma.review.findMany({
    where: {
      guesthouseId: Number(guesthouseId),
    },
    include: {
      guest: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return reviews;
};

// ============================================================
// GET GUEST'S OWN REVIEWS
// ============================================================

export const getGuestReviews = async (guestId) => {
  if (!guestId) {
    throw new Error('Guest ID is required.');
  }

  const reviews = await prisma.review.findMany({
    where: {
      guestId: Number(guestId),
    },
    include: {
      guesthouse: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
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
    orderBy: {
      createdAt: 'desc',
    },
  });

  return reviews;
};

// ============================================================
// GET OWNER REVIEWS
// ============================================================

export const getOwnerReviews = async (ownerId) => {
  if (!ownerId) {
    throw new Error('Owner ID is required.');
  }

  const reviews = await prisma.review.findMany({
    where: {
      guesthouse: {
        ownerId: Number(ownerId),
      },
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
    orderBy: {
      createdAt: 'desc',
    },
  });

  return reviews;
};

// ============================================================
// RESPOND TO REVIEW
// ============================================================

export const respondToReview = async (reviewId, responseText) => {
  if (!reviewId) {
    throw new Error('Review ID is required.');
  }

  const normalizedResponse = String(responseText || '').trim();
  if (normalizedResponse.length < 1 || normalizedResponse.length > 1000) {
    throw new Error('Response must be 1 to 1000 characters long.');
  }

  const review = await prisma.review.update({
    where: { id: Number(reviewId) },
    data: {
      ownerResponse: normalizedResponse,
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
    },
  });

  return review;
};