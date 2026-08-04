import prisma from "../config/prisma.js";

export const createGuesthouse = async (data, ownerId) => {
  return await prisma.guesthouse.create({
    data: {
      name: data.name,
      address: data.address,
      city: data.city,
      description: data.description,
      image: data.image,
      ownerId,
    },
  });
};

export const getAllGuesthouses = async () => {
  return await prisma.guesthouse.findMany({
    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });
};
export const updateGuesthouse = async (id, data) => {
  return await prisma.guesthouse.update({
    where: {
      id: Number(id),
    },
    data,
  });
};
export const getGuesthouseById = async (id) => {
  return await prisma.guesthouse.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });
};
export const deleteGuesthouse = async (id) => {
  return await prisma.guesthouse.delete({
    where: {
      id: Number(id),
    },
  });
};