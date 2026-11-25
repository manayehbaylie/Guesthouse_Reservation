import test from "node:test";
import assert from "node:assert/strict";
import prisma from "../config/prisma.js";
import { createReservation } from "./reservation.service.js";
import { createHash, randomBytes } from "node:crypto";

const mockMethod = (context, target, method, implementation) => {
  const original = target[method];
  target[method] = implementation;
  context.after(() => {
    target[method] = original;
  });
};

test("new reservations notify the owning guesthouse through the reservation category", async (context) => {
  const previousToken = process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_BOT_TOKEN;
  context.after(() => {
    if (previousToken !== undefined) process.env.TELEGRAM_BOT_TOKEN = previousToken;
  });

  const notifications = [];
  const reservation = {
    id: 81,
    checkIn: new Date("2026-11-10T00:00:00.000Z"),
    checkOut: new Date("2026-11-12T00:00:00.000Z"),
    guest: { fullName: "Test Guest" },
    room: {
      roomType: "DOUBLE",
      guesthouse: { id: 14, name: "Nile House", city: "Bahir Dar", ownerId: 77 },
    },
  };
  mockMethod(context, prisma.systemSetting, "upsert", async () => ({
    guestBookingEnabled: true,
    systemLocked: false,
    systemLockMessage: "",
  }));
  mockMethod(context, prisma.systemLock, "upsert", async () => ({
    isLocked: false,
    message: "",
  }));
  mockMethod(context, prisma, "$transaction", async (callback) => callback({
    $queryRaw: async () => [],
    room: {
      findUnique: async () => ({
        id: 5,
        capacity: 2,
        available: true,
        maintenanceStatus: "AVAILABLE",
        guesthouse: { id: 14, name: "Nile House", status: "APPROVED", ownerId: 77 },
      }),
    },
    reservation: {
      findFirst: async () => null,
      create: async () => reservation,
    },
  }));
  mockMethod(context, prisma.reservation, "findFirst", async () => null);
  mockMethod(context, prisma.notification, "create", async ({ data }) => {
    notifications.push(data);
    return { id: notifications.length, ...data };
  });
  mockMethod(context, prisma.user, "findUnique", async () => ({ telegramChatId: null }));

  await createReservation({ roomId: 5, checkIn: "2026-11-10", checkOut: "2026-11-12" }, 42);

  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].userId, 77);
  assert.equal(notifications[0].guesthouseId, 14);
  assert.equal(notifications[0].category, "reservation");
  assert.match(notifications[0].message, /Test Guest requested DOUBLE at Nile House/);
});

test("intent-backed reservations ignore client-submitted room, dates, and guest count", async (context) => {
  const token = randomBytes(32).toString("base64url");
  const intent = {
    id: 45,
    tokenHash: createHash("sha256").update(token).digest("hex"),
    userId: 42,
    roomId: 8,
    guesthouseId: 12,
    checkIn: new Date("2099-01-10T00:00:00.000Z"),
    checkOut: new Date("2099-01-12T00:00:00.000Z"),
    guests: 2,
    expiresAt: new Date(Date.now() + 60_000),
    reservationId: null,
  };
  let reservationData;
  const updates = [];

  mockMethod(context, prisma.systemSetting, "upsert", async () => ({ guestBookingEnabled: true }));
  mockMethod(context, prisma.systemLock, "upsert", async () => ({ isLocked: false, message: "" }));
  mockMethod(context, prisma, "$transaction", async (callback) => callback({
    $queryRaw: async (strings) => strings.join("?").includes('FROM "BookingIntent"') ? [{ ...intent }] : [],
    $executeRaw: async (strings, ...values) => { updates.push({ query: strings.join("?"), values }); return 1; },
    room: {
      findUnique: async () => ({
        id: 8,
        capacity: 3,
        available: true,
        maintenanceStatus: "AVAILABLE",
        guesthouse: { id: 12, name: "Nile House", status: "APPROVED", ownerId: null },
      }),
    },
    reservation: {
      findFirst: async () => null,
      create: async ({ data }) => {
        reservationData = data;
        return {
          id: 91,
          ...data,
          guest: { fullName: "Test Guest" },
          room: { roomType: "DOUBLE", guesthouse: { id: 12, name: "Nile House", city: "Gondar", ownerId: null } },
        };
      },
    },
  }));

  await createReservation({
    bookingIntentToken: token,
    roomId: 999,
    checkIn: "2030-01-01",
    checkOut: "2030-01-02",
    numberOfGuests: 1,
  }, 42);

  assert.equal(reservationData.roomId, 8);
  assert.equal(reservationData.numberOfGuests, 2);
  assert.equal(reservationData.checkIn.toISOString().slice(0, 10), "2099-01-10");
  assert.equal(reservationData.checkOut.toISOString().slice(0, 10), "2099-01-12");
  assert.equal(updates.some(({ query }) => query.includes('"reservationId"')), true);
});
