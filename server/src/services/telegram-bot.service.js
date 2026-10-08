import prisma from "../config/prisma.js";
import { generateToken } from "../utils/jwt.js";
import { callTelegramApi, sendTelegramMessage } from "./telegram-api.service.js";
import { consumeTelegramLinkCode } from "./telegram-link.service.js";

const DATE_PATTERN = /\b20\d{2}-\d{2}-\d{2}\b/g;
const ROOM_TYPES = ["SINGLE", "DOUBLE", "TWIN", "FAMILY", "SUITE"];
let pollingStarted = false;

export const parseTelegramSearch = (message) => {
  let query = String(message || "")
    .replace(/^\/search(?:@\w+)?\s*/i, "")
    .trim();
  const dateMatches = query.match(DATE_PATTERN) || [];
  const params = new URLSearchParams();

  if (dateMatches.length === 1) {
    throw new Error("Please provide both dates as YYYY-MM-DD.");
  }
  if (dateMatches.length > 2) {
    throw new Error("Please provide only check-in and check-out dates.");
  }
  if (dateMatches.length === 2) {
    params.set("checkIn", dateMatches[0]);
    params.set("checkOut", dateMatches[1]);
    query = query.replace(DATE_PATTERN, " ");
  }

  const roomType = ROOM_TYPES.find((type) =>
    new RegExp(`\\b${type}\\b`, "i").test(query)
  );
  if (roomType) {
    params.set("roomType", roomType);
    query = query.replace(new RegExp(`\\b${roomType}\\b`, "i"), " ");
  }

  const maxPrice = query.match(/\b(?:under|below|max(?:imum)?|up to)\s*(?:ETB|birr)?\s*([\d,]+)/i);
  if (maxPrice) {
    params.set("maxPrice", maxPrice[1].replaceAll(",", ""));
    query = query.replace(maxPrice[0], " ");
  }

  const locationPhrase = query.match(/\b(?:in|near|around|at|from)\s+(.+)$/i);
  if (locationPhrase) {
    query = locationPhrase[1];
  } else {
    query = query.replace(/^(?:find|search|show|available)\s+(?:(?:me|all)\s+)?(?:(?:guesthouses?|rooms?)\s+)?/i, "");
  }

  const location = query.replace(/\s+/g, " ").replace(/^[,\s]+|[,\s]+$/g, "");
  if (!location) {
    throw new Error("Please include a city, region, woreda, or other location.");
  }
  params.set("location", location);
  return params;
};

export const formatTelegramSearchResults = (guesthouses, params) => {
  if (!guesthouses.length) {
    return "No approved guesthouses with available rooms matched that search. Try a different location, room type, price, or date range.";
  }

  const dateRange = params.get("checkIn") && params.get("checkOut")
    ? ` for ${params.get("checkIn")} to ${params.get("checkOut")}`
    : "";
  const lines = [`Approved guesthouses and available rooms${dateRange}:`];

  for (const guesthouse of guesthouses.slice(0, 6)) {
    const location = [
      guesthouse.subCity,
      guesthouse.woreda,
      guesthouse.city,
      guesthouse.address,
    ].filter(Boolean).join(", ");
    lines.push(`\n${guesthouse.name} — ${location || "Ethiopia"}`);
    for (const room of (guesthouse.rooms || []).slice(0, 3)) {
      lines.push(
        `• ${room.roomType} · ${Number(room.price).toLocaleString("en-US")} ETB/night · Available`
      );
    }
  }

  if (guesthouses.length > 6) {
    lines.push("\nMore matches are available; narrow your search to see fewer results.");
  }
  return lines.join("\n").slice(0, 4000);
};

const getApiBaseUrl = () =>
  (process.env.TELEGRAM_API_BASE_URL ||
    `http://127.0.0.1:${process.env.PORT || 5000}`).replace(/\/$/, "");

const requestPlatformApi = async (path, { token, method = "GET", body } = {}) => {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(20000),
  });
  const result = await response.json();
  if (!response.ok || result.success === false) {
    throw new Error(result.message || `Platform API request failed (${response.status}).`);
  }
  return result.data;
};

const privateChat = (update) =>
  update.message?.chat?.type === "private" &&
  update.message?.from?.id &&
  String(update.message.chat.id) === String(update.message.from.id);

const reply = (chatId, text) => sendTelegramMessage(chatId, text);

const linkTelegramAccount = async (chatId, code) => {
  try {
    const user = await consumeTelegramLinkCode(code, chatId);
    await reply(
      chatId,
      `Your ${user.role} account is linked. Use /help to see what I can do.`
    );
  } catch (error) {
    if (error.code === "P2002") {
      await reply(chatId, "This Telegram account is already linked to another platform account. Unlink it first, or contact platform support.");
    } else {
      await reply(chatId, error.message);
    }
  }
};

const formatReservations = (reservations) => {
  if (!reservations.length) return "There are no reservations available to your account.";
  return reservations.slice(0, 10).map((reservation) => {
    const { guesthouse } = reservation.room;
    const dates = `${new Date(reservation.checkIn).toISOString().slice(0, 10)} to ${new Date(reservation.checkOut).toISOString().slice(0, 10)}`;
    const paymentStatus = reservation.payment?.status
      ? ` · Payment ${reservation.payment.status}`
      : "";
    return `#${reservation.id} ${guesthouse.name}, ${guesthouse.city}\n${reservation.room.roomType} · ${dates}\nStatus: ${reservation.status}${paymentStatus}`;
  }).join("\n\n").slice(0, 4000);
};

