import prisma from "../config/prisma.js";
import { createNotification } from "./notification.service.js";
import axios from "axios";

// ============================================================
// CONFIGURATION
// ============================================================

const CHAPA_SECRET_KEY =
  process.env.CHAPA_SECRET_KEY?.trim();

const BACKEND_URL =
  process.env.BACKEND_URL?.trim();

const FRONTEND_URL =
  process.env.FRONTEND_URL?.trim();

// ============================================================
// SUPPORTED PAYMENT METHODS
// ============================================================

const PAYMENT_METHODS = [
  "TELEBIRR",
  "BANK_TRANSFER",
  "CHAPA",
];

// ============================================================
// ETHIOPIAN BANKS
// ============================================================

const ETHIOPIAN_BANKS = [
  "CBE",
  "Awash Bank",
  "Bank of Abyssinia",
  "Zemen Bank",
  "Dashen Bank",
  "PRIDE Microfinance",
];

// ============================================================
// NORMALIZE ETHIOPIAN PHONE
// ============================================================

const normalizeEthiopianPhone = (value) => {
  let phone = String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/-/g, "");

  if (/^2519\d{8}$/.test(phone)) {
    return `+${phone}`;
  }

  if (/^09\d{8}$/.test(phone)) {
    return `+251${phone.slice(1)}`;
  }

  if (/^9\d{8}$/.test(phone)) {
    return `+251${phone}`;
  }

  return phone;
};

// ============================================================
// VALIDATE ETHIOPIAN PHONE
// ============================================================

const isValidEthiopianPhone = (value) => {
  return /^\+2519\d{8}$/.test(value);
};

// ============================================================
// VALIDATE PAYMENT METHOD
// ============================================================

const normalizePaymentMethod = (method) => {
  const normalized = String(method || "")
    .trim()
    .toUpperCase();

  if (!PAYMENT_METHODS.includes(normalized)) {
    throw new Error("Invalid payment method.");
  }

  return normalized;
};

// ============================================================
// CALCULATE RESERVATION AMOUNT
// ============================================================

const calculateReservationAmount = (reservation) => {
  if (!reservation?.room) {
    throw new Error("Room not found.");
  }

  const checkIn = new Date(reservation.checkIn);
  const checkOut = new Date(reservation.checkOut);

  if (
    Number.isNaN(checkIn.getTime()) ||
    Number.isNaN(checkOut.getTime())
  ) {
    throw new Error("Invalid reservation dates.");
  }

  if (checkOut <= checkIn) {
    throw new Error(
      "Check-out date must be after check-in date."
    );
  }

  const millisecondsPerDay =
    1000 * 60 * 60 * 24;

  const nights = Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) /
      millisecondsPerDay
  );

  const roomPrice = Number(
    reservation.room.price
  );

  if (
    !Number.isFinite(roomPrice) ||
    roomPrice <= 0
  ) {
    throw new Error(
      "Room price must be greater than zero."
    );
  }

  const amount = roomPrice * nights;

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new Error(
      "Payment amount must be greater than zero."
    );
  }

  return {
    nights,
    roomPrice,
    amount,
  };
};

// ============================================================
// LOAD RESERVATION
// ============================================================

const getReservationForPayment = async (
  reservationId
) => {
  const id = Number(reservationId);

  if (!id || Number.isNaN(id)) {
    throw new Error(
      "Invalid reservation ID."
    );
  }

  const reservation =
    await prisma.reservation.findUnique({
      where: {
        id,
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
                ownerId: true,
              },
            },
          },
        },
      },
    });

  if (!reservation) {
    throw new Error(
      "Reservation not found."
    );
  }

  return reservation;
};

// ============================================================
// VALIDATE RESERVATION FOR PAYMENT
// ============================================================

const validateReservationForPayment = async (
  reservation
) => {
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

  if (!reservation.room) {
    throw new Error("Room not found.");
  }

  if (
    reservation.room.guesthouse?.status !==
    "APPROVED"
  ) {
    throw new Error(
      "Payment cannot be made for an unapproved guesthouse."
    );
  }

  if (
    reservation.room.maintenanceStatus !==
    "AVAILABLE"
  ) {
    throw new Error(
      "This room is currently unavailable for maintenance."
    );
  }

  const overlappingReservation =
    await prisma.reservation.findFirst({
      where: {
        roomId: reservation.roomId,

        id: {
          not: reservation.id,
        },

        status: {
          in: [
            "CONFIRMED",
            "CHECKED_IN",
          ],
        },

        checkIn: {
          lt: reservation.checkOut,
        },

        checkOut: {
          gt: reservation.checkIn,
        },
      },
    });

  if (overlappingReservation) {
    throw new Error(
      "Room is no longer available for the selected dates."
    );
  }
};

