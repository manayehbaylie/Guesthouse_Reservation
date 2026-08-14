import prisma from "../config/prisma.js";
import { createNotification } from "./notification.service.js";
// ===================================
// Get All Reservations
// ===================================
export const getReceptionReservations =
  async () => {

    return await prisma.reservation.findMany({

      orderBy: {
        createdAt: "desc",
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

            guesthouse: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },

      },

    });

};
// ===================================
// Confirm Reservation
// ===================================
export const confirmReservation = async (id) => {

  const reservation =
    await prisma.reservation.findUnique({

      where: {
        id: Number(id),
      },

    });

  if (!reservation) {
    throw new Error("Reservation not found");
  }

  if (reservation.status !== "PENDING") {
    throw new Error(
      "Only pending reservations can be confirmed."
    );
  }

  const updatedReservation =
    await prisma.reservation.update({

      where: {
        id: Number(id),
      },

      data: {
        status: "CONFIRMED",
      },

    });

  await createNotification({

    title: "Reservation Confirmed",

    message:
      "Your reservation has been confirmed by the receptionist.",

    userId: reservation.guestId,

  });

  return updatedReservation;

};
// ===================================
// Check In Guest
// ===================================
export const checkInGuest = async (id) => {

  const reservation =
    await prisma.reservation.findUnique({

      where: {
        id: Number(id),
      },

    });

  if (!reservation) {
    throw new Error("Reservation not found");
  }

  if (
    reservation.status !== "CONFIRMED"
  ) {
    throw new Error(
      "Only confirmed reservations can be checked in."
    );
  }

  // Update Reservation and mark room as occupied
  const updatedReservation =
    await prisma.reservation.update({

      where: {
        id: Number(id),
      },

      data: {
        status: "CHECKED_IN",
      },

    });

  // Mark room as occupied
  await prisma.room.update({
    where: {
      id: reservation.roomId,
    },
    data: {
      available: false,
    },
  });

  await createNotification({

    title: "Guest Checked In",

    message:
      "Welcome! Your check-in has been completed.",

    userId: reservation.guestId,

  });

  return updatedReservation;

};
// ===================================
// Check Out Guest
// ===================================
export const checkOutGuest = async (id) => {

  const reservation =
    await prisma.reservation.findUnique({

      where: {
        id: Number(id),
      },

    });

  if (!reservation) {
    throw new Error("Reservation not found");
  }

  if (
    reservation.status !== "CHECKED_IN"
  ) {
    throw new Error(
      "Only checked-in reservations can be checked out."
    );
  }

  // Update Reservation
  const updatedReservation =
    await prisma.reservation.update({

      where: {
        id: Number(id),
      },

      data: {
        status: "CHECKED_OUT",
      },

    });

  // Make Room Available Again
  await prisma.room.update({

    where: {
      id: reservation.roomId,
    },

    data: {
      available: true,
    },

  });

  // Notification
  await createNotification({

    title: "Checked Out",

    message:
      "Thank you for staying with us.",

    userId: reservation.guestId,

  });

  return updatedReservation;

};// ===================================
// Cancel Reservation
// ===================================
export const cancelReservation = async (id) => {

  const reservation =
    await prisma.reservation.findUnique({

      where: {
        id: Number(id),
      },

    });

  if (!reservation) {
    throw new Error("Reservation not found");
  }

  // Only pending or confirmed reservations
  if (
    reservation.status !== "PENDING" &&
    reservation.status !== "CONFIRMED"
  ) {
    throw new Error(
      "Only pending or confirmed reservations can be cancelled."
    );
  }

  const updatedReservation =
    await prisma.reservation.update({

      where: {
        id: Number(id),
      },

      data: {
        status: "CANCELLED",
      },

    });

  // Make room available again
  await prisma.room.update({

    where: {
      id: reservation.roomId,
    },

    data: {
      available: true,
    },

  });

  // Send notification
  await createNotification({

    title: "Reservation Cancelled",

    message:
      "Your reservation has been cancelled by the receptionist.",

    userId: reservation.guestId,

  });

  return updatedReservation;

};
// ===================================
// Today's Arrivals
// ===================================
export const getTodayArrivals = async () => {

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);

  tomorrow.setDate(tomorrow.getDate() + 1);

  return await prisma.reservation.findMany({

    where: {

      checkIn: {

        gte: today,

        lt: tomorrow,

      },

      status: "CONFIRMED",

    },

    orderBy: {

      checkIn: "asc",

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

          roomNumber: true,

          roomType: true,

          guesthouse: {

            select: {

              id: true,

              name: true,

            },

          },

        },

      },

    },

  });

};
// ===================================
// Today's Departures
// ===================================
export const getTodayDepartures = async () => {

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);

  tomorrow.setDate(tomorrow.getDate() + 1);

  return await prisma.reservation.findMany({

    where: {

      checkOut: {

        gte: today,

        lt: tomorrow,

      },

      status: "CHECKED_IN",

    },

    orderBy: {

      checkOut: "asc",

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

          roomNumber: true,

          roomType: true,

          guesthouse: {

            select: {

              id: true,

              name: true,

            },

          },

        },

      },

    },

  });

};