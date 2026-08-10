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
export const getAllRooms = async () => {
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
  return await prisma.room.update({
    where: {
      id: Number(id),
    },
    data: {
      roomNumber: data.roomNumber,
      roomType: data.roomType,
      price: data.price,
      capacity: data.capacity,
      available: data.available,
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
