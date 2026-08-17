import prisma from "../config/prisma.js";
import { createNotification } from "./notification.service.js";

// ========================================
// Create Payment
// ========================================
export const createPayment = async (data) => {
  const reservationId = Number(data.reservationId);
  const amount = Number(data.amount);

  // ----------------------------------------
  // Validate reservation ID
  // ----------------------------------------
  if (!reservationId || Number.isNaN(reservationId)) {
    throw new Error("Valid reservation ID is required.");
  }

  // ----------------------------------------
  // Validate amount
  // ----------------------------------------
  if (!amount || Number.isNaN(amount) || amount <= 0) {
    throw new Error("Valid payment amount is required.");
  }

  // ----------------------------------------
  // Get payment method
  // ----------------------------------------
  const paymentMethod = data.paymentMethod || data.method;

  if (!paymentMethod) {
    throw new Error("Payment method is required.");
  }

  // ----------------------------------------
  // Allowed payment methods
  // ----------------------------------------
  const allowedMethods = [
    "CASH",
    "CARD",
    "TELEBIRR",
    "BANK_TRANSFER",
  ];

  if (!allowedMethods.includes(paymentMethod)) {
    throw new Error(`Invalid payment method: ${paymentMethod}`);
  }

  // ----------------------------------------
  // Find reservation
  // ----------------------------------------
  const reservation = await prisma.reservation.findUnique({
    where: {
      id: reservationId,
    },
    include: {
      room: true,
      guest: true,
    },
  });

  if (!reservation) {
    throw new Error("Reservation not found.");
  }

  // ----------------------------------------
  // Payment only for PENDING reservation
  // ----------------------------------------
  if (reservation.status !== "PENDING") {
    throw new Error(
      "Payment can only be made for a pending reservation."
    );
  }

  // ----------------------------------------
  // Check existing payment
  // ----------------------------------------
  const existingPayment = await prisma.payment.findUnique({
    where: {
      reservationId,
    },
  });

  if (existingPayment) {
    throw new Error(
      "Payment already exists for this reservation."
    );
  }

  // ----------------------------------------
  // Create payment
  // ----------------------------------------
  const payment = await prisma.payment.create({
    data: {
      amount,
      method: paymentMethod,
      status: "PENDING",
      reservationId,
    },
  });

  // ----------------------------------------
  // Notification
  // ----------------------------------------
  await createNotification({
    title: "Payment Created",
    message:
      "Your payment request has been created. Please complete the payment.",
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

// ========================================
// Get Payment By ID
// ========================================
export const getPaymentById = async (id) => {
  const paymentId = Number(id);

  if (!paymentId || Number.isNaN(paymentId)) {
    throw new Error("Invalid payment ID.");
  }

  return await prisma.payment.findUnique({
    where: {
      id: paymentId,
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
  });
};

// ========================================
// Update Payment Status
// ========================================
export const updatePaymentStatus = async (id, status) => {
  const paymentId = Number(id);

  if (!paymentId || Number.isNaN(paymentId)) {
    throw new Error("Invalid payment ID.");
  }

  // ----------------------------------------
  // Validate status
  // ----------------------------------------
  const allowedStatuses = [
    "PENDING",
    "PAID",
    "FAILED",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new Error(`Invalid payment status: ${status}`);
  }

  // ----------------------------------------
  // Find payment
  // ----------------------------------------
  const payment = await prisma.payment.findUnique({
    where: {
      id: paymentId,
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
    throw new Error("Payment not found.");
  }

  // ----------------------------------------
  // Paid payment cannot be changed
  // ----------------------------------------
  if (payment.status === "PAID") {
    throw new Error("Paid payment cannot be changed.");
  }

  // ----------------------------------------
  // Update payment status
  // ----------------------------------------
  const updatedPayment = await prisma.payment.update({
    where: {
      id: paymentId,
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

  // ========================================
  // PAYMENT PAID
  // ========================================
  if (status === "PAID") {
    // --------------------------------------
    // Confirm reservation
    // --------------------------------------
    await prisma.reservation.update({
      where: {
        id: payment.reservationId,
      },

      data: {
        status: "CONFIRMED",
      },
    });

    // --------------------------------------
    // Make room unavailable
    // --------------------------------------
    await prisma.room.update({
      where: {
        id: payment.reservation.roomId,
      },

      data: {
        available: false,
      },
    });

    // --------------------------------------
    // Notification
    // --------------------------------------
    await createNotification({
      title: "Payment Successful",
      message:
        "Your payment was successful and your reservation has been confirmed.",
      userId: payment.reservation.guestId,
    });
  }

  // ========================================
  // PAYMENT FAILED
  // ========================================
  if (status === "FAILED") {
    // --------------------------------------
    // Make room available
    // --------------------------------------
    await prisma.room.update({
      where: {
        id: payment.reservation.roomId,
      },

      data: {
        available: true,
      },
    });

    // --------------------------------------
    // Keep reservation pending
    // --------------------------------------
    await prisma.reservation.update({
      where: {
        id: payment.reservationId,
      },

      data: {
        status: "PENDING",
      },
    });

    // --------------------------------------
    // Notification
    // --------------------------------------
    await createNotification({
      title: "Payment Failed",
      message:
        "Your payment was not successful. The room is still available.",
      userId: payment.reservation.guestId,
    });
  }

  return updatedPayment;
};

// ========================================
// Get Owner Payment Report
// ========================================
export const getOwnerPaymentReport = async (ownerId) => {
  const id = Number(ownerId);

  if (!id || Number.isNaN(id)) {
    throw new Error("Invalid owner ID.");
  }

  return await prisma.payment.findMany({
    where: {
      status: "PAID",

      reservation: {
        room: {
          guesthouse: {
            ownerId: id,
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