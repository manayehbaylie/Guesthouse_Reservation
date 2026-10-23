import test from "node:test";
import assert from "node:assert/strict";
import { createDecipheriv, createHmac } from "node:crypto";
import axios from "axios";
import prisma from "../config/prisma.js";

process.env.CHAPA_SECRET_KEY ||= "test-only-chapa-secret";
const {
  createTelegramBookingDraft,
  encryptChapaAuthorization,
  finalizeVerifiedTelegramBookingDraft,
  initiateChapaBookingDraftDirectCharge,
  normalizeChapaMobile,
  selectTelegramBookingDraftPaymentMethod,
  verifyChapaWebhookSignature,
} = await import("./payment.service.js");

const replacePrismaMethod = (context, target, method, implementation) => {
  const original = target[method];
  target[method] = implementation;
  context.after(() => { target[method] = original; });
};

test("normalizes supported Ethiopian mobile formats and rejects unsupported numbers", () => {
  assert.equal(normalizeChapaMobile("0912345678"), "0912345678");
  assert.equal(normalizeChapaMobile("0712345678"), "0712345678");
  assert.equal(normalizeChapaMobile("+251 91 234 5678"), "0912345678");
  assert.equal(normalizeChapaMobile("251712345678"), "0712345678");
  assert.throws(() => normalizeChapaMobile("0612345678"), /Ethiopian mobile number/);
});

test("encrypts the authorization payload as decryptable 3DES", () => {
  const key = "123456789012345678901234";
  const encrypted = encryptChapaAuthorization({ requestID: "req-123", otp: "12345" }, key);
  const decipher = createDecipheriv("des-ede3", Buffer.from(key), null);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64")),
    decipher.final(),
  ]).toString("utf8");

  assert.deepEqual(JSON.parse(decrypted), { requestID: "req-123", otp: "12345" });
  assert.throws(() => encryptChapaAuthorization({ otp: "12345" }, "short"));
});

test("verifies Chapa webhook signatures and rejects invalid signatures", () => {
  const secret = "local-webhook-test-secret";
  const rawBody = Buffer.from('{"event":"charge.success","tx_ref":"GH-1-2"}');
  const payloadSignature = createHmac("sha256", secret).update(rawBody).digest("hex");
  const secretSignature = createHmac("sha256", secret).update(secret).digest("hex");

  assert.equal(verifyChapaWebhookSignature({ rawBody, headers: { "x-chapa-signature": payloadSignature }, secret }), true);
  assert.equal(verifyChapaWebhookSignature({ rawBody, headers: { "chapa-signature": secretSignature }, secret }), true);
  assert.equal(verifyChapaWebhookSignature({ rawBody, headers: { "x-chapa-signature": "00" }, secret }), false);
  assert.equal(verifyChapaWebhookSignature({ rawBody: "not a buffer", headers: { "x-chapa-signature": payloadSignature }, secret }), false);
});

test("creates a 30-minute booking draft without creating a reservation and rechecks at method selection", async (context) => {
  const bookingDraftDescriptor = Object.getOwnPropertyDescriptor(prisma, "bookingDraft");
  const transactionDescriptor = Object.getOwnPropertyDescriptor(prisma, "$transaction");
  const draft = { id: 71 };
  const dataWrites = [];
  let overlap = false;
  const room = {
    id: 9,
    price: 250,
    capacity: 3,
    available: true,
    maintenanceStatus: "AVAILABLE",
    guesthouse: { status: "APPROVED" },
  };
  const transaction = {
    $queryRaw: async () => [],
    room: { findUnique: async () => room },
    reservation: { findFirst: async () => overlap ? { id: 99 } : null },
    bookingDraft: {
      create: async ({ data }) => {
        dataWrites.push(data);
        Object.assign(draft, data, {
          userId: data.userId,
          user: { id: data.userId, fullName: "Test Guest", email: "guest@gmail.com", phone: "+251911111111" },
        });
        return structuredClone(draft);
      },
      findFirst: async () => structuredClone(draft),
      update: async ({ data }) => {
        Object.assign(draft, data);
        return structuredClone(draft);
      },
    },
  };
  Object.defineProperty(prisma, "bookingDraft", { configurable: true, value: transaction.bookingDraft });
  prisma.$transaction = async (callback) => callback(transaction);
  replacePrismaMethod(context, prisma.systemSetting, "upsert", async () => ({ guestBookingEnabled: true }));
  replacePrismaMethod(context, prisma.systemLock, "upsert", async () => ({ isLocked: false, message: "" }));
  context.after(() => {
    if (bookingDraftDescriptor) Object.defineProperty(prisma, "bookingDraft", bookingDraftDescriptor);
    else delete prisma.bookingDraft;
    if (transactionDescriptor) Object.defineProperty(prisma, "$transaction", transactionDescriptor);
    else delete prisma.$transaction;
  });

  const created = await createTelegramBookingDraft({
    userId: 42,
    roomId: 9,
    checkIn: "2030-11-10",
    checkOut: "2030-11-12",
    guests: 2,
  });

  assert.equal(dataWrites.length, 1);
  assert.equal(dataWrites[0].amount, 500);
  assert.equal(dataWrites[0].status, "PENDING");
  assert.equal(created.txRef.startsWith("GHD-"), true);
  assert.ok(created.expiresAt.getTime() > Date.now() + 29 * 60 * 1000);

  const selected = await selectTelegramBookingDraftPaymentMethod({ draftId: created.id, userId: 42, method: "MPESA" });
  assert.equal(selected.method, "MPESA");
  overlap = true;
  await assert.rejects(
    selectTelegramBookingDraftPaymentMethod({ draftId: created.id, userId: 42, method: "EBIRR" }),
    /no longer available/
  );
  assert.equal(draft.status, "FAILED");
});

test("finalizes verified drafts atomically and idempotently, or records refund-required without a reservation", async (context) => {
  const transactionDescriptor = Object.getOwnPropertyDescriptor(prisma, "$transaction");
  const draft = {
    id: 81,
    userId: 42,
    roomId: 9,
    checkIn: new Date("2030-11-10T00:00:00.000Z"),
    checkOut: new Date("2030-11-12T00:00:00.000Z"),
    guests: 2,
    amount: 500,
    txRef: "GHD-test-reference",
    method: "CBE_BIRR",
    status: "PENDING",
    expiresAt: new Date(Date.now() + 60_000),
    user: { id: 42, fullName: "Test Guest", email: "guest@gmail.com", phone: "+251911111111" },
    room: { id: 9, price: 250, capacity: 3, available: true, maintenanceStatus: "AVAILABLE", guesthouse: { status: "APPROVED" } },
  };
  let existingPayment = null;
  let overlap = false;
  let reservationCreates = 0;
  let paymentCreates = 0;
  const transaction = {
    $queryRaw: async () => [],
    bookingDraft: {
      findUnique: async () => structuredClone(draft),
      update: async ({ data }) => Object.assign(draft, data),
    },
    payment: {
      findUnique: async () => existingPayment,
      create: async ({ data }) => {
        paymentCreates += 1;
        existingPayment = { id: paymentCreates, ...data, reservation: data.reservationId ? { id: data.reservationId } : null };
        return existingPayment;
      },
    },
    room: { findUnique: async () => draft.room },
    reservation: {
      findFirst: async () => overlap ? { id: 7 } : null,
      create: async ({ data }) => {
        reservationCreates += 1;
        return { id: 91, ...data, guest: draft.user, room: { ...draft.room, guesthouse: { ownerId: 10, name: "House", city: "Gondar" } } };
      },
    },
  };
  prisma.$transaction = async (callback) => callback(transaction);
  context.after(() => {
    if (transactionDescriptor) Object.defineProperty(prisma, "$transaction", transactionDescriptor);
    else delete prisma.$transaction;
  });

  const paid = await finalizeVerifiedTelegramBookingDraft(draft);
  assert.equal(paid.payment.status, "PAID");
  assert.equal(paid.reservation.status, "CONFIRMED");
  assert.equal(paid.payment.reservationId, 91);
  assert.equal(paid.payment.bookingDraftId, draft.id);
  assert.equal(draft.status, "COMPLETED");
  const duplicate = await finalizeVerifiedTelegramBookingDraft(draft);
  assert.equal(duplicate.payment.id, paid.payment.id);
  assert.equal(reservationCreates, 1);
  assert.equal(paymentCreates, 1);

  existingPayment = null;
  draft.status = "PENDING";
  overlap = true;
  const refund = await finalizeVerifiedTelegramBookingDraft(draft);
  assert.equal(refund.refundRequired, true);
  assert.equal(refund.reservation, null);
  assert.equal(refund.payment.status, "REFUND_REQUIRED");
  assert.equal(refund.payment.reservationId, null);
  assert.equal(draft.status, "REFUND_REQUIRED");
  assert.equal(reservationCreates, 1);
  assert.equal(paymentCreates, 2);

  existingPayment = null;
  draft.status = "EXPIRED";
  draft.expiresAt = new Date(Date.now() - 1);
  overlap = false;
  const latePayment = await finalizeVerifiedTelegramBookingDraft(draft);
  assert.equal(latePayment.refundRequired, true);
  assert.equal(latePayment.payment.status, "REFUND_REQUIRED");
  assert.equal(latePayment.reservation, null);
  assert.equal(reservationCreates, 1);
  assert.equal(paymentCreates, 3);
});

test("starts a wallet direct charge with the draft txRef and selected Chapa type", async (context) => {
  const bookingDraftDescriptor = Object.getOwnPropertyDescriptor(prisma, "bookingDraft");
  const transactionDescriptor = Object.getOwnPropertyDescriptor(prisma, "$transaction");
  const axiosPost = axios.post;
  const draft = {
    id: 91,
    userId: 42,
    roomId: 9,
    checkIn: new Date("2030-11-10T00:00:00.000Z"),
    checkOut: new Date("2030-11-12T00:00:00.000Z"),
    guests: 2,
    amount: 500,
    txRef: "GHD-provider-reference",
    method: null,
    status: "PENDING",
    expiresAt: new Date(Date.now() + 60_000),
    user: { id: 42, fullName: "Test Guest", email: "guest@gmail.com", phone: "+251911111111" },
    room: { id: 9, price: 250, capacity: 3, available: true, maintenanceStatus: "AVAILABLE", guesthouse: { status: "APPROVED" } },
  };
  const providerCalls = [];
  const transaction = {
    $queryRaw: async () => [],
    room: { findUnique: async () => draft.room },
    reservation: { findFirst: async () => null },
    bookingDraft: {
      findFirst: async () => structuredClone(draft),
      update: async ({ data }) => Object.assign(draft, data),
    },
  };
  Object.defineProperty(prisma, "bookingDraft", { configurable: true, value: transaction.bookingDraft });
  prisma.$transaction = async (callback) => callback(transaction);
  axios.post = async (url, form, options) => {
    providerCalls.push({ url, txRef: form.get("tx_ref"), mobile: form.get("mobile"), options });
    return { data: { status: "success", data: { auth_type: "ussd", reference: "provider-reference" } } };
  };
  context.after(() => {
    if (bookingDraftDescriptor) Object.defineProperty(prisma, "bookingDraft", bookingDraftDescriptor);
    else delete prisma.bookingDraft;
    if (transactionDescriptor) Object.defineProperty(prisma, "$transaction", transactionDescriptor);
    else delete prisma.$transaction;
    axios.post = axiosPost;
  });

  const payment = await initiateChapaBookingDraftDirectCharge({
    draftId: draft.id,
    userId: draft.userId,
    type: "mpesa",
    mobile: "+251 91 234 5678",
  });

  assert.equal(providerCalls.length, 1);
  assert.match(providerCalls[0].url, /charges\?type=mpesa$/);
  assert.equal(providerCalls[0].txRef, draft.txRef);
  assert.equal(providerCalls[0].mobile, "0912345678");
  assert.equal(draft.method, "MPESA");
  assert.equal(payment.txRef, draft.txRef);
  assert.equal(payment.authType, "ussd");
});