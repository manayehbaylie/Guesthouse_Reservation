import assert from "node:assert/strict";
import test from "node:test";
import { createHash, randomBytes } from "node:crypto";
import prisma from "../config/prisma.js";
import { claimBookingIntent, createBookingIntent } from "./booking-intent.service.js";

const mockMethod = (context, target, method, implementation) => {
  const original = target[method];
  target[method] = implementation;
  context.after(() => { target[method] = original; });
};

const room = {
  id: 8,
  price: 250,
  capacity: 3,
  available: true,
  maintenanceStatus: "AVAILABLE",
  guesthouse: { id: 12, name: "Test Guesthouse", city: "Gondar", status: "APPROVED" },
};

const mockSystemSettings = (context) => {
  mockMethod(context, prisma.systemSetting, "upsert", async () => ({ guestBookingEnabled: true }));
  mockMethod(context, prisma.systemLock, "upsert", async () => ({ isLocked: false, message: "" }));
};

test("creates a server-side intent with a hashed token and server-calculated total", async (context) => {
  mockSystemSettings(context);
  mockMethod(context, prisma, "$transaction", async (callback) => callback({
    $queryRaw: async (strings, ...values) => {
      if (!strings.join("?").includes('INSERT INTO "BookingIntent"')) return [];
      const [tokenHash, roomId, guesthouseId, checkIn, checkOut, guests, expiresAt] = values;
      return [{ id: 1, tokenHash, roomId, guesthouseId, checkIn, checkOut, guests, expiresAt }];
    },
    $executeRaw: async () => 1,
    room: { findUnique: async () => room },
    reservation: { findFirst: async () => null },
  }));

  const created = await createBookingIntent({
    guesthouseId: 12,
    roomId: 8,
    checkIn: "2099-01-10",
    checkOut: "2099-01-12",
    guests: 2,
  });

  assert.match(created.token, /^[A-Za-z0-9_-]{40,50}$/);
  assert.notEqual(createHash("sha256").update(created.token).digest("hex"), created.token);
  assert.equal(created.booking.guesthouseId, 12);
  assert.equal(created.booking.roomId, 8);
  assert.equal(created.booking.numberOfGuests, 2);
  assert.equal(created.booking.nights, 2);
  assert.equal(created.booking.totalPrice, 500);
  assert.equal(created.booking.pricePerNight, 250);
});

test("claims an intent for one guest and rejects a different guest", async (context) => {
  const token = randomBytes(32).toString("base64url");
  const intent = {
    id: 44,
    tokenHash: createHash("sha256").update(token).digest("hex"),
    userId: null,
    roomId: 8,
    guesthouseId: 12,
    checkIn: new Date("2099-01-10T00:00:00.000Z"),
    checkOut: new Date("2099-01-12T00:00:00.000Z"),
    guests: 2,
    expiresAt: new Date(Date.now() + 60_000),
    reservationId: null,
  };
  mockMethod(context, prisma, "$transaction", async (callback) => callback({
    $queryRaw: async (strings, ...values) => {
      const query = strings.join("?");
      if (query.includes('SELECT * FROM "BookingIntent"')) return [{ ...intent }];
      if (query.includes('UPDATE "BookingIntent"')) {
        if (intent.userId !== null) return [];
        intent.userId = values[0];
        return [{ ...intent }];
      }
      return [];
    },
    room: { findUnique: async () => room },
    reservation: { findFirst: async () => null },
  }));

  const claimed = await claimBookingIntent(token, 71);
  assert.equal(claimed.guesthouseId, 12);
  assert.equal(claimed.roomId, 8);
  assert.equal(claimed.totalPrice, 500);
  await assert.rejects(claimBookingIntent(token, 72), /expired/i);
});
