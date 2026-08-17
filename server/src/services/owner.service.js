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

  const receptionist = await prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      password: hashedPassword,
      phone: cleanPhone,
      role: "RECEPTIONIST",
    },
  });

  // Assign receptionist to guesthouse
  await prisma.staffAssignment.create({
    data: {
      guesthouseId: guesthouse.id,
      staffId: receptionist.id,
    },
  });

  return receptionist;
};

/*
==================================================
4. GET RECEPTIONISTS
==================================================
*/
export const getReceptionists = async (
  ownerId
) => {
  const guesthouse = await prisma.guesthouse.findFirst({
    where: {
      ownerId,
    },
  });

  if (!guesthouse) {
    return [];
  }

  const assignments = await prisma.staffAssignment.findMany({
    where: {
      guesthouseId: guesthouse.id,
    },
    include: {
      staff: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      },
    },
  });

  return assignments.map(assignment => assignment.staff);
};

/*
==================================================
5. ASSIGN EXISTING RECEPTIONIST TO GUESTHOUSE
==================================================
*/
export const assignReceptionistToGuesthouse = async (
  ownerId,
  staffId
) => {
  const guesthouse = await prisma.guesthouse.findFirst({
    where: {
      ownerId,
    },
  });

  if (!guesthouse) {
    throw new Error("Guesthouse not found");
  }

  const staff = await prisma.user.findUnique({
    where: {
      id: staffId,
    },
  });

  if (!staff) {
    throw new Error("Staff not found");
  }

  if (staff.role !== "RECEPTIONIST") {
    throw new Error("User is not a receptionist");
  }

  // Check if already assigned
  const existingAssignment = await prisma.staffAssignment.findUnique({
    where: {
      guesthouseId_staffId: {
        guesthouseId: guesthouse.id,
        staffId: staffId,
      },
    },
  });

  if (existingAssignment) {
    throw new Error("Receptionist already assigned to this guesthouse");
  }

  return await prisma.staffAssignment.create({
    data: {
      guesthouseId: guesthouse.id,
      staffId: staffId,
    },
  });
};

/*
==================================================
6. REMOVE RECEPTIONIST FROM GUESTHOUSE
==================================================
*/
export const removeReceptionistFromGuesthouse = async (
  ownerId,
  staffId
) => {
  const guesthouse = await prisma.guesthouse.findFirst({
    where: {
      ownerId,
    },
  });

  if (!guesthouse) {
    throw new Error("Guesthouse not found");
  }

  const assignment = await prisma.staffAssignment.findUnique({
    where: {
      guesthouseId_staffId: {
        guesthouseId: guesthouse.id,
        staffId: Number(staffId),
      },
    },
  });

  if (!assignment) {
    throw new Error("Receptionist is not assigned to this guesthouse");
  }

  return await prisma.staffAssignment.delete({
    where: {
      guesthouseId_staffId: {
        guesthouseId: guesthouse.id,
        staffId: Number(staffId),
      },
    },
  });
};