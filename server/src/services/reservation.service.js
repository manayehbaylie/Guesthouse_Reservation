import prisma from "../config/prisma.js";
import { createNotification } from "./notification.service.js";

// ============================================================
// CREATE RESERVATION
// ============================================================

export const createReservation = async (
  data,
  guestId
) => {
  // ----------------------------------------------------------
  // 1. Validate guest
  // ----------------------------------------------------------

  if (!guestId) {
    throw new Error(
      "Authentication required."
    );
  }

  // ----------------------------------------------------------
  // 2. Validate room ID
  // ----------------------------------------------------------

  const roomId =
    Number(data.roomId);

  if (
    !roomId ||
    Number.isNaN(roomId)
  ) {
    throw new Error(
      "Invalid room ID."
    );
  }

  // ----------------------------------------------------------
  // 3. Validate dates
  // ----------------------------------------------------------

  const checkIn =
    new Date(data.checkIn);

  const checkOut =
    new Date(data.checkOut);

  if (
    Number.isNaN(
      checkIn.getTime()
    ) ||
    Number.isNaN(
      checkOut.getTime()
    )
  ) {
    throw new Error(
      "Invalid check-in or check-out date."
    );
  }

  if (checkOut <= checkIn) {
    throw new Error(
      "Check-out date must be after check-in date."
    );
  }

  // ----------------------------------------------------------
  // 4. Check room exists
  // ----------------------------------------------------------

  const room =
    await prisma.room.findUnique({
      where: {
        id: roomId,
      },
    });

  if (!room) {
    throw new Error(
      "Room not found."
    );
  }

  // ----------------------------------------------------------
  // 5. Check room availability
  // ----------------------------------------------------------

  if (room.available === false) {
    throw new Error(
      "This room is currently unavailable."
    );
  }

  // ----------------------------------------------------------
  // 6. Check reservation overlap
  // ----------------------------------------------------------

  const existingReservation =
    await prisma.reservation.findFirst({
      where: {
        roomId,

        status: {
          in: [
            "PENDING",
            "CONFIRMED",
            "CHECKED_IN",
          ],
        },

        checkIn: {
          lt: checkOut,
        },

        checkOut: {
          gt: checkIn,
        },
      },
    });

  if (existingReservation) {
    throw new Error(
      "Room is not available for the selected dates."
    );
  }

  // ----------------------------------------------------------
  // 7. Create PENDING reservation
  // ----------------------------------------------------------

  const reservation =
    await prisma.reservation.create({
      data: {
        checkIn,
        checkOut,

        status: "PENDING",

        guestId,

        roomId,
      },

      include: {
        room: true,
      },
    });

  // ----------------------------------------------------------
  // 8. Notify guest
  // ----------------------------------------------------------

  try {
    await createNotification({
      title: "Reservation Created",

      message:
        "Your reservation has been created. Please complete payment to confirm your reservation.",

      userId: guestId,
    });
  } catch (notificationError) {
    console.error(
      "Notification error:",
      notificationError
    );
  }

  return reservation;
};


// ============================================================
// GET ALL RESERVATIONS
// ============================================================

export const getAllReservations =
  async () => {
    return await prisma.reservation.findMany({
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
            available: true,
            guesthouseId: true,
          },
        },

        payment: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  };


// ============================================================
// GET RESERVATION BY ID
// ============================================================

export const getReservationById =
  async (id) => {
    const reservationId =
      Number(id);

    if (
      !reservationId ||
      Number.isNaN(
        reservationId
      )
    ) {
      throw new Error(
        "Invalid reservation ID."
      );
    }

    return await prisma.reservation.findUnique({
      where: {
        id: reservationId,
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
            available: true,
            guesthouseId: true,
          },
        },

        payment: true,
      },
    });
  };


// ============================================================
// UPDATE RESERVATION STATUS
// ============================================================

export const updateReservationStatus =
  async (id, status) => {
    const reservationId =
      Number(id);

    if (
      !reservationId ||
      Number.isNaN(
        reservationId
      )
    ) {
      throw new Error(
        "Invalid reservation ID."
      );
    }

    if (!status) {
      throw new Error(
        "Reservation status is required."
      );
    }

    const normalizedStatus =
      String(status).toUpperCase();

    const allowedStatuses = [
      "CHECKED_IN",
      "CHECKED_OUT",
    ];

    if (
      !allowedStatuses.includes(
        normalizedStatus
      )
    ) {
      throw new Error(
        "Invalid reservation status."
      );
    }

    // --------------------------------------------------------
    // Find reservation
    // --------------------------------------------------------

    const reservation =
      await prisma.reservation.findUnique({
        where: {
          id: reservationId,
        },
      });

    if (!reservation) {
      throw new Error(
        "Reservation not found."
      );
    }

    // --------------------------------------------------------
    // PENDING
    // --------------------------------------------------------

    if (
      reservation.status ===
      "PENDING"
    ) {
      throw new Error(
        "Pending reservation must be confirmed through successful payment."
      );
    }

    // --------------------------------------------------------
    // CONFIRMED -> CHECKED_IN
    // --------------------------------------------------------

    if (
      reservation.status ===
      "CONFIRMED"
    ) {
      if (
        normalizedStatus !==
        "CHECKED_IN"
      ) {
        throw new Error(
          "Confirmed reservation can only be checked in."
        );
      }
    }

    // --------------------------------------------------------
    // CHECKED_IN -> CHECKED_OUT
    // --------------------------------------------------------

    else if (
      reservation.status ===
      "CHECKED_IN"
    ) {
      if (
        normalizedStatus !==
        "CHECKED_OUT"
      ) {
        throw new Error(
          "Checked-in reservation can only be checked out."
        );
      }
    }

    // --------------------------------------------------------
    // CHECKED_OUT
    // --------------------------------------------------------

    else if (
      reservation.status ===
      "CHECKED_OUT"
    ) {
      throw new Error(
        "Checked-out reservation cannot be changed."
      );
    }

    // --------------------------------------------------------
    // CANCELLED
    // --------------------------------------------------------

    else if (
      reservation.status ===
      "CANCELLED"
    ) {
      throw new Error(
        "Cancelled reservation cannot be changed."
      );
    }

    // --------------------------------------------------------
    // Update reservation
    // --------------------------------------------------------

    const updatedReservation =
      await prisma.reservation.update({
        where: {
          id: reservationId,
        },

        data: {
          status:
            normalizedStatus,
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
              available: true,
              guesthouseId: true,
            },
          },

          payment: true,
        },
      });

    // --------------------------------------------------------
    // CHECKED IN
    // --------------------------------------------------------

    if (
      normalizedStatus ===
      "CHECKED_IN"
    ) {
      await prisma.room.update({
        where: {
          id: reservation.roomId,
        },

        data: {
          available: false,
        },
      });

      try {
        await createNotification({
          title: "Checked In",

          message:
            "Welcome! You have successfully checked in.",

          userId:
            reservation.guestId,
        });
      } catch (error) {
        console.error(
          "Check-in notification error:",
          error
        );
      }
    }

    // --------------------------------------------------------
    // CHECKED OUT
    // --------------------------------------------------------

    if (
      normalizedStatus ===
      "CHECKED_OUT"
    ) {
      await prisma.room.update({
        where: {
          id: reservation.roomId,
        },

        data: {
          available: true,
        },
      });

      try {
        await createNotification({
          title: "Checked Out",

          message:
            "Thank you for staying with us.",

          userId:
            reservation.guestId,
        });
      } catch (error) {
        console.error(
          "Check-out notification error:",
          error
        );
      }
    }

    return updatedReservation;
  };