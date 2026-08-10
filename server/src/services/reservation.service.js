import prisma from "../config/prisma.js";
import { createNotification } from "./notification.service.js";

// ========================================
// Create Reservation
// ========================================
export const createReservation = async (
  data,
  guestId
) => {

  // ------------------------------------
  // 1. Check room
  // ------------------------------------
  const room = await prisma.room.findUnique({
    where: {
      id: data.roomId,
    },
  });

  if (!room) {
    throw new Error("Room not found");
  }

  // ------------------------------------
  // 2. Check room availability
  // ------------------------------------
  if (!room.available) {
    throw new Error(
      "Room is not available"
    );
  }

  // ------------------------------------
  // 3. Create PENDING reservation
  // ------------------------------------
  const reservation =
    await prisma.reservation.create({
      data: {
        checkIn: new Date(data.checkIn),
        checkOut: new Date(data.checkOut),

        status: "PENDING",

        guestId,

        roomId: data.roomId,
      },
    });

  // ------------------------------------
  // 4. Notification
  // ------------------------------------
  await createNotification({
    title: "Reservation Created",

    message:
      "Your reservation has been created. Please complete payment to confirm your reservation.",

    userId: guestId,
  });

  // ------------------------------------
  // IMPORTANT
  // ------------------------------------
  // DO NOT update room.available here.
  //
  // Room becomes unavailable only
  // after payment status becomes PAID.

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
export const getReservationById = async (
  id
) => {

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
export const updateReservationStatus = async (
  id,
  status
) => {

  const reservation =
    await prisma.reservation.findUnique({
      where: {
        id: Number(id),
      },
    });

  if (!reservation) {
    throw new Error(
      "Reservation not found"
    );
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

      throw new Error(
        "Confirmed reservation can only be checked in."
      );
    }
  }

  // ======================================
  // CHECKED_IN → CHECKED_OUT
  // ======================================
  else if (
    reservation.status === "CHECKED_IN"
  ) {

    if (status !== "CHECKED_OUT") {

      throw new Error(
        "Checked-in reservation can only be checked out."
      );
    }
  }

  // ======================================
  // CHECKED_OUT
  // ======================================
  else if (
    reservation.status === "CHECKED_OUT"
  ) {

    throw new Error(
      "Checked-out reservation cannot be changed."
    );
  }

  // ======================================
  // CANCELLED
  // ======================================
  else if (
    reservation.status === "CANCELLED"
  ) {

    throw new Error(
      "Cancelled reservation cannot be changed."
    );
  }

  // ======================================
  // Update status
  // ======================================
  const updatedReservation =
    await prisma.reservation.update({

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

      message:
        "Welcome! You have successfully checked in.",

      userId: reservation.guestId,
    });
  }

  // ======================================
  // CHECKED_OUT
  // ======================================
  if (status === "CHECKED_OUT") {

    // Room becomes available again
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

      message:
        "Thank you for staying with us.",

      userId: reservation.guestId,
    });
  }

  return updatedReservation;
};