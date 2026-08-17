import prisma from "../config/prisma.js";
import { createNotification } from "./notification.service.js";

const APPROVED = "APPROVED";
const PENDING = "PENDING";
const REJECTED = "REJECTED";

const ACTIVE_RESERVATION_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
];

// ==========================================================
// CREATE GUESTHOUSE
// ==========================================================
export const createGuesthouse = async (data, ownerId) => {
  return await prisma.guesthouse.create({
    data: {
      name: data.name,
      address: data.address,
      city: data.city,
      description: data.description,
      image: data.image || null,
      ownerId: Number(ownerId),
      status: PENDING,
    },
  });
};

// ==========================================================
// GET ALL VERIFIED / APPROVED GUESTHOUSES
// Used by the Guest search/home page
// ==========================================================
export const getAllGuesthouses = async ({
  q = "",
  city = "",
  checkIn,
  checkOut,
  maxPrice,
} = {}) => {
  const keyword = String(q || "").trim();

  const where = {
    status: APPROVED,
  };

  // ----------------------------------------------------------
  // CITY FILTER
  // ----------------------------------------------------------
  if (city && city !== "All Cities") {
    where.city = {
      equals: city,
      mode: "insensitive",
    };
  }

  // ----------------------------------------------------------
  // KEYWORD SEARCH
  // Searches guesthouse name, address, city and description
  // ----------------------------------------------------------
  if (keyword) {
    where.OR = [
      {
        name: {
          contains: keyword,
          mode: "insensitive",
        },
      },
      {
        address: {
          contains: keyword,
          mode: "insensitive",
        },
      },
      {
        city: {
          contains: keyword,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: keyword,
          mode: "insensitive",
        },
      },
    ];
  }

  // ----------------------------------------------------------
  // ROOM FILTER
  // ----------------------------------------------------------
  const roomWhere = {
    available: true,
  };

  // Maximum price
  if (
    maxPrice !== undefined &&
    maxPrice !== null &&
    maxPrice !== ""
  ) {
    const price = Number(maxPrice);

    if (!Number.isNaN(price)) {
      roomWhere.price = {
        lte: price,
      };
    }
  }

  // ----------------------------------------------------------
  // DATE AVAILABILITY
  // Prevent rooms with overlapping active reservations
  // from appearing as available.
  // ----------------------------------------------------------
  if (checkIn && checkOut) {
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);

    if (
      !Number.isNaN(startDate.getTime()) &&
      !Number.isNaN(endDate.getTime()) &&
      endDate > startDate
    ) {
      roomWhere.reservations = {
        none: {
          status: {
            in: ACTIVE_RESERVATION_STATUSES,
          },

          checkIn: {
            lt: endDate,
          },

          checkOut: {
            gt: startDate,
          },
        },
      };
    }
  }

  // ----------------------------------------------------------
  // ONLY GUESTHOUSES WITH AVAILABLE ROOMS
  // ----------------------------------------------------------
  where.rooms = {
    some: roomWhere,
  };

  // ----------------------------------------------------------
  // FETCH VERIFIED GUESTHOUSES
  // ----------------------------------------------------------
  const guesthouses = await prisma.guesthouse.findMany({
    where,

    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },

      rooms: {
        where: roomWhere,

        orderBy: {
          price: "asc",
        },
      },
    },

    orderBy: [
      {
        city: "asc",
      },
      {
        name: "asc",
      },
    ],

    // Guest page should show at most 10
    take: 10,
  });

  // ----------------------------------------------------------
  // REMOVE DUPLICATES
  // ----------------------------------------------------------
  const seen = new Set();

  return guesthouses.filter((guesthouse) => {
    if (seen.has(guesthouse.id)) {
      return false;
    }

    seen.add(guesthouse.id);

    return true;
  });
};

// ==========================================================
// GET ONE GUESTHOUSE BY ID
// ==========================================================
export const getGuesthouseById = async (id) => {
  const guesthouseId = Number(id);

  if (!Number.isInteger(guesthouseId)) {
    return null;
  }

  return await prisma.guesthouse.findUnique({
    where: {
      id: guesthouseId,
    },

    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },

      rooms: {
        orderBy: {
          price: "asc",
        },
      },
    },
  });
};

// ==========================================================
// UPDATE GUESTHOUSE
// ==========================================================
export const updateGuesthouse = async (id, data) => {
  const guesthouseId = Number(id);

  if (!Number.isInteger(guesthouseId)) {
    throw new Error("Invalid guesthouse ID");
  }

  const guesthouse = await prisma.guesthouse.findUnique({
    where: {
      id: guesthouseId,
    },
  });

  if (!guesthouse) {
    throw new Error("Guesthouse not found");
  }

  return await prisma.guesthouse.update({
    where: {
      id: guesthouseId,
    },

    data: {
      ...(data.name !== undefined && {
        name: data.name,
      }),

      ...(data.address !== undefined && {
        address: data.address,
      }),

      ...(data.city !== undefined && {
        city: data.city,
      }),

      ...(data.description !== undefined && {
        description: data.description,
      }),

      ...(data.image !== undefined && {
        image: data.image,
      }),
    },
  });
};

// ==========================================================
// DELETE GUESTHOUSE
// ==========================================================
export const deleteGuesthouse = async (id) => {
  const guesthouseId = Number(id);

  if (!Number.isInteger(guesthouseId)) {
    throw new Error("Invalid guesthouse ID");
  }

  const guesthouse = await prisma.guesthouse.findUnique({
    where: {
      id: guesthouseId,
    },
  });

  if (!guesthouse) {
    throw new Error("Guesthouse not found");
  }

  return await prisma.guesthouse.delete({
    where: {
      id: guesthouseId,
    },
  });
};

// ==========================================================
// GET PENDING GUESTHOUSES
// Admin only
// ==========================================================
export const getPendingGuesthouses = async () => {
  return await prisma.guesthouse.findMany({
    where: {
      status: PENDING,
    },

    orderBy: {
      createdAt: "desc",
    },

    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
    },
  });
};

// ==========================================================
// APPROVE GUESTHOUSE
// ==========================================================
export const approveGuesthouse = async (id) => {
  const guesthouseId = Number(id);

  if (!Number.isInteger(guesthouseId)) {
    throw new Error("Invalid guesthouse ID");
  }

  const guesthouse = await prisma.guesthouse.findUnique({
    where: {
      id: guesthouseId,
    },
  });

  if (!guesthouse) {
    throw new Error("Guesthouse not found");
  }

  if (guesthouse.status === APPROVED) {
    throw new Error("Guesthouse is already approved");
  }

  const updatedGuesthouse = await prisma.guesthouse.update({
    where: {
      id: guesthouseId,
    },

    data: {
      status: APPROVED,
      rejectionReason: null,
    },
  });

  await createNotification({
    title: "Guesthouse Approved",
    message:
      "Congratulations! Your guesthouse has been approved by the administrator.",
    userId: guesthouse.ownerId,
  });

  return updatedGuesthouse;
};

// ==========================================================
// REJECT GUESTHOUSE
// ==========================================================
export const rejectGuesthouse = async (id, reason) => {
  const guesthouseId = Number(id);

  if (!Number.isInteger(guesthouseId)) {
    throw new Error("Invalid guesthouse ID");
  }

  const guesthouse = await prisma.guesthouse.findUnique({
    where: {
      id: guesthouseId,
    },
  });

  if (!guesthouse) {
    throw new Error("Guesthouse not found");
  }

  const rejectionReason =
    String(reason || "").trim() || "No reason provided";

  const updatedGuesthouse = await prisma.guesthouse.update({
    where: {
      id: guesthouseId,
    },

    data: {
      status: REJECTED,
      rejectionReason,
    },
  });

  await createNotification({
    title: "Guesthouse Rejected",
    message: `Your guesthouse application was rejected. Reason: ${rejectionReason}`,
    userId: guesthouse.ownerId,
  });

  return updatedGuesthouse;
};