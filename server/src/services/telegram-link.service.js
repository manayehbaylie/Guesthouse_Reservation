import { createHash, randomBytes } from "node:crypto";
import prisma from "../config/prisma.js";

const hashCode = (code) =>
  createHash("sha256").update(code).digest("hex");

export const getTelegramLinkStatus = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { telegramChatId: true },
  });

  if (!user) throw new Error("User not found.");
  return { linked: Boolean(user.telegramChatId) };
};

export const createTelegramLinkCode = async (userId) => {
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

export const consumeTelegramLinkCode = async (code, chatId) => {
  if (!/^[\w-]{32}$/.test(String(code || ""))) {
    throw new Error("This Telegram link code is invalid or expired. Generate a new one from your platform profile.");
  }

  const codeHash = hashCode(code);
  const now = new Date();
  const user = await prisma.user.findUnique({
    where: { telegramLinkCodeHash: codeHash },
    select: {
      id: true,
      role: true,
      telegramLinkExpiresAt: true,
    },
  });

  if (!user || !user.telegramLinkExpiresAt || user.telegramLinkExpiresAt <= now) {
    throw new Error("This Telegram link code is invalid or expired. Generate a new one from your platform profile.");
  }

  const result = await prisma.user.updateMany({
    where: {
      id: user.id,
      telegramLinkCodeHash: codeHash,
      telegramLinkExpiresAt: { gt: now },
    },
    data: {
      telegramChatId: String(chatId),
      telegramLinkCodeHash: null,
      telegramLinkExpiresAt: null,
    },
  });

  if (result.count !== 1) {
    throw new Error("This Telegram link code has already been used. Generate a new one from your platform profile.");
  }

  return { id: user.id, role: user.role };
};

export const unlinkTelegramAccount = async (userId) => {
  await prisma.user.update({
    where: { id: Number(userId) },
    data: {
      telegramChatId: null,
      telegramLinkCodeHash: null,
      telegramLinkExpiresAt: null,
    },
  });
  return { linked: false };
};
