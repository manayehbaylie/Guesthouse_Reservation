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

  if (reservation.status !== 'CHECKED_OUT' && reservation.status !== 'checked_out') {
    throw new Error('You can only review after completing your stay.');
  }

  // Create review
  const review = await prisma.review.create({
    data: {
      rating: Number(rating),
      comment: String(comment).trim(),
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

  if (!responseText || !String(responseText).trim()) {
    throw new Error('Response text is required.');
  }

  const review = await prisma.review.update({
    where: { id: Number(reviewId) },
    data: {
      ownerResponse: String(responseText).trim(),
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