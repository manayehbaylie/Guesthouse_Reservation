import { timingSafeEqual } from "node:crypto";
import {
  createTelegramLinkCode,
  getTelegramLinkStatus,
  unlinkTelegramAccount,
} from "../services/telegram-link.service.js";
import { successResponse } from "../utils/response.js";
import { getTelegramLoginConfig } from "../services/telegram-login.service.js";
import { handleTelegramUpdate, logTelegramError } from "../services/telegram-bot.service.js";

export const handleTelegramWebhook = async (req, res) => {
  const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (!configuredSecret) {
    return res.status(503).json({ ok: false });
  }

  const receivedSecret = String(req.get("x-telegram-bot-api-secret-token") || "");
  const expectedBuffer = Buffer.from(configuredSecret);
  const receivedBuffer = Buffer.from(receivedSecret);
  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    return res.status(401).json({ ok: false });
  }

  try {
    await handleTelegramUpdate(req.body);
    return res.status(200).json({ ok: true });
  } catch (error) {
    logTelegramError("Telegram webhook update failed", error);
    return res.status(500).json({ ok: false });
  }
};

export const getBotInfo = (req, res) => {
  const username = process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, "").trim();
  const configured = Boolean(username);

  return successResponse(res, {
    configured,
    username: configured ? username : null,
    url: configured ? `https://t.me/${username}` : null,
  }, "Telegram bot info fetched");
};

export const getLoginInfo = (req, res) =>
  successResponse(res, getTelegramLoginConfig(), "Telegram login info fetched");

export const getLinkStatus = async (req, res, next) => {
  try {
    const result = await getTelegramLinkStatus(req.user.id);
    return successResponse(res, result, "Telegram link status fetched");
  } catch (error) {
    next(error);
  }
};

export const createLinkCode = async (req, res, next) => {
  try {
    const result = await createTelegramLinkCode(req.user.id);
    return successResponse(res, result, "Telegram link code created");
  } catch (error) {
    next(error);
  }
};

export const unlink = async (req, res, next) => {
  try {
    const result = await unlinkTelegramAccount(req.user.id);
    return successResponse(res, result, "Telegram account unlinked");
  } catch (error) {
    next(error);
  }
};