const formatPayments = (payments) => {
  if (!payments.length) return "There are no payments on your guest account.";
  return payments.slice(0, 10).map((payment) => {
    const reservation = payment.reservation;
    return `Reservation #${reservation.id} — ${reservation.room.guesthouse.name}\n${Number(payment.amount).toLocaleString("en-US")} ETB · ${payment.method} · ${payment.status}`;
  }).join("\n\n").slice(0, 4000);
};

const handleSearch = async (chatId, text) => {
  try {
    const params = parseTelegramSearch(text);
    const guesthouses = await requestPlatformApi(
      `/api/search/guesthouses?${params.toString()}`
    );
    await reply(chatId, formatTelegramSearchResults(guesthouses, params));
  } catch (error) {
    await reply(chatId, error.message);
  }
};

const handleUpdate = async (update) => {
  if (!privateChat(update)) return;
  const message = update.message;
  const chatId = String(message.chat.id);
  const text = String(message.text || "").trim();
  if (!text) return;

  const command = text.split(/\s+/, 1)[0].split("@", 1)[0].toLowerCase();
  if (command === "/start" && text.split(/\s+/)[1]) {
    await linkTelegramAccount(chatId, text.split(/\s+/)[1]);
    return;
  }
  if (command === "/link" && text.split(/\s+/)[1]) {
    await linkTelegramAccount(chatId, text.split(/\s+/)[1]);
    return;
  }
  if (command === "/start" || command === "/help") {
    await reply(chatId, [
      "Welcome to the Guesthouse Reservation assistant.",
      "",
      "/search <location> [room type] [max price] [check-in check-out] — find approved guesthouses and available rooms anywhere in Ethiopia",
      "/reservations — view reservations available to your account",
      "/payments — view your guest payment history",
      "/link <code> — link using the temporary code from your profile page",
      "/unlink — disconnect this Telegram account",
      "",
      "You can also ask a natural-language question and I will pass it to the platform AI assistant.",
      "Example: /search Bahir Dar DOUBLE under 1500 2026-11-10 2026-11-12",
    ].join("\n"));
    return;
  }
  if (command === "/search") {
    await handleSearch(chatId, text);
    return;
  }

  const user = await prisma.user.findUnique({
    where: { telegramChatId: chatId },
    select: { id: true, role: true },
  });
  if (command === "/unlink") {
    if (!user) {
      await reply(chatId, "This Telegram account is not linked.");
      return;
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        telegramChatId: null,
        telegramLinkCodeHash: null,
        telegramLinkExpiresAt: null,
      },
    });
    await reply(chatId, "Your Telegram account has been unlinked.");
    return;
  }
  if (!user) {
    await reply(chatId, "Link your account from the Telegram section of your signed-in platform profile. Use /help for bot commands.");
    return;
  }

  const token = generateToken(user);
  try {
    if (command === "/reservations") {
      const reservations = await requestPlatformApi("/api/reservations/mine", { token });
      await reply(chatId, formatReservations(reservations));
      return;
    }
    if (command === "/payments") {
      if (user.role !== "GUEST") {
        await reply(chatId, "Payment history is available here for guest accounts. Owners, receptionists, and admins can use their platform dashboards.");
        return;
      }
      const payments = await requestPlatformApi("/api/payments/history", { token });
      await reply(chatId, formatPayments(payments));
      return;
    }

    const answer = await requestPlatformApi("/api/ai/chat", {
      method: "POST",
      token,
      body: { message: text, history: [] },
    });
    await reply(chatId, answer.reply || "I couldn't prepare a response. Please try again.");
  } catch (error) {
    console.error("Telegram platform request failed:", error.message);
    await reply(chatId, "I couldn't complete that request right now. Please try again shortly.");
  }
};

export const startTelegramBot = () => {
  if (pollingStarted || !process.env.TELEGRAM_BOT_TOKEN?.trim()) return;
  pollingStarted = true;
  void pollTelegramUpdates();
};

const pollTelegramUpdates = async () => {
  let offset;
  try {
    await callTelegramApi("deleteWebhook", { drop_pending_updates: false });
    console.log("Telegram bot polling started.");
  } catch (error) {
    console.error("Telegram bot initialization failed:", error.message);
    pollingStarted = false;
    return;
  }

  while (pollingStarted) {
    try {
      const updates = await callTelegramApi(
        "getUpdates",
        {
          ...(offset === undefined ? {} : { offset }),
          timeout: 25,
          allowed_updates: ["message"],
        },
        35000
      );
      for (const update of updates) {
        offset = update.update_id + 1;
        try {
          await handleUpdate(update);
        } catch (error) {
          console.error("Telegram update handling failed:", error.message);
          const chatId = update.message?.chat?.id;
          if (chatId) {
            await reply(chatId, "Something went wrong while handling that request. Please try again.").catch(() => {});
          }
        }
      }
    } catch (error) {
      console.error("Telegram polling failed:", error.message);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};
