import bcrypt from "bcrypt";
import prisma from "../config/prisma.js";

/*
==================================================
1. GET OWNER GUESTHOUSE
==================================================
*/
export const getMyGuesthouse = async (ownerId) => {
  return await prisma.guesthouse.findFirst({
    where: {
      ownerId,
    },
    include: {
      rooms: true,
    },
  });
};

/*
==================================================
2. UPDATE OWNER GUESTHOUSE
==================================================
*/
export const updateMyGuesthouse = async (
  ownerId,
  data
) => {
  const guesthouse =
    await prisma.guesthouse.findFirst({
      where: {
        ownerId,
      },
    });

  if (!guesthouse) {
    throw new Error("Guesthouse not found");
  }

  return await prisma.guesthouse.update({
    where: {
      id: guesthouse.id,
    },
    data: {
      name: data.name,
      description: data.description,
      location: data.location,
      address: data.address,
    },
  });
};

/*
==================================================
3. CREATE RECEPTIONIST
==================================================
*/
export const createReceptionist = async (
  ownerId,
  data
) => {
  const guesthouse =
    await prisma.guesthouse.findFirst({
      where: {
        ownerId,
      },
    });

  if (!guesthouse) {
    throw new Error("Guesthouse not found");
  }

  // Clean phone number
  const cleanPhone = data.phone.replace(/\s/g, '').replace(/-/g, '');

  const existingUser =
    await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  const existingPhone =
    await prisma.user.findUnique({
      where: {
        phone: cleanPhone,
      },
    });

  if (existingPhone) {
    throw new Error("Phone already exists");
  }

  // Use default password if not provided
  const password = data.password || "Password123";
  const hashedPassword =
    await bcrypt.hash(password, 10);

  return await prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      password: hashedPassword,
      phone: cleanPhone,
      role: "RECEPTIONIST",
    },
  });
};

/*
==================================================
4. GET RECEPTIONISTS
==================================================
*/
export const getReceptionists = async (
  ownerId
) => {
  // Since User model doesn't have guesthouseId, we'll return all receptionists
  // In a real system, you'd need a staff assignment table
  return await prisma.user.findMany({
    where: {
      role: "RECEPTIONIST",
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });
};