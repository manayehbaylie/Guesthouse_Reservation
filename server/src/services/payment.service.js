import prisma from "../config/prisma.js";
import { createNotification } from "./notification.service.js";

/*
|--------------------------------------------------------------------------
| Supported Ethiopian banks
|--------------------------------------------------------------------------
*/

const ETHIOPIAN_BANKS = [
  "CBE",
  "Awash Bank",
  "Bank of Abyssinia",
  "Zemen Bank",
  "Dashen Bank",
  "PRIDE Microfinance",
];

/*
|--------------------------------------------------------------------------
| Create Payment
|--------------------------------------------------------------------------
*/

export const createPayment = async (data) => {
  const reservationId = Number(
    data.reservationId
  );

  /*
   * Find reservation
   */
  const reservation =
    await prisma.reservation.findUnique({
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
    throw new Error(
      "Reservation not found."
    );
  }

  /*
   * Payment is only allowed for pending reservations.
   */
  if (reservation.status !== "PENDING") {
    throw new Error(
      "Payment can only be made for a pending reservation."
    );
  }

  /*
   * Prevent duplicate payments.
   */
  if (reservation.payment) {
    throw new Error(
      "Payment already exists for this reservation."
    );
  }

  /*
   * Make sure the room belongs to an approved guesthouse.
   */
  if (
    reservation.room?.guesthouse?.status !==
    "APPROVED"
  ) {
    throw new Error(
      "Payment cannot be made for an unapproved guesthouse."
    );
  }

  /*
   * Validate amount.
   */
  const amount = Number(data.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(
      "Payment amount must be greater than zero."
    );
  }

  /*
   * Normalize payment method.
   */
  const paymentMethod =
    String(data.paymentMethod).toUpperCase();

  if (
    !["TELEBIRR", "BANK_TRANSFER"].includes(
      paymentMethod
    )
  ) {
    throw new Error(
      "Invalid payment method."
    );
  }

  /*
   * Payment-specific validation.
   */

  let mobileNumber = null;
  let bankName = null;
  let accountNumber = null;

  /*
   * TELEBIRR
   */
  if (paymentMethod === "TELEBIRR") {
    if (!data.mobileNumber) {
      throw new Error(
        "Mobile number is required for Telebirr."
      );
    }

    mobileNumber = String(
      data.mobileNumber
    ).replace(/\s+/g, "");

    const validPhone =
      /^(09\d{8}|\+2519\d{8})$/.test(
        mobileNumber
      );

    if (!validPhone) {
      throw new Error(
        "Enter a valid Ethiopian mobile number."
      );
    }
  }

  /*
   * BANK TRANSFER
   */
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

  /*
   * Create payment.
   *
   * The payment starts as PENDING.
   * It becomes PAID only after payment verification.
   */
  const payment =
    await prisma.payment.create({
      data: {
        amount,

        paymentMethod,

        status: "PENDING",

        reservationId,

        mobileNumber,

        bankName,

        accountNumber,
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

  /*
   * Notify guest.
   */
  await createNotification({
    title: "Payment Request Created",

    message:
      "Your payment request has been created. Please complete and verify your payment.",

    userId: reservation.guestId,
  });

  return payment;
};

/* ---------------------------------------------------------------------
| Confirm & Pay (initiate)
| ---------------------------------------------------------------------
| Used by the frontend "Payment & Confirmation" flow. Given a pending
| reservation, it computes the amount from the room price and stay
| length, records a verified (PAID) payment, confirms the reservation,
| makes the room unavailable, and returns a payment reference number.
| ---------------------------------------------------------------------
*/

export const initiatePayment = async ({
  reservationId,
  method,
  phone,
  accountNumber,
  mobileNumber: mobileNumberAlt,
}) => {
  const resId = Number(reservationId);

  const reservation = await prisma.reservation.findUnique({
    where: { id: resId },

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

  // Normalize method. Telebirr stays Telebirr; everything else
  // (CBE_BIRR, bank transfer, card, ...) maps to BANK_TRANSFER.
  const rawMethod = String(method || "").toUpperCase();
  const paymentMethod =
    rawMethod === "TELEBIRR" ? "TELEBIRR" : "BANK_TRANSFER";

  let bankAccountNumber = null;

  if (paymentMethod === "TELEBIRR") {
    const mNumber = String(
      phone || mobileNumberAlt || ""
    ).replace(/\s+/g, "");

    if (!/^(09\d{8}|\+2519\d{8})$/.test(mNumber)) {
      throw new Error(
        "Enter a valid Ethiopian mobile number."
      );
    }

    bankAccountNumber = mNumber;
  } else {
    const acc = String(accountNumber || "").trim();

    if (!/^[0-9]{6,20}$/.test(acc)) {
      throw new Error(
        "Account number must contain 6 to 20 digits."
      );
    }

    bankAccountNumber = acc;
  }

  // Compute total = nightly room rate x number of nights.
  const startDate = new Date(reservation.checkIn);
  const endDate = new Date(reservation.checkOut);
  const nights = Math.max(
    1,
    Math.round(
      (endDate.getTime() - startDate.getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const amount =
    Number(reservation.room?.price ?? 0) * nights;

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(
      "Payment amount must be greater than zero."
    );
  }

  // Atomic: record PAID payment, confirm reservation, block the room.
  const payment = await prisma.$transaction(async (tx) => {
    const created = await tx.payment.create({
      data: {
        reservationId: resId,
        amount,
        method: paymentMethod,
        status: "PAID",
        accountNumber: bankAccountNumber,
      },
    });

    await tx.reservation.update({
      where: { id: resId },
      data: { status: "CONFIRMED" },
    });

    await tx.room.update({
      where: { id: reservation.roomId },
      data: { available: false },
    });

    return created;
  });

  await createNotification({
    title: "Payment Successful",
    message:
      "Your payment was verified successfully and your reservation has been confirmed.",
    userId: reservation.guestId,
  });

  const referenceNumber =
    "GH-" +
    String(payment.id).padStart(8, "0");

  return {
    ...payment,
    referenceNumber,
    method: paymentMethod,
    status: "PAID",
  };
};

/* ---------------------------------------------------------------------
| Payment History (for a specific guest)
| ---------------------------------------------------------------------
*/

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
/*
|--------------------------------------------------------------------------
| Get All Payments
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Get Payment By ID
|--------------------------------------------------------------------------
*/

export const getPaymentById = async (
  id
) => {
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

/*
|--------------------------------------------------------------------------
| Update Payment Status
|--------------------------------------------------------------------------
*/

export const updatePaymentStatus = async (
  id,
  status
) => {
  const payment =
    await prisma.payment.findUnique({
      where: {
        id: Number(id),
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
    throw new Error(
      "Payment not found."
    );
  }

  /*
   * Normalize status.
   */
  const normalizedStatus =
    String(status).toUpperCase();

  if (
    !["PENDING", "PAID", "FAILED"].includes(
      normalizedStatus
    )
  ) {
    throw new Error(
      "Invalid payment status."
    );
  }

  /*
   * A paid payment cannot be changed.
   */
  if (
    payment.status === "PAID" &&
    normalizedStatus !== "PAID"
  ) {
    throw new Error(
      "Paid payment cannot be changed."
    );
  }

  /*
   * If already paid, return it.
   */
  if (
    payment.status === "PAID" &&
    normalizedStatus === "PAID"
  ) {
    return payment;
  }

  /*
   * Update payment and reservation
   * together using a transaction.
   */
  const result =
    await prisma.$transaction(
      async (tx) => {
        const updatedPayment =
          await tx.payment.update({
            where: {
              id: Number(id),
            },

            data: {
              status: normalizedStatus,
            },
          });

        /*
         * PAYMENT PAID
         */
        if (
          normalizedStatus === "PAID"
        ) {
          /*
           * Confirm reservation.
           */
          await tx.reservation.update({
            where: {
              id: payment.reservationId,
            },

            data: {
              status: "CONFIRMED",
            },
          });

          /*
           * Make room unavailable.
           */
          await tx.room.update({
            where: {
              id: payment.reservation.roomId,
            },

            data: {
              available: false,
            },
          });
        }

        /*
         * PAYMENT FAILED
         */
        if (
          normalizedStatus === "FAILED"
        ) {
          /*
           * Keep reservation pending.
           */
          await tx.reservation.update({
            where: {
              id: payment.reservationId,
            },

            data: {
              status: "PENDING",
            },
          });

          /*
           * Make room available again.
           */
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

  /*
   * Notify guest after transaction.
   */

  if (
    normalizedStatus === "PAID"
  ) {
    await createNotification({
      title: "Payment Successful",

      message:
        "Your payment was verified successfully and your reservation has been confirmed.",

      userId:
        payment.reservation.guestId,
    });
  }

  if (
    normalizedStatus === "FAILED"
  ) {
    await createNotification({
      title: "Payment Failed",
      message:
        "Your payment was not successful. The reservation remains pending and you may try again.",

      userId:
        payment.reservation.guestId,
    });
  }

  return result;
};

/*
|--------------------------------------------------------------------------
| Get Owner Payment Report
|--------------------------------------------------------------------------
*/

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