import {
  createTelegramLinkCode,
  getTelegramLinkStatus,
  unlinkTelegramAccount,
} from "../services/telegram-link.service.js";
import { successResponse } from "../utils/response.js";

export const getBotInfo = (req, res) => {
  const username = process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, "").trim();
  const configured = Boolean(username && process.env.TELEGRAM_BOT_TOKEN?.trim());

  return successResponse(res, {
    configured,
    username: configured ? username : null,
    url: configured ? `https://t.me/${username}` : null,
  }, "Telegram bot info fetched");
};

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
