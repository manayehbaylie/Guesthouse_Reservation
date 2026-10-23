import { createHash, randomBytes } from "node:crypto";
import prisma from "../config/prisma.js";

const hashCode = (code) =>
  createHash("sha256").update(code).digest("hex");

export const getTelegramLinkStatus = async (userId) => {
  const account = await prisma.telegramAccount.findUnique({
    where: { userId: Number(userId) },
    select: { telegramId: true },
  });

  return { linked: Boolean(account) };
};

export const createTelegramLinkCode = async (userId) => {
  const existingAccount = await prisma.telegramAccount.findUnique({
    where: { userId: Number(userId) },
    select: { telegramId: true },
  });
  if (existingAccount) {
    const error = new Error("A Telegram account is already connected.");
    error.statusCode = 409;
    throw error;
  }

  const code = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { id: Number(userId) },
    data: {
      telegramLinkCodeHash: hashCode(code),
      telegramLinkExpiresAt: expiresAt,
    },
  });

  const username = process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, "").trim();
  return {
    code,
    expiresAt,
    linkUrl: username
      ? `https://t.me/${username}?start=${encodeURIComponent(code)}`
      : null,
  };
};

export const consumeTelegramLinkCode = async (code, telegramId) => {
  if (!/^[\w-]{32}$/.test(String(code || "")) || !/^\d+$/.test(String(telegramId || ""))) {
    throw new Error("This Telegram link code is invalid or expired. Generate a new one from your platform profile.");
  }

  const codeHash = hashCode(code);
  const now = new Date();
  const user = await prisma.user.findUnique({
    where: { telegramLinkCodeHash: codeHash },
    select: {
      id: true,
      role: true,
      language: true,
      telegramLinkExpiresAt: true,
    },
  });

  if (!user || !user.telegramLinkExpiresAt || user.telegramLinkExpiresAt <= now) {
    throw new Error("This Telegram link code is invalid or expired. Generate a new one from your platform profile.");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const linkedTelegram = await tx.telegramAccount.findUnique({
        where: { telegramId: String(telegramId) },
        select: { userId: true },
      });
      const linkedUser = await tx.telegramAccount.findUnique({
        where: { userId: user.id },
        select: { telegramId: true },
      });
      if (
        (linkedTelegram && linkedTelegram.userId !== user.id) ||
        (linkedUser && linkedUser.telegramId !== String(telegramId))
      ) {
        const error = new Error("This Telegram account is already linked to another account.");
        error.code = "TELEGRAM_ACCOUNT_ALREADY_LINKED";
        error.statusCode = 409;
        throw error;
      }

      const result = await tx.user.updateMany({
        where: {
          id: user.id,
          telegramLinkCodeHash: codeHash,
          telegramLinkExpiresAt: { gt: now },
        },
        data: {
          telegramChatId: null,
          telegramLinkCodeHash: null,
          telegramLinkExpiresAt: null,
        },
      });
      if (result.count !== 1) {
        throw new Error("This Telegram link code has already been used. Generate a new one from your platform profile.");
      }
      if (!linkedUser) {
        await tx.telegramAccount.create({
          data: { telegramId: String(telegramId), userId: user.id },
        });
      }
    });
  } catch (error) {
    if (error.code === "P2002") {
      const conflict = new Error("This Telegram account is already linked to another account.");
      conflict.code = "TELEGRAM_ACCOUNT_ALREADY_LINKED";
      conflict.statusCode = 409;
      throw conflict;
    }
    throw error;
  }

  return {
    id: user.id,
    role: user.role,
    ...(user.language ? { language: user.language } : {}),
  };
};

export const unlinkTelegramAccount = async (userId) => {
  await prisma.$transaction(async (tx) => {
    await tx.telegramAccount.deleteMany({ where: { userId: Number(userId) } });
    await tx.user.update({
      where: { id: Number(userId) },
      data: {
        telegramChatId: null,
        telegramLinkCodeHash: null,
        telegramLinkExpiresAt: null,
      },
    });
  });
  return { linked: false };
};
