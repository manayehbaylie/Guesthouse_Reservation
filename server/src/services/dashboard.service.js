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

  const commissionRate = Math.min(
    100,
    Math.max(0, Number(process.env.COMMISSION_RATE ?? 10))
  );
  const totalRevenue = revenue._sum.amount ?? 0;
  const commissionRevenue = (totalRevenue * commissionRate) / 100;

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
    totalRevenue,
    grossRevenue: totalRevenue,
    commissionRate,
    commissionRevenue,
    platformCommission: commissionRevenue,
    ownerPayouts: totalRevenue - commissionRevenue,
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

  const telebirr = await prisma.payment.aggregate({
    where: {
      status: "PAID",
      method: "TELEBIRR",
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

  const chapa = await prisma.payment.aggregate({
    where: {
      status: "PAID",
      method: "CHAPA",
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

  const cbe = await prisma.payment.aggregate({
    where: {
      status: "PAID",
      method: "BANK_TRANSFER",
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

  const card = await prisma.payment.aggregate({
    where: {
      status: "PAID",
      method: "CARD",
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
    breakdown: {
      telebirr: telebirr._sum.amount ?? 0,
      chapa: (chapa._sum.amount ?? 0) + (card._sum.amount ?? 0),
      cbe_birr: cbe._sum.amount ?? 0,
    },
  };
};
export const getOwnerMonthlyRevenue = async (ownerId) => {
  const revenue = await prisma.$queryRaw`
    SELECT
      DATE_TRUNC('month', p."createdAt") AS month,
      SUM(p.amount) AS total
    FROM "Payment" p
    INNER JOIN "Reservation" r
      ON p."reservationId" = r.id
    INNER JOIN "Room" rm
      ON r."roomId" = rm.id
    INNER JOIN "Guesthouse" g
      ON rm."guesthouseId" = g.id
    WHERE
      p.status = 'PAID'
      AND g."ownerId" = ${ownerId}
    GROUP BY DATE_TRUNC('month', p."createdAt")
    ORDER BY DATE_TRUNC('month', p."createdAt") ASC;
  `;

  return revenue;
};
export const getOwnerRecentReservations = async (
  ownerId
) => {
  return await prisma.reservation.findMany({
    take: 10,

    orderBy: {
      createdAt: "desc",
    },

    where: {
      room: {
        guesthouse: {
          ownerId,
        },
      },
    },

    include: {
      guest: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },

      room: {
        select: {
          id: true,
          roomNumber: true,
          roomType: true,
          price: true,
        },
      },
    },
  });
};
export const getOwnerRecentPayments = async (
  ownerId
) => {
  return await prisma.payment.findMany({
    take: 10,

    orderBy: {
      createdAt: "desc",
    },

    where: {
      reservation: {
        room: {
          guesthouse: {
            ownerId,
          },
        },
      },
    },

    include: {
      reservation: {
        include: {
          guest: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },

          room: {
            select: {
              id: true,
              roomNumber: true,
              roomType: true,
              price: true,
            },
          },
        },
      },
    },
  });
};
