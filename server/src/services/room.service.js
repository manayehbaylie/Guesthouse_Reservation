import prisma from "../config/prisma.js";
import { parseDateOnly } from "../utils/date.utils.js";
import { reservationOverlapWhere } from "../utils/reservation-overlap.utils.js";

/* ============================================================
   CREATE ROOM
============================================================ */

export const createRoom = async (data, guesthouseId) => {
  return await prisma.room.create({
    data: {
      roomNumber: data.roomNumber,
      roomType: data.roomType,
      price: data.price,
      capacity: data.capacity,

      // ONLY TWO ROOM STATES
      available: data.available ?? true,
      maintenanceStatus:
        data.available === false
          ? "UNAVAILABLE"
          : "AVAILABLE",

      guesthouseId: Number(guesthouseId),
    },
  });
};



/* ============================================================
   GET ALL ROOMS
============================================================ */

export const getAllRooms = async (
  guesthouseId = null,
  checkIn = null,
  checkOut = null,
  forBooking = false
) => {
  const parsedId = Number(guesthouseId);
  const where =
    guesthouseId && !isNaN(parsedId) && parsedId > 0
      ? {
          guesthouseId: parsedId,
        }
      : {};

  const startDate = checkIn ? parseDateOnly(checkIn) : null;
  const endDate = checkOut ? parseDateOnly(checkOut) : null;
  const hasDateRange =
    checkIn &&
    checkOut &&
    startDate &&
    endDate &&
    !Number.isNaN(startDate.getTime()) &&
    !Number.isNaN(endDate.getTime()) &&
    endDate > startDate;

  const reservationWhere = hasDateRange
    ? reservationOverlapWhere(null, startDate, endDate)
    : {
        id: -1,
      };

  const rooms = await prisma.room.findMany({
    where,

    include: {
      guesthouse: {
        select: {
          id: true,
          name: true,
          city: true,
        },
      },

      reservations: {
        where: reservationWhere,
        select: {
          id: true,
          status: true,
          checkIn: true,
          checkOut: true,
        },
        take: 1,
      },

    },

    orderBy: {
      id: "asc",
    },
  });

  return rooms.map((room) => {
    const isReserved = room.reservations.length > 0;
    const isMaintenanceBlocked = room.maintenanceStatus !== "AVAILABLE";
    const availabilityStatus = isMaintenanceBlocked
      ? "unavailable"
      : hasDateRange
        ? isReserved
          ? "reserved"
          : "available"
        : forBooking || room.available
          ? "available"
          : "unavailable";

    return {
      ...room,
      available: availabilityStatus === "available",
      availabilityStatus,
      reservations: undefined,
    };
  });
};


/* ============================================================
   GET ROOM BY ID
============================================================ */

export const getRoomById = async (id) => {

  const roomId = Number(id);

  if (!roomId || Number.isNaN(roomId)) {
    throw new Error("Invalid room ID.");
  }

  return await prisma.room.findUnique({
    where: {
      id: roomId,
    },

    include: {
      guesthouse: {
        select: {
          id: true,
          name: true,
          city: true,
        },
      },

      reservations: {
        select: {
          id: true,
          checkIn: true,
          checkOut: true,
          status: true,
        },

        orderBy: {
          checkIn: "asc",
        },
      },
    },
  });
};


/* ============================================================
   CHECK ROOM AVAILABILITY FOR SELECTED DATES
============================================================ */

export const checkRoomAvailability = async (
  roomId,
  checkIn,
  checkOut
) => {

  const id = Number(roomId);

  if (!id || Number.isNaN(id)) {
    throw new Error("Invalid room ID.");
  }

  const startDate = parseDateOnly(checkIn);
  const endDate = parseDateOnly(checkOut);

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime())
  ) {
    throw new Error(
      "Invalid check-in or check-out date."
    );
  }

  if (endDate <= startDate) {
    throw new Error(
      "Check-out date must be after check-in date."
    );
  }


  /* ----------------------------------------------------------
     Get room
  ---------------------------------------------------------- */

  const room = await prisma.room.findUnique({
    where: {
      id,
    },

    select: {
      id: true,
      roomNumber: true,
      maintenanceStatus: true,
    },
  });

  if (!room) {
    throw new Error("Room not found.");
  }


  /* ----------------------------------------------------------
     MANUAL ROOM STATUS
     
     Receptionist can make a room unavailable for:
     - maintenance
     - cleaning
     - other reasons

     This is different from reservation dates.
  ---------------------------------------------------------- */

  if (room.maintenanceStatus !== "AVAILABLE") {
    return {
      available: false,
      reason: "ROOM_UNAVAILABLE",
    };
  }


  /* ----------------------------------------------------------
     CHECK DATE OVERLAP
     
     Example:

     Reservation:
     Aug 24 -> Aug 25

     Search:
     Aug 26 -> Aug 27

     NO OVERLAP
     => available

     Search:
     Aug 24 -> Aug 25

     OVERLAP
     => unavailable
  ---------------------------------------------------------- */

  const overlappingReservation = await prisma.reservation.findFirst({
    where: reservationOverlapWhere(id, startDate, endDate),
  });


  if (overlappingReservation) {

    return {
      available: false,
      reason: "DATE_ALREADY_BOOKED",
      reservationId:
        overlappingReservation.id,
    };
  }


  /* ----------------------------------------------------------
     NO OVERLAP
  ---------------------------------------------------------- */

  return {
    available: true,
    reason: "AVAILABLE",
  };
};



/* ============================================================
   UPDATE ROOM
============================================================ */

export const updateRoom = async (id, data) => {
  const roomId = Number(id);

  if (!roomId || Number.isNaN(roomId)) {
    throw new Error("Invalid room ID.");
  }

  const room = await prisma.room.findUnique({
    where: {
      id: roomId,
    },
  });

  if (!room) {
    throw new Error("Room not found.");
  }

  const updateData = {};

  if (data.roomNumber !== undefined) {
    updateData.roomNumber = data.roomNumber;
  }

  if (data.roomType !== undefined) {
    updateData.roomType = data.roomType;
  }

  if (data.price !== undefined) {
    updateData.price = Number(data.price);
  }

  if (data.capacity !== undefined) {
    updateData.capacity = Number(data.capacity);
  }

  // ONLY TWO ROOM STATES
  if (data.available !== undefined) {
    updateData.available = Boolean(data.available);
    updateData.maintenanceStatus = data.available
      ? "AVAILABLE"
      : "UNAVAILABLE";
  }

  return await prisma.room.update({
    where: {
      id: roomId,
    },
    data: updateData,
  });
};
/* ============================================================
   DELETE ROOM
============================================================ */

export const deleteRoom = async (id) => {

  const roomId = Number(id);

  if (!roomId || Number.isNaN(roomId)) {
    throw new Error("Invalid room ID.");
  }

  return await prisma.room.delete({
    where: {
      id: roomId,
    },
  });
};