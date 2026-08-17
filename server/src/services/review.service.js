import prisma from "../config/prisma.js";

export const createReview = async (guestId, data) => {
  const { guesthouseId, reservationId, rating, comment } = data;

  // Verify the guest has a reservation for this guesthouse
  const reservation = await prisma.reservation.findFirst({
    where: {
      id: reservationId,
      guestId,
      room: {
        guesthouseId,
      },
    },
  });

  if (!reservation) {
    throw new Error("Invalid reservation or guesthouse");
  }

  // Check if review already exists for this reservation
  const existingReview = await prisma.review.findUnique({
    where: { reservationId },
  });

  if (existingReview) {
    throw new Error("Review already exists for this reservation");
  }

  return await prisma.review.create({
    data: {
      guestId,
      guesthouseId,
      reservationId,
      rating,
      comment,
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
};

export const getReviewsByGuesthouse = async (guesthouseId) => {
  return await prisma.review.findMany({
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
};

export const getReviewsByGuest = async (guestId) => {
  return await prisma.review.findMany({
    where: {
      guestId,
    },
    include: {
      guesthouse: {
        select: {
          id: true,
          name: true,
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
};

export const respondToReview = async (reviewId, response) => {
  return await prisma.review.update({
    where: {
      id: Number(reviewId),
    },
    data: {
      ownerResponse: response,
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
};

export const getOwnerReviews = async (ownerId) => {
  // First get the owner's guesthouse
  const guesthouse = await prisma.guesthouse.findFirst({
    where: {
      ownerId,
    },
  });

  if (!guesthouse) {
    return [];
  }

  // Get all reviews for the owner's guesthouse
  return await prisma.review.findMany({
    where: {
      guesthouseId: guesthouse.id,
    },
    include: {
      guest: {
        select: {
          id: true,
          fullName: true,
          email: true,
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
};