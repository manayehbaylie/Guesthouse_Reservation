import prisma from "../config/prisma.js";

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

  return await prisma.guesthouse.update({
    where: {
      id: Number(id),
    },
    data: {
      status: "APPROVED",
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

  return {
    totalUsers,
    totalGuesthouses,
    totalRooms,
    totalReservations,
    totalPayments,
    totalRevenue: paidPayments._sum.amount || 0,
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