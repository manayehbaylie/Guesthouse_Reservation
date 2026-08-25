import prisma from "../config/prisma.js";
import { createNotification } from "./notification.service.js";
import axios from "axios";

// ============================================================
// CHAPA CONFIGURATION
// ============================================================

const CHAPA_SECRET_KEY =
  process.env.CHAPA_SECRET_KEY;

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
// NORMALIZE ETHIOPIAN PHONE NUMBER
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
// CALCULATE RESERVATION AMOUNT
// ============================================================

const calculateReservationAmount = (reservation) => {
  if (!reservation?.room) {
    throw new Error("Room not found.");
  }

  const checkIn = new Date(
    reservation.checkIn
  );

  const checkOut = new Date(
    reservation.checkOut
  );

  if (
    Number.isNaN(checkIn.getTime()) ||
    Number.isNaN(checkOut.getTime())
  ) {
    throw new Error(
      "Invalid reservation dates."
    );
  }

  if (checkOut <= checkIn) {
    throw new Error(
      "Check-out date must be after check-in date."
    );
  }

  const millisecondsPerDay =
    1000 * 60 * 60 * 24;

  const nights = Math.ceil(
    (checkOut.getTime() -
      checkIn.getTime()) /
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

  const amount =
    roomPrice * nights;

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
// INITIALIZE CHAPA PAYMENT
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
  if (!CHAPA_SECRET_KEY) {
    throw new Error(
      "CHAPA_SECRET_KEY is not configured."
    );
  }

  const nameParts =
    String(fullName || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  const firstName =
    nameParts.shift() || "Guest";

  const lastName =
    nameParts.join(" ") || "Guest";

  const response = await axios.post(
    "https://api.chapa.co/v1/transaction/initialize",
    {
      amount: String(amount),
      currency: "ETB",

      email,

      first_name:
        firstName,

      last_name:
        lastName,

      phone_number:
        phone || undefined,

      tx_ref:
        txRef,

      callback_url:
        callbackUrl,

      return_url:
        returnUrl,

      customization: {
        title:
          "Guesthouse Reservation",

        description:
          "Payment for guesthouse reservation",
      },
    },
    {
      headers: {
        Authorization:
          `Bearer ${CHAPA_SECRET_KEY}`,

        "Content-Type":
          "application/json",
      },
    }
  );

  if (
    response.data?.status !==
    "success"
  ) {
    throw new Error(
      response.data?.message ||
      "Unable to initialize Chapa payment."
    );
  }

  if (
    !response.data?.data?.checkout_url
  ) {
    throw new Error(
      "Chapa did not return a checkout URL."
    );
  }

  return response.data;
};

// ============================================================
// CREATE PAYMENT
// ============================================================

export const createPayment = async (
  data
) => {
  const reservationId =
    Number(data.reservationId);

  if (
    !reservationId ||
    Number.isNaN(reservationId)
  ) {
    throw new Error(
      "Invalid reservation ID."
    );
  }

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

  if (
    reservation.status !==
    "PENDING"
  ) {
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
    throw new Error(
      "Room not found."
    );
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

  const {
    amount,
  } =
    calculateReservationAmount(
      reservation
    );

  const paymentMethod =
    String(
      data.paymentMethod || ""
    ).toUpperCase();

  if (
    ![
      "TELEBIRR",
      "BANK_TRANSFER",
      "CHAPA",
    ].includes(paymentMethod)
  ) {
    throw new Error(
      "Invalid payment method."
    );
  }

  let mobileNumber = null;
  let bankName = null;
  let accountNumber = null;

  // ==========================================================
  // TELEBIRR VALIDATION
  // ==========================================================

  if (
    paymentMethod ===
    "TELEBIRR"
  ) {
    if (!data.mobileNumber) {
      throw new Error(
        "Mobile number is required for Telebirr."
      );
    }

    mobileNumber =
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

  // ==========================================================
  // BANK TRANSFER VALIDATION
  // ==========================================================

  if (
    paymentMethod ===
    "BANK_TRANSFER"
  ) {
    if (!data.bankName) {
      throw new Error(
        "Bank name is required for bank transfer."
      );
    }

    bankName =
      String(
        data.bankName
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

    if (!data.accountNumber) {
      throw new Error(
        "Account number is required for bank transfer."
      );
    }

    accountNumber =
      String(
        data.accountNumber
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

  const method =
    paymentMethod ===
    "BANK_TRANSFER"
      ? "CBE_BIRR"
      : paymentMethod;

  const payment =
    await prisma.payment.create({
      data: {
        amount,

        method,

        status:
          "PENDING",

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

  try {
    await createNotification({
      title:
        "Payment Request Created",

      message:
        "Your payment request has been created. Please complete your payment.",

      userId:
        reservation.guestId,
    });
  } catch (error) {
    console.error(
      "Payment notification error:",
      error
    );
  }

  return payment;
};

// ============================================================
// INITIATE PAYMENT
// ============================================================

export const initiatePayment =
  async ({
    reservationId,
    method,
    phone,
    bankName,
    accountNumber,
    mobileNumber,
  }) => {
    const resId =
      Number(reservationId);

    if (
      !resId ||
      Number.isNaN(resId)
    ) {
      throw new Error(
        "Invalid reservation ID."
      );
    }

    const reservation =
      await prisma.reservation.findUnique({
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
      throw new Error(
        "Reservation not found."
      );
    }

    // ==========================================================
    // RESERVATION MUST BE PENDING
    // ==========================================================

    if (
      reservation.status !==
      "PENDING"
    ) {
      throw new Error(
        "Payment can only be made for a pending reservation."
      );
    }

    // ==========================================================
    // ONLY ONE PAYMENT PER RESERVATION
    // ==========================================================

    if (reservation.payment) {
      throw new Error(
        "Payment already exists for this reservation."
      );
    }

    // ==========================================================
    // ROOM VALIDATION
    // ==========================================================

    if (!reservation.room) {
      throw new Error(
        "Room not found."
      );
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

    // ==========================================================
    // DATE OVERLAP RECHECK
    // ==========================================================

    const overlappingReservation =
      await prisma.reservation.findFirst({
        where: {
          roomId:
            reservation.roomId,

          id: {
            not: resId,
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
      });

    if (
      overlappingReservation
    ) {
      throw new Error(
        "Room is no longer available for the selected dates."
      );
    }

    // ==========================================================
    // PAYMENT METHOD
    // ==========================================================

    const rawMethod =
      String(
        method || ""
      ).toUpperCase();

    if (
      ![
        "TELEBIRR",
        "BANK_TRANSFER",
        "CHAPA",
      ].includes(
        rawMethod
      )
    ) {
      throw new Error(
        "Invalid payment method."
      );
    }

    const paymentMethod =
      rawMethod ===
      "BANK_TRANSFER"
        ? "CBE_BIRR"
        : rawMethod;

    // ==========================================================
    // TELEBIRR VALIDATION
    // ==========================================================

    if (
      paymentMethod ===
      "TELEBIRR"
    ) {
      const mobile =
        normalizeEthiopianPhone(
          phone ||
            mobileNumber
        );

      if (
        !isValidEthiopianPhone(
          mobile
        )
      ) {
        throw new Error(
          "Enter a valid Ethiopian mobile number."
        );
      }
    }

    // ==========================================================
    // BANK VALIDATION
    // ==========================================================

    if (
      paymentMethod ===
      "CBE_BIRR"
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
    // CALCULATE PAYMENT AMOUNT
    // ==========================================================

    const {
      amount,
      nights,
      roomPrice,
    } =
      calculateReservationAmount(
        reservation
      );

    // ==========================================================
    // CHAPA
    // ==========================================================

    if (
      rawMethod ===
      "CHAPA"
    ) {
      const txRef =
        `GH-${resId}-${Date.now()}`;

      const payment =
        await prisma.payment.create({
          data: {
            reservationId:
              resId,

            amount,

            method:
              "CHAPA",

            status:
              "PENDING",
          },
        });

      try {
        const chapaResult =
          await initializeChapaPayment({
            amount,

            email:
              reservation.guest.email,

            fullName:
              reservation.guest.fullName,

            phone:
              undefined,

            txRef,

            callbackUrl:
              `${process.env.BACKEND_URL}/payments/chapa/callback`,

            returnUrl:
              `${process.env.FRONTEND_URL}/payment/chapa/return`,
          });

        try {
          await createNotification({
            title:
              "Chapa Payment Started",

            message:
              "Your Chapa payment has been initialized. Please complete the payment.",

            userId:
              reservation.guestId,
          });
        } catch (error) {
          console.error(
            "Chapa notification error:",
            error
          );
        }

        return {
          status:
            "PENDING",

          method:
            "CHAPA",

          reservationId:
            resId,

          paymentId:
            payment.id,

          txRef,

          amount,

          nights,

          roomPrice,

          checkoutUrl:
            chapaResult.data
              .checkout_url,
        };
      } catch (error) {
        await prisma.payment.update({
          where: {
            id:
              payment.id,
          },

          data: {
            status:
              "FAILED",
          },
        });

        throw error;
      }
    }

    // ==========================================================
    // TELEBIRR / CBE BIRR
    //
    // IMPORTANT:
    //
    // These methods are marked PAID here because this function
    // represents the verified/manual payment flow.
    //
    // Reservation becomes CONFIRMED in the same transaction.
    // ==========================================================

    const result =
      await prisma.$transaction(
        async (tx) => {
          // ----------------------------------------------------
          // Re-read reservation inside transaction
          // ----------------------------------------------------

          const currentReservation =
            await tx.reservation.findUnique({
              where: {
                id:
                  resId,
              },

              include: {
                payment: true,
              },
            });

          if (
            !currentReservation
          ) {
            throw new Error(
              "Reservation not found."
            );
          }

          if (
            currentReservation.status !==
            "PENDING"
          ) {
            throw new Error(
              "Payment can only be made for a pending reservation."
            );
          }

          if (
            currentReservation.payment
          ) {
            throw new Error(
              "Payment already exists for this reservation."
            );
          }

          // ----------------------------------------------------
          // Re-check overlapping reservations
          // ----------------------------------------------------

          const overlapping =
            await tx.reservation.findFirst({
              where: {
                roomId:
                  currentReservation.roomId,

                id: {
                  not:
                    resId,
                },

                status: {
                  in: [
                    "CONFIRMED",
                    "CHECKED_IN",
                  ],
                },

                checkIn: {
                  lt:
                    currentReservation.checkOut,
                },

                checkOut: {
                  gt:
                    currentReservation.checkIn,
                },
              },
            });

          if (overlapping) {
            throw new Error(
              "Room is no longer available for the selected dates."
            );
          }

          // ----------------------------------------------------
          // Re-check room
          // ----------------------------------------------------

          const currentRoom =
            await tx.room.findUnique({
              where: {
                id:
                  currentReservation.roomId,
              },
            });

          if (!currentRoom) {
            throw new Error(
              "Room not found."
            );
          }

          if (
            currentRoom.maintenanceStatus !==
            "AVAILABLE"
          ) {
            throw new Error(
              "This room is currently unavailable for maintenance."
            );
          }

          // ----------------------------------------------------
          // CREATE PAID PAYMENT
          // ----------------------------------------------------

          const payment =
            await tx.payment.create({
              data: {
                reservationId:
                  resId,

                amount,

                method:
                  paymentMethod,

                status:
                  "PAID",
              },
            });

          // ----------------------------------------------------
          // CONFIRM RESERVATION
          // ----------------------------------------------------

          const confirmedReservation =
            await tx.reservation.update({
              where: {
                id:
                  resId,
              },

              data: {
                status:
                  "CONFIRMED",
              },
            });

          return {
            payment,
            confirmedReservation,
          };
        }
      );

    // ==========================================================
    // NOTIFICATION
    // ==========================================================

    try {
      await createNotification({
        title:
          "Payment Successful",

        message:
          "Your payment was verified successfully and your reservation has been confirmed.",

        userId:
          reservation.guestId,
      });
    } catch (error) {
      console.error(
        "Payment notification error:",
        error
      );
    }

    // ==========================================================
    // PAYMENT REFERENCE
    // ==========================================================

    const referenceNumber =
      "GH-" +
      String(
        result.payment.id
      ).padStart(
        8,
        "0"
      );

    return {
      ...result.payment,

      referenceNumber,

      reservation:
        result.confirmedReservation,
    };
  };

// ============================================================
// PAYMENT HISTORY
// ============================================================

export const getPaymentHistory =
  async (guestId) => {
    const id =
      Number(guestId);

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
          guestId:
            id,
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
        createdAt:
          "desc",
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
        createdAt:
          "desc",
      },
    });
  };

// ============================================================
// GET PAYMENT BY ID
// ============================================================

export const getPaymentById =
  async (id) => {
    const paymentId =
      Number(id);

    if (
      !paymentId ||
      Number.isNaN(paymentId)
    ) {
      throw new Error(
        "Invalid payment ID."
      );
    }

    return await prisma.payment.findUnique({
      where: {
        id:
          paymentId,
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

// ============================================================
// UPDATE PAYMENT STATUS
// ============================================================

export const updatePaymentStatus =
  async (
    id,
    status
  ) => {
    const paymentId =
      Number(id);

    if (
      !paymentId ||
      Number.isNaN(paymentId)
    ) {
      throw new Error(
        "Invalid payment ID."
      );
    }

    if (!status) {
      throw new Error(
        "Payment status is required."
      );
    }

    const normalizedStatus =
      String(status)
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
          id:
            paymentId,
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

    // ==========================================================
    // PAID CANNOT BE REVERSED
    // ==========================================================

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

    // ==========================================================
    // FAILED PAYMENT
    // ==========================================================

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

    // ==========================================================
    // UPDATE PAYMENT
    // ==========================================================

    const result =
      await prisma.$transaction(
        async (tx) => {
          // ----------------------------------------------------
          // Re-check payment
          // ----------------------------------------------------

          const currentPayment =
            await tx.payment.findUnique({
              where: {
                id:
                  paymentId,
              },

              include: {
                reservation: true,
              },
            });

          if (
            !currentPayment
          ) {
            throw new Error(
              "Payment not found."
            );
          }

          if (
            currentPayment.status ===
              "PAID" &&
            normalizedStatus !==
              "PAID"
          ) {
            throw new Error(
              "Paid payment cannot be changed."
            );
          }

          // ----------------------------------------------------
          // FAILED
          // ----------------------------------------------------

          if (
            normalizedStatus ===
            "FAILED"
          ) {
            const updatedPayment =
              await tx.payment.update({
                where: {
                  id:
                    paymentId,
                },

                data: {
                  status:
                    "FAILED",
                },
              });

            if (
              currentPayment
                .reservation
                .status ===
              "PENDING"
            ) {
              await tx.reservation.update({
                where: {
                  id:
                    currentPayment
                      .reservationId,
                },

                data: {
                  status:
                    "PENDING",
                },
              });
            }

            return updatedPayment;
          }

          // ----------------------------------------------------
          // PENDING
          // ----------------------------------------------------

          if (
            normalizedStatus ===
            "PENDING"
          ) {
            const updatedPayment =
              await tx.payment.update({
                where: {
                  id:
                    paymentId,
                },

                data: {
                  status:
                    "PENDING",
                },
              });

            return updatedPayment;
          }

          // ----------------------------------------------------
          // PAID
          // ----------------------------------------------------

          if (
            normalizedStatus ===
            "PAID"
          ) {
            if (
              currentPayment
                .reservation
                .status !==
              "PENDING"
            ) {
              throw new Error(
                "Only a pending reservation can be confirmed by payment."
              );
            }

            // -----------------------------------------------
            // Check overlapping reservation
            // -----------------------------------------------

            const overlapping =
              await tx.reservation.findFirst({
                where: {
                  roomId:
                    currentPayment
                      .reservation
                      .roomId,

                  id: {
                    not:
                      currentPayment
                        .reservationId,
                  },

                  status: {
                    in: [
                      "CONFIRMED",
                      "CHECKED_IN",
                    ],
                  },

                  checkIn: {
                    lt:
                      currentPayment
                        .reservation
                        .checkOut,
                  },

                  checkOut: {
                    gt:
                      currentPayment
                        .reservation
                        .checkIn,
                  },
                },
              });

            if (overlapping) {
              throw new Error(
                "Room is no longer available for the selected dates."
              );
            }

            // -----------------------------------------------
            // Check room maintenance
            // -----------------------------------------------

            const room =
              await tx.room.findUnique({
                where: {
                  id:
                    currentPayment
                      .reservation
                      .roomId,
                },
              });

            if (!room) {
              throw new Error(
                "Room not found."
              );
            }

            if (
              room.maintenanceStatus !==
              "AVAILABLE"
            ) {
              throw new Error(
                "This room is currently unavailable for maintenance."
              );
            }

            // -----------------------------------------------
            // Update payment
            // -----------------------------------------------

            const updatedPayment =
              await tx.payment.update({
                where: {
                  id:
                    paymentId,
                },

                data: {
                  status:
                    "PAID",
                },
              });

            // -----------------------------------------------
            // Confirm reservation
            // -----------------------------------------------

            await tx.reservation.update({
              where: {
                id:
                  currentPayment
                    .reservationId,
              },

              data: {
                status:
                  "CONFIRMED",
              },
            });

            return updatedPayment;
          }

          throw new Error(
            "Invalid payment status."
          );
        }
      );

    // ==========================================================
    // NOTIFICATIONS
    // ==========================================================

    if (
      normalizedStatus ===
      "PAID"
    ) {
      try {
        await createNotification({
          title:
            "Payment Successful",

          message:
            "Your payment was verified successfully and your reservation has been confirmed.",

          userId:
            payment.reservation.guestId,
        });
      } catch (error) {
        console.error(
          "Payment success notification error:",
          error
        );
      }
    }

    if (
      normalizedStatus ===
      "FAILED"
    ) {
      try {
        await createNotification({
          title:
            "Payment Failed",

          message:
            "Your payment was not successful. The reservation remains pending and you may try again.",

          userId:
            payment.reservation.guestId,
        });
      } catch (error) {
        console.error(
          "Payment failed notification error:",
          error
        );
      }
    }

    return result;
  };

// ============================================================
// OWNER PAYMENT REPORT
// ============================================================

export const getOwnerPaymentReport =
  async (ownerId) => {
    const id =
      Number(ownerId);

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
        status:
          "PAID",

        reservation: {
          room: {
            guesthouse: {
              ownerId:
                id,
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
        createdAt:
          "desc",
      },
    });
  };