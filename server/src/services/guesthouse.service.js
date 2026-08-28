import prisma from "../config/prisma.js";
import {createNotification,} from "./notification.service.js";
export const createGuesthouse = async (data, ownerId) => {
  return await prisma.guesthouse.create({
    data: {
  name: data.name,
  address: data.address,
  city: data.city,
  description: data.description,
  image: data.image,
  ownerId,
  status: "PENDING",
},
  });
};
export const getAllGuesthouses = async () => {
 return await prisma.guesthouse.findMany({
  where: {
    status: "APPROVED",
  },
  include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          residentialAddress: true,
          idType: true,
          idNumber: true,
          createdAt: true,
        },
      },
      rooms: true,
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
  return await prisma.guesthouse.findFirst({
    where: {
      id: Number(id),
      status: "APPROVED",
    },
    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      },
      rooms: true,
    },
  });
};
export const getGuesthouseByOwnerId = async (ownerId) => {
  const guesthouse = await prisma.guesthouse.findFirst({
    where: {
      ownerId: Number(ownerId),
    },
    include: {
      rooms: true,
    },
  });

  if (!guesthouse) {
    throw new Error("Guesthouse not found");
  }

  return guesthouse;
};
export const deleteGuesthouse = async (id) => {
  return await prisma.guesthouse.delete({
    where: {
      id: Number(id),
    },
  });
};
// ========================================
// Get Pending Guesthouses
// ========================================
export const getPendingGuesthouses = async () => {
  return await prisma.guesthouse.findMany({
    where: {
      status: {
        in: ["DRAFT", "PENDING"],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          residentialAddress: true,
         // idType: true,//
          idNumber: true,
          createdAt: true,
        },
      },
      rooms: true,
    },
  });
};
// ========================================
// Approve Guesthouse
// ========================================
export const approveGuesthouse = async (id) => {
  const guesthouse = await prisma.guesthouse.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!guesthouse) {
    throw new Error("Guesthouse not found");
  }

  const updatedGuesthouse = await prisma.guesthouse.update({
    where: {
      id: Number(id),
    },
    data: {
      status: "APPROVED",
      rejectionReason: null,
    },
  });

  await createNotification({
    title: "Guesthouse Approved",
    message: "Congratulations! Your guesthouse has been approved by the administrator.",
    userId: guesthouse.ownerId,
  });

  return updatedGuesthouse;
};
// ========================================
// Reject Guesthouse
// ========================================
export const rejectGuesthouse = async (id, reason) => {
  const guesthouse = await prisma.guesthouse.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!guesthouse) {
    throw new Error("Guesthouse not found");
  }

  const updatedGuesthouse = await prisma.guesthouse.update({
    where: {
      id: Number(id),
    },
    data: {
      status: "REJECTED",
      rejectionReason: reason,
    },
  });

  await createNotification({
    title: "Guesthouse Rejected",
    message: `Reason: ${reason}`,
    userId: guesthouse.ownerId,
  });

  return updatedGuesthouse;
};