import prisma from "../config/prisma.js";

export const createRoom = async (data, guesthouseId) => {
  return await prisma.room.create({
    data: {
      roomNumber: data.roomNumber,
      roomType: data.roomType,
      price: data.price,
      capacity: data.capacity,
      available: data.available ?? true,
      guesthouseId: Number(guesthouseId),
    },
  });
};
export const getAllRooms = async (guesthouseId = null) => {
  if (guesthouseId) {
    return await prisma.room.findMany({
      where: {
        guesthouseId: Number(guesthouseId),
      },
      include: {
        guesthouse: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
    });
  }
  return await prisma.room.findMany({
    include: {
      guesthouse: {
        select: {
          id: true,
          name: true,
          city: true,
        },
      },
    },
  });
};
export const getRoomById = async (id) => {
  return await prisma.room.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      guesthouse: {
        select: {
          id: true,
          name: true,
          city: true,
        },
      },
    },
  });
};
export const updateRoom = async (id, data) => {

  const roomId = Number(id);

  if (!roomId || Number.isNaN(roomId)) {
    throw new Error("Invalid room ID.");
  }

  // ========================================================
  // 1. Get room
  // ========================================================

  const room = await prisma.room.findUnique({
    where: {
      id: roomId,
    },
  });

  if (!room) {
    throw new Error("Room not found.");
  }

  // ========================================================
  // 2. If receptionist wants to make room AVAILABLE
  // ========================================================

  if (data.available === true) {

    // Check active reservation
    const activeReservation =
      await prisma.reservation.findFirst({
        where: {
          roomId,

          status: {
            in: [
              "PENDING",
              "CONFIRMED",
              "CHECKED_IN",
            ],
          },
        },
      });

    // Room has active reservation
    if (activeReservation) {
      throw new Error(
        "This room cannot be made AVAILABLE because it has an active reservation."
      );
    }
  }

  // ========================================================
  // 3. Update room
  // ========================================================

  return await prisma.room.update({
    where: {
      id: roomId,
    },

    data: {
      ...(data.roomNumber !== undefined && {
        roomNumber: data.roomNumber,
      }),

      ...(data.roomType !== undefined && {
        roomType: data.roomType,
      }),

      ...(data.price !== undefined && {
        price: data.price,
      }),

      ...(data.capacity !== undefined && {
        capacity: data.capacity,
      }),

      ...(data.available !== undefined && {
        available: data.available,
      }),
    },
  });
};
export const deleteRoom = async (id) => {
  return await prisma.room.delete({
    where: {
      id: Number(id),
    },
  });
};
