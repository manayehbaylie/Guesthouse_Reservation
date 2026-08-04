import prisma from "../config/prisma.js";

export const createReservation = async (data, guestId) => {
  // Check if room exists
  const room = await prisma.room.findUnique({
    where: {
      id: data.roomId,
    },
  });

  if (!room) {
    throw new Error("Room not found");
  }

  // Check room availability
  if (!room.available) {
    throw new Error("Room is not available");
  }

  // Create reservation
  const reservation = await prisma.reservation.create({
    data: {
      checkIn: new Date(data.checkIn),
      checkOut: new Date(data.checkOut),
      status: "PENDING",
      guestId,
      roomId: data.roomId,
    },
  });

  // Update room availability
  await prisma.room.update({
    where: {
      id: data.roomId,
    },
    data: {
      available: false,
    },
  });

  return reservation;
};
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
        },
      },
    },
  });
};
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
        },
      },
    },
  });
};
export const updateReservationStatus = async (
  id,
  status
) => {
  return await prisma.reservation.update({
    where: {
      id: Number(id),
    },
    data: {
      status,
    },
  });
};
export const cancelReservation = async (id) => {
  // Find reservation
  const reservation = await prisma.reservation.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!reservation) {
    throw new Error("Reservation not found");
  }

  // Update reservation status
  const updatedReservation = await prisma.reservation.update({
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

  return updatedReservation;
};