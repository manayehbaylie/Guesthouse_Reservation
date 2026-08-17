import prisma from "../config/prisma.js";

/*
==================================================
SEARCH GUESTHOUSES
==================================================

Supported filters:
- q / name / location
- city
- checkIn
- checkOut
- minPrice
- maxPrice
- roomType

Rules:
- Only APPROVED guesthouses are returned.
- Only available rooms are considered.
- Overlapping reservations are excluded.
- Maximum 10 guesthouses are returned.
- Duplicate guesthouses are removed.
==================================================
*/

export const searchGuesthouses = async ({
  q,
  name,
  location,
  city,
  checkIn,
  checkOut,
  minPrice,
  maxPrice,
  roomType,
} = {}) => {
  const keyword = String(q || name || location || "").trim();

  const where = {
    // IMPORTANT:
    // Only verified/approved guesthouses appear in search.
    status: "APPROVED",
  };

  /*
  -----------------------------------------------
  CITY FILTER
  -----------------------------------------------
  */
  if (city && city !== "All Cities") {
    where.city = {
      equals: city.trim(),
      mode: "insensitive",
    };
  }

  /*
  -----------------------------------------------
  KEYWORD / LOCATION SEARCH
  -----------------------------------------------
  */
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

  /*
  -----------------------------------------------
  ROOM FILTERS
  -----------------------------------------------
  */
  const roomWhere = {
    available: true,
  };

  /*
  Room type
  */
  if (roomType) {
    roomWhere.roomType = roomType;
  }

  /*
  Minimum / maximum price
  */
  const parsedMinPrice =
    minPrice !== undefined &&
    minPrice !== null &&
    minPrice !== ""
      ? Number(minPrice)
      : null;

  const parsedMaxPrice =
    maxPrice !== undefined &&
    maxPrice !== null &&
    maxPrice !== ""
      ? Number(maxPrice)
      : null;

  if (
    parsedMinPrice !== null &&
    !Number.isNaN(parsedMinPrice)
  ) {
    roomWhere.price = {
      ...(roomWhere.price || {}),
      gte: parsedMinPrice,
    };
  }

  if (
    parsedMaxPrice !== null &&
    !Number.isNaN(parsedMaxPrice)
  ) {
    roomWhere.price = {
      ...(roomWhere.price || {}),
      lte: parsedMaxPrice,
    };
  }

  /*
  -----------------------------------------------
  DATE / AVAILABILITY FILTER
  -----------------------------------------------

  A room cannot be returned if it already has an
  overlapping PENDING, CONFIRMED, or CHECKED_IN
  reservation.
  */
  if (checkIn && checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (
      Number.isNaN(checkInDate.getTime()) ||
      Number.isNaN(checkOutDate.getTime())
    ) {
      throw new Error("Invalid check-in or check-out date");
    }

    if (checkOutDate <= checkInDate) {
      throw new Error(
        "Check-out date must be after check-in date"
      );
    }

    roomWhere.reservations = {
      none: {
        status: {
          in: [
            "PENDING",
            "CONFIRMED",
            "CHECKED_IN",
          ],
        },

        checkIn: {
          lt: checkOutDate,
        },

        checkOut: {
          gt: checkInDate,
        },
      },
    };
  }

  /*
  -----------------------------------------------
  REQUIRE AT LEAST ONE MATCHING ROOM
  -----------------------------------------------
  */
  where.rooms = {
    some: roomWhere,
  };

  /*
  -----------------------------------------------
  GET GUESTHOUSES
  -----------------------------------------------
  */
  const guesthouses =
    await prisma.guesthouse.findMany({
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

      /*
      The guest dashboard should display a maximum
      of 10 verified guesthouses.
      */
      take: 10,
    });

  /*
  -----------------------------------------------
  REMOVE DUPLICATES
  -----------------------------------------------
  */
  const seen = new Set();

  const uniqueGuesthouses = guesthouses.filter(
    (guesthouse) => {
      if (seen.has(guesthouse.id)) {
        return false;
      }

      seen.add(guesthouse.id);

      return true;
    }
  );

  /*
  -----------------------------------------------
  FORMAT PRICE DATA
  -----------------------------------------------
  */
  return uniqueGuesthouses.map((guesthouse) => {
    const prices = guesthouse.rooms.map((room) =>
      Number(room.price)
    );

    const minRoomPrice =
      prices.length > 0
        ? Math.min(...prices)
        : null;

    const maxRoomPrice =
      prices.length > 0
        ? Math.max(...prices)
        : null;

    return {
      ...guesthouse,

      priceRange: {
        min: minRoomPrice,
        max: maxRoomPrice,
      },

      /*
      Helpful flag for the frontend.
      */
      verified: guesthouse.status === "APPROVED",
    };
  });
};


/*
==================================================
SEARCH ROOMS
==================================================
*/
export const searchRooms = async ({
  roomType,
  minPrice,
  maxPrice,
  available,
} = {}) => {
  const where = {};

  if (roomType) {
    where.roomType = roomType;
  }

  if (available !== undefined) {
    where.available =
      available === true ||
      available === "true";
  }

  const parsedMinPrice =
    minPrice !== undefined &&
    minPrice !== null &&
    minPrice !== ""
      ? Number(minPrice)
      : null;

  const parsedMaxPrice =
    maxPrice !== undefined &&
    maxPrice !== null &&
    maxPrice !== ""
      ? Number(maxPrice)
      : null;

  if (
    parsedMinPrice !== null &&
    !Number.isNaN(parsedMinPrice)
  ) {
    where.price = {
      ...(where.price || {}),
      gte: parsedMinPrice,
    };
  }

  if (
    parsedMaxPrice !== null &&
    !Number.isNaN(parsedMaxPrice)
  ) {
    where.price = {
      ...(where.price || {}),
      lte: parsedMaxPrice,
    };
  }

  return prisma.room.findMany({
    where,

    include: {
      guesthouse: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          status: true,
        },
      },
    },

    orderBy: {
      price: "asc",
    },
  });
};


/*
==================================================
SEARCH RESERVATIONS
==================================================
*/
export const searchReservations = async ({
  guestId,
  roomId,
  status,
} = {}) => {
  const where = {};

  if (guestId) {
    where.guestId = Number(guestId);
  }

  if (roomId) {
    where.roomId = Number(roomId);
  }

  if (status) {
    where.status = status;
  }

  return prisma.reservation.findMany({
    where,

    include: {
      guest: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },

      room: {
        include: {
          guesthouse: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              status: true,
            },
          },
        },
      },

      payment: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};