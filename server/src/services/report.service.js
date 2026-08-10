import prisma from "../config/prisma.js";

// ======================================
// Owner Revenue Report
// ======================================
export const getRevenueReport = async (ownerId) => {
  return await prisma.payment.findMany({
    where: {
      status: "PAID",
      reservation: {
        room: {
          guesthouse: {
            ownerId,
          },
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    include: {
      reservation: {
        include: {
          guest: {
            select: {
              fullName: true,
              email: true,
            },
          },

          room: {
            select: {
              roomNumber: true,
              roomType: true,
            },
          },
        },
      },
    },
  });
};

// ======================================
// Admin Report
// ======================================
export const getAdminReport = async () => {
  const totalUsers = await prisma.user.count();

  const totalGuesthouses =
    await prisma.guesthouse.count();

  const totalRooms =
    await prisma.room.count();

  const totalReservations =
    await prisma.reservation.count();

  const totalPayments =
    await prisma.payment.count();

  const revenue =
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
    totalRevenue:
      revenue._sum.amount ?? 0,
  };
};