// ============================================================
// CHAPA INITIALIZATION
// ============================================================

const initializeChapaPayment = async ({
  amount,
  email,
  fullName,
  phone,
  txRef,
  callbackUrl,
  returnUrl,
}) => {
  // ----------------------------------------------------------
  // ENVIRONMENT VALIDATION
  // ----------------------------------------------------------

  if (!CHAPA_SECRET_KEY) {
    throw new Error(
      "CHAPA_SECRET_KEY is not configured."
    );
  }

  if (!email) {
    throw new Error(
      "Guest email is required for Chapa payment."
    );
  }

  if (!BACKEND_URL) {
    throw new Error(
      "BACKEND_URL is not configured."
    );
  }

  if (!FRONTEND_URL) {
    throw new Error(
      "FRONTEND_URL is not configured."
    );
  }

  // ----------------------------------------------------------
  // SPLIT FULL NAME
  // ----------------------------------------------------------

  const nameParts = String(
    fullName || ""
  )
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const firstName =
    nameParts.shift() || "Guest";

  const lastName =
    nameParts.join(" ") || "Guest";

  // ----------------------------------------------------------
  // NORMALIZE PHONE
  // ----------------------------------------------------------

  let normalizedPhone;

  if (phone) {
    normalizedPhone =
      normalizeEthiopianPhone(phone);

    if (
      !isValidEthiopianPhone(
        normalizedPhone
      )
    ) {
      throw new Error(
        "Invalid Ethiopian phone number."
      );
    }
  }

  // ----------------------------------------------------------
  // CHAPA REQUEST
  // ----------------------------------------------------------

  const chapaPayload = {
    amount: String(amount),
    currency: "ETB",

    email,

    first_name: firstName,
    last_name: lastName,

    ...(normalizedPhone
      ? {
          phone_number:
            normalizedPhone,
        }
      : {}),

    tx_ref: txRef,

    callback_url: callbackUrl,
    return_url: returnUrl,

    customization: {
      // IMPORTANT:
      // Chapa title MUST NOT exceed 16 characters.
      title: "Guesthouse",
      description:
        "Reservation payment",
    },
  };

  console.log(
    "================================="
  );

  console.log(
    "CHAPA INITIALIZATION"
  );

  console.log(
    "Amount:",
    chapaPayload.amount
  );

  console.log(
    "Currency:",
    chapaPayload.currency
  );

  console.log(
    "Email:",
    chapaPayload.email
  );

  console.log(
    "First name:",
    chapaPayload.first_name
  );

  console.log(
    "Last name:",
    chapaPayload.last_name
  );

  console.log(
    "Phone:",
    chapaPayload.phone_number ||
      "Not provided"
  );

  console.log(
    "Transaction reference:",
    chapaPayload.tx_ref
  );

  console.log(
    "Callback URL:",
    chapaPayload.callback_url
  );

  console.log(
    "Return URL:",
    chapaPayload.return_url
  );

  console.log(
    "================================="
  );

  try {
    const response =
      await axios.post(
        "https://api.chapa.co/v1/transaction/initialize",
        chapaPayload,
        {
          headers: {
            Authorization:
              `Bearer ${CHAPA_SECRET_KEY}`,

            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          timeout: 30000,
        }
      );

    // --------------------------------------------------------
    // CHAPA RESPONSE
    // --------------------------------------------------------

    console.log(
      "CHAPA RESPONSE:",
      response.data
    );

    if (
      response.data?.status !==
      "success"
    ) {
      let message =
        response.data?.message;

      if (
        typeof message ===
        "object"
      ) {
        message =
          Object.entries(
            message
          )
            .map(
              ([key, value]) =>
                `${key}: ${
                  Array.isArray(value)
                    ? value.join(", ")
                    : value
                }`
            )
            .join("; ");
      }

      throw new Error(
        message ||
          "Unable to initialize Chapa payment."
      );
    }

    const checkoutUrl =
      response.data?.data
        ?.checkout_url;

    if (!checkoutUrl) {
      throw new Error(
        "Chapa did not return a checkout URL."
      );
    }

    return response.data;
  } catch (error) {
    // --------------------------------------------------------
    // CHAPA ERROR HANDLING
    // --------------------------------------------------------

    if (error.response) {
      console.error(
        "================================="
      );

      console.error(
        "CHAPA API ERROR"
      );

      console.error(
        "Status:",
        error.response.status
      );

      console.error(
        "Response:",
        JSON.stringify(
          error.response.data,
          null,
          2
        )
      );

      console.error(
        "================================="
      );

      let message =
        error.response.data
          ?.message;

      if (
        typeof message ===
        "object"
      ) {
        message =
          Object.entries(
            message
          )
            .map(
              ([key, value]) =>
                `${key}: ${
                  Array.isArray(value)
                    ? value.join(", ")
                    : value
                }`
            )
            .join("; ");
      }

      throw new Error(
        message ||
          `Chapa API returned status ${error.response.status}.`
      );
    }

    console.error(
      "Chapa request error:",
      error.message
    );

    throw new Error(
      `Chapa payment initialization failed: ${error.message}`
    );
  }
};

// ============================================================
// CREATE PAYMENT RECORD
// ============================================================

const createPaymentRecord = async ({
  reservationId,
  amount,
  method,
  status = "PENDING",
}) => {
  return await prisma.payment.create({
    data: {
      reservationId,
      amount,
      method,
      status,
    },
  });
};

// ============================================================
// NOTIFICATION HELPER
// ============================================================

const sendNotification = async ({
  title,
  message,
  userId,
  category,
}) => {
  if (!userId) {
    return;
  }

  try {
    await createNotification({
      title,
      message,
      userId,
      category,
    });
  } catch (error) {
    console.error(
      `Notification error [${title}]:`,
      error
    );
  }
};

// ============================================================
// PAYMENT SUCCESS NOTIFICATIONS
// ============================================================

const notifyPaymentSuccess = async ({
  reservation,
  payment,
}) => {
  const guestName =
    reservation.guest?.fullName ||
    "Guest";

  const guesthouseName =
    reservation.room?.guesthouse
      ?.name ||
    "Guesthouse";

  const roomNumber =
    reservation.room?.roomNumber
      ? `Room ${reservation.room.roomNumber}`
      : "Room";

  const amount =
    Number(payment.amount || 0);

  // GUEST
  await sendNotification({
    title: "Payment Successful",

    message:
      `Your payment of ${amount} ETB was successful. ` +
      `Reservation #${reservation.id} at ${guesthouseName} ` +
      `is now confirmed.`,

    userId:
      reservation.guestId,

    category: "payment",
  });

  // OWNER
  const ownerId =
    reservation.room?.guesthouse
      ?.ownerId;

  if (ownerId) {
    await sendNotification({
      title: "Payment Received",

      message:
        `Payment of ${amount} ETB received for ` +
        `Reservation #${reservation.id}. ` +
        `${guestName} - ${roomNumber} at ` +
        `${guesthouseName}.`,

      userId: ownerId,

      category: "payment",
    });
  }

  // RECEPTIONISTS
  const guesthouseId =
    reservation.room?.guesthouse?.id;

  if (!guesthouseId) {
    return;
  }

  try {
    const staffAssignments =
      await prisma.staffAssignment.findMany(
        {
          where: {
            guesthouseId,
          },

          select: {
            staffId: true,
          },
        }
      );

    for (
      const assignment of
        staffAssignments
    ) {
      if (!assignment.staffId) {
        continue;
      }

      await sendNotification({
        title:
          "Booking Confirmed & Paid",

        message:
          `Reservation #${reservation.id} for ` +
          `${guestName} (${roomNumber}) at ` +
          `${guesthouseName} is confirmed and paid ` +
          `(${amount} ETB).`,

        userId:
          assignment.staffId,

        category:
          "reservation",
      });
    }
  } catch (error) {
    console.error(
      "Receptionist notification error:",
      error
    );
  }
};

// ============================================================
// PAYMENT FAILED NOTIFICATION
// ============================================================

const notifyPaymentFailed = async (
  reservation
) => {
  await sendNotification({
    title: "Payment Failed",

    message:
      `Payment for Reservation #${reservation.id} ` +
      `was not successful. The reservation remains pending.`,

    userId:
      reservation.guestId,

    category: "payment",
  });
};

// ============================================================
// CREATE PAYMENT
// ============================================================

export const createPayment = async (
  data
) => {
  const reservation =
    await getReservationForPayment(
      data.reservationId
    );

  await validateReservationForPayment(
    reservation
  );

  const {
    amount,
    nights,
    roomPrice,
  } =
    calculateReservationAmount(
      reservation
    );

  const method =
    normalizePaymentMethod(
      data.paymentMethod
    );

  // TELEBIRR
  if (method === "TELEBIRR") {
    if (!data.mobileNumber) {
      throw new Error(
        "Mobile number is required for Telebirr."
      );
    }

    const mobileNumber =
      normalizeEthiopianPhone(
        data.mobileNumber
      );

    if (
      !isValidEthiopianPhone(
        mobileNumber
      )
    ) {
      throw new Error(
        "Enter a valid Ethiopian mobile number."
      );
    }
  }

  // BANK TRANSFER
  if (
    method === "BANK_TRANSFER"
  ) {
    const bankName =
      String(
        data.bankName || ""
      ).trim();

    if (
      !ETHIOPIAN_BANKS.includes(
        bankName
      )
    ) {
      throw new Error(
        "Please select a supported Ethiopian bank."
      );
    }

    const accountNumber =
      String(
        data.accountNumber || ""
      ).trim();

    if (
      !/^[0-9]{6,20}$/.test(
        accountNumber
      )
    ) {
      throw new Error(
        "Account number must contain 6 to 20 digits."
      );
    }
  }

  const payment =
    await createPaymentRecord({
      reservationId:
        reservation.id,

      amount,

      method,

      status: "PENDING",
    });

  await sendNotification({
    title:
      "Payment Request Created",

    message:
      `Payment request for Reservation #${reservation.id} ` +
      `has been created. Please complete your payment.`,

    userId:
      reservation.guestId,

    category: "payment",
  });

  return {
    ...payment,

    nights,
    roomPrice,

    referenceNumber:
      `GH-${String(payment.id).padStart(
        8,
        "0"
      )}`,
  };
};

// ============================================================
// INITIATE PAYMENT
// ============================================================

export const initiatePayment = async ({
  reservationId,
  method,
  phone,
  bankName,
  accountNumber,
  mobileNumber,
}) => {
  const reservation =
    await getReservationForPayment(
      reservationId
    );

  await validateReservationForPayment(
    reservation
  );

  const {
    amount,
    nights,
    roomPrice,
  } =
    calculateReservationAmount(
      reservation
    );

  const paymentMethod =
    normalizePaymentMethod(method);

  // ==========================================================
  // TELEBIRR
  // ==========================================================

  let normalizedPhone = null;

  if (
    paymentMethod === "TELEBIRR"
  ) {
    normalizedPhone =
      normalizeEthiopianPhone(
        phone || mobileNumber
      );

    if (
      !isValidEthiopianPhone(
        normalizedPhone
      )
    ) {
      throw new Error(
        "Enter a valid Ethiopian mobile number."
      );
    }
  }

  // ==========================================================
  // BANK TRANSFER
  // ==========================================================

  if (
    paymentMethod ===
    "BANK_TRANSFER"
  ) {
    const selectedBank =
      String(
        bankName || ""
      ).trim();

    if (
      !ETHIOPIAN_BANKS.includes(
        selectedBank
      )
    ) {
      throw new Error(
        "Please select a supported Ethiopian bank."
      );
    }

    const acc =
      String(
        accountNumber || ""
      ).trim();

    if (
      !/^[0-9]{6,20}$/.test(
        acc
      )
    ) {
      throw new Error(
        "Account number must contain 6 to 20 digits."
      );
    }
  }

  // ==========================================================
  // CHAPA
  // ==========================================================

  if (
    paymentMethod === "CHAPA"
  ) {
    if (!CHAPA_SECRET_KEY) {
      throw new Error(
        "CHAPA_SECRET_KEY is not configured."
      );
    }

    if (!BACKEND_URL) {
      throw new Error(
        "BACKEND_URL is not configured."
      );
    }

    if (!FRONTEND_URL) {
      throw new Error(
        "FRONTEND_URL is not configured."
      );
    }

    if (
      !reservation.guest?.email
    ) {
      throw new Error(
        "Guest email is required for Chapa payment."
      );
    }

    const txRef =
      `GH-${reservation.id}-${Date.now()}`;

    // --------------------------------------------------------
    // CREATE PENDING PAYMENT
    // --------------------------------------------------------

    const payment =
      await createPaymentRecord({
        reservationId:
          reservation.id,

        amount,

        method: "CHAPA",

        status: "PENDING",
      });

    try {
      // ------------------------------------------------------
      // INITIALIZE CHAPA
      // ------------------------------------------------------

      const chapaResult =
        await initializeChapaPayment({
          amount,

          email:
            reservation.guest.email,

          fullName:
            reservation.guest.fullName,

          phone:
            reservation.guest.phone
              ? normalizeEthiopianPhone(
                  reservation.guest.phone
                )
              : undefined,

          txRef,

          callbackUrl:
            `${BACKEND_URL}/payments/chapa/callback`,

          returnUrl:
            `${FRONTEND_URL}/payment/chapa/return`,
        });

      // ------------------------------------------------------
      // NOTIFICATION
      // ------------------------------------------------------

      await sendNotification({
        title:
          "Chapa Payment Started",

        message:
          `Chapa payment has been initialized for ` +
          `Reservation #${reservation.id}.`,

        userId:
          reservation.guestId,

        category: "payment",
      });

      // ------------------------------------------------------
      // RETURN CHECKOUT URL
      // ------------------------------------------------------

      return {
        status: "PENDING",

        method: "CHAPA",

        reservationId:
          reservation.id,

        paymentId:
          payment.id,

        txRef,

        amount,

        nights,

        roomPrice,

        checkoutUrl:
          chapaResult.data
            .checkout_url,

        referenceNumber:
          `GH-${String(
            payment.id
          ).padStart(8, "0")}`,
      };
    } catch (error) {
      // ------------------------------------------------------
      // CHAPA INITIALIZATION FAILED
      // ------------------------------------------------------

      console.error(
        "Chapa initialization failed:",
        error.message
      );

      try {
        await prisma.payment.update({
          where: {
            id: payment.id,
          },

          data: {
            status: "FAILED",
          },
        });
      } catch (dbError) {
        console.error(
          "Could not update failed payment:",
          dbError
        );
      }

      await notifyPaymentFailed(
        reservation
      );

      throw error;
    }
  }

  // ==========================================================
  // TELEBIRR / BANK TRANSFER
  // ==========================================================

  const payment =
    await createPaymentRecord({
      reservationId:
        reservation.id,

      amount,

      method:
        paymentMethod,

      status: "PENDING",
    });

  await sendNotification({
    title:
      "Payment Submitted",

    message:
      `Your ${paymentMethod} payment request for ` +
      `Reservation #${reservation.id} is pending verification.`,

    userId:
      reservation.guestId,

    category: "payment",
  });

  return {
    ...payment,

    status: "PENDING",

    nights,
    roomPrice,

    referenceNumber:
      `GH-${String(
        payment.id
      ).padStart(8, "0")}`,
  };
};

// ============================================================
// MARK PAYMENT AS PAID
// ============================================================

export const markPaymentAsPaid =
  async (paymentId) => {
    const id = Number(paymentId);

    if (
      !id ||
      Number.isNaN(id)
    ) {
      throw new Error(
        "Invalid payment ID."
      );
    }

    const result =
      await prisma.$transaction(
        async (tx) => {
          const payment =
            await tx.payment.findUnique(
              {
                where: {
                  id,
                },

                include: {
                  reservation: true,
                },
              }
            );

          if (!payment) {
            throw new Error(
              "Payment not found."
            );
          }

          if (
            payment.status ===
            "PAID"
          ) {
            return payment;
          }

          if (
            payment.status ===
            "FAILED"
          ) {
            throw new Error(
              "Failed payment cannot be marked as paid."
            );
          }

          const reservation =
            await tx.reservation.findUnique(
              {
                where: {
                  id:
                    payment.reservationId,
                },

                include: {
                  payment: true,

                  room: {
                    include: {
                      guesthouse: {
                        select: {
                          id: true,
                          name: true,
                          ownerId: true,
                          status: true,
                        },
                      },
                    },
                  },

                  guest: {
                    select: {
                      id: true,
                      fullName: true,
                      email: true,
                      phone: true,
                    },
                  },
                },
              }
            );

          if (!reservation) {
            throw new Error(
              "Reservation not found."
            );
          }

          if (
            reservation.status !==
            "PENDING"
          ) {
            throw new Error(
              "Only a pending reservation can be confirmed by payment."
            );
          }

          if (
            reservation.room
              ?.guesthouse
              ?.status !== "APPROVED"
          ) {
            throw new Error(
              "Guesthouse is not approved."
            );
          }

          if (
            reservation.room
              ?.maintenanceStatus !==
            "AVAILABLE"
          ) {
            throw new Error(
              "Room is not available."
            );
          }

          const overlapping =
            await tx.reservation.findFirst(
              {
                where: {
                  roomId:
                    reservation.roomId,

                  id: {
                    not:
                      reservation.id,
                  },

                  status: {
                    in: [
                      "CONFIRMED",
                      "CHECKED_IN",
                    ],
                  },

                  checkIn: {
                    lt:
                      reservation.checkOut,
                  },

                  checkOut: {
                    gt:
                      reservation.checkIn,
                  },
                },
              }
            );

          if (overlapping) {
            throw new Error(
              "Room is no longer available for the selected dates."
            );
          }

          const updatedPayment =
            await tx.payment.update({
              where: {
                id,
              },

              data: {
                status: "PAID",
              },
            });

          await tx.reservation.update({
            where: {
              id:
                reservation.id,
            },

            data: {
              status:
                "CONFIRMED",
            },
          });

          return {
            payment:
              updatedPayment,

            reservation,
          };
        }
      );

    await notifyPaymentSuccess({
      reservation:
        result.reservation,

      payment:
        result.payment,
    });

    return {
      ...result.payment,

      referenceNumber:
        `GH-${String(
          result.payment.id
        ).padStart(8, "0")}`,

      reservation:
        result.reservation,
    };
  };

// ============================================================
// UPDATE PAYMENT STATUS
// ============================================================

export const updatePaymentStatus =
  async (id, status) => {
    const paymentId = Number(id);

    if (
      !paymentId ||
      Number.isNaN(paymentId)
    ) {
      throw new Error(
        "Invalid payment ID."
      );
    }

    const normalizedStatus =
      String(status || "")
        .trim()
        .toUpperCase();

    if (
      ![
        "PENDING",
        "PAID",
        "FAILED",
      ].includes(
        normalizedStatus
      )
    ) {
      throw new Error(
        "Invalid payment status."
      );
    }

    const payment =
      await prisma.payment.findUnique({
        where: {
          id: paymentId,
        },

        include: {
          reservation: true,
        },
      });

    if (!payment) {
      throw new Error(
        "Payment not found."
      );
    }

    if (
      payment.status ===
      "PAID"
    ) {
      if (
        normalizedStatus ===
        "PAID"
      ) {
        return payment;
      }

      throw new Error(
        "Paid payment cannot be changed."
      );
    }

    if (
      payment.status ===
        "FAILED" &&
      normalizedStatus !==
        "FAILED"
    ) {
      throw new Error(
        "Failed payment cannot be changed."
      );
    }

    if (
      normalizedStatus ===
      "FAILED"
    ) {
      const updatedPayment =
        await prisma.payment.update({
          where: {
            id: paymentId,
          },

          data: {
            status: "FAILED",
          },
        });

      await notifyPaymentFailed(
        payment.reservation
      );

      return updatedPayment;
    }

    if (
      normalizedStatus ===
      "PENDING"
    ) {
      return await prisma.payment.update(
        {
          where: {
            id: paymentId,
          },

          data: {
            status: "PENDING",
          },
        }
      );
    }

    if (
      normalizedStatus ===
      "PAID"
    ) {
      return await markPaymentAsPaid(
        paymentId
      );
    }

    throw new Error(
      "Invalid payment status."
    );
  };

// ============================================================
// GET PAYMENT HISTORY FOR GUEST
// ============================================================

export const getPaymentHistory =
  async (guestId) => {
    const id = Number(guestId);

    if (
      !id ||
      Number.isNaN(id)
    ) {
      throw new Error(
        "Invalid guest ID."
      );
    }

    return await prisma.payment.findMany({
      where: {
        reservation: {
          guestId: id,
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

// ============================================================
// GET ALL PAYMENTS
// ============================================================

export const getAllPayments =
  async () => {
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

// ============================================================
// GET PAYMENT BY ID
// ============================================================

export const getPaymentById =
  async (id) => {
    const paymentId = Number(id);

    if (
      !paymentId ||
      Number.isNaN(paymentId)
    ) {
      throw new Error(
        "Invalid payment ID."
      );
    }

    const payment =
      await prisma.payment.findUnique({
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

    if (!payment) {
      throw new Error(
        "Payment not found."
      );
    }

    return payment;
  };

// ============================================================
// OWNER PAYMENT REPORT
// ============================================================

export const getOwnerPaymentReport =
  async (ownerId) => {
    const id = Number(ownerId);

    if (
      !id ||
      Number.isNaN(id)
    ) {
      throw new Error(
        "Invalid owner ID."
      );
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