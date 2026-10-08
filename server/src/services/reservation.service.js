import prisma from "../config/prisma.js";
import { createNotification } from "./notification.service.js";
import { parseDateOnly } from "../utils/date.utils.js";
import { reservationOverlapWhere } from "../utils/reservation-overlap.utils.js";
import { buildReservationAccessWhere } from "../utils/reservation-access.utils.js";

// ============================================================
// CREATE RESERVATION
// ============================================================

export const createReservation = async (data, guestId) => {
  if (!guestId) {
    throw new Error("Authentication required.");
  }

  const roomId = Number(data.roomId);

  if (!roomId || Number.isNaN(roomId)) {
    throw new Error("Invalid room ID.");
  }

  const checkIn = parseDateOnly(data.checkIn);
  const checkOut = parseDateOnly(data.checkOut);

  if (
    Number.isNaN(checkIn.getTime()) ||
    Number.isNaN(checkOut.getTime())
  ) {
    throw new Error("Invalid check-in or check-out date.");
  }

  if (checkOut <= checkIn) {
    throw new Error(
      "Check-out date must be after check-in date."
    );
  }

  const reservation = await prisma.$transaction(async (tx) => {
    const room = await tx.room.findUnique({
      where: {
        id: roomId,
      },
      include: {
        guesthouse: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!room) {
      throw new Error("Room not found.");
    }

    if (room.guesthouse.status !== "APPROVED") {
      throw new Error(
        "Reservation cannot be made for an unapproved guesthouse."
      );
    }

    if (room.maintenanceStatus !== "AVAILABLE") {
      throw new Error(
        "This room is currently unavailable for maintenance."
      );
    }

    const overlappingReservation = await tx.reservation.findFirst({
      where: reservationOverlapWhere(roomId, checkIn, checkOut),
    });

    if (overlappingReservation) {
      throw new Error(
        "Room is not available for the selected dates."
      );
    }

    return await tx.reservation.create({
      data: {
        checkIn,
        checkOut,
        status: "PENDING",
        guestId: Number(guestId),
        roomId,
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

        room: {
          select: {
            id: true,
            roomNumber: true,
            roomType: true,
            price: true,
            capacity: true,
            available: true,
            maintenanceStatus: true,
            guesthouseId: true,
          },
        },

        payment: true,
      },
    });
  });

  return reservation;
};

// ============================================================
// GET ALL RESERVATIONS
// ============================================================

export const getAllReservations = async () => {
  return await prisma.reservation.findMany({
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
          capacity: true,
          available: true,
          maintenanceStatus: true,
          guesthouseId: true,
          guesthouse: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
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

export const getReservationsForUser = async (user) => {
  const where = buildReservationAccessWhere(user);
  if (!where) {
    throw new Error("Unsupported account role.");
  }

  return prisma.reservation.findMany({
    where,
    include: {
      room: {
        select: {
          id: true,
          roomNumber: true,
          roomType: true,
          price: true,
          guesthouse: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              subCity: true,
              woreda: true,
            },
          },
        },
      },
      payment: {
        select: {
          amount: true,
          method: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

// ============================================================
// GET RESERVATION BY ID
// ============================================================

export const getReservationById = async (id) => {
  const reservationId = Number(id);

  if (!reservationId || Number.isNaN(reservationId)) {
    throw new Error("Invalid reservation ID.");
  }

  return await prisma.reservation.findUnique({
    where: {
      id: reservationId,
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

      room: {
        select: {
          id: true,
          roomNumber: true,
          roomType: true,
          price: true,
          capacity: true,
          available: true,
          maintenanceStatus: true,
          guesthouseId: true,
          guesthouse: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
            },
          },
        },
      },

      payment: true,
    },
  });
};

export const deleteGuestReservation = async (id, guestId) => {
  const reservationId = Number(id);
  const ownerId = Number(guestId);

  if (!Number.isInteger(reservationId) || reservationId <= 0) {
    throw new Error("Invalid reservation ID.");
  }

  if (!Number.isInteger(ownerId) || ownerId <= 0) {
    throw new Error("Authentication required.");
  }

  const reservation = await prisma.reservation.findFirst({
    where: {
      id: reservationId,
      guestId: ownerId,
    },
    include: {
      room: {
        select: {
          roomType: true,
          guesthouse: { select: { name: true, city: true } },
        },
      },
    },
  });

  if (!reservation) {
    throw new Error("Reservation not found.");
  }

  const result = await prisma.reservation.deleteMany({
    where: { id: reservationId, guestId: ownerId },
  });
  if (result.count !== 1) {
    throw new Error("Reservation not found.");
  }

  await createNotification({
    title: "Reservation Cancelled",
    message: `Your reservation #${reservationId} at ${reservation.room.guesthouse.name}, ${reservation.room.guesthouse.city} has been cancelled.`,
    userId: ownerId,
    category: "reservation",
  });

  return {
    id: reservationId,
    deleted: true,
  };
};

// ============================================================
// UPDATE RESERVATION STATUS
// ============================================================

export const updateReservationStatus = async (
  id,
  status
) => {
  const reservationId = Number(id);

  if (!reservationId || Number.isNaN(reservationId)) {
    throw new Error("Invalid reservation ID.");
  }

  if (!status) {
    throw new Error(
      "Reservation status is required."
    );
  }

  const normalizedStatus =
    String(status).toUpperCase();

  const reservation =
    await prisma.reservation.findUnique({
      where: {
        id: reservationId,
      },
    });

  if (!reservation) {
    throw new Error("Reservation not found.");
  }

  if (reservation.status === "PENDING") {
    throw new Error(
      "Pending reservation must be confirmed through successful payment."
    );
  }

  if (reservation.status === "CONFIRMED") {
    if (normalizedStatus !== "CHECKED_IN") {
      throw new Error(
        "Confirmed reservation can only be checked in."
      );
    }
  } else if (
    reservation.status === "CHECKED_IN"
  ) {
    if (normalizedStatus !== "CHECKED_OUT") {
      throw new Error(
        "Checked-in reservation can only be checked out."
      );
    }
  } else if (
    reservation.status === "CHECKED_OUT"
  ) {
    throw new Error(
      "Checked-out reservation cannot be changed."
    );
  } else if (
    reservation.status === "CANCELLED"
  ) {
    throw new Error(
      "Cancelled reservation cannot be changed."
    );
  } else {
    throw new Error(
      "Invalid reservation status transition."
    );
  }

  const updatedReservation =
    await prisma.reservation.update({
      where: {
        id: reservationId,
      },

      data: {
        status: normalizedStatus,
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

        room: {
          select: {
            id: true,
            roomNumber: true,
            roomType: true,
            price: true,
            capacity: true,
            available: true,
            maintenanceStatus: true,
            guesthouseId: true,
          },
        },

        payment: true,
      },
    });

  if (normalizedStatus === "CHECKED_IN") {
    try {
      await createNotification({
        title: "Checked In",
        message:
          "Welcome! You have successfully checked in.",
        userId: reservation.guestId,
        category: "reservation",
      });
    } catch (error) {
      console.error(
        "Check-in notification error:",
        error
      );
    }
  }

  if (normalizedStatus === "CHECKED_OUT") {
    try {
      await createNotification({
        title: "Checked Out",
        message:
          "Thank you for staying with us.",
        userId: reservation.guestId,
        category: "reservation",
      });
    } catch (error) {
      console.error(
        "Check-out notification error:",
        error
      );
    }
  }

  return updatedReservation;
};

// ============================================================
// CHECKOUT RESERVATION
// ============================================================

export const checkoutReservation = async (
  reservationId
) => {
  const id = Number(reservationId);

  if (!id || Number.isNaN(id)) {
    throw new Error(
      "Invalid reservation ID."
    );
  }

  const result = await prisma.$transaction(
    async (tx) => {
      const reservation =
        await tx.reservation.findUnique({
          where: {
            id,
          },
        });

      if (!reservation) {
        throw new Error(
          "Reservation not found."
        );
      }

      if (
        reservation.status ===
        "CHECKED_OUT"
      ) {
        throw new Error(
          "Guest has already checked out."
        );
      }

      if (
        reservation.status ===
        "CANCELLED"
      ) {
        throw new Error(
          "Cancelled reservation cannot be checked out."
        );
      }

      if (
        reservation.status !==
        "CHECKED_IN"
      ) {
        throw new Error(
          "Only a checked-in reservation can be checked out."
        );
      }

      return await tx.reservation.update({
        where: {
          id,
        },

        data: {
          status: "CHECKED_OUT",
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

          room: {
            select: {
              id: true,
              roomNumber: true,
              roomType: true,
              price: true,
              capacity: true,
              available: true,
              maintenanceStatus: true,
              guesthouseId: true,
            },
          },

          payment: true,
        },
      });
    }
  );

  try {
    await createNotification({
      title: "Checked Out",
      message:
        "Thank you for staying with us.",
      userId: result.guest.id,
      category: "reservation",
    });
  } catch (error) {
    console.error(
      "Checkout notification error:",
      error
    );
  }

  return result;
};