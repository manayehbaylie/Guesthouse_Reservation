import prisma from "../config/prisma.js";

export const createPayment = async (data) => {
  // Check reservation
  const reservation = await prisma.reservation.findUnique({
    where: {
      id: data.reservationId,
    },
  });

  if (!reservation) {
    throw new Error("Reservation not found");
  }

  // Check if payment already exists
  const existingPayment = await prisma.payment.findUnique({
    where: {
      reservationId: data.reservationId,
    },
  });

  if (existingPayment) {
    throw new Error("Payment already exists");
  }

  // Create payment
  const payment = await prisma.payment.create({
    data: {
      amount: data.amount,
      method: data.paymentMethod,
      status: "PENDING",
      reservationId: data.reservationId,
    },
  });

  return payment;
};
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
  });
};
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
export const updatePaymentStatus = async (
  id,
  status
) => {
  return await prisma.payment.update({
    where: {
      id: Number(id),
    },
    data: {
      status,
    },
  });
};