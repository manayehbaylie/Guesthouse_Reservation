import { createCipheriv, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import prisma from "../config/prisma.js";
import { createNotification } from "./notification.service.js";
import axios from "axios";
import { calculateNights, parseDateOnly } from "../utils/date.utils.js";
import { getBankAccountValidationError } from "../validators/payment.validator.js";
import { reservationOverlapWhere } from "../utils/reservation-overlap.utils.js";
import { getSystemSettings } from "./system-settings.service.js";
import { notifyReservationOwner } from "./reservation.service.js";
import {
  notifyTelegramPaymentConfirmation,
  notifyTelegramPaymentFailure,
  notifyTelegramBookingRefundRequired,
} from "./telegram-payment-notification.service.js";

// ============================================================
// CONFIGURATION
// ============================================================

const CHAPA_SECRET_KEY =
  process.env.CHAPA_SECRET_KEY?.trim();

const CHAPA_ENCRYPTION_KEY = process.env.CHAPA_ENCRYPTION_KEY?.trim();
const CHAPA_WEBHOOK_SECRET = process.env.CHAPA_WEBHOOK_SECRET?.trim();

const BACKEND_URL =
  process.env.BACKEND_URL?.trim();

const FRONTEND_URL =
  process.env.FRONTEND_URL?.trim();

// ============================================================
// SUPPORTED PAYMENT METHODS
// ============================================================

const PAYMENT_METHODS = [
  "TELEBIRR",
  "CBE_BIRR",
  "EBIRR",
  "MPESA",
  "BANK_TRANSFER",
  "BANK_CARD",
  "CARD",
  "CHAPA",
];

const DIRECT_CHARGE_TYPES = new Set([
  "telebirr",
  "cbebirr",
  "ebirr",
  "mpesa",
  "enat_bank",
]);

export const normalizeChapaMobile = (value) => {
  const input = String(value || "").trim().replace(/[\s()-]/g, "");
  let mobile = input;
  if (/^\+?251[79]\d{8}$/.test(input)) {
    mobile = `0${input.replace(/^\+?251/, "")}`;
  }
  if (!/^0[79]\d{8}$/.test(mobile)) {
    throw new Error("Enter an Ethiopian mobile number beginning with 09 or 07.");
  }
  return mobile;
};

export const encryptChapaAuthorization = (payload, key = CHAPA_ENCRYPTION_KEY) => {
  const keyBytes = Buffer.from(String(key || ""), "utf8");
  if (![16, 24].includes(keyBytes.length)) {
    throw new Error("CHAPA_ENCRYPTION_KEY must be a 16- or 24-byte 3DES key.");
  }
  const cipher = createCipheriv(keyBytes.length === 16 ? "des-ede" : "des-ede3", keyBytes, null);
  return Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]).toString("base64");
};

const safeEqualHex = (actual, expected) => {
  if (!/^[\da-f]+$/i.test(actual) || !/^[\da-f]+$/i.test(expected)) return false;
  const actualBytes = Buffer.from(actual, "hex");
  const expectedBytes = Buffer.from(expected, "hex");
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
};

export const verifyChapaWebhookSignature = ({ rawBody, headers, secret = CHAPA_WEBHOOK_SECRET }) => {
  if (!secret || !Buffer.isBuffer(rawBody)) return false;
  const payloadSignature = String(headers?.["x-chapa-signature"] || "").trim();
  const secretSignature = String(headers?.["chapa-signature"] || "").trim();
  const expectedPayloadSignature = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedSecretSignature = createHmac("sha256", secret).update(secret).digest("hex");
  return safeEqualHex(payloadSignature, expectedPayloadSignature) ||
    safeEqualHex(secretSignature, expectedSecretSignature);
};

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
  "Hibret Bank",
  "Oromia Bank",
  "Wegagen Bank",
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

export const calculateReservationAmount = (reservation) => {
  if (!reservation?.room) {
    throw new Error("Room not found.");
  }

  const checkIn = parseDateOnly(reservation.checkIn);
  const checkOut = parseDateOnly(reservation.checkOut);

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

  const nights = calculateNights(
    reservation.checkIn,
    reservation.checkOut
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

const bookingDraftInclude = {
  user: { select: { id: true, fullName: true, email: true, phone: true } },
  room: {
    include: {
      guesthouse: { select: { id: true, name: true, city: true, status: true, ownerId: true } },
    },
  },
};

const lockBookingDraft = async (database, draftId) => {
  await database.$queryRaw`SELECT "id" FROM "booking_drafts" WHERE "id" = ${Number(draftId)} FOR UPDATE`;
};

const bookingDraftUnavailable = (message) => Object.assign(new Error(message), { code: "BOOKING_DRAFT_UNAVAILABLE" });

const assertDraftRoomAvailable = async (database, { roomId, checkIn, checkOut, guests }, { lock = true } = {}) => {
  if (lock) {
    await database.$queryRaw`SELECT "id" FROM "Room" WHERE "id" = ${Number(roomId)} FOR UPDATE`;
  }
  const room = await database.room.findUnique({
    where: { id: Number(roomId) },
    include: { guesthouse: { select: { status: true } } },
  });
  if (!room) throw bookingDraftUnavailable("Room not found.");
  if (room.guesthouse.status !== "APPROVED") throw bookingDraftUnavailable("Reservation cannot be made for an unapproved guesthouse.");
  if (!room.available || room.maintenanceStatus !== "AVAILABLE") throw bookingDraftUnavailable("Room is no longer available for the selected dates.");
  const guestCount = Number(guests);
  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > room.capacity) {
    throw bookingDraftUnavailable(`Number of guests must be between 1 and ${room.capacity}.`);
  }
  const overlapping = await database.reservation.findFirst({
    where: reservationOverlapWhere(Number(roomId), checkIn, checkOut),
    select: { id: true },
  });
  if (overlapping) throw bookingDraftUnavailable("Room is no longer available for the selected dates.");
  return room;
};

export const createTelegramBookingDraft = async ({ userId, roomId, checkIn, checkOut, guests }) => {
  const settings = await getSystemSettings();
  if (!settings.guestBookingEnabled) {
    const error = new Error("Guest bookings are temporarily disabled.");
    error.statusCode = 403;
    throw error;
  }
  const guestId = Number(userId);
  const numericRoomId = Number(roomId);
  const start = parseDateOnly(checkIn);
  const end = parseDateOnly(checkOut);
  if (!guestId || !numericRoomId || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw new Error("Invalid booking draft details.");
  }
  const txRef = `GHD-${randomUUID()}`;
  return prisma.$transaction(async (tx) => {
    const room = await assertDraftRoomAvailable(tx, {
      roomId: numericRoomId,
      checkIn: start,
      checkOut: end,
      guests,
    });
    const { amount } = calculateReservationAmount({ room, checkIn: start, checkOut: end });
    return tx.bookingDraft.create({
      data: {
        userId: guestId,
        roomId: numericRoomId,
        checkIn: start,
        checkOut: end,
        guests: Number(guests),
        amount,
        txRef,
        status: "PENDING",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
      include: bookingDraftInclude,
    });
  });
};

const getTelegramBookingDraft = async (draftId, userId, database = prisma) => {
  const draft = await database.bookingDraft.findFirst({
    where: { id: Number(draftId), userId: Number(userId) },
    include: bookingDraftInclude,
  });
  if (!draft) throw new Error("Booking draft not found.");
  return draft;
};

export const selectTelegramBookingDraftPaymentMethod = async ({ draftId, userId, method }) => {
  const normalizedMethod = normalizePaymentMethod(method);
  const result = await prisma.$transaction(async (tx) => {
    await lockBookingDraft(tx, draftId);
    const draft = await getTelegramBookingDraft(draftId, userId, tx);
    if (draft.status !== "PENDING") return { error: "This booking draft is no longer active." };
    if (draft.expiresAt <= new Date()) {
      await tx.bookingDraft.update({ where: { id: draft.id }, data: { status: "EXPIRED" } });
      return { error: "This booking draft has expired." };
    }
    try {
      await assertDraftRoomAvailable(tx, draft);
    } catch (error) {
      if (error.code !== "BOOKING_DRAFT_UNAVAILABLE") throw error;
      await tx.bookingDraft.update({ where: { id: draft.id }, data: { status: "FAILED" } });
      return { error: error.message };
    }
    return {
      draft: await tx.bookingDraft.update({
        where: { id: draft.id },
        data: { method: normalizedMethod },
        include: bookingDraftInclude,
      }),
    };
  });
  if (result.error) throw new Error(result.error);
  return result.draft;
};

export const markTelegramBookingDraftFailed = async (draftId, userId) => {
  await prisma.bookingDraft.updateMany({
    where: { id: Number(draftId), userId: Number(userId), status: "PENDING" },
    data: { status: "FAILED" },
  });
};

export const expireTelegramBookingDrafts = async () => {
  const result = await prisma.bookingDraft.updateMany({
    where: { status: "PENDING", expiresAt: { lte: new Date() } },
    data: { status: "EXPIRED" },
  });
  return result.count;
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
  reservation,
  { allowExistingPayment = false, allowCancelled = false } = {}
) => {
  if (reservation.status !== "PENDING" && !(allowCancelled && reservation.status === "CANCELLED")) {
    throw new Error(
      "Payment can only be made for a pending reservation."
    );
  }

  if (reservation.payment && !allowExistingPayment) {
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

  const overlappingReservation = await prisma.reservation.findFirst({
    where: reservationOverlapWhere(
      reservation.roomId,
      reservation.checkIn,
      reservation.checkOut,
      reservation.id
    ),
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
    let parsedCheckoutUrl;
    try {
      parsedCheckoutUrl = new URL(checkoutUrl);
    } catch {
      throw new Error("Chapa returned an invalid checkout URL.");
    }
    if (
      parsedCheckoutUrl.protocol !== "https:" ||
      parsedCheckoutUrl.username ||
      parsedCheckoutUrl.password
    ) {
      throw new Error("Chapa returned an insecure checkout URL.");
    }

    return response.data;
  } catch (error) {
    // --------------------------------------------------------
    // CHAPA ERROR HANDLING
    // --------------------------------------------------------

    if (error.response) {
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

    throw new Error(
      `Chapa payment initialization failed: ${error.message}`
    );
  }
};

export const initiateChapaBookingDraftCheckout = async ({ draftId, userId }) => {
  const draft = await selectTelegramBookingDraftPaymentMethod({
    draftId,
    userId,
    method: "BANK_CARD",
  });
  try {
    const guestEmail = String(draft.user.email || "").trim().toLowerCase();
    const chapaEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)
      ? guestEmail
      : `guest${draft.userId}@example.com`;
    const result = await initializeChapaPayment({
      amount: draft.amount,
      email: chapaEmail,
      fullName: draft.user.fullName,
      phone: draft.user.phone ? normalizeEthiopianPhone(draft.user.phone) : undefined,
      txRef: draft.txRef,
      callbackUrl: `${BACKEND_URL.replace(/\/$/, "")}/api/payments/chapa/callback`,
      returnUrl: `${FRONTEND_URL}/payment/chapa/return?tx_ref=${encodeURIComponent(draft.txRef)}`,
    });
    return {
      status: "PENDING",
      draftId: draft.id,
      userId: draft.userId,
      amount: draft.amount,
      txRef: draft.txRef,
      expiresAt: draft.expiresAt,
      checkoutUrl: result.data.checkout_url,
    };
  } catch {
    await markTelegramBookingDraftFailed(draft.id, draft.userId);
    throw new Error("Chapa checkout could not be started. Please search and try again.");
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
  chapaTxRef,
}) => {
  return await prisma.payment.create({
    data: {
      reservationId,
      amount,
      method,
      status,
      ...(chapaTxRef ? { chapaTxRef } : {}),
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
      `was not successful. The reservation was cancelled.`,

    userId:
      reservation.guestId,

    category: "payment",
  });
};

export const cancelPendingReservation = async (reservationId) => {
  const id = Number(reservationId);
  if (!Number.isInteger(id) || id <= 0) return false;

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { payment: { select: { status: true } } },
  });

  if (
    !reservation ||
    reservation.status !== "PENDING" ||
    reservation.payment?.status === "PENDING"
  ) {
    return false;
  }

  const result = await prisma.reservation.updateMany({
    where: { id, status: "PENDING" },
    data: { status: "CANCELLED" },
  });

  if (result.count === 1) {
    await createNotification({
      title: "Reservation Cancelled",
      message: `Your reservation #${id} was cancelled because payment could not be started.`,
      userId: reservation.guestId,
      category: "reservation",
    });
  }

  return result.count === 1;
};

const failPaymentAndCancelReservation = async (paymentId, { notifyTelegram = true } = {}) => {
  const id = Number(paymentId);
  const failure = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Payment" WHERE "id" = ${id} FOR UPDATE`;

    const payment = await tx.payment.findUnique({
      where: { id },
      include: { reservation: true },
    });

    if (!payment) {
      throw new Error("Payment not found.");
    }

    if (payment.status === "PAID") {
      return { changed: false, reservation: null };
    }

    const changed = payment.status === "PENDING";
    if (changed) {
      await tx.payment.update({
        where: { id },
        data: { status: "FAILED" },
      });
    }

    if (payment.reservation.status === "PENDING") {
      await tx.reservation.update({
        where: { id: payment.reservationId },
        data: { status: "CANCELLED" },
      });
    }

    return { changed, reservation: payment.reservation };
  });

  if (failure.changed && failure.reservation) {
    await notifyPaymentFailed(failure.reservation);
    if (notifyTelegram) {
      await notifyTelegramPaymentFailure({ id, reservationId: failure.reservation.id });
    }
  }

  return prisma.payment.findUnique({ where: { id } });
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

    const accountNumberError = getBankAccountValidationError(
      bankName,
      accountNumber
    );

    if (accountNumberError) {
      throw new Error(accountNumberError);
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
  retry = false,
}) => {
  let reservation =
    await getReservationForPayment(
      reservationId
    );

  await validateReservationForPayment(reservation, {
    allowExistingPayment: retry,
    allowCancelled: retry,
  });

  if (retry && (reservation.status !== "CANCELLED" || reservation.payment?.status !== "FAILED")) {
    throw new Error("Only a failed reservation payment can be retried.");
  }

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

    const accountNumberError = getBankAccountValidationError(
      selectedBank,
      acc
    );

    if (accountNumberError) {
      throw new Error(accountNumberError);
    }
  }

  // ==========================================================
  // CHAPA
  // ==========================================================

  if (
    ["CARD", "BANK_CARD", "TELEBIRR", "BANK_TRANSFER", "CHAPA"].includes(
      paymentMethod
    )
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

    const guestEmail = String(
      reservation.guest?.email || ""
    ).trim().toLowerCase();

    const chapaEmail =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)
        ? guestEmail
        : `guest${reservation.guestId}@example.com`;

    const txRef =
      `GH-${reservation.id}-${Date.now()}`;

    // --------------------------------------------------------
    // CREATE PENDING PAYMENT
    // --------------------------------------------------------

    const payment = retry
      ? await prisma.$transaction(async (tx) => {
          await tx.reservation.update({
            where: { id: reservation.id },
            data: { status: "PENDING" },
          });
          return tx.payment.update({
            where: { id: reservation.payment.id },
            data: {
              amount,
              method: paymentMethod,
              status: "PENDING",
              chapaTxRef: txRef,
              telegramNotifiedAt: null,
            },
          });
        })
      : await createPaymentRecord({
          reservationId: reservation.id,
          amount,
          method: paymentMethod,
          status: "PENDING",
          chapaTxRef: txRef,
        });

    try {
      // ------------------------------------------------------
      // INITIALIZE CHAPA
      // ------------------------------------------------------

      const chapaResult =
        await initializeChapaPayment({
          amount,

          email: chapaEmail,

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
            `${BACKEND_URL.replace(/\/$/, '')}/api/payments/chapa/callback`,

          returnUrl:
            `${FRONTEND_URL}/payment/chapa/return?tx_ref=${encodeURIComponent(txRef)}`,
        });

      // ------------------------------------------------------
      // RETURN CHECKOUT URL
      // ------------------------------------------------------

      return {
        status: "PENDING",

        method: paymentMethod,

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

      try {
        await failPaymentAndCancelReservation(payment.id, { notifyTelegram: false });
      } catch (dbError) {
        console.error(
          "Could not cancel failed payment reservation:",
          dbError
        );
      }

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

export const retryInitiatePayment = async ({ reservationId, method = "CARD" }) =>
  initiatePayment({ reservationId, method, retry: true });

const assertDirectChargeType = (type) => {
  const normalized = String(type || "").trim().toLowerCase();
  if (!DIRECT_CHARGE_TYPES.has(normalized)) {
    throw new Error("Unsupported Chapa direct-charge method.");
  }
  return normalized;
};

const createPaymentAttempt = async ({ reservation, amount, method, txRef, retry }) => {
  if (retry) {
    return prisma.$transaction(async (tx) => {
      await tx.reservation.update({ where: { id: reservation.id }, data: { status: "PENDING" } });
      return tx.payment.update({
        where: { id: reservation.payment.id },
        data: { amount, method, status: "PENDING", chapaTxRef: txRef, telegramNotifiedAt: null },
      });
    });
  }
  return createPaymentRecord({ reservationId: reservation.id, amount, method, status: "PENDING", chapaTxRef: txRef });
};

const chapaAuthorizationType = (response = {}) => {
  const data = response.data || response;
  const explicit = String(data.auth_type || data.authType || "").toLowerCase();
  if (["otp", "ussd"].includes(explicit)) return explicit;
  return data.otp_required === true || data.requires_otp === true ? "otp" : "ussd";
};

const directChargePaymentMethod = (chargeType) => ({
  telebirr: "TELEBIRR",
  cbebirr: "CBE_BIRR",
  ebirr: "EBIRR",
  mpesa: "MPESA",
  enat_bank: "BANK_TRANSFER",
})[chargeType];

const initiateDirectChargeRequest = async ({ chargeType, amount, mobile, txRef, guest }) => {
  if (!CHAPA_SECRET_KEY) throw new Error("CHAPA_SECRET_KEY is not configured.");
  const form = new FormData();
  form.append("amount", String(amount));
  form.append("currency", "ETB");
  form.append("mobile", mobile);
  form.append("tx_ref", txRef);
  const nameParts = String(guest?.fullName || "Guest").trim().split(/\s+/);
  form.append("first_name", nameParts.shift() || "Guest");
  form.append("last_name", nameParts.join(" ") || "Guest");
  if (guest?.email) form.append("email", guest.email);

  try {
    const response = await axios.post(
      `https://api.chapa.co/v1/charges?type=${encodeURIComponent(chargeType)}`,
      form,
      { headers: { Authorization: `Bearer ${CHAPA_SECRET_KEY}`, Accept: "application/json" }, timeout: 30000 }
    );
    if (response.data?.status !== "success") throw new Error("Chapa rejected the direct charge.");
    const data = response.data.data || {};
    const authType = chapaAuthorizationType(response.data);
    const requestId = String(data.requestID || data.request_id || response.data.requestID || "");
    if (authType === "otp" && !requestId) throw new Error("Chapa did not return a request ID for OTP authorization.");
    const reference = String(data.reference || data.chapa_reference || data.reference_id || "");
    if (!reference) throw new Error("Chapa did not return an authorization reference.");
    return {
      authType,
      requestId,
      reference,
      checkoutUrl: String(data.checkout_url || data.url || ""),
    };
  } catch {
    throw new Error("Chapa direct charge could not be started. Try another method.");
  }
};

export const initiateChapaBookingDraftDirectCharge = async ({ draftId, userId, type, mobile }) => {
  const chargeType = assertDirectChargeType(type);
  const normalizedMobile = normalizeChapaMobile(mobile);
  const method = directChargePaymentMethod(chargeType);
  const draft = await selectTelegramBookingDraftPaymentMethod({ draftId, userId, method });
  try {
    const authorization = await initiateDirectChargeRequest({
      chargeType,
      amount: draft.amount,
      mobile: normalizedMobile,
      txRef: draft.txRef,
      guest: draft.user,
    });
    return {
      status: "PENDING",
      draftId: draft.id,
      userId: draft.userId,
      amount: draft.amount,
      txRef: draft.txRef,
      expiresAt: draft.expiresAt,
      type: chargeType,
      ...authorization,
    };
  } catch (error) {
    await markTelegramBookingDraftFailed(draft.id, draft.userId);
    throw error;
  }
};

export const initiateChapaDirectCharge = async ({ reservationId, type, mobile, retry = false }) => {
  const chargeType = assertDirectChargeType(type);
  const normalizedMobile = normalizeChapaMobile(mobile);
  const reservation = await getReservationForPayment(reservationId);
  await validateReservationForPayment(reservation, { allowExistingPayment: retry, allowCancelled: retry });
  if (retry && (reservation.status !== "CANCELLED" || reservation.payment?.status !== "FAILED")) {
    throw new Error("Only a failed reservation payment can be retried.");
  }
  if (!CHAPA_SECRET_KEY) throw new Error("CHAPA_SECRET_KEY is not configured.");

  const { amount, nights, roomPrice } = calculateReservationAmount(reservation);
  const txRef = `GH-${reservation.id}-${Date.now()}`;
  const method = directChargePaymentMethod(chargeType);
  const payment = await createPaymentAttempt({ reservation, amount, method, txRef, retry });
  try {
    const authorization = await initiateDirectChargeRequest({
      chargeType,
      amount,
      mobile: normalizedMobile,
      txRef,
      guest: reservation.guest,
    });
    return {
      status: "PENDING",
      paymentId: payment.id,
      reservationId: reservation.id,
      amount,
      nights,
      roomPrice,
      txRef,
      type: chargeType,
      ...authorization,
    };
  } catch (error) {
    try {
      await failPaymentAndCancelReservation(payment.id, { notifyTelegram: false });
    } catch {
      // Keep provider errors and credentials out of bot logs.
    }
    throw error;
  }
};

export const authorizeChapaDirectCharge = async ({ type, authType, reference, requestId, otp }) => {
  const chargeType = assertDirectChargeType(type);
  const normalizedAuthType = String(authType || "").toLowerCase();
  if (!["otp", "ussd"].includes(normalizedAuthType)) throw new Error("Invalid Chapa authorization type.");
  const body = { reference: String(reference || "") };
  if (!body.reference) throw new Error("Chapa authorization reference is missing.");
  if (normalizedAuthType === "otp") {
    if (!/^\d{4,8}$/.test(String(otp || "")) || !requestId) throw new Error("Enter the OTP sent by your payment provider.");
    body.client = encryptChapaAuthorization({ requestID: requestId, otp: String(otp) });
  }

  try {
    const response = await axios.post(
      `https://api.chapa.co/v1/validate?type=${encodeURIComponent(chargeType)}&auth_type=${encodeURIComponent(normalizedAuthType)}`,
      body,
      { headers: { Authorization: `Bearer ${CHAPA_SECRET_KEY}`, Accept: "application/json", "Content-Type": "application/json" }, timeout: 30000 }
    );
    if (response.data?.status !== "success") throw new Error("Chapa authorization failed.");
    const data = response.data.data || {};
    return {
      status: "PENDING",
      authType: chapaAuthorizationType(response.data),
      requestId: String(data.requestID || data.request_id || requestId || ""),
      reference: String(data.reference || reference),
    };
  } catch {
    const error = new Error("Chapa authorization could not be completed.");
    error.code = "CHAPA_AUTH_REJECTED";
    throw error;
  }
};

// ============================================================
// MARK PAYMENT AS PAID
// ============================================================

export const markPaymentAsPaid =
  async (paymentId, { allowFailedRecovery = false } = {}) => {
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
          await tx.$queryRaw`SELECT "id" FROM "Payment" WHERE "id" = ${id} FOR UPDATE`;

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
            return {
              changed: false,
              payment,
              reservation: payment.reservation,
            };
          }

          if (
            payment.status === "FAILED" &&
            !allowFailedRecovery
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

          await tx.$queryRaw`SELECT "id" FROM "Room" WHERE "id" = ${reservation.roomId} FOR UPDATE`;

          const recoveringFailedPayment =
            allowFailedRecovery &&
            payment.status === "FAILED" &&
            reservation.status === "CANCELLED";

          if (
            reservation.status !== "PENDING" &&
            !recoveringFailedPayment
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

          const overlapping = await tx.reservation.findFirst({
            where: reservationOverlapWhere(
              reservation.roomId,
              reservation.checkIn,
              reservation.checkOut,
              reservation.id
            ),
          });

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
            changed: true,
            payment:
              updatedPayment,

            reservation,
          };
        }
      );

    if (result.changed) {
      await notifyPaymentSuccess({
        reservation: result.reservation,
        payment: result.payment,
      });
    }

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
// VERIFY CHAPA TRANSACTION
// ============================================================

const getReservationIdFromTxRef = (txRef) => {
  const match = /^GH-(\d+)-\d+(?:-\d+)?$/.exec(String(txRef || '').trim());
  return match ? Number(match[1]) : null;
};

const verifyChapaTransaction = async (txRef) => {
  if (!CHAPA_SECRET_KEY) {
    throw new Error('CHAPA_SECRET_KEY is not configured.');
  }

  const response = await axios.get(
    `https://api.chapa.co/v1/transaction/verify/${encodeURIComponent(txRef)}`,
    {
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
        Accept: 'application/json',
      },
      timeout: 30000,
    }
  );

  const verified = response.data?.status === 'success' &&
    ['success', 'completed'].includes(
      String(response.data?.data?.status || '').toLowerCase()
    );

  return {
    verified,
    status: String(response.data?.data?.status || '').toUpperCase(),
    data: response.data,
  };
};

const completeVerifiedBookingDraft = async (draft, forceRefund = false) => {
  return prisma.$transaction(async (tx) => {
    await lockBookingDraft(tx, draft.id);
    const current = await tx.bookingDraft.findUnique({
      where: { id: draft.id },
      include: bookingDraftInclude,
    });
    if (!current) throw new Error("Booking draft not found.");

    const existingPayment = await tx.payment.findUnique({
      where: { chapaTxRef: current.txRef },
      include: { reservation: true },
    });
    if (existingPayment) {
      return {
        payment: existingPayment,
        refundRequired: existingPayment.status === "REFUND_REQUIRED",
        reservation: existingPayment.reservation,
      };
    }

    const expired = current.status === "EXPIRED" || current.expiresAt <= new Date();
    let unavailable = forceRefund || current.status !== "PENDING" || expired;
    if (!unavailable) {
      try {
        await assertDraftRoomAvailable(tx, current);
      } catch (error) {
        if (error.code !== "BOOKING_DRAFT_UNAVAILABLE") throw error;
        unavailable = true;
      }
    }

    if (unavailable) {
      const payment = await tx.payment.create({
        data: {
          reservationId: null,
          bookingDraftId: current.id,
          amount: current.amount,
          method: current.method || "CHAPA",
          status: "REFUND_REQUIRED",
          chapaTxRef: current.txRef,
        },
      });
      await tx.bookingDraft.update({
        where: { id: current.id },
        data: { status: "REFUND_REQUIRED" },
      });
      return { payment, reservation: null, refundRequired: true };
    }

    const reservation = await tx.reservation.create({
      data: {
        checkIn: current.checkIn,
        checkOut: current.checkOut,
        numberOfGuests: current.guests,
        status: "CONFIRMED",
        guestId: current.userId,
        roomId: current.roomId,
      },
      include: {
        guest: { select: { id: true, fullName: true, email: true, phone: true } },
        room: {
          include: {
            guesthouse: { select: { id: true, name: true, city: true, ownerId: true } },
          },
        },
      },
    });
    const payment = await tx.payment.create({
      data: {
        reservationId: reservation.id,
        bookingDraftId: current.id,
        amount: current.amount,
        method: current.method || "CHAPA",
        status: "PAID",
        chapaTxRef: current.txRef,
      },
    });
    await tx.bookingDraft.update({
      where: { id: current.id },
      data: { status: "COMPLETED" },
    });
    return { payment, reservation, refundRequired: false };
  });
};

export const finalizeVerifiedTelegramBookingDraft = completeVerifiedBookingDraft;

export const processChapaCallback = async (payload = {}) => {
  const txRef = String(
    payload.tx_ref ||
      payload.trx_ref ||
      payload.txRef ||
      payload.reference ||
      ''
  ).trim();

  if (!txRef) throw new Error("Invalid Chapa transaction reference.");

  const draft = await prisma.bookingDraft.findUnique({
    where: { txRef },
  });
  if (draft) {
    const existingPayment = await prisma.payment.findUnique({
      where: { chapaTxRef: txRef },
      include: { reservation: true },
    });
    if (existingPayment?.status === "PAID" || existingPayment?.status === "REFUND_REQUIRED") {
      try {
        if (existingPayment.status === "PAID") await notifyTelegramPaymentConfirmation(existingPayment);
        else await notifyTelegramBookingRefundRequired(existingPayment);
      } catch (error) {
        console.error("Telegram payment outcome notification failed:", error.message);
      }
      return existingPayment;
    }

    const verification = await verifyChapaTransaction(txRef);
    const verifiedData = verification.data?.data || {};
    const transactionMatches = String(verifiedData.tx_ref || "") === txRef;
    const amountMatches =
      String(verifiedData.currency || "").toUpperCase() === "ETB" &&
      Number.isFinite(Number(verifiedData.amount)) &&
      Math.round(Number(verifiedData.amount) * 100) === Math.round(Number(draft.amount) * 100);

    if (verification.verified && transactionMatches) {
      const result = await completeVerifiedBookingDraft(draft, !amountMatches);
      if (result.refundRequired) {
        try {
          await notifyTelegramBookingRefundRequired(result.payment);
        } catch (error) {
          console.error("Telegram refund notice failed:", error.message);
        }
      } else {
        try {
          await notifyReservationOwner(result.reservation);
        } catch (error) {
          console.error("Reservation owner notification failed:", error.message);
        }
        try {
          await notifyTelegramPaymentConfirmation(result.payment);
        } catch (error) {
          console.error("Telegram payment confirmation failed:", error.message);
        }
      }
      return result.payment;
    }

    const failureTokens = verification.status.toLowerCase().match(/[a-z]+/g) || [];
    if (failureTokens.some((status) => ["failed", "cancelled", "canceled", "expired"].includes(status))) {
      await prisma.bookingDraft.updateMany({
        where: { id: draft.id, status: "PENDING" },
        data: { status: "FAILED" },
      });
      return { status: "FAILED", bookingDraftId: draft.id, chapaTxRef: txRef };
    }
    return { status: draft.status, bookingDraftId: draft.id, chapaTxRef: txRef };
  }

  const reservationId = getReservationIdFromTxRef(txRef);

  if (!txRef || !reservationId) {
    throw new Error('Invalid Chapa transaction reference.');
  }

  let payment = await prisma.payment.findUnique({
    where: { chapaTxRef: txRef },
  });

  if (!payment && /^GH-\d+-\d+$/.test(txRef)) {
    const legacyReservationId = getReservationIdFromTxRef(txRef);
    const legacyPayment = await prisma.payment.findUnique({
      where: { reservationId: legacyReservationId },
    });
    if (!legacyPayment?.chapaTxRef) payment = legacyPayment;
  }

  if (!payment) {
    throw new Error('Payment not found for Chapa transaction.');
  }

  const verification = await verifyChapaTransaction(txRef);
  const verifiedData = verification.data?.data || {};
  const verifiedAmount = Number(verifiedData.amount);
  const expectedAmount = Number(payment.amount);
  const transactionMatches =
    String(verifiedData.tx_ref || "") === txRef &&
    String(verifiedData.currency || "").toUpperCase() === "ETB" &&
    Number.isFinite(verifiedAmount) &&
    Math.round(verifiedAmount * 100) === Math.round(expectedAmount * 100);

  if (verification.verified && transactionMatches) {
    const paidPayment = await markPaymentAsPaid(payment.id, {
      allowFailedRecovery: true,
    });
    try {
      await notifyTelegramPaymentConfirmation(paidPayment);
    } catch (error) {
      console.error("Telegram payment confirmation failed:", error.message);
    }
    return paidPayment;
  }

  const verificationStatusTokens =
    verification.status.toLowerCase().match(/[a-z]+/g) || [];
  const failed = verificationStatusTokens.some((status) =>
    ['failed', 'cancelled', 'canceled', 'expired'].includes(status)
  );

  if (failed && payment.status !== 'PAID') {
    await failPaymentAndCancelReservation(payment.id);
  }

  return prisma.payment.findUnique({
    where: { id: payment.id },
    include: { reservation: true },
  });
};

export const getChapaPaymentStatus = async (guestId, txRef) => {
  const draft = await prisma.bookingDraft.findFirst({
    where: { txRef: String(txRef || ""), userId: Number(guestId) },
  });
  if (draft) {
    const existingPayment = await prisma.payment.findUnique({
      where: { chapaTxRef: draft.txRef },
      include: { reservation: true },
    });
    if (existingPayment?.status === "PAID" || existingPayment?.status === "REFUND_REQUIRED") return existingPayment;
    return processChapaCallback({ tx_ref: draft.txRef });
  }

  const reservationId = getReservationIdFromTxRef(txRef);

  if (!reservationId) {
    throw new Error('Invalid Chapa transaction reference.');
  }

  const payment = await prisma.payment.findFirst({
    where: {
      reservationId,
      chapaTxRef: txRef,
      reservation: { guestId: Number(guestId) },
    },
    include: { reservation: true },
  });

  if (!payment) {
    throw new Error('Payment not found.');
  }

  if (payment.status === 'PENDING' || payment.status === 'FAILED') {
    return processChapaCallback({ tx_ref: txRef });
  }

  return payment;
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
      return await failPaymentAndCancelReservation(paymentId);
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