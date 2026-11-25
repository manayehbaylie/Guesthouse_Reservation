import { createHash, randomBytes } from "node:crypto";
import prisma from "../config/prisma.js";
import { calculateNights, parseDateOnly } from "../utils/date.utils.js";
import { reservationOverlapWhere } from "../utils/reservation-overlap.utils.js";
import { getSystemSettings } from "./system-settings.service.js";

const INTENT_TTL_MS = 30 * 60 * 1000;
const tokenHash = (token) => createHash("sha256").update(String(token)).digest("hex");
const invalidIntent = () => Object.assign(
  new Error("This booking selection has expired. Please select the dates and room again."),
  { statusCode: 410 }
);
const unavailableRoom = (message) => Object.assign(new Error(message), { statusCode: 409 });

const validateRoomSelection = async (database, { roomId, guesthouseId, checkIn, checkOut, guests }, { skipOverlap = false } = {}) => {
  const room = await database.room.findUnique({
    where: { id: Number(roomId) },
    include: { guesthouse: { select: { id: true, name: true, city: true, status: true } } },
  });
  if (!room || room.guesthouse.id !== Number(guesthouseId)) throw unavailableRoom("The selected room could not be found.");
  if (room.guesthouse.status !== "APPROVED") throw unavailableRoom("This guesthouse is not available for bookings.");
  if (!room.available || room.maintenanceStatus !== "AVAILABLE") throw unavailableRoom("This room is no longer available.");

  const guestCount = Number(guests);
  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > room.capacity) {
    throw unavailableRoom(`Number of guests must be between 1 and ${room.capacity}.`);
  }

  const start = parseDateOnly(checkIn);
  const end = parseDateOnly(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw unavailableRoom("Select valid check-in and check-out dates.");
  }

  if (!skipOverlap) {
    const overlapping = await database.reservation.findFirst({
      where: reservationOverlapWhere(Number(roomId), start, end),
      select: { id: true },
    });
    if (overlapping) throw unavailableRoom("This room is no longer available for the selected dates.");
  }

  const nights = calculateNights(start, end);
  const pricePerNight = Number(room.price);
  const totalPrice = pricePerNight * nights;
  if (!Number.isFinite(totalPrice) || totalPrice <= 0) throw unavailableRoom("The price for this room is not available.");

  return {
    room,
    checkIn: start,
    checkOut: end,
    guests: guestCount,
    nights,
    pricePerNight,
    totalPrice,
  };
};

const serializeIntent = (intent, selection) => ({
  guesthouseId: intent.guesthouseId,
  roomId: intent.roomId,
  guesthouse: {
    id: intent.guesthouseId,
    name: selection.room.guesthouse.name,
    city: selection.room.guesthouse.city,
  },
  room: {
    id: intent.roomId,
    roomNumber: selection.room.roomNumber,
    roomType: selection.room.roomType,
    capacity: selection.room.capacity,
  },
  checkIn: selection.checkIn.toISOString().slice(0, 10),
  checkOut: selection.checkOut.toISOString().slice(0, 10),
  checkInDate: selection.checkIn.toISOString().slice(0, 10),
  checkOutDate: selection.checkOut.toISOString().slice(0, 10),
  numberOfGuests: intent.guests,
  nights: selection.nights,
  nightsCount: selection.nights,
  pricePerNight: selection.pricePerNight,
  totalPrice: selection.totalPrice,
  amount: selection.totalPrice,
});

export const createBookingIntent = async ({ guesthouseId, roomId, checkIn, checkOut, guests = 1 }) => {
  const settings = await getSystemSettings();
  if (!settings.guestBookingEnabled) {
    throw Object.assign(new Error("Guest bookings are temporarily disabled."), { statusCode: 403 });
  }

  const numericGuesthouseId = Number(guesthouseId);
  const numericRoomId = Number(roomId);
  if (!Number.isInteger(numericGuesthouseId) || numericGuesthouseId < 1 || !Number.isInteger(numericRoomId) || numericRoomId < 1) {
    throw unavailableRoom("Select a valid guesthouse and room.");
  }

  const token = randomBytes(32).toString("base64url");
  const selection = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Room" WHERE "id" = ${numericRoomId} FOR UPDATE`;
    const currentSelection = await validateRoomSelection(tx, {
      roomId: numericRoomId,
      guesthouseId: numericGuesthouseId,
      checkIn,
      checkOut,
      guests,
    });
    const now = new Date();
    const expiresAt = new Date(Date.now() + INTENT_TTL_MS);
    await tx.$executeRaw`DELETE FROM "BookingIntent" WHERE "expiresAt" <= ${now}`;
    const [intent] = await tx.$queryRaw`
      INSERT INTO "BookingIntent" ("tokenHash", "roomId", "guesthouseId", "checkIn", "checkOut", "guests", "expiresAt", "createdAt")
      VALUES (${tokenHash(token)}, ${numericRoomId}, ${numericGuesthouseId}, ${currentSelection.checkIn}, ${currentSelection.checkOut}, ${currentSelection.guests}, ${expiresAt}, ${now})
      RETURNING *
    `;
    return { intent, selection: currentSelection };
  });

  return {
    token,
    expiresAt: selection.intent.expiresAt,
    booking: serializeIntent(selection.intent, selection.selection),
  };
};

export const claimBookingIntent = async (token, userId) => {
  const value = String(token || "");
  if (!/^[A-Za-z0-9_-]{40,50}$/.test(value) || !Number(userId)) throw invalidIntent();
  const hash = tokenHash(value);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    let [intent] = await tx.$queryRaw`SELECT * FROM "BookingIntent" WHERE "tokenHash" = ${hash} FOR UPDATE`;
    if (!intent || intent.expiresAt <= now || (intent.userId && intent.userId !== Number(userId))) throw invalidIntent();

    if (!intent.userId) {
      [intent] = await tx.$queryRaw`UPDATE "BookingIntent" SET "userId" = ${Number(userId)} WHERE "id" = ${intent.id} AND "userId" IS NULL AND "expiresAt" > ${now} RETURNING *`;
      if (!intent) throw invalidIntent();
    }

    const selection = await validateRoomSelection(tx, intent, { skipOverlap: Boolean(intent.reservationId) });
    return { ...serializeIntent(intent, selection), expiresAt: intent.expiresAt };
  });
};

export const findClaimedBookingIntent = async (token, userId, database = prisma, { lock = false } = {}) => {
  const value = String(token || "");
  if (!/^[A-Za-z0-9_-]{40,50}$/.test(value) || !Number(userId)) throw invalidIntent();
  const hash = tokenHash(value);
  const rows = lock
    ? await database.$queryRaw`SELECT * FROM "BookingIntent" WHERE "tokenHash" = ${hash} FOR UPDATE`
    : await database.$queryRaw`SELECT * FROM "BookingIntent" WHERE "tokenHash" = ${hash}`;
  const intent = rows[0];
  if (!intent || intent.userId !== Number(userId) || intent.expiresAt <= new Date()) throw invalidIntent();
  return intent;
};
