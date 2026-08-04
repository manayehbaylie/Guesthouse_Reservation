import prisma from "../config/prisma.js";

// ================= Dashboard Statistics =================
export const getDashboardStats = async () => {
  const totalUsers = await prisma.user.count();

  const totalGuesthouses = await prisma.guesthouse.count();

  const totalRooms = await prisma.room.count();

  const totalReservations = await prisma.reservation.count();

  const totalPayments = await prisma.payment.count();

  const revenue = await prisma.payment.aggregate({
    where: {
      status: "PAID",
    },
    _sum: {
      amount: true,
    },
  });

  const availableRooms = await prisma.room.count({
    where: {
      available: true,
    },
  });

  const reservedRooms = await prisma.room.count({
    where: {
      available: false,
    },
  });

  return {
    totalUsers,
    totalGuesthouses,
    totalRooms,
    totalReservations,
    totalPayments,
    totalRevenue: revenue._sum.amount ?? 0,
    availableRooms,
    reservedRooms,
  };
};

// ================= Monthly Revenue =================
export const getMonthlyRevenue = async () => {
  const revenue = await prisma.$queryRaw`
    SELECT
      DATE_TRUNC('month', "createdAt") AS month,
      SUM(amount) AS total
    FROM "Payment"
    WHERE status = 'PAID'
    GROUP BY DATE_TRUNC('month', "createdAt")
    ORDER BY month ASC;
  `;

  return revenue;
};

// ================= Recent Reservations =================
export const getRecentReservations = async () => {
  return await prisma.reservation.findMany({
    take: 10,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      guest: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      room: {
        select: {
          id: true,
          roomNumber: true,
          roomType: true,
        },
      },
    },
  });
};

// ================= Recent Payments =================
export const getRecentPayments = async () => {
  return await prisma.payment.findMany({
    take: 10,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      reservation: {
        include: {
          guest: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          room: {
            select: {
              id: true,
              roomNumber: true,
              roomType: true,
            },
          },
        },
      },
    },
  });
};

// ================= Owner Dashboard =================
export const getOwnerDashboard = async (ownerId) => {
  const totalGuesthouses = await prisma.guesthouse.count({
    where: {
      ownerId,
    },
  });

  const totalRooms = await prisma.room.count({
    where: {
      guesthouse: {
        ownerId,
      },
    },
  });

  const availableRooms = await prisma.room.count({
    where: {
      available: true,
      guesthouse: {
        ownerId,
      },
    },
  });

  const reservedRooms = await prisma.room.count({
    where: {
      available: false,
      guesthouse: {
        ownerId,
      },
    },
  });

  return {
    totalGuesthouses,
    totalRooms,
    availableRooms,
    reservedRooms,
  };
};
export const getOwnerRevenue = async (ownerId) => {
  const revenue = await prisma.payment.aggregate({
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
    _sum: {
      amount: true,
    },
  });

  return {
    totalRevenue: revenue._sum.amount ?? 0,
  };
};