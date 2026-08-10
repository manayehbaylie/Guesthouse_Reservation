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

  const existingUser =
    await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  const hashedPassword =
    await bcrypt.hash(data.password, 10);

  return await prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      password: hashedPassword,
      role: "RECEPTIONIST",
      guesthouseId: guesthouse.id,
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
  const guesthouse =
    await prisma.guesthouse.findFirst({
      where: {
        ownerId,
      },
    });

  if (!guesthouse) {
    throw new Error("Guesthouse not found");
  }

  return await prisma.user.findMany({
    where: {
      guesthouseId: guesthouse.id,
      role: "RECEPTIONIST",
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