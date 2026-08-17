import prisma from "../config/prisma.js";

// ========================================
// Top Guesthouses (ADMIN)
// ========================================
export const getTopGuesthouses = async () => {
  const guesthouses = await prisma.guesthouse.findMany({
    where: {
      status: "APPROVED",
    },
    include: {
      rooms: {
        include: {
          reservations: true,
        },
      },
    },
  });

  return guesthouses
    .map((guesthouse) => {
      const reservationCount = guesthouse.rooms.reduce(
        (total, room) => total + room.reservations.length,
        0
      );

      return {
        id: guesthouse.id,
        name: guesthouse.name,
        city: guesthouse.city,
        reservationCount,
      };
    })
    .sort((a, b) => b.reservationCount - a.reservationCount);
};
// ========================================
// Top Rooms (OWNER)
// ========================================
export const getTopRooms = async (ownerId) => {
  const rooms = await prisma.room.findMany({
    where: {
      guesthouse: {
        ownerId,
      },
    },
    include: {
      reservations: true,
    },
  });

  return rooms
    .map((room) => ({
      id: room.id,
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      reservationCount: room.reservations.length,
    }))
    .sort((a, b) => b.reservationCount - a.reservationCount);
};
// ========================================
// Most Active Guests (OWNER)
// ========================================
export const getMostActiveGuests = async (
  ownerId
) => {

  const guests =
    await prisma.user.findMany({

      where: {
        role: "GUEST",
      },

      include: {

        reservations: {

          where: {

            room: {

              guesthouse: {

                ownerId,

              },

            },

          },

        },

      },

    });

  return guests

    .map((guest) => ({

      id: guest.id,

      fullName: guest.fullName,

      email: guest.email,

      reservationCount:
        guest.reservations.length,

    }))

    .filter(
      (guest) =>
        guest.reservationCount > 0
    )

    .sort(

      (a, b) =>
        b.reservationCount -
        a.reservationCount

    );

};
// ========================================
// Room Type Statistics (ADMIN)
// ========================================
export const getRoomTypeStatistics =
  async () => {

    return await prisma.room.groupBy({

      by: ["roomType"],

      _count: {

        roomType: true,

      },

      orderBy: {

        roomType: "asc",

      },

    });

};