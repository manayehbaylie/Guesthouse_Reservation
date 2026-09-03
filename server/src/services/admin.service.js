import prisma from "../config/prisma.js";
import { hashPassword } from "../utils/hash.js";
import { createNotification } from "./notification.service.js";

/*
==================================================
1. APPROVE GUESTHOUSE
==================================================
*/
export const approveGuesthouse = async (id) => {
  const guesthouse = await prisma.guesthouse.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!guesthouse) {
    throw new Error("Guesthouse not found");
  }

  if (guesthouse.status === "APPROVED") {
    throw new Error("Guesthouse is already approved");
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

  try {
    await createNotification({
      title: "Guesthouse Approved",
      message: `Congratulations! Your property "${guesthouse.name}" has been approved by the platform administrator and is now live for guest bookings.`,
      userId: guesthouse.ownerId,
      category: "guesthouse",
    });
  } catch (error) {
    console.error("Failed to notify owner of guesthouse approval:", error);
  }

  return updatedGuesthouse;
};

/*
==================================================
1.5 REJECT GUESTHOUSE
==================================================
*/
export const rejectGuesthouse = async (id, reason) => {
  const rejectionReason = String(reason || "").trim();

  if (!rejectionReason) {
    throw new Error("A rejection reason is required");
  }

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
      rejectionReason,
    },
  });

  try {
    await createNotification({
      title: "Guesthouse Review Notice",
      message: `Your property "${guesthouse.name}" was not approved. Reason: ${rejectionReason}`,
      userId: guesthouse.ownerId,
    });
  } catch (error) {
    console.error("Failed to notify owner of guesthouse rejection:", error);
  }

  return updatedGuesthouse;
};

/*
==================================================
1.6 GET ALL GUESTHOUSES (ADMIN)
==================================================
*/
export const getAllGuesthousesForAdmin = async () => {
  return await prisma.guesthouse.findMany({
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
          createdAt: true,
        },
      },
      rooms: true,
    },
  });
};

/*
==================================================
1.6 DELETE GUESTHOUSE
==================================================
*/
export const deleteGuesthouse = async (id) => {
  const guesthouse = await prisma.guesthouse.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!guesthouse) {
    throw new Error("Guesthouse not found");
  }

  return await prisma.guesthouse.delete({
    where: {
      id: Number(id),
    },
  });
};

/*
==================================================
1.7 DELETE USER
==================================================
*/
export const deleteUser = async (id) => {
  const user = await prisma.user.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return await prisma.user.delete({
    where: {
      id: Number(id),
    },
  });
};

/*
==================================================
2. GET ALL USERS
==================================================
*/
export const getAllUsers = async () => {
  return await prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

/*
==================================================
2.5 UPDATE USER ROLE
==================================================
*/
export const updateUserRole = async (id, newRole) => {
  const user = await prisma.user.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return await prisma.user.update({
    where: {
      id: Number(id),
    },
    data: {
      role: newRole,
    },
  });
};
/*
==================================================
2.6 UPDATE ADMIN PROFILE
==================================================
*/
export const updateAdminProfile = async (
  id,
  data
) => {
  if (!id) {
    throw new Error(
      "Admin user ID is required."
    );
  }

  const updateData = {};

  // -----------------------------------------------
  // FULL NAME
  // -----------------------------------------------

  if (data.fullName !== undefined) {
    const fullName =
      String(data.fullName).trim();

    if (!fullName) {
      throw new Error(
        "Full name is required."
      );
    }

    updateData.fullName = fullName;
  }

  // -----------------------------------------------
  // EMAIL
  // -----------------------------------------------

  if (data.email !== undefined) {
    const email =
      String(data.email)
        .trim()
        .toLowerCase();

    if (!email) {
      throw new Error(
        "Email is required."
      );
    }

    updateData.email = email;
  }

  // -----------------------------------------------
  // PHONE
  // -----------------------------------------------

  if (data.phone !== undefined) {
    updateData.phone =
      String(data.phone).trim();
  }

  // -----------------------------------------------
  // PASSWORD
  // -----------------------------------------------

  if (
    data.password !== undefined &&
    String(data.password).trim()
  ) {
    const password =
      String(data.password).trim();

    if (password.length < 6) {
      throw new Error(
        "Password must be at least 6 characters."
      );
    }

    updateData.password =
      await hashPassword(password);
  }

  // -----------------------------------------------
  // CHECK ADMIN EXISTS
  // -----------------------------------------------

  const existingUser =
    await prisma.user.findUnique({
      where: {
        id: Number(id),
      },
      select: {
        id: true,
        role: true,
        email: true,
      },
    });

  if (!existingUser) {
    throw new Error(
      "Administrator account not found."
    );
  }

  if (existingUser.role !== "ADMIN") {
    throw new Error(
      "Only an administrator can update this profile."
    );
  }

  // -----------------------------------------------
  // PREVENT DUPLICATE EMAIL
  // -----------------------------------------------

  if (
    updateData.email &&
    updateData.email !== existingUser.email
  ) {
    const emailOwner =
      await prisma.user.findUnique({
        where: {
          email: updateData.email,
        },
        select: {
          id: true,
        },
      });

    if (
      emailOwner &&
      emailOwner.id !== Number(id)
    ) {
      throw new Error(
        "Email address is already in use."
      );
    }
  }

  // -----------------------------------------------
  // UPDATE DATABASE
  // -----------------------------------------------

  return await prisma.user.update({
    where: {
      id: Number(id),
    },

    data: updateData,

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
/*
==================================================
3. GET PLATFORM REPORT
==================================================
*/
export const getPlatformReport = async () => {
  const totalUsers = await prisma.user.count();

  const totalGuesthouses =
    await prisma.guesthouse.count();

  const totalRooms =
    await prisma.room.count();

  const totalReservations =
    await prisma.reservation.count();

  const totalPayments =
    await prisma.payment.count();

  const paidPayments =
    await prisma.payment.aggregate({
      where: {
        status: "PAID",
      },
      _sum: {
        amount: true,
      },
    });

  const totalRevenue = paidPayments._sum.amount || 0;
  const commissionRate = Math.min(
    100,
    Math.max(0, Number(process.env.COMMISSION_RATE ?? 10))
  );
  const commissionRevenue = (totalRevenue * commissionRate) / 100;

  return {
    totalUsers,
    totalGuesthouses,
    totalRooms,
    totalReservations,
    totalPayments,
    totalRevenue,
    grossRevenue: totalRevenue,
    commissionRate,
    commissionRevenue,
    ownerPayouts: totalRevenue - commissionRevenue,
  };
};

/*
==================================================
4. GET SYSTEM ACTIVITY
==================================================

NOTE:
This requires an Activity/Audit model in Prisma.
If your current schema does not have one, do not
use this function until that model is added.
==================================================
*/
export const getSystemActivity = async () => {
  return await prisma.activity.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });
};

export const createSystemBackup = async () => {
  const [users, guesthouses, rooms, reservations, payments, assignments, reviews, notifications] = await Promise.all([
    prisma.user.findMany(),
    prisma.guesthouse.findMany(),
    prisma.room.findMany(),
    prisma.reservation.findMany(),
    prisma.payment.findMany(),
    prisma.staffAssignment.findMany(),
    prisma.review.findMany(),
    prisma.notification.findMany(),
  ]);

  return {
    format: "guesthouse-platform-backup",
    version: 1,
    generatedAt: new Date().toISOString(),
    data: { users, guesthouses, rooms, reservations, payments, assignments, reviews, notifications },
  };
};

export const restoreSystemBackup = async (backup) => {
  if (!backup || backup.format !== "guesthouse-platform-backup" || !backup.data) {
    throw new Error("Invalid backup file. Please upload a Guesthouse Platform backup JSON file.");
  }

  const { users = [], guesthouses = [], rooms = [], reservations = [], payments = [], assignments = [], reviews = [], notifications = [] } = backup.data;
  if (!Array.isArray(users) || !Array.isArray(guesthouses) || !Array.isArray(rooms)) {
    throw new Error("Backup file is missing required data.");
  }

  return prisma.$transaction(async (tx) => {
    await tx.notification.deleteMany();
    await tx.review.deleteMany();
    await tx.payment.deleteMany();
    await tx.reservation.deleteMany();
    await tx.staffAssignment.deleteMany();
    await tx.room.deleteMany();
    await tx.guesthouse.deleteMany();
    await tx.user.deleteMany();

    for (const user of users) await tx.user.create({ data: user });
    for (const guesthouse of guesthouses) await tx.guesthouse.create({ data: guesthouse });
    for (const room of rooms) await tx.room.create({ data: room });
    for (const reservation of reservations) await tx.reservation.create({ data: reservation });
    for (const payment of payments) await tx.payment.create({ data: payment });
    for (const assignment of assignments) await tx.staffAssignment.create({ data: assignment });
    for (const review of reviews) await tx.review.create({ data: review });
    for (const notification of notifications) await tx.notification.create({ data: notification });

    for (const table of ["User", "Guesthouse", "Room", "Reservation", "Payment", "StaffAssignment", "Review", "Notification"]) {
      await tx.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1), true)`);
    }

    return { users: users.length, guesthouses: guesthouses.length, rooms: rooms.length, reservations: reservations.length };
  });
};