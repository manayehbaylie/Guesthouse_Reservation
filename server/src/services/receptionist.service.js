import prisma from "../config/prisma.js";
import { createNotification } from "./notification.service.js";

// Helper function to get receptionist's assigned guesthouse
const getReceptionistGuesthouse = async (receptionistId) => {
  const assignment = await prisma.staffAssignment.findFirst({
    where: {
      staffId: receptionistId,
    },
    include: {
      guesthouse: true,
    },
  });

  if (!assignment) {
    throw new Error("Receptionist is not assigned to any guesthouse");
  }

  return assignment.guesthouse;
};

// ===================================
// Get All Reservations for Receptionist's Guesthouse
// ===================================
export const getReceptionReservations = async (receptionistId) => {
  const guesthouse = await getReceptionistGuesthouse(receptionistId);
  
  return await prisma.reservation.findMany({
    where: {
      room: {
        guesthouseId: guesthouse.id,
      },
    },
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
          capacity: true,
          available: true,
          maintenanceStatus: true,
          guesthouse: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      payment: true,
    },
  });
};

// ===================================
// Dashboard Stats
// ===================================
export const getDashboardStats = async (receptionistId) => {
  const guesthouse = await getReceptionistGuesthouse(receptionistId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Today's arrivals
  const arrivals = await prisma.reservation.count({
    where: {
      room: {
        guesthouseId: guesthouse.id,
      },
      checkIn: {
        gte: today,
        lt: tomorrow,
      },
      status: "CONFIRMED",
    },
  });

  // Today's departures
  const departures = await prisma.reservation.count({
    where: {
      room: {
        guesthouseId: guesthouse.id,
      },
      checkOut: {
        gte: today,
        lt: tomorrow,
      },
      status: "CHECKED_IN",
    },
  });

  // In-house guests
  const inHouse = await prisma.reservation.count({
    where: {
      room: {
        guesthouseId: guesthouse.id,
      },
      status: "CHECKED_IN",
    },
  });

  // Available rooms
  const availableRooms = await prisma.room.count({
    where: {
      guesthouseId: guesthouse.id,
      available: true,
      maintenanceStatus: "AVAILABLE",
    },
  });

  const totalRooms = await prisma.room.count({
    where: {
      guesthouseId: guesthouse.id,
    },
  });

  return {
    arrivals,
    departures,
    inHouse,
    availableRooms,
    totalRooms,
  };
};

// ===================================
// Get Receptionist's Rooms
// ===================================
export const getReceptionistRooms = async (receptionistId) => {
  const guesthouse = await getReceptionistGuesthouse(receptionistId);
  
  return await prisma.room.findMany({
    where: {
      guesthouseId: guesthouse.id,
    },
    orderBy: {
      roomNumber: "asc",
    },
  });
};

// ===================================
// In-House Guests
// ===================================
export const getInHouseGuests = async (receptionistId) => {
  const guesthouse = await getReceptionistGuesthouse(receptionistId);
  
  return await prisma.reservation.findMany({
    where: {
      room: {
        guesthouseId: guesthouse.id,
      },
      status: "CHECKED_IN",
    },
    orderBy: {
      checkIn: "desc",
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
        },
      },
    },
  });
};

// ===================================
// Search Reservations
// ===================================
export const searchReservations = async (receptionistId, searchTerm) => {
  const guesthouse = await getReceptionistGuesthouse(receptionistId);
  
  return await prisma.reservation.findMany({
    where: {
      room: {
        guesthouseId: guesthouse.id,
      },
      OR: [
        {
          guest: {
            fullName: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
        },
        {
          guest: {
            phone: {
              contains: searchTerm,
            },
          },
        },
        {
          room: {
            roomNumber: {
              contains: searchTerm,
            },
          },
        },
        {
          id: {
            equals: isNaN(parseInt(searchTerm)) ? undefined : parseInt(searchTerm),
          },
        },
      ],
    },
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
          capacity: true,
          available: true,
          maintenanceStatus: true,
          guesthouse: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      payment: true,
    },
  });
};
// ===================================
// Confirm Reservation
// ===================================
export const confirmReservation = async (receptionistId, id) => {
  const guesthouse = await getReceptionistGuesthouse(receptionistId);
  
  const reservation = await prisma.reservation.findFirst({
    where: {
      id: Number(id),
      room: {
        guesthouseId: guesthouse.id,
      },
    },
  });

  if (!reservation) {
    throw new Error("Reservation not found");
  }

  if (reservation.status !== "PENDING") {
    throw new Error("Only pending reservations can be confirmed.");
  }

  const updatedReservation = await prisma.reservation.update({
    where: {
      id: Number(id),
    },
    data: {
      status: "CONFIRMED",
    },
  });

  await createNotification({
    title: "Reservation Confirmed",
    message: "Your reservation has been confirmed by the receptionist.",
    userId: reservation.guestId,
  });

  return updatedReservation;
};

// ===================================
// Check In Guest
// ===================================
export const checkInGuest = async (receptionistId, id) => {
  const guesthouse = await getReceptionistGuesthouse(receptionistId);
  
  const reservation = await prisma.reservation.findFirst({
    where: {
      id: Number(id),
      room: {
        guesthouseId: guesthouse.id,
      },
    },
  });

  if (!reservation) {
    throw new Error("Reservation not found");
  }

  if (reservation.status !== "CONFIRMED") {
    throw new Error("Only confirmed reservations can be checked in.");
  }

  // Use transaction to update both reservation and room
  const result = await prisma.$transaction(async (tx) => {
    // Update Reservation
    const updatedReservation = await tx.reservation.update({
      where: {
        id: Number(id),
      },
      data: {
        status: "CHECKED_IN",
      },
    });

    // Mark room as occupied
    await tx.room.update({
      where: {
        id: reservation.roomId,
      },
      data: {
        available: false,
      },
    });

    return updatedReservation;
  });

  await createNotification({
    title: "Guest Checked In",
    message: "Welcome! Your check-in has been completed.",
    userId: reservation.guestId,
  });

  return result;
};

// ===================================
// Check Out Guest
// ===================================
export const checkOutGuest = async (receptionistId, id) => {
  const guesthouse = await getReceptionistGuesthouse(receptionistId);
  
  const reservation = await prisma.reservation.findFirst({
    where: {
      id: Number(id),
      room: {
        guesthouseId: guesthouse.id,
      },
    },
  });

  if (!reservation) {
    throw new Error("Reservation not found");
  }

  if (reservation.status !== "CHECKED_IN") {
    throw new Error("Only checked-in reservations can be checked out.");
  }

  // Use transaction to update both reservation and room
  const result = await prisma.$transaction(async (tx) => {
    // Update Reservation
    const updatedReservation = await tx.reservation.update({
      where: {
        id: Number(id),
      },
      data: {
        status: "CHECKED_OUT",
      },
    });

    // Make Room Available Again
    await tx.room.update({
      where: {
        id: reservation.roomId,
      },
      data: {
        available: true,
      },
    });

    return updatedReservation;
  });

  // Notification
  await createNotification({
    title: "Checked Out",
    message: "Thank you for staying with us.",
    userId: reservation.guestId,
  });

  return result;
};

// ===================================
// Cancel Reservation
// ===================================
export const cancelReservation = async (receptionistId, id) => {
  const guesthouse = await getReceptionistGuesthouse(receptionistId);
  
  const reservation = await prisma.reservation.findFirst({
    where: {
      id: Number(id),
      room: {
        guesthouseId: guesthouse.id,
      },
    },
  });

  if (!reservation) {
    throw new Error("Reservation not found");
  }

  // Only pending or confirmed reservations
  if (reservation.status !== "PENDING" && reservation.status !== "CONFIRMED") {
    throw new Error("Only pending or confirmed reservations can be cancelled.");
  }

  // Use transaction to update both reservation and room
  const result = await prisma.$transaction(async (tx) => {
    const updatedReservation = await tx.reservation.update({
      where: {
        id: Number(id),
      },
      data: {
        status: "CANCELLED",
      },
    });

    // Make room available again
    await tx.room.update({
      where: {
        id: reservation.roomId,
      },
      data: {
        available: true,
      },
    });

    return updatedReservation;
  });

  // Send notification
  await createNotification({
    title: "Reservation Cancelled",
    message: "Your reservation has been cancelled by the receptionist.",
    userId: reservation.guestId,
  });

  return result;
};

// ===================================
// Today's Arrivals
// ===================================
export const getTodayArrivals = async (receptionistId) => {
  const guesthouse = await getReceptionistGuesthouse(receptionistId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return await prisma.reservation.findMany({
    where: {
      room: {
        guesthouseId: guesthouse.id,
      },
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
      payment: true,
    },
  });
};

// ===================================
// Today's Departures
// ===================================
export const getTodayDepartures = async (receptionistId) => {
  const guesthouse = await getReceptionistGuesthouse(receptionistId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return await prisma.reservation.findMany({
    where: {
      room: {
        guesthouseId: guesthouse.id,
      },
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
          id: true,
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
      payment: true,
    },
  });
};

// ===================================
// Update Room Availability
// ===================================
export const updateRoomAvailability = async (receptionistId, roomId, maintenanceStatus) => {
  const guesthouse = await getReceptionistGuesthouse(receptionistId);
  
  const room = await prisma.room.findFirst({
    where: {
      id: Number(roomId),
      guesthouseId: guesthouse.id,
    },
  });

  if (!room) {
    throw new Error("Room not found");
  }

  const available = maintenanceStatus === "AVAILABLE";

  return await prisma.room.update({
    where: {
      id: Number(roomId),
    },
    data: {
      maintenanceStatus,
      available,
    },
  });
};