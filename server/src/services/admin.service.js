import prisma from "../config/prisma.js";

/**
 * Approve a guesthouse
 */
export const approveGuesthouse = async (id) => {
  const guesthouseId = Number(id);

  if (!Number.isInteger(guesthouseId)) {
    throw new Error("Invalid guesthouse ID");
  }

  const guesthouse = await prisma.guesthouse.findUnique({
    where: {
      id: guesthouseId,
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
      id: guesthouseId,
    },
    data: {
      status: "APPROVED",
    },
  });
};

/*
==================================================
1.5 REJECT GUESTHOUSE
==================================================
*/
export const rejectGuesthouse = async (id, reason) => {
  const guesthouse = await prisma.guesthouse.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!guesthouse) {
    throw new Error("Guesthouse not found");
  }

  return await prisma.guesthouse.update({
    where: {
      id: Number(id),
    },
    data: {
      status: "REJECTED",
      rejectionReason: reason,
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
3. GET PLATFORM REPORT
==================================================
*/
export const getPlatformReport = async () => {
  const [
    totalUsers,
    totalGuesthouses,
    totalRooms,
    totalReservations,
    totalPayments,
    paidPayments,
  ] = await Promise.all([
    prisma.user.count(),

    prisma.guesthouse.count(),

    prisma.room.count(),

    prisma.reservation.count(),

    prisma.payment.count(),

    prisma.payment.aggregate({
      where: {
        status: "PAID",
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  return {
    totalUsers,
    totalGuesthouses,
    totalRooms,
    totalReservations,
    totalPayments,
    totalRevenue: paidPayments._sum.amount
      ? paidPayments._sum.amount.toString()
      : "0",
  };
};

/**
 * Get system activity
 *
 * Your current Prisma schema does not contain
 * an Activity model, so we cannot use:
 *
 * prisma.activity.findMany()
 *
 * Instead, return useful recent system data
 * from existing models.
 */
export const getSystemActivity = async () => {
  const [recentUsers, recentGuesthouses, recentReservations] =
    await Promise.all([
      prisma.user.findMany({
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
        take: 20,
      }),

      prisma.guesthouse.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          owner: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      }),

      prisma.reservation.findMany({
        select: {
          id: true,
          status: true,
          checkIn: true,
          checkOut: true,
          createdAt: true,
          guest: {
            select: {
              id: true,
              fullName: true,
            },
          },
          room: {
            select: {
              id: true,
              roomNumber: true,
              guesthouse: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      }),
    ]);

  return {
    recentUsers,
    recentGuesthouses,
    recentReservations,
  };
};