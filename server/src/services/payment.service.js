import prisma from "../config/prisma.js";
import { createNotification } from "./notification.service.js";

const ETHIOPIAN_BANKS = [
  "CBE",
  "Awash Bank",
  "Bank of Abyssinia",
  "Zemen Bank",
  "Dashen Bank",
  "PRIDE Microfinance",
];

const normalizeEthiopianPhone = (value) => {
  return String(value || "").replace(/\s+/g, "");
};

const isValidEthiopianPhone = (value) => {
  return /^(09\d{8}|\+2519\d{8})$/.test(value);
};

/* ==========================================================
   CREATE PAYMENT
========================================================== */

export const createPayment = async (data) => {
  const reservationId = Number(data.reservationId);

  const reservation = await prisma.reservation.findUnique({
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
        include: {
          guesthouse: true,
        },
      },
      payment: true,
    },
  });

  if (!reservation) {
    throw new Error("Reservation not found.");
  }

  if (reservation.status !== "PENDING") {
    throw new Error(
      "Payment can only be made for a pending reservation."
    );
  }

  if (reservation.payment) {
    throw new Error(
      "Payment already exists for this reservation."
    );
  }

  if (reservation.room?.guesthouse?.status !== "APPROVED") {
    throw new Error(
      "Payment cannot be made for an unapproved guesthouse."
    );
  }

  if (!reservation.room?.available) {
    throw new Error(
      "This room is no longer available."
    );
  }

  const amount = Number(data.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(
      "Payment amount must be greater than zero."
    );
  }

  const paymentMethod =
    String(data.paymentMethod || "").toUpperCase();

  if (
    !["TELEBIRR", "BANK_TRANSFER"].includes(paymentMethod)
  ) {
    throw new Error("Invalid payment method.");
  }

  let mobileNumber = null;
  let bankName = null;
  let accountNumber = null;

  if (paymentMethod === "TELEBIRR") {
    if (!data.mobileNumber) {
      throw new Error(
        "Mobile number is required for Telebirr."
      );
    }

    mobileNumber = normalizeEthiopianPhone(
      data.mobileNumber
    );

    if (!isValidEthiopianPhone(mobileNumber)) {
      throw new Error(
        "Enter a valid Ethiopian mobile number."
      );
    }
  }

  if (paymentMethod === "BANK_TRANSFER") {
    if (!data.bankName) {
      throw new Error(
        "Bank name is required for bank transfer."
      );
    }

    bankName = String(data.bankName).trim();

    if (!ETHIOPIAN_BANKS.includes(bankName)) {
      throw new Error(
        "Please select a supported Ethiopian bank."
      );
    }

    if (!data.accountNumber) {
      throw new Error(
        "Account number is required for bank transfer."
      );
    }

    accountNumber = String(
      data.accountNumber
    ).trim();

    if (!/^[0-9]{6,20}$/.test(accountNumber)) {
      throw new Error(
        "Account number must contain 6 to 20 digits."
      );
    }
  }

  const method =
    paymentMethod === "BANK_TRANSFER"
      ? "CBE_BIRR"
      : paymentMethod;

  const payment = await prisma.payment.create({
    data: {
      amount,
      method,
      status: "PENDING",
      reservationId,
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
            include: {
              guesthouse: {
                select: {
                  id: true,
                  name: true,
                  city: true,
                },
              },
            },
          },
        },
      },
    },
  });

  await createNotification({
    title: "Payment Request Created",
    message:
      "Your payment request has been created. Please complete and verify your payment.",
    userId: reservation.guestId,
  });

  return payment;
};

/* ==========================================================
   INITIATE PAYMENT / CONFIRM RESERVATION
========================================================== */

export const initiatePayment = async ({
  reservationId,
  method,
  phone,
  accountNumber,
  mobileNumber: mobileNumberAlt,
}) => {
  const resId = Number(reservationId);

  const reservation = await prisma.reservation.findUnique({
    where: {
      id: resId,
    },
    include: {
      payment: true,
      guest: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
      room: {
        include: {
          guesthouse: {
            select: {
              id: true,
              name: true,
              city: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!reservation) {
    throw new Error("Reservation not found.");
  }

  if (reservation.status !== "PENDING") {
    throw new Error(
      "Payment can only be made for a pending reservation."
    );
  }

  if (reservation.payment) {
    throw new Error(
      "Payment already exists for this reservation."
    );
  }

  if (reservation.room?.guesthouse?.status !== "APPROVED") {
    throw new Error(
      "Payment cannot be made for an unapproved guesthouse."
    );
  }

  if (!reservation.room) {
    throw new Error("Room not found.");
  }

  if (!reservation.room.available) {
    throw new Error(
      "This room is no longer available."
    );
  }

  const rawMethod = String(method || "").toUpperCase();

  const paymentMethod =
    rawMethod === "TELEBIRR"
      ? "TELEBIRR"
      : "CBE_BIRR";

  if (paymentMethod === "TELEBIRR") {
    const mobile = normalizeEthiopianPhone(
      phone || mobileNumberAlt
    );

    if (!isValidEthiopianPhone(mobile)) {
      throw new Error(
        "Enter a valid Ethiopian mobile number."
      );
    }
  } else {
    const acc = String(accountNumber || "").trim();

    if (!/^[0-9]{6,20}$/.test(acc)) {
      throw new Error(
        "Account number must contain 6 to 20 digits."
      );
    }
  }

  const startDate = new Date(reservation.checkIn);
  const endDate = new Date(reservation.checkOut);

  const nights = Math.max(
    1,
    Math.round(
      (endDate.getTime() - startDate.getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const roomPrice = Number(
    reservation.room.price ??
      reservation.room.pricePerNight ??
      0
  );

  const amount = roomPrice * nights;

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(
      "Payment amount must be greater than zero."
    );
  }

  /*
   * IMPORTANT:
   *
   * Payment + reservation confirmation + room occupation
   * happen inside ONE transaction.
   */
  const result = await prisma.$transaction(
    async (tx) => {

      // Re-check the room inside the transaction.
      const currentRoom = await tx.room.findUnique({
        where: {
          id: reservation.roomId,
        },
      });

      if (!currentRoom) {
        throw new Error("Room not found.");
      }

      if (!currentRoom.available) {
        throw new Error(
          "This room has already been booked."
        );
      }

      // Create PAID payment.
      const payment = await tx.payment.create({
        data: {
          reservationId: resId,
          amount,
          method: paymentMethod,
          status: "PAID",
        },
      });

      // Confirm reservation.
      const confirmedReservation =
        await tx.reservation.update({
          where: {
            id: resId,
          },
          data: {
            status: "CONFIRMED",
          },
        });

      // IMPORTANT:
      // Make the room occupied/unavailable.
      const occupiedRoom = await tx.room.update({
        where: {
          id: reservation.roomId,
        },
        data: {
          available: false,
        },
      });

      return {
        payment,
        confirmedReservation,
        occupiedRoom,
      };
    }
  );

  await createNotification({
    title: "Payment Successful",
    message:
      "Your payment was verified successfully and your reservation has been confirmed.",
    userId: reservation.guestId,
  });

  const referenceNumber =
    "GH-" +
    String(result.payment.id).padStart(8, "0");

  return {
    ...result.payment,
    referenceNumber,
    method: paymentMethod,
    status: "PAID",
    reservation: result.confirmedReservation,
    room: result.occupiedRoom,
  };
};

/* ==========================================================
   PAYMENT HISTORY
========================================================== */

export const getPaymentHistory = async (guestId) => {
  return await prisma.payment.findMany({
    where: {
      reservation: {
        guestId: Number(guestId),
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
            include: {
              guesthouse: {
                select: {
                  id: true,
                  name: true,
                  city: true,
                  status: true,
                },
              },
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

/* ==========================================================
   GET ALL PAYMENTS
========================================================== */

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
              phone: true,
            },
          },
          room: {
            include: {
              guesthouse: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  city: true,
                  status: true,
                },
              },
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

/* ==========================================================
   GET PAYMENT BY ID
========================================================== */

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
              phone: true,
            },
          },
          room: {
            include: {
              guesthouse: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  city: true,
                  status: true,
                },
              },
            },
          },
        },
      },
    },
  });
};

/* ==========================================================
   UPDATE PAYMENT STATUS
========================================================== */

export const updatePaymentStatus = async (
  id,
  status
) => {
  const paymentId = Number(id);

  const payment = await prisma.payment.findUnique({
    where: {
      id: paymentId,
    },
    include: {
      reservation: {
        include: {
          guest: true,
          room: {
            include: {
              guesthouse: true,
            },
          },
        },
      },
    },
  });

  if (!payment) {
    throw new Error("Payment not found.");
  }

  const normalizedStatus =
    String(status).toUpperCase();

  if (
    !["PENDING", "PAID", "FAILED"].includes(
      normalizedStatus
    )
  ) {
    throw new Error("Invalid payment status.");
  }

  if (
    payment.status === "PAID" &&
    normalizedStatus !== "PAID"
  ) {
    throw new Error(
      "Paid payment cannot be changed."
    );
  }

  if (
    payment.status === "PAID" &&
    normalizedStatus === "PAID"
  ) {
    return payment;
  }

  const result = await prisma.$transaction(
    async (tx) => {

      const updatedPayment =
        await tx.payment.update({
          where: {
            id: paymentId,
          },
          data: {
            status: normalizedStatus,
          },
        });

      if (normalizedStatus === "PAID") {

        await tx.reservation.update({
          where: {
            id: payment.reservationId,
          },
          data: {
            status: "CONFIRMED",
          },
        });

        await tx.room.update({
          where: {
            id: payment.reservation.roomId,
          },
          data: {
            available: false,
          },
        });
      }

      if (normalizedStatus === "FAILED") {

        await tx.reservation.update({
          where: {
            id: payment.reservationId,
          },
          data: {
            status: "PENDING",
          },
        });

        await tx.room.update({
          where: {
            id: payment.reservation.roomId,
          },
          data: {
            available: true,
          },
        });
      }

      return updatedPayment;
    }
  );

  if (normalizedStatus === "PAID") {
    await createNotification({
      title: "Payment Successful",
      message:
        "Your payment was verified successfully and your reservation has been confirmed.",
      userId: payment.reservation.guestId,
    });
  }

  if (normalizedStatus === "FAILED") {
    await createNotification({
      title: "Payment Failed",
      message:
        "Your payment was not successful. The reservation remains pending and you may try again.",
      userId: payment.reservation.guestId,
    });
  }

  return result;
};

/* ==========================================================
   OWNER PAYMENT REPORT
========================================================== */

export const getOwnerPaymentReport =
  async (ownerId) => {
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
                phone: true,
              },
            },
            room: {
              include: {
                guesthouse: {
                  select: {
                    id: true,
                    name: true,
                    city: true,
                  },
                },
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