import prisma from "../config/prisma.js";

// ============================================================
// CREATE REVIEW
// ============================================================

export const createReview = async (guestId, data) => {
  const {
    guesthouseId,
    reservationId,
    rating,
    comment,
  } = data;

  const parsedGuesthouseId =
    Number(guesthouseId);

  const parsedReservationId =
    Number(reservationId);

  const parsedRating =
    Number(rating);

  // ----------------------------------------------------------
  // VALIDATION
  // ----------------------------------------------------------

  if (
    !parsedGuesthouseId ||
    !parsedReservationId
  ) {
    throw new Error(
      "Guesthouse ID and reservation ID are required"
    );
  }

  if (
    !Number.isInteger(parsedRating) ||
    parsedRating < 1 ||
    parsedRating > 5
  ) {
    throw new Error(
      "Rating must be between 1 and 5"
    );
  }

  if (
    !comment ||
    !String(comment).trim()
  ) {
    throw new Error(
      "Review comment is required"
    );
  }

  // ----------------------------------------------------------
  // VERIFY RESERVATION
  //
  // The reservation must:
  // 1. Belong to the logged-in guest
  // 2. Belong to the selected guesthouse
  // 3. Be completed / checked out
  // ----------------------------------------------------------

  const reservation =
    await prisma.reservation.findFirst({
      where: {
        id: parsedReservationId,
        guestId,
        room: {
          guesthouseId:
            parsedGuesthouseId,
        },
      },
    });

  if (!reservation) {
    throw new Error(
      "Invalid reservation or guesthouse"
    );
  }

  // ----------------------------------------------------------
  // ONLY ALLOW REVIEWS AFTER THE STAY
  // ----------------------------------------------------------

  const reservationStatus =
    String(
      reservation.status || ""
    ).toUpperCase();

  if (
    ![
      "CHECKED_OUT",
      "COMPLETED",
    ].includes(reservationStatus)
  ) {
    throw new Error(
      "You can only review a guesthouse after checking out"
    );
  }

  // ----------------------------------------------------------
  // CHECK IF REVIEW ALREADY EXISTS
  // ----------------------------------------------------------

  const existingReview =
    await prisma.review.findUnique({
      where: {
        reservationId:
          parsedReservationId,
      },
    });

  if (existingReview) {
    throw new Error(
      "Review already exists for this reservation"
    );
  }

  // ----------------------------------------------------------
  // CREATE REVIEW
  // ----------------------------------------------------------

  return await prisma.review.create({
    data: {
      guestId,

      guesthouseId:
        parsedGuesthouseId,

      reservationId:
        parsedReservationId,

      rating:
        parsedRating,

      comment:
        String(comment).trim(),
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
          status: true,
        },
      },
    },
  });
};

// ============================================================
// GET REVIEWS BY GUESTHOUSE
// ============================================================

export const getReviewsByGuesthouse = async (
  guesthouseId
) => {
  const parsedGuesthouseId =
    Number(guesthouseId);

  if (!parsedGuesthouseId) {
    throw new Error(
      "Guesthouse ID is required"
    );
  }

  return await prisma.review.findMany({
    where: {
      guesthouseId:
        parsedGuesthouseId,
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
          status: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};

// ============================================================
// GET REVIEWS BY GUEST
// ============================================================

export const getReviewsByGuest = async (
  guestId
) => {
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
          status: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};

// ============================================================
// RESPOND TO REVIEW
// ============================================================

export const respondToReview = async (
  ownerId,
  reviewId,
  response
) => {
  const parsedReviewId =
    Number(reviewId);

  if (!parsedReviewId) {
    throw new Error(
      "Review ID is required"
    );
  }

  if (
    !response ||
    !String(response).trim()
  ) {
    throw new Error(
      "Response is required"
    );
  }

  // ----------------------------------------------------------
  // VERIFY REVIEW BELONGS TO OWNER'S GUESTHOUSE
  // ----------------------------------------------------------

  const review =
    await prisma.review.findFirst({
      where: {
        id: parsedReviewId,

        guesthouse: {
          ownerId,
        },
      },
    });

  if (!review) {
    throw new Error(
      "Review not found or you are not authorized to respond to this review"
    );
  }

  // ----------------------------------------------------------
  // UPDATE REVIEW
  // ----------------------------------------------------------

  return await prisma.review.update({
    where: {
      id: parsedReviewId,
    },

    data: {
      ownerResponse:
        String(response).trim(),
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
          status: true,
        },
      },
    },
  });
};

// ============================================================
// GET OWNER REVIEWS
// ============================================================

export const getOwnerReviews = async (
  ownerId
) => {
  // ----------------------------------------------------------
  // FIND OWNER'S GUESTHOUSE
  // ----------------------------------------------------------

  const guesthouse =
    await prisma.guesthouse.findFirst({
      where: {
        ownerId,
      },

      select: {
        id: true,
      },
    });

  if (!guesthouse) {
    return [];
  }

  // ----------------------------------------------------------
  // GET REVIEWS
  // ----------------------------------------------------------

  return await prisma.review.findMany({
    where: {
      guesthouseId:
        guesthouse.id,
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
          status: true,
        },
      },

      guesthouse: {
        select: {
          id: true,
          name: true,
          city: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};