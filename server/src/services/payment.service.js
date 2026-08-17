import prisma from "../config/prisma.js";
import { createNotification } from "./notification.service.js";

// ========================================
// Create Payment
// ========================================
export const createPayment = async (data) => {
  const reservation = await prisma.reservation.findUnique({
    where: {
      id: Number(data.reservationId),
    },
    include: {
      room: true,
    },
  });

  if (!reservation) {
    throw new Error("Reservation not found");
  }

  // Payment only for pending reservation
  if (reservation.status !== "PENDING") {
    throw new Error("Payment can only be made for a pending reservation.");
  }

  // Check existing payment
  const existingPayment = await prisma.payment.findUnique({
    where: {
      reservationId: Number(data.reservationId),
    },
  });

  if (existingPayment) {
    throw new Error("Payment already exists for this reservation.");
  }

  // Create payment
  const payment = await prisma.payment.create({
    data: {
      amount: data.amount,
      method: data.paymentMethod,
      status: "PENDING",
      reservationId: Number(data.reservationId),
    },
  });

  // Notify guest
  await createNotification({
    title: "Payment Created",
    message: "Your payment request has been created. Please complete the payment.",
    userId: reservation.guestId,
  });

  return payment;
};

// ========================================
// Get All Payments
// ========================================
export const getAllPayments = async () => {
  return await prisma.payment.findMany({
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
    orderBy: {
      createdAt: "desc",
    },
  });
};

// ========================================
// Get Payment By ID
// ========================================
export const getPaymentById = async (id) => {
  return await prisma.payment.findUnique({
    where: {
      id: Number(id),
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

// ========================================
// Update Payment Status
// ========================================
export const updatePaymentStatus = async (id, status) => {
  const payment = await prisma.payment.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      reservation: {
        include: {
          guest: true,
          room: true,
        },
      },
    },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  // Paid payment cannot be changed
  if (payment.status === "PAID") {
    throw new Error("Paid payment cannot be changed.");
  }

  // Update payment
  const updatedPayment = await prisma.payment.update({
    where: {
      id: Number(id),
    },
    data: {
      status,
    },
    include: {
      reservation: {
        include: {
          guest: true,
          room: true,
        },
      },
    },
  });

  // ======================================
  // PAYMENT PAID
  // ======================================
  if (status === "PAID") {
    // Confirm reservation
    await prisma.reservation.update({
      where: {
        id: payment.reservationId,
      },
      data: {
        status: "CONFIRMED",
      },
    });

    // Make room unavailable
    await prisma.room.update({
      where: {
        id: payment.reservation.roomId,
      },
      data: {
        available: false,
      },
    });

    // Notify guest
    await createNotification({
      title: "Payment Successful",
      message: "Your payment was successful and your reservation has been confirmed.",
      userId: payment.reservation.guestId,
    });
  }

  // ======================================
  // PAYMENT FAILED
  // ======================================
  if (status === "FAILED") {
    // Room becomes available
    await prisma.room.update({
      where: {
        id: payment.reservation.roomId,
      },
      data: {
        available: true,
      },
    });

    // Reservation stays pending
    await prisma.reservation.update({
      where: {
        id: payment.reservationId,
      },
      data: {
        status: "PENDING",
      },
    });

    // Notify guest
    await createNotification({
      title: "Payment Failed",
      message: "Your payment was not successful. The room is still available. Please try again.",
      userId: payment.reservation.guestId,
    });
  }

  return updatedPayment;
};

// ========================================
// Get Owner Payment Report
// ========================================
export const getOwnerPaymentReport = async (ownerId) => {
  return await prisma.payment.findMany({
    where: {
      status: "PAID",
      reservation: {
        room: {
          guesthouse: {
            ownerId: Number(ownerId),
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
    orderBy: {
      createdAt: "desc",
    },
  });
};