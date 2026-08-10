import prisma from "../config/prisma.js";

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
export const updateMyProfile = async (
  guestId,
  data
) => {
  return await prisma.user.update({
    where: {
      id: guestId,
    },
    data: {
      fullName: data.fullName,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
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
        },
      },
      guesthouse: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};