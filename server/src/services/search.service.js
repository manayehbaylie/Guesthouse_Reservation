import prisma from "../config/prisma.js";

// ========================================
// Search Guesthouses
// ========================================

export const searchGuesthouses = async ({
  name,
  location,
  minPrice,
  maxPrice,
  roomType,
}) => {
  const where = {};

  // Guesthouse Name
  if (name) {
    where.name = {
      contains: name,
      mode: "insensitive",
    };
  }

  // Location
  if (location) {
    where.location = {
      contains: location,
      mode: "insensitive",
    };
  }

  // Room Filters
  if (roomType || minPrice || maxPrice) {
    where.rooms = {
      some: {
        ...(roomType && { roomType }),

        ...(minPrice || maxPrice
          ? {
              price: {
                ...(minPrice && {
                  gte: Number(minPrice),
                }),

                ...(maxPrice && {
                  lte: Number(maxPrice),
                }),
              },
            }
          : {}),
      },
    };
  }

  return await prisma.guesthouse.findMany({
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
        where: {
          available: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};
// ========================================
// Search Rooms
// ========================================

export const searchRooms = async ({
  roomType,
  minPrice,
  maxPrice,
  available,
}) => {

  const where = {};

  // Room Type
  if (roomType) {
    where.roomType = roomType;
  }

  // Available
  if (available !== undefined) {
    where.available =
      available === "true";
  }

  // Price
  if (minPrice || maxPrice) {
    where.price = {
      ...(minPrice && {
        gte: Number(minPrice),
      }),

      ...(maxPrice && {
        lte: Number(maxPrice),
      }),
    };
  }

  return await prisma.room.findMany({

    where,

    include: {

      guesthouse: {
        select: {
          id: true,
          name: true,
          location: true,
        },
      },

    },

    orderBy: {
      price: "asc",
    },

  });

};
// ======================================
// Search Reservations
// ======================================

export const searchReservations = async ({
  status,
  guestName,
  roomNumber,
}) => {
  const where = {};

  // Reservation Status
  if (status) {
    where.status = status;
  }

  // Guest Name
  if (guestName) {
    where.guest = {
      fullName: {
        contains: guestName,
        mode: "insensitive",
      },
    };
  }

  // Room Number
  if (roomNumber) {
    where.room = {
      roomNumber: {
        contains: roomNumber,
        mode: "insensitive",
      },
    };
  }

  return await prisma.reservation.findMany({
    where,

    include: {
      guest: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },

      room: {
        select: {
          id: true,
          roomNumber: true,
          roomType: true,
          price: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};