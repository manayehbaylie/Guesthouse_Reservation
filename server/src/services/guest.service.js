import prisma from "../config/prisma.js";
import { hashPassword } from "../utils/hash.js";

/*
==================================================
1. GET GUEST PROFILE
==================================================
*/
export const getMyProfile = async (guestId) => {
  return await prisma.user.findUnique({
    where: {
      id: guestId,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
};

/*
==================================================
2. UPDATE GUEST PROFILE
==================================================
*/
export const updateMyProfile = async (guestId, data = {}) => {
  const updateData = {};

  if (data.fullName !== undefined) {
    const fullName = String(data.fullName).trim();
    if (!fullName) {
      throw new Error("Full name is required.");
    }
    updateData.fullName = fullName;
  }

  if (data.email !== undefined) {
    const email = String(data.email).trim().toLowerCase();
    if (!email) {
      throw new Error("Email is required.");
    }
    updateData.email = email;
  }

  if (data.phone !== undefined) {
    const phone = String(data.phone).trim();
    if (!phone) {
      throw new Error("Phone number is required.");
    }
    updateData.phone = phone;
  }

  if (data.password !== undefined && String(data.password).trim()) {
    const password = String(data.password).trim();
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }
    updateData.password = await hashPassword(password);
  }

  if (!Object.keys(updateData).length) {
    return await prisma.user.findUnique({
      where: { id: guestId },
      select: { id: true, fullName: true, email: true, role: true },
    });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: guestId },
    select: { id: true, email: true, phone: true },
  });

  if (!currentUser) {
    throw new Error("User not found.");
  }

  if (updateData.email && updateData.email !== currentUser.email) {
    const emailOwner = await prisma.user.findUnique({
      where: { email: updateData.email },
      select: { id: true },
    });

    if (emailOwner && emailOwner.id !== guestId) {
      throw new Error("Email address is already in use.");
    }
  }

  if (updateData.phone && updateData.phone !== currentUser.phone) {
    const phoneOwner = await prisma.user.findFirst({
      where: {
        phone: updateData.phone,
        id: { not: guestId },
      },
      select: { id: true },
    });

    if (phoneOwner) {
      throw new Error("Phone number is already in use.");
    }
  }

  return await prisma.user.update({
    where: {
      id: guestId,
    },
    data: updateData,
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
    },
  });
};

/*
==================================================
3. GET GUEST RESERVATION HISTORY
==================================================
*/
export const getMyReservations = async (
  guestId
) => {
  return await prisma.reservation.findMany({
    where: {
      guestId,
    },
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
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};