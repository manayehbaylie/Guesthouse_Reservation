import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import prisma from "../config/prisma.js";
import {
  consumeTelegramLinkCode,
  createTelegramLinkCode,
  getTelegramLinkStatus,
  unlinkTelegramAccount,
} from "./telegram-link.service.js";

const hashCode = (code) =>
  createHash("sha256").update(code).digest("hex");

const mockMethod = (context, target, method, implementation) => {
  const original = target[method];
  target[method] = implementation;
  context.after(() => {
    target[method] = original;
  });
};

test("creates a temporary link using only a stored code hash", async (context) => {
  const previousUsername = process.env.TELEGRAM_BOT_USERNAME;
  process.env.TELEGRAM_BOT_USERNAME = "@GuesthouseTestBot";
  context.after(() => {
    if (previousUsername === undefined) delete process.env.TELEGRAM_BOT_USERNAME;
    else process.env.TELEGRAM_BOT_USERNAME = previousUsername;
  });

  let updateArgs;
  mockMethod(context, prisma.user, "update", async (args) => {
    updateArgs = args;
    return {};
  });
  mockMethod(context, prisma.telegramAccount, "findUnique", async () => null);

  const result = await createTelegramLinkCode(42);

  assert.match(result.code, /^[\w-]{32}$/);
  assert.equal(updateArgs.where.id, 42);
  assert.equal(updateArgs.data.telegramLinkCodeHash, hashCode(result.code));
  assert.notEqual(updateArgs.data.telegramLinkCodeHash, result.code);
  assert.ok(updateArgs.data.telegramLinkExpiresAt > new Date());
  assert.equal(
    result.linkUrl,
    `https://t.me/GuesthouseTestBot?start=${encodeURIComponent(result.code)}`
  );
});

test("consumes a valid code once and links the private chat to its account", async (context) => {
  const code = "abcdefghijklmnopqrstuvwx12345678";
  let updateArgs;
  let createArgs;
  mockMethod(context, prisma.user, "findUnique", async (args) => {
    assert.equal(args.where.telegramLinkCodeHash, hashCode(code));
    return {
      id: 42,
      role: "GUEST",
      language: "am",
      telegramLinkExpiresAt: new Date(Date.now() + 60_000),
    };
  });
  mockMethod(context, prisma, "$transaction", async (callback) => callback({
    user: {
      updateMany: async (args) => {
        updateArgs = args;
        return { count: 1 };
      },
    },
    telegramAccount: {
      findUnique: async () => null,
      create: async (args) => {
        createArgs = args;
        return args.data;
      },
    },
  }));

  const user = await consumeTelegramLinkCode(code, "987654321");

  assert.deepEqual(user, { id: 42, role: "GUEST", language: "am" });
  assert.equal(updateArgs.where.id, 42);
  assert.equal(updateArgs.where.telegramLinkCodeHash, hashCode(code));
  assert.ok(updateArgs.where.telegramLinkExpiresAt.gt instanceof Date);
  assert.ok(updateArgs.where.telegramLinkExpiresAt.gt <= new Date());
  assert.equal(updateArgs.data.telegramChatId, null);
  assert.equal(updateArgs.data.telegramLinkCodeHash, null);
  assert.equal(updateArgs.data.telegramLinkExpiresAt, null);
  assert.deepEqual(createArgs.data, { telegramId: "987654321", userId: 42 });
});

test("rejects a Telegram ID already linked to another account", async (context) => {
  const code = "abcdefghijklmnopqrstuvwx12345678";
  let codeConsumed = false;
  mockMethod(context, prisma.user, "findUnique", async () => ({
    id: 42,
    role: "GUEST",
    telegramLinkExpiresAt: new Date(Date.now() + 60_000),
  }));
  mockMethod(context, prisma, "$transaction", async (callback) => callback({
    user: {
      updateMany: async () => {
        codeConsumed = true;
        return { count: 1 };
      },
    },
    telegramAccount: {
      findUnique: async ({ where }) => where.telegramId ? { userId: 7 } : null,
      create: async () => assert.fail("A conflicting account must not be created"),
    },
  }));

  await assert.rejects(
    consumeTelegramLinkCode(code, "987654321"),
    (error) => error.code === "TELEGRAM_ACCOUNT_ALREADY_LINKED"
  );
  assert.equal(codeConsumed, false);
});

test("reads Telegram link status and unlinks the database account", async (context) => {
  let deleteArgs;
  let userUpdateArgs;
  mockMethod(context, prisma.telegramAccount, "findUnique", async ({ where }) =>
    where.userId === 42 ? { telegramId: "987654321" } : null
  );
  assert.deepEqual(await getTelegramLinkStatus(42), { linked: true });
  mockMethod(context, prisma, "$transaction", async (callback) => callback({
    telegramAccount: {
      deleteMany: async (args) => {
        deleteArgs = args;
        return { count: 1 };
      },
    },
    user: {
      update: async (args) => {
        userUpdateArgs = args;
        return {};
      },
    },
  }));

  assert.deepEqual(await unlinkTelegramAccount(42), { linked: false });
  assert.deepEqual(deleteArgs.where, { userId: 42 });
  assert.deepEqual(userUpdateArgs.data, {
    telegramChatId: null,
    telegramLinkCodeHash: null,
    telegramLinkExpiresAt: null,
  });
});

test("rejects expired codes without updating a user", async (context) => {
  let transactionAttempted = false;
  mockMethod(context, prisma.user, "findUnique", async () => ({
    id: 42,
    role: "GUEST",
    telegramLinkExpiresAt: new Date(Date.now() - 1000),
  }));
  mockMethod(context, prisma, "$transaction", async () => {
    transactionAttempted = true;
  });

  await assert.rejects(
    consumeTelegramLinkCode("abcdefghijklmnopqrstuvwx12345678", "987654321"),
    /invalid or expired/
  );
  assert.equal(transactionAttempted, false);
});

test("rejects a code that was already consumed by a concurrent request", async (context) => {
  mockMethod(context, prisma.user, "findUnique", async () => ({
    id: 42,
    role: "GUEST",
    telegramLinkExpiresAt: new Date(Date.now() + 60_000),
  }));
  mockMethod(context, prisma, "$transaction", async (callback) => callback({
    user: { updateMany: async () => ({ count: 0 }) },
    telegramAccount: { findUnique: async () => null, create: async () => ({}) },
  }));

  await assert.rejects(
    consumeTelegramLinkCode("abcdefghijklmnopqrstuvwx12345678", "987654321"),
    /already been used/
  );
});