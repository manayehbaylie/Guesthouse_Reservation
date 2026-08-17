import prisma from "../config/prisma.js";
import { createNotification } from "./notification.service.js";

// ========================================
// Create Reservation
// ========================================
export const createReservation = async (data, guestId) => {
  // ------------------------------------
  // 1. Validate dates
  // ------------------------------------
  const checkIn = new Date(data.checkIn);
  const checkOut = new Date(data.checkOut);

  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    throw new Error("Invalid check-in or check-out date");
  }

  if (checkOut <= checkIn) {
    throw new Error("Check-out date must be after check-in date");
  }

  // ------------------------------------
  // 2. Check room exists
  // ------------------------------------
  const room = await prisma.room.findUnique({
    where: {
      id: Number(data.roomId),
    },
  });

  if (!room) {
    throw new Error("Room not found");
  }

  // ------------------------------------
  // 3. Check reservation date overlap
  // ------------------------------------
  const existingReservation = await prisma.reservation.findFirst({
    where: {
      roomId: Number(data.roomId),

      status: {
        in: ["CONFIRMED", "CHECKED_IN"],
      },

      checkIn: {
        lt: checkOut,
      },

      checkOut: {
        gt: checkIn,
      },
    },
  });

  if (existingReservation) {
    throw new Error("Room is not available for the selected dates");
  }

  // ------------------------------------
  // 4. Create PENDING reservation
  // ------------------------------------
  const reservation = await prisma.reservation.create({
    data: {
      checkIn,
      checkOut,
      status: "PENDING",
      guestId,
      roomId: Number(data.roomId),
    },
  });

  // ------------------------------------
  // 5. Notification
  // ------------------------------------
  await createNotification({
    title: "Reservation Created",
    message:
      "Your reservation has been created. Please complete payment to confirm your reservation.",
    userId: guestId,
  });

  return reservation;
};

// ========================================
// Get All Reservations
// ========================================
export const getAllReservations = async () => {
  return await prisma.reservation.findMany({
    include: {
      guest: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },

      room: {
        select: {
          id: true,
          roomNumber: true,
          roomType: true,
          price: true,
          available: true,
        },
      },

      payment: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};

// ========================================
// Get Reservation By ID
// ========================================
export const getReservationById = async (id) => {
  return await prisma.reservation.findUnique({
    where: {
      id: Number(id),
    },

    include: {
      guest: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },

      room: {
        select: {
          id: true,
          roomNumber: true,
          roomType: true,
          price: true,
          available: true,
        },
      },

      payment: true,
    },
  });
};

// ========================================
// Update Reservation Status
// ========================================
export const updateReservationStatus = async (id, status) => {
  const reservation = await prisma.reservation.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!reservation) {
    throw new Error("Reservation not found");
  }

  // ======================================
  // PENDING
  // ======================================
  if (reservation.status === "PENDING") {
    throw new Error(
      "Pending reservation must be confirmed through successful payment."
    );
  }

  // ======================================
  // CONFIRMED → CHECKED_IN
  // ======================================
  if (reservation.status === "CONFIRMED") {
    if (status !== "CHECKED_IN") {
      throw new Error("Confirmed reservation can only be checked in.");
    }
  }

  // ======================================
  // CHECKED_IN → CHECKED_OUT
  // ======================================
  else if (reservation.status === "CHECKED_IN") {
    if (status !== "CHECKED_OUT") {
      throw new Error("Checked-in reservation can only be checked out.");
    }
  }

  // ======================================
  // CHECKED_OUT
  // ======================================
  else if (reservation.status === "CHECKED_OUT") {
    throw new Error("Checked-out reservation cannot be changed.");
  }

  // ======================================
  // CANCELLED
  // ======================================
  else if (reservation.status === "CANCELLED") {
    throw new Error("Cancelled reservation cannot be changed.");
  }

  // ======================================
  // Update status
  // ======================================
  const updatedReservation = await prisma.reservation.update({
    where: {
      id: Number(id),
    },

    data: {
      status,
    },
  });

  // ======================================
  // CHECKED_IN notification
  // ======================================
  if (status === "CHECKED_IN") {
    await createNotification({
      title: "Checked In",
      message: "Welcome! You have successfully checked in.",
      userId: reservation.guestId,
    });
  }

  // ======================================
  // CHECKED_OUT
  // ======================================
  if (status === "CHECKED_OUT") {
    await prisma.room.update({
      where: {
        id: reservation.roomId,
      },

      data: {
        available: true,
      },
    });

    await createNotification({
      title: "Checked Out",
      message: "Thank you for staying with us.",
      userId: reservation.guestId,
    });
  }

  return updatedReservation;
};