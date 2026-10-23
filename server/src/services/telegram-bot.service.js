import { createCipheriv, createDecipheriv, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import prisma from "../config/prisma.js";
import { generateToken } from "../utils/jwt.js";
import { getEthiopianPhoneLookupCandidates } from "../utils/auth-normalization.js";
import {
  normalizeRegistrationPhone,
  validateRegistrationAddress,
  validateRegistrationConsent,
  validateRegistrationEmail,
  validateRegistrationIdNumber,
  validateRegistrationIdType,
  validateRegistrationName,
  validateRegistrationPassword,
  validateRegistrationPasswordConfirmation,
} from "./auth-validation.service.js";
import { REGISTRATION_ID_TYPES } from "../../../shared/registration-options.mjs";
import { registerUser, loginUser } from "./auth.service.js";
import { getReservationsForUser } from "./reservation.service.js";
import {
  calculateReservationAmount,
  authorizeChapaDirectCharge,
  createTelegramBookingDraft,
  expireTelegramBookingDrafts,
  getChapaPaymentStatus,
  getPaymentHistory,
  initiateChapaDirectCharge,
  initiateChapaBookingDraftCheckout,
  initiateChapaBookingDraftDirectCharge,
  initiatePayment,
  markTelegramBookingDraftFailed,
  normalizeChapaMobile,
  retryInitiatePayment,
  selectTelegramBookingDraftPaymentMethod,
  updatePaymentStatus,
} from "./payment.service.js";
import { searchGuesthouses, searchRooms } from "./search.service.js";
import { sendPasswordResetEmail } from "./email.service.js";
import {
  callTelegramApi,
  createPublicHttpsUrlButton,
  sendTelegramMessage,
} from "./telegram-api.service.js";
import { consumeTelegramLinkCode } from "./telegram-link.service.js";
import { normalizeTelegramLanguage, telegramText } from "./telegram-bot.i18n.js";

const DATE_PATTERN = /\b20\d{2}-\d{2}-\d{2}\b/g;
const ROOM_TYPES = ["SINGLE", "DOUBLE", "TWIN", "FAMILY", "SUITE"];
const CONVERSATION_TTL = 15 * 60 * 1000;
const CHAT_MESSAGE_RATE_LIMIT = 20;
const chatRateLimits = new Map();
const paymentPollers = new Map();
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5175").replace(/\/$/, "");
let pollingStarted = false;
let conversationCleanupTimer;

export const getTelegramProfileLink = (frontendUrl = FRONTEND_URL) =>
  `${String(frontendUrl).replace(/\/$/, "")}/profile?telegram=link`;

const redactTelegramSensitiveData = (value) => {
  let redacted = String(value || "");
  for (const name of [
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_WEBHOOK_SECRET",
    "CHAPA_SECRET_KEY",
    "CHAPA_ENCRYPTION_KEY",
    "CHAPA_WEBHOOK_SECRET",
    "JWT_SECRET",
    "RESET_CODE_SECRET",
  ]) {
    const secret = process.env[name]?.trim();
    if (secret) redacted = redacted.split(secret).join("[REDACTED_SECRET]");
  }
  return redacted
    .replace(/bot\d+:[A-Za-z0-9_-]{20,}/g, "bot[REDACTED_TELEGRAM_TOKEN]")
    .replace(/(?:\+?251[\s()-]?[79](?:[\s()-]?\d){8}|0[79](?:[\s()-]?\d){8})/g, "[REDACTED_PHONE]")
    .replace(/([\"']?(?:otp|one[- ]time code)[\"']?\s*[:=]\s*[\"']?)\d{4,8}([\"']?)/gi, "$1[REDACTED_CODE]$2");
};

export const logTelegramError = (context, error) => {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : "";
  console.error(`${context}: ${redactTelegramSensitiveData(message)}${stack ? `\n${redactTelegramSensitiveData(stack)}` : ""}`);
};

const MENU_ACTION_KEYS = {
  menuSearch: "search",
  menuReservations: "reservations",
  menuPayments: "payments",
  menuLink: "link",
  menuLanguage: "language",
  menuHelp: "help",
  menuLogout: "logout",
};

const telegramActionLabels = new Map(
  Object.entries(MENU_ACTION_KEYS).flatMap(([key, action]) =>
    ["en", "am"].map((language) => [telegramText(language, key).trim().toLocaleLowerCase(), action])
  )
);

const TELEGRAM_COMMAND_ACTIONS = new Map([
  ["/start", "start"],
  ["/help", "help"],
  ["/menu", "menu"],
  ["/cancel", "cancel"],
  ["/search", "search"],
  ["/reservations", "reservations"],
  ["/payments", "payments"],
  ["/link", "link"],
  ["/language", "language"],
  ["/logout", "logout"],
  ["/unlink", "unlink"],
]);

export const classifyTelegramIntent = (text) => {
  const normalized = String(text || "").trim().toLowerCase().replace(/[.!?፧]/g, "").replace(/\s+/g, " ");
  const command = normalized.split(/\s+/, 1)[0].split("@", 1)[0];
  if (TELEGRAM_COMMAND_ACTIONS.has(command)) return TELEGRAM_COMMAND_ACTIONS.get(command);
  if (telegramActionLabels.has(normalized)) return telegramActionLabels.get(normalized);
  if (/^(?:my reservations|my bookings|reservations|bookings|ቦታ ማስያዣዎቼ|የእኔ ቦታ ማስያዣዎች)$/.test(normalized)) return "reservations";
  if (/^(?:my payments|payments|payment history|ክፍያ|ክፍያዎቼ|የእኔ ክፍያዎች)$/.test(normalized)) return "payments";
  if (/^(?:help|start|እርዳታ|እገዛ)$/.test(normalized)) return "help";
  if (/^(?:search|find|ፈልግ)$/.test(normalized)) return "search";
  if (/^(?:link account|link my account|መለያ አገናኝ|መለያዬን አገናኝ)$/.test(normalized)) return "link";
  if (/^(?:language|ቋንቋ)$/.test(normalized)) return "language";
  if (/^(?:logout|log out|sign out|ውጣ)$/iu.test(normalized)) return "logout";
  const original = String(text || "").trim();
  if (/[?፧]|^(?:what|where|when|why|how|can|could|is|are|do|does|which|who)\b/i.test(original) || /^(?:ምን|የት|መቼ|ለምን|እንዴት)/u.test(original)) return "question";
  if (/^(?:hi|hello|hey|thanks?|thank you|good morning|good evening|ሰላም|አመሰግናለሁ)$/iu.test(normalized)) return "unknown";
  if (/\p{L}/u.test(normalized) && normalized.length <= 120) return "location";
  return "unknown";
};

export const getTelegramIntentAccess = (intent, linked) => ({
  action: intent,
  requiresLink: ["reservations", "payments", "question", "book"].includes(intent) && !linked,
  linkButton: ["reservations", "payments", "question", "book"].includes(intent) && !linked,
});

const dateOnly = (year, month, day) => {
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) return null;
  return date;
};

const toDateOnlyString = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const validateTelegramDate = (input, today = new Date()) => {
  const text = String(input || "").trim();
  let year;
  let month;
  let day;
  let match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (match) [, year, month, day] = match;

  if (!match && (match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text))) {
    day = match[1];
    month = match[2];
    year = match[3];
  }

  if (!match) return { date: null, problem: "format" };
  const parsed = dateOnly(year, month, day);
  if (!parsed) return { date: null, problem: "invalid" };

  const parsedDay = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (parsedDay < todayStart) return { date: null, problem: "past" };

  return { date: toDateOnlyString(parsed), problem: null };
};

export const parseTelegramDate = (input, today = new Date()) =>
  validateTelegramDate(input, today).date;

const telegramDateError = (language, problem, today = new Date()) =>
  telegramText(language, {
    format: "invalidDateFormat",
    invalid: "invalidDateValue",
    past: "dateInPast",
    checkout: "checkoutBeforeCheckin",
  }[problem] || "invalidDateValue", { today: toDateOnlyString(today) });

export const advanceTelegramSearch = (state, input) => {
  const next = { ...state, data: { ...state.data } };
  if (next.step === "CHECKIN") {
    const result = validateTelegramDate(input);
    if (!result.date) return { state, error: true, errorKey: result.problem };
    next.data.checkIn = result.date;
    next.step = "CHECKOUT";
  } else if (next.step === "CHECKOUT") {
    const result = validateTelegramDate(input);
    if (!result.date) return { state, error: true, errorKey: result.problem };
    if (next.data.checkIn && result.date <= next.data.checkIn) return { state, error: true, errorKey: "checkout" };
    next.data.checkOut = result.date;
    next.step = "RUN";
  }
  return { state: next };
};

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

export const dedupeTelegramRooms = (rooms = []) => {
  const uniqueRooms = new Map();
  for (const room of rooms) {
    const key = `${room.roomType}:${Number(room.price)}`;
    const current = uniqueRooms.get(key);
    if (!current || Number(room.capacity) > Number(current.capacity)) {
      uniqueRooms.set(key, room);
    }
  }
  return [...uniqueRooms.values()];
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
    for (const room of dedupeTelegramRooms(guesthouse.rooms).slice(0, 3)) {
      lines.push(
        `• ${room.roomType} · ${Number(room.price).toLocaleString("en-US")} ETB/night · Available`
      );
    }
  }

  if (guesthouses.length > 6) {
    lines.push("\nMore matches are available; narrow your search to see fewer results.");
  }
  return lines.join("\n");
};

const normalizeCity = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, " ")
  .trim();

const cityAliases = new Map([
  ["gonder", "gondar"],
  ["gondar", "gondar"],
]);

const editDistance = (first, second) => {
  let previous = Array.from({ length: second.length + 1 }, (_, index) => index);
  for (let row = 1; row <= first.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= second.length; column += 1) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (first[row - 1] === second[column - 1] ? 0 : 1)
      );
    }
    previous = current;
  }
  return previous[second.length];
};

export const matchTelegramCity = (query, cities) => {
  const normalizedQuery = normalizeCity(query);
  if (!normalizedQuery) return null;
  const canonicalQuery = cityAliases.get(normalizedQuery) || normalizedQuery;
  const exact = cities.find((city) => {
    const normalizedCity = normalizeCity(city);
    return (cityAliases.get(normalizedCity) || normalizedCity) === canonicalQuery;
  });
  if (exact) return exact;

  let bestCity = null;
  let bestScore = 0;
  for (const city of cities) {
    const normalizedCity = normalizeCity(city);
    const canonicalCity = cityAliases.get(normalizedCity) || normalizedCity;
    const score = 1 - editDistance(canonicalQuery, canonicalCity) / Math.max(canonicalQuery.length, canonicalCity.length, 1);
    if (score > bestScore) {
      bestCity = city;
      bestScore = score;
    }
  }
  return bestScore >= 0.72 ? bestCity : null;
};

const suggestTelegramCities = (query, cities) => {
  const normalizedQuery = cityAliases.get(normalizeCity(query)) || normalizeCity(query);
  return [...cities]
    .map((city) => {
      const normalizedCity = normalizeCity(city);
      const canonicalCity = cityAliases.get(normalizedCity) || normalizedCity;
      return { city, distance: editDistance(normalizedQuery, canonicalCity) };
    })
    .sort((first, second) => first.distance - second.distance || first.city.localeCompare(second.city))
    .slice(0, 3)
    .map(({ city }) => city);
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

const privateChat = (update) => {
  const chat = update.message?.chat || update.callback_query?.message?.chat;
  const user = update.message?.from || update.callback_query?.from;
  return chat?.type === "private" && user?.id && String(chat.id) === String(user.id);
};

const menuMarkup = (language, role) => ({
  keyboard: [
    ...(role === "GUEST"
      ? [
          [{ text: telegramText(language, "menuSearch") }, { text: telegramText(language, "menuReservations") }],
          [{ text: telegramText(language, "menuPayments") }, { text: telegramText(language, "menuLanguage") }],
          [{ text: telegramText(language, "menuHelp") }, { text: telegramText(language, "menuLogout") }],
        ]
      : [
          [{ text: telegramText(language, "menuReservations") }, { text: telegramText(language, "menuPayments") }],
          [{ text: telegramText(language, "menuLanguage") }, { text: telegramText(language, "menuHelp") }],
          [{ text: telegramText(language, "menuLogout") }],
        ]),
  ],
  resize_keyboard: true,
  is_persistent: true,
});

const reply = async (chatId, text, language = "en", options = {}) => {
  const user = options.reply_markup ? null : await getLinkedUser(chatId);
  return sendTelegramMessage(chatId, text, {
    reply_markup: options.reply_markup || menuMarkup(language, user?.role),
    ...options,
  });
};

const inlineMarkup = (rows) => ({
  inline_keyboard: rows
    .map((row) => row.filter((button) =>
      button.callback_data === undefined || Buffer.byteLength(String(button.callback_data), "utf8") <= 64
    ))
    .filter((row) => row.length),
});
const cancelMarkup = (language, includeBack = false) => inlineMarkup([[
  ...(includeBack ? [{ text: telegramText(language, "back"), callback_data: "back" }] : []),
  { text: telegramText(language, "cancel"), callback_data: "cancel" },
]]);

const maskEmail = (email) => {
  const [local, domain] = String(email || "").split("@");
  if (!local || !domain) return "***";
  return `${local[0]}***${local.length > 1 ? local.at(-1) : ""}@${domain}`;
};

const registrationCodeMarkup = (language) => inlineMarkup([
  [
    { text: telegramText(language, "resendCode"), callback_data: "auth:resend_code" },
    { text: telegramText(language, "changeEmail"), callback_data: "auth:change_email" },
  ],
  [
    { text: telegramText(language, "back"), callback_data: "back" },
    { text: telegramText(language, "cancel"), callback_data: "cancel" },
  ],
]);
const profileUrl = () => getTelegramProfileLink();

const sendProfileLinkMessage = (chatId, text, language) => {
  const url = profileUrl();
  const button = createPublicHttpsUrlButton(telegramText(language, "profileLink"), url);
  return reply(
    chatId,
    button ? text : `${text}\n\n${url}`,
    language,
    button ? { reply_markup: inlineMarkup([[button]]) } : {}
  );
};

const sendCheckoutLinkMessage = (chatId, text, checkoutUrl, language) => {
  const button = createPublicHttpsUrlButton(telegramText(language, "payWithChapa"), checkoutUrl);
  if (!button) throw new Error("Chapa did not provide a valid public HTTPS checkout URL.");
  return reply(chatId, text, language, { reply_markup: inlineMarkup([[button]]) });
};

const ownerGuesthouseRegistrationUrl = () => {
  try {
    const frontendUrl = process.env.FRONTEND_URL?.trim() || FRONTEND_URL;
    const url = new URL("/owner/guesthouse", frontendUrl);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
};

const ownerDashboardUrl = () => {
  try {
    const frontendUrl = process.env.FRONTEND_URL?.trim() || FRONTEND_URL;
    const url = new URL("/owner", frontendUrl);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
};

const sendOwnerGuesthouseGuidance = (chatId, language) => {
  const dashboardUrl = ownerDashboardUrl();
  const url = ownerGuesthouseRegistrationUrl();
  const text = telegramText(language, "ownerGuesthouseGuidance");
  return reply(chatId, text, language, {
    reply_markup: inlineMarkup([
      ...(dashboardUrl ? [[{ text: telegramText(language, "ownerDashboard"), url: dashboardUrl }]] : []),
      ...(url ? [[{ text: telegramText(language, "registerGuesthouseOnWebsite"), url }]] : []),
    ]),
  });
};

const startPaymentPoller = ({ chatId, userId, draftId, draftExpiresAt, paymentId, txRef }) => {
  if (!txRef || (!draftId && !paymentId) || paymentPollers.has(txRef)) return;
  for (const [previousTxRef, poller] of paymentPollers) {
    if ((paymentId && poller.paymentId === paymentId) || (draftId && poller.draftId === draftId)) {
      clearTimeout(poller.timer);
      paymentPollers.delete(previousTxRef);
    }
  }
  const expiresAt = draftId
    ? new Date(draftExpiresAt).getTime()
    : Date.now() + 10 * 60 * 1000;
  const expirePoll = async () => {
    if (draftId) {
      const finalStatus = await getChapaPaymentStatus(userId, txRef).catch((error) => {
        logTelegramError("Telegram final Chapa status check failed", error);
        return null;
      });
      if (["PAID", "FAILED", "REFUND_REQUIRED", "EXPIRED"].includes(String(finalStatus?.status).toUpperCase())) {
        return;
      }
      await expireTelegramBookingDrafts();
    } else {
      await updatePaymentStatus(paymentId, "FAILED");
    }
  };
  const poll = async () => {
    try {
      if (Date.now() >= expiresAt) {
        await expirePoll();
        paymentPollers.delete(txRef);
        if (chatId) await setConversation(chatId, null);
        return;
      }
      const payment = await getChapaPaymentStatus(userId, txRef);
      if (["PAID", "FAILED", "REFUND_REQUIRED", "EXPIRED"].includes(String(payment.status).toUpperCase())) {
        paymentPollers.delete(txRef);
        if (chatId) await setConversation(chatId, null);
        return;
      }
      if (Date.now() >= expiresAt) {
        await expirePoll();
        paymentPollers.delete(txRef);
        if (chatId) await setConversation(chatId, null);
        return;
      }
    } catch (error) {
      logTelegramError("Telegram Chapa payment poll failed", error);
    }
    if (Date.now() >= expiresAt) {
      paymentPollers.delete(txRef);
      return;
    }
    const timer = setTimeout(poll, Math.min(10_000, Math.max(0, expiresAt - Date.now())));
    timer.unref?.();
    paymentPollers.set(txRef, { timer, paymentId, draftId });
  };
  const timer = setTimeout(poll, 10_000);
  timer.unref?.();
  paymentPollers.set(txRef, { timer, paymentId, draftId });
};

export const paymentMethodsMarkup = (language) => inlineMarkup([
  [
    { text: telegramText(language, "payTelebirr"), callback_data: "payment:method:telebirr" },
    { text: telegramText(language, "bankCbe"), callback_data: "payment:method:cbebirr" },
  ],
  [
    { text: telegramText(language, "bankEbirr"), callback_data: "payment:method:ebirr" },
    { text: telegramText(language, "bankMpesa"), callback_data: "payment:method:mpesa" },
  ],
  [{ text: telegramText(language, "payBankCard"), callback_data: "payment:method:bank_card" }],
  [{ text: telegramText(language, "cancel"), callback_data: "cancel" }],
]);

const showPaymentMethods = async (chatId, reservationId, userId, language, retry = false) => {
  await setConversation(chatId, {
    kind: "payment",
    step: "METHOD",
    userId,
    reservationId,
    retry,
    data: {},
  });
  await reply(chatId, telegramText(language, "paymentChoicePrompt", { id: reservationId }), language, {
    reply_markup: paymentMethodsMarkup(language),
  });
};

const showDraftPaymentMethods = async (chatId, draft, language) => {
  await setConversation(chatId, {
    kind: "payment",
    step: "METHOD",
    userId: draft.userId,
    draftId: draft.id,
    amount: draft.amount,
    expiresAt: draft.expiresAt,
    data: {},
  });
  await reply(chatId, telegramText(language, "draftPaymentChoicePrompt", {
    amount: Number(draft.amount).toLocaleString("en-US"),
  }), language, { reply_markup: paymentMethodsMarkup(language) });
};

const sendHostedPayment = async ({ chatId, userId, reservationId, language, method, retry }) => {
  let payment;
  try {
    payment = retry
      ? await retryInitiatePayment({ reservationId, method })
      : await initiatePayment({ reservationId, method });
  } catch (error) {
    logTelegramError("Telegram hosted payment initialization failed", error);
    await setConversation(chatId, null);
    await reply(chatId, telegramText(language, "paymentFailedRetry", { id: reservationId }), language, {
      reply_markup: inlineMarkup([[{
        text: telegramText(language, "tryAnotherMethod"),
        callback_data: `payment:choose:${reservationId}`,
      }]]),
    });
    return;
  }
  await setConversation(chatId, null);
  startPaymentPoller({ chatId, userId, paymentId: payment.paymentId, txRef: payment.txRef });
  await sendCheckoutLinkMessage(
    chatId,
    telegramText(language, "bookingCreated", { id: reservationId }),
    payment.checkoutUrl,
    language
  );
};

const sendHostedDraftPayment = async ({ chatId, userId, draftId, language }) => {
  try {
    const payment = await initiateChapaBookingDraftCheckout({ draftId, userId });
    await setConversation(chatId, null);
    startPaymentPoller({
      chatId,
      userId,
      draftId,
      draftExpiresAt: payment.expiresAt,
      txRef: payment.txRef,
    });
    await sendCheckoutLinkMessage(
      chatId,
      telegramText(language, "draftCheckoutMessage"),
      payment.checkoutUrl,
      language
    );
  } catch (error) {
    logTelegramError("Telegram draft hosted payment initialization failed", error);
    await markTelegramBookingDraftFailed(draftId, userId);
    await setConversation(chatId, null);
    await reply(chatId, telegramText(language, "bookingDraftPaymentFailed"), language, {
      reply_markup: inlineMarkup([[
        { text: telegramText(language, "searchAgain"), callback_data: "search:start" },
      ]]),
    });
  }
};

const getLinkedUser = async (chatId) => {
  const account = await prisma.telegramAccount.findUnique({
    where: { telegramId: String(chatId) },
    include: { user: { select: { id: true, role: true, language: true } } },
  });
  return account?.user || null;
};

const getLanguage = async (chatId, telegramLanguage) => {
  const user = await getLinkedUser(chatId);
  const state = await loadChatState(chatId);
  const language = normalizeTelegramLanguage(user?.language || state.language || telegramLanguage);
  if (!user && state.language !== language) {
    state.language = language;
    await saveChatState(chatId, state);
  }
  return language;
};

const loadChatState = async (chatId) => {
  const record = await prisma.telegramConversation.findUnique({ where: { chatId } });
  if (!record) return {};
  if (record.expiresAt <= new Date()) {
    await prisma.telegramConversation.deleteMany({ where: { chatId, expiresAt: { lte: new Date() } } });
    return {};
  }

  const state = record.state && typeof record.state === "object" ? record.state : {};
  return structuredClone(state);
};

const saveChatState = async (chatId, state) => {
  const entries = Object.entries(state).filter(([, value]) => value !== undefined && value !== null);
  if (!entries.length) {
    await prisma.telegramConversation.deleteMany({ where: { chatId } });
    return;
  }

  const expiresAt = new Date(Date.now() + CONVERSATION_TTL);
  const normalizedState = JSON.parse(JSON.stringify(Object.fromEntries(entries)));
  await prisma.telegramConversation.upsert({
    where: { chatId },
    create: { chatId, state: normalizedState, expiresAt },
    update: { state: normalizedState, expiresAt },
  });
};

const setConversation = async (chatId, conversation) => {
  const state = await loadChatState(chatId);
  if (conversation) {
    if (conversation.kind === "auth" && conversation.data?.registrationSecretCipher) {
      conversation.data.registrationSecretExpiresAt = Date.now() + CONVERSATION_TTL;
    }
    state.conversation = conversation;
  }
  else delete state.conversation;
  await saveChatState(chatId, state);
};

const getConversation = async (chatId) => (await loadChatState(chatId)).conversation || null;

const registrationSecretKey = () => {
  const secret = process.env.RESET_CODE_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error("Registration secret encryption is not configured.");
  return createHmac("sha256", secret).update("telegram-registration-state").digest();
};

const encryptRegistrationSecrets = (secrets) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", registrationSecretKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(secrets), "utf8"),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
};

const decryptRegistrationSecrets = (value) => {
  const [ivText, tagText, encryptedText] = String(value || "").split(".");
  if (!ivText || !tagText || !encryptedText) throw new Error("Registration session is invalid. Please restart registration.");
  try {
    const decipher = createDecipheriv("aes-256-gcm", registrationSecretKey(), Buffer.from(ivText, "base64url"));
    decipher.setAuthTag(Buffer.from(tagText, "base64url"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedText, "base64url")),
      decipher.final(),
    ]).toString("utf8");
    return JSON.parse(decrypted);
  } catch {
    throw new Error("Registration session is invalid. Please restart registration.");
  }
};

const readRegistrationSecrets = (data = {}) => {
  if (data.registrationSecretExpiresAt > Date.now() && data.registrationSecretCipher) {
    return decryptRegistrationSecrets(data.registrationSecretCipher);
  }
  return {};
};

const writeRegistrationSecrets = (data, values) => {
  const secrets = {
    ...readRegistrationSecrets(data),
    ...values,
    expiresAt: Date.now() + CONVERSATION_TTL,
  };
  const { expiresAt, ...encryptedValues } = secrets;
  data.registrationSecretCipher = encryptRegistrationSecrets(encryptedValues);
  data.registrationSecretExpiresAt = expiresAt;
};

const deleteRegistrationSecret = (key, data = {}) => {
  const secrets = readRegistrationSecrets(data);
  delete secrets[key];
  const remaining = Object.keys(secrets).filter((name) => name !== "expiresAt");
  if (!remaining.length) {
    delete data.registrationSecretCipher;
    delete data.registrationSecretExpiresAt;
  } else {
    writeRegistrationSecrets(data, secrets);
  }
};

const cancelActiveConversation = async (chatId) => {
  const conversation = await getConversation(chatId);
  if (conversation?.kind === "payment") {
    if (conversation.draftId) {
      await markTelegramBookingDraftFailed(conversation.draftId, conversation.userId).catch(() => {});
    } else if (conversation.data?.paymentId) {
      await updatePaymentStatus(conversation.data.paymentId, "FAILED").catch(() => {});
    }
  }
  await setConversation(chatId, null);
  return conversation;
};

const registrationCodeHash = (code) => createHmac(
  "sha256",
  process.env.RESET_CODE_SECRET || process.env.JWT_SECRET
).update(code).digest("hex");

const equalCodeHash = (left, right) => {
  const leftBuffer = Buffer.from(String(left || ""), "hex");
  const rightBuffer = Buffer.from(String(right || ""), "hex");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

const authButtons = (language) => inlineMarkup([
  [{ text: telegramText(language, "register"), callback_data: "auth:register" }],
  [{ text: telegramText(language, "login"), callback_data: "auth:login" }],
]);

const registrationRoleMarkup = (language) => inlineMarkup([
  [{ text: telegramText(language, "registerAsGuest"), callback_data: "auth:role:GUEST" }],
  [{ text: telegramText(language, "registerAsOwner"), callback_data: "auth:role:OWNER" }],
  [{ text: telegramText(language, "back"), callback_data: "back" }],
  [{ text: telegramText(language, "cancel"), callback_data: "cancel" }],
]);

const registrationIdTypeMarkup = (language) => inlineMarkup([
  ...REGISTRATION_ID_TYPES.map((idType) => [{ text: telegramText(language, idType), callback_data: `auth:id_type:${REGISTRATION_ID_TYPES.indexOf(idType)}` }]),
  [{ text: telegramText(language, "back"), callback_data: "back" }],
  [{ text: telegramText(language, "cancel"), callback_data: "cancel" }],
]);

const frontendLegalUrl = (path) => {
  try {
    const url = new URL(path, process.env.FRONTEND_URL?.trim() || FRONTEND_URL);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
};

const registrationConsentMarkup = (language) => inlineMarkup([
  [
    ...(frontendLegalUrl("/terms") ? [{ text: telegramText(language, "termsOfService"), url: frontendLegalUrl("/terms") }] : []),
    ...(frontendLegalUrl("/privacy") ? [{ text: telegramText(language, "privacyPolicy"), url: frontendLegalUrl("/privacy") }] : []),
  ],
  [{ text: telegramText(language, "agreeToPolicies"), callback_data: "auth:consent" }],
  [{ text: telegramText(language, "back"), callback_data: "back" }],
  [{ text: telegramText(language, "cancel"), callback_data: "cancel" }],
]);

const registrationSummaryMarkup = (language) => inlineMarkup([[
  { text: telegramText(language, "confirmRegistration"), callback_data: "auth:confirm_registration" },
  { text: telegramText(language, "back"), callback_data: "back" },
  { text: telegramText(language, "cancel"), callback_data: "cancel" },
]]);

const maskIdNumber = (value) => {
  const idNumber = String(value || "");
  return idNumber.length > 4 ? `****${idNumber.slice(-4)}` : "****";
};

const promptLogin = (chatId, language) => reply(
  chatId,
  telegramText(language, "loginAgain"),
  language,
  { reply_markup: authButtons(language) }
);

const linkTelegramUser = async (chatId, user) => {
  const existingTelegram = await prisma.telegramAccount.findUnique({
    where: { telegramId: String(chatId) },
    select: { userId: true },
  });
  if (existingTelegram && existingTelegram.userId !== user.id) {
    const error = new Error("This Telegram account is already linked to another platform account.");
    error.code = "TELEGRAM_ACCOUNT_ALREADY_LINKED";
    throw error;
  }
  const existing = await prisma.telegramAccount.findUnique({
    where: { userId: user.id },
    select: { telegramId: true },
  });
  if (existing && existing.telegramId !== String(chatId)) {
    const error = new Error("This account is already linked to another Telegram account.");
    error.code = "TELEGRAM_ACCOUNT_ALREADY_LINKED";
    throw error;
  }
  await prisma.telegramAccount.upsert({
    where: { telegramId: String(chatId) },
    create: { telegramId: String(chatId), userId: user.id },
    update: { userId: user.id },
  });
};

const unlinkTelegramUser = async (chatId, userId) => {
  await prisma.$transaction(async (tx) => {
    await tx.telegramAccount.deleteMany({ where: { telegramId: String(chatId) } });
    await tx.user.update({
      where: { id: userId },
      data: {
        telegramChatId: null,
        telegramLinkCodeHash: null,
        telegramLinkExpiresAt: null,
      },
    });
  });
};

const startRegistration = async (chatId, language) => {
  const state = { kind: "auth", step: "REGISTER_ROLE", data: {} };
  await setConversation(chatId, state);
  await showRegistrationStep(chatId, state, language);
};

const startLogin = async (chatId, language) => {
  await setConversation(chatId, { kind: "auth", step: "LOGIN_EMAIL", data: {} });
  await reply(chatId, telegramText(language, "askLoginEmail"), language, { reply_markup: cancelMarkup(language) });
};

const finishTelegramAuth = async (chatId, user, language, messageKey = "whatNext") => {
  await linkTelegramUser(chatId, user);
  await setConversation(chatId, null);
  const selectedLanguage = normalizeTelegramLanguage(user.language || language);
  if (user.role === "OWNER") {
    await sendOwnerGuesthouseGuidance(chatId, selectedLanguage);
    await reply(chatId, telegramText(selectedLanguage, messageKey), selectedLanguage);
  } else {
    await reply(chatId, telegramText(selectedLanguage, messageKey), selectedLanguage);
  }
  await resumePendingAction(chatId, user, selectedLanguage);
};

const sendRegistrationCode = async (chatId, language, state, data) => {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await sendPasswordResetEmail(data.email, code);
  data.codeHash = registrationCodeHash(code);
  data.codeExpiresAt = Date.now() + 10 * 60 * 1000;
  data.codeSentAt = Date.now();
  data.failedCodeAttempts ??= 0;
  await setConversation(chatId, { ...state, step: "REGISTER_CODE", data });
  await reply(chatId, telegramText(language, "emailCodePrompt", { email: maskEmail(data.email) }), language, {
    reply_markup: registrationCodeMarkup(language),
  });
};

const processAuthText = async (chatId, text, language, state) => {
  const data = { ...state.data };
  if (state.step === "REGISTER_NAME") {
    const fullName = validateRegistrationName(text);
    data.fullName = fullName;
    await setConversation(chatId, { ...state, step: "REGISTER_EMAIL", data });
    await reply(chatId, telegramText(language, data.role === "OWNER" ? "askRegisterEmail" : "askRegisterGuestEmail"), language, {
      reply_markup: inlineMarkup([
        ...(data.role === "GUEST" ? [[{ text: telegramText(language, "skip"), callback_data: "auth:skip_email" }]] : []),
        [{ text: telegramText(language, "back"), callback_data: "back" }, { text: telegramText(language, "cancel"), callback_data: "cancel" }],
      ]),
    });
    return;
  }

  if (state.step === "REGISTER_EMAIL") {
    const { email, normalizedEmail } = await validateRegistrationEmail(text.trim(), data.role);
    if (email) {
      const existing = await prisma.user.findFirst({
        where: { OR: [{ normalizedEmail }, { email }] },
        select: { id: true },
      });
      if (existing) throw Object.assign(new Error("This email is already registered."), { field: "email" });
    }
    data.email = email;
    data.normalizedEmail = normalizedEmail;
    if (data.role === "OWNER") {
      await sendRegistrationCode(chatId, language, state, data);
    } else {
      await setConversation(chatId, { ...state, step: "REGISTER_PHONE", data });
      await reply(chatId, telegramText(language, "askRegisterPhone"), language, { reply_markup: cancelMarkup(language, true) });
    }
    return;
  }

  if (state.step === "REGISTER_PHONE") {
    const phone = normalizeRegistrationPhone(text);
    const candidates = getEthiopianPhoneLookupCandidates(phone);
    const existing = await prisma.user.findFirst({
      where: { OR: [{ normalizedPhone: phone }, { phone: { in: candidates } }] },
      select: { id: true },
    });
    if (existing) throw Object.assign(new Error("This phone number is already registered."), { field: "phone" });
    data.phone = phone;
    if (data.role === "OWNER") {
      await setConversation(chatId, { ...state, step: "REGISTER_ADDRESS", data });
      await reply(chatId, telegramText(language, "askRegisterAddress"), language, { reply_markup: cancelMarkup(language, true) });
    } else {
      await setConversation(chatId, { ...state, step: "REGISTER_PASSWORD", data });
      await reply(chatId, telegramText(language, "askRegisterPassword"), language, { reply_markup: cancelMarkup(language, true) });
    }
    return;
  }

  if (state.step === "REGISTER_CODE") {
    if (!/^\d{6}$/.test(text)) {
      await reply(chatId, telegramText(language, "enterSixDigitCode", { email: maskEmail(data.email) }), language, {
        reply_markup: registrationCodeMarkup(language),
      });
      return;
    }
    if (data.codeExpiresAt <= Date.now() || !equalCodeHash(data.codeHash, registrationCodeHash(text))) {
      data.failedCodeAttempts = Number(data.failedCodeAttempts || 0) + 1;
      if (data.failedCodeAttempts >= 5) {
        await setConversation(chatId, null);
        await reply(chatId, telegramText(language, "emailCodeAttemptsExceeded"), language, {
          reply_markup: authButtons(language),
        });
        return;
      }
      await setConversation(chatId, { ...state, data });
      await reply(chatId, telegramText(language, "invalidEmailCode", { email: maskEmail(data.email) }), language, {
        reply_markup: registrationCodeMarkup(language),
      });
      return;
    }
    await setConversation(chatId, { ...state, step: "REGISTER_PHONE", data });
    await reply(chatId, telegramText(language, "askRegisterPhone"), language, { reply_markup: cancelMarkup(language, true) });
    return;
  }

  if (state.step === "REGISTER_ADDRESS") {
    data.residentialAddress = validateRegistrationAddress(text);
    await setConversation(chatId, { ...state, step: "REGISTER_ID_TYPE", data });
    await reply(chatId, telegramText(language, "askRegisterIdType"), language, { reply_markup: registrationIdTypeMarkup(language) });
    return;
  }

  if (state.step === "REGISTER_ID_NUMBER") {
    writeRegistrationSecrets(data, { idNumber: validateRegistrationIdNumber(text) });
    await setConversation(chatId, { ...state, step: "REGISTER_PASSWORD", data });
    await reply(chatId, telegramText(language, "askRegisterPassword"), language, { reply_markup: cancelMarkup(language, true) });
    return;
  }

  if (state.step === "REGISTER_PASSWORD") {
    writeRegistrationSecrets(data, { password: validateRegistrationPassword(text) });
    await setConversation(chatId, { ...state, step: "REGISTER_CONFIRM_PASSWORD", data });
    await reply(chatId, telegramText(language, "askRegisterConfirmPassword"), language, { reply_markup: cancelMarkup(language, true) });
    return;
  }

  if (state.step === "REGISTER_CONFIRM_PASSWORD") {
    const secrets = readRegistrationSecrets(data);
    validateRegistrationPasswordConfirmation(secrets.password, text);
    writeRegistrationSecrets(data, { confirmPassword: text });
    await setConversation(chatId, { ...state, step: "REGISTER_CONSENT", data });
    await reply(chatId, telegramText(language, "agreeToPoliciesPrompt"), language, {
      reply_markup: registrationConsentMarkup(language),
    });
    return;
  }

  if (state.step === "LOGIN_EMAIL") {
    const email = text.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      await reply(chatId, telegramText(language, "askLoginEmail"), language, { reply_markup: cancelMarkup(language) });
      return;
    }
    data.email = email;
    await setConversation(chatId, { ...state, step: "LOGIN_PASSWORD", data });
    await reply(chatId, telegramText(language, "askLoginPassword"), language, { reply_markup: cancelMarkup(language, true) });
    return;
  }

  if (state.step === "LOGIN_PASSWORD") {
    const result = await loginUser(data.email, text);
    await finishTelegramAuth(chatId, result.user, language);
  }
};

const showRegistrationSummary = async (chatId, state, language) => {
  const owner = state.data.role === "OWNER";
  const secrets = readRegistrationSecrets(state.data);
  const key = owner ? "registrationSummaryOwner" : "registrationSummaryGuest";
  await setConversation(chatId, { ...state, step: "REGISTER_SUMMARY" });
  await reply(chatId, telegramText(language, key, {
    name: state.data.fullName,
    email: state.data.email || "-",
    phone: state.data.phone,
    address: state.data.residentialAddress,
    idType: state.data.idType,
    idNumber: maskIdNumber(secrets.idNumber),
  }), language, { reply_markup: registrationSummaryMarkup(language) });
};

const showRegistrationStep = async (chatId, state, language) => {
  const promptWithBack = (text) => reply(chatId, telegramText(language, text), language, { reply_markup: cancelMarkup(language, true) });
  if (state.step === "REGISTER_ROLE") {
    await reply(chatId, telegramText(language, "askRegisterRole"), language, { reply_markup: registrationRoleMarkup(language) });
  } else if (state.step === "REGISTER_NAME") {
    await promptWithBack("askRegisterName");
  } else if (state.step === "REGISTER_EMAIL") {
    await reply(chatId, telegramText(language, state.data.role === "OWNER" ? "askRegisterEmail" : "askRegisterGuestEmail"), language, {
      reply_markup: inlineMarkup([
        ...(state.data.role === "GUEST" ? [[{ text: telegramText(language, "skip"), callback_data: "auth:skip_email" }]] : []),
        [{ text: telegramText(language, "back"), callback_data: "back" }, { text: telegramText(language, "cancel"), callback_data: "cancel" }],
      ]),
    });
  } else if (state.step === "REGISTER_CODE") {
    await reply(chatId, telegramText(language, "emailCodePrompt", { email: maskEmail(state.data.email) }), language, {
      reply_markup: registrationCodeMarkup(language),
    });
  } else if (state.step === "REGISTER_ADDRESS") {
    await promptWithBack("askRegisterAddress");
  } else if (state.step === "REGISTER_ID_TYPE") {
    await reply(chatId, telegramText(language, "askRegisterIdType"), language, { reply_markup: registrationIdTypeMarkup(language) });
  } else if (state.step === "REGISTER_ID_NUMBER") {
    await promptWithBack("askRegisterIdNumber");
  } else if (state.step === "REGISTER_PASSWORD") {
    await promptWithBack("askRegisterPassword");
  } else if (state.step === "REGISTER_CONFIRM_PASSWORD") {
    await promptWithBack("askRegisterConfirmPassword");
  } else if (state.step === "REGISTER_CONSENT") {
    await reply(chatId, telegramText(language, "agreeToPoliciesPrompt"), language, { reply_markup: registrationConsentMarkup(language) });
  } else if (state.step === "REGISTER_SUMMARY") {
    await showRegistrationSummary(chatId, state, language);
  } else if (state.step === "REGISTER_PHONE") {
    await promptWithBack("askRegisterPhone");
  }
};

const setPendingAction = async (chatId, action) => {
  const state = await loadChatState(chatId);
  state.pendingAction = action;
  await saveChatState(chatId, state);
};

const takePendingAction = async (chatId) => {
  const state = await loadChatState(chatId);
  const action = state.pendingAction || null;
  delete state.pendingAction;
  await saveChatState(chatId, state);
  return action;
};

const allowChatMessage = (chatId) => {
  const now = Date.now();
  const recent = (chatRateLimits.get(chatId) || []).filter((time) => now - time < 10000);
  if (recent.length >= CHAT_MESSAGE_RATE_LIMIT) return false;
  recent.push(now);
  chatRateLimits.set(chatId, recent);
  return true;
};

const statusIcon = (status = "") => ({
  PENDING: "⏳",
  CONFIRMED: "✅",
  COMPLETED: "✅",
  CANCELLED: "✖️",
  REJECTED: "✖️",
  PAID: "✅",
  FAILED: "❌",
}[String(status).toUpperCase()] || "•");

const showReservations = async (chatId, user, language) => {
  const reservations = await getReservationsForUser(user);
  if (!reservations.length) {
    await reply(chatId, telegramText(language, "reservationsEmpty"), language);
    return;
  }
  await reply(chatId, telegramText(language, "reservationsTitle"), language);
  for (const reservation of reservations.slice(0, 10)) {
    const guesthouse = reservation.room?.guesthouse || {};
    const dates = `${new Date(reservation.checkIn).toISOString().slice(0, 10)} to ${new Date(reservation.checkOut).toISOString().slice(0, 10)}`;
    const payment = reservation.payment?.status ? ` · ${statusIcon(reservation.payment.status)} ${reservation.payment.status}` : "";
    const text = `${statusIcon(reservation.status)} #${reservation.id} ${guesthouse.name || "Guesthouse"}, ${guesthouse.city || ""}\n${reservation.room?.roomType || "Room"} · ${dates}\n${reservation.status}${payment}`;
    const rows = (reservation.status === "PENDING" && !reservation.payment) || reservation.payment?.status === "FAILED"
      ? [[{ text: telegramText(language, "payNow"), callback_data: `pay:${reservation.id}` }]]
      : [];
    await reply(chatId, text, language, rows.length ? { reply_markup: inlineMarkup(rows) } : {});
  }
};

const showPayments = async (chatId, user, language) => {
  if (user.role !== "GUEST") {
    await reply(chatId, telegramText(language, "bookingGuestsOnly"), language);
    return;
  }
  const payments = await getPaymentHistory(user.id);
  if (!payments.length) {
    await reply(chatId, telegramText(language, "paymentsEmpty"), language);
    return;
  }
  await reply(chatId, telegramText(language, "paymentsTitle"), language);
  for (const payment of payments.slice(0, 10)) {
    const reservation = payment.reservation;
    await reply(
      chatId,
      `${statusIcon(payment.status)} Reservation #${reservation.id} — ${reservation.room.guesthouse.name}\n${Number(payment.amount).toLocaleString("en-US")} ETB · ${payment.method} · ${payment.status}`,
      language
    );
  }
};

const showRoomTypeChoices = (chatId, language) => reply(chatId, telegramText(language, "askRoomType"), language, {
  reply_markup: inlineMarkup([
    [{ text: telegramText(language, "roomSingle"), callback_data: "flow:type:SINGLE" }, { text: telegramText(language, "roomDouble"), callback_data: "flow:type:DOUBLE" }],
    [{ text: telegramText(language, "roomTwin"), callback_data: "flow:type:TWIN" }, { text: telegramText(language, "roomFamily"), callback_data: "flow:type:FAMILY" }],
    [{ text: telegramText(language, "roomSuite"), callback_data: "flow:type:SUITE" }],
    [{ text: telegramText(language, "back"), callback_data: "back" }],
    [{ text: telegramText(language, "cancel"), callback_data: "cancel" }],
  ]),
});

const startSearch = async (chatId, language) => {
  const user = await getLinkedUser(chatId);
  if (!user) {
    await promptLogin(chatId, language);
    return;
  }
  if (user.role !== "GUEST") {
    await reply(chatId, telegramText(language, "paymentsGuestOnly"), language);
    return;
  }
  const rows = await prisma.guesthouse.findMany({
    where: { status: "APPROVED" },
    select: { city: true },
    distinct: ["city"],
    orderBy: { city: "asc" },
  });
  const cities = rows.map(({ city }) => city).filter(Boolean);
  const state = { kind: "search", step: "CITY", userId: user.id, data: {}, cityOptions: cities };
  await setConversation(chatId, state);
  if (!cities.length) {
    await reply(chatId, telegramText(language, "noApprovedCities"), language);
    return;
  }
  await reply(chatId, telegramText(language, "askCity"), language, { reply_markup: cancelMarkup(language) });
};

const showCityGuesthouses = async (chatId, state, city, language) => {
  const houses = await prisma.guesthouse.findMany({
    where: { status: "APPROVED", city },
    select: { id: true, name: true, address: true, woreda: true },
    orderBy: { name: "asc" },
  });
  if (!houses.length) {
    await reply(chatId, telegramText(language, "noApprovedGuesthouses"), language);
    return;
  }
  const areas = new Map();
  for (const house of houses) {
    const labels = [...new Set([house.woreda, house.address].map((value) => String(value || "").trim()).filter(Boolean))];
    for (const label of labels) {
      const key = label.toLocaleLowerCase();
      const option = areas.get(key) || { label, guesthouseIds: [] };
      option.guesthouseIds.push(house.id);
      areas.set(key, option);
    }
  }
  state.step = "AREA";
  state.data.city = city;
  state.houseOptions = houses;
  state.areaOptions = [...areas.values()];
  await setConversation(chatId, state);
  const houseList = houses.map((house) => {
    const location = [house.woreda, house.address].filter(Boolean).join(" / ") || "Address not provided";
    return `• ${house.name} — ${location}`;
  }).join("\n");
  const buttons = state.areaOptions.map((area, index) => ({ text: area.label, callback_data: `flow:area:${index}` }));
  const buttonRows = [];
  for (let index = 0; index < buttons.length; index += 2) buttonRows.push(buttons.slice(index, index + 2));
  buttonRows.push([{ text: telegramText(language, "all"), callback_data: "flow:area:all" }]);
  buttonRows.push([{ text: telegramText(language, "back"), callback_data: "back" }]);
  buttonRows.push([{ text: telegramText(language, "cancel"), callback_data: "cancel" }]);
  await reply(chatId, telegramText(language, "approvedGuesthouses", { city, houses: houseList }), language, { reply_markup: inlineMarkup(buttonRows) });
};

const startLanguageChoice = (chatId, language) => reply(chatId, telegramText(language, "languagePrompt"), language, {
  reply_markup: inlineMarkup([
    [{ text: telegramText(language, "languageEnglish"), callback_data: "language:en" }],
    [{ text: telegramText(language, "languageAmharic"), callback_data: "language:am" }],
  ]),
});

const sendLinkHelp = (chatId, language) => sendProfileLinkMessage(chatId, telegramText(language, "notLinked"), language);

const resumePendingAction = async (chatId, user, language) => {
  const action = await takePendingAction(chatId);
  if (!action) return;
  if (action.type === "reservations") {
    await showReservations(chatId, user, language);
  } else if (action.type === "payments") {
    await showPayments(chatId, user, language);
  } else if (action.type === "question") {
    try {
      const answer = await requestPlatformApi("/api/ai/chat", {
        method: "POST",
        token: generateToken(user),
        body: { message: action.message, history: [] },
      });
      await reply(chatId, answer.reply || telegramText(language, "actionFailed"), language);
    } catch (error) {
      logTelegramError("Telegram AI request after linking failed", error);
      await reply(chatId, telegramText(language, "actionFailed"), language);
    }
  }
};

const linkTelegramAccount = async (chatId, code, language) => {
  let user;
  try {
    user = await consumeTelegramLinkCode(code, chatId);
    await linkTelegramUser(chatId, user);
  } catch (error) {
    const message = ["P2002", "TELEGRAM_ACCOUNT_ALREADY_LINKED"].includes(error.code)
      ? telegramText(language, "alreadyLinked")
      : telegramText(language, "invalidLink");
    await sendProfileLinkMessage(chatId, message, language);
    return;
  }

  const selectedLanguage = normalizeTelegramLanguage(user.language || language);
  if (!user.language) await prisma.user.update({ where: { id: user.id }, data: { language: selectedLanguage } });
  await reply(chatId, telegramText(selectedLanguage, "linked"), selectedLanguage);
  await resumePendingAction(chatId, user, selectedLanguage);
};

const showAvailableRoomChoices = async (chatId, state, language) => {
  const buttons = (state.roomOptions || []).slice(0, 50).map((room) => {
    const quote = calculateReservationAmount({ room, checkIn: state.data.checkIn, checkOut: state.data.checkOut });
    return {
      text: telegramText(language, "availableRoomChoice", {
        house: room.guesthouse.name,
        roomType: telegramText(language, `room${room.roomType[0]}${room.roomType.slice(1).toLowerCase()}`),
        price: Number(room.price).toLocaleString("en-US"),
        total: quote.amount.toLocaleString("en-US"),
      }),
      callback_data: `flow:room:${room.id}`,
    };
  });
  const rows = buttons.map((button) => [button]);
  rows.push([{ text: telegramText(language, "back"), callback_data: "back" }]);
  rows.push([{ text: telegramText(language, "cancel"), callback_data: "cancel" }]);
  await reply(chatId, telegramText(language, "availableRooms"), language, { reply_markup: inlineMarkup(rows) });
};

const listAvailableRooms = async (chatId, state, language) => {
  const rooms = await searchRooms({
    roomType: state.data.roomType,
    checkIn: state.data.checkIn,
    checkOut: state.data.checkOut,
  });
  const filteredRooms = rooms.filter((room) => state.guesthouseIds.includes(room.guesthouseId));
  if (!filteredRooms.length) {
    await setConversation(chatId, null);
    await reply(chatId, telegramText(language, "noRoomsForDates"), language);
    return;
  }

  state.step = "ROOM";
  state.roomOptions = filteredRooms;
  await setConversation(chatId, state);
  await showAvailableRoomChoices(chatId, state, language);
};

const processSearchText = async (chatId, text, language, state) => {
  if (state.step === "CITY") {
    const city = matchTelegramCity(text, state.cityOptions || []);
    if (city) {
      await showCityGuesthouses(chatId, state, city, language);
      return;
    }
    const suggestions = suggestTelegramCities(text, state.cityOptions || []);
    state.citySuggestionOptions = suggestions;
    await setConversation(chatId, state);
    const buttons = suggestions.map((option, index) => ({ text: option, callback_data: `flow:city:${index}` }));
    const rows = buttons.map((button) => [button]);
    rows.push([{ text: telegramText(language, "cancel"), callback_data: "cancel" }]);
    await reply(chatId, telegramText(language, "citySuggestions", { city: text }), language, {
      reply_markup: inlineMarkup(rows),
    });
    return;
  }
  if (state.step !== "CHECKIN" && state.step !== "CHECKOUT") {
    await reply(chatId, telegramText(language, "chooseFromButtons"), language, { reply_markup: cancelMarkup(language, true) });
    return;
  }

  const result = validateTelegramDate(text);
  if (!result.date) {
    await reply(chatId, telegramDateError(language, result.problem), language, { reply_markup: cancelMarkup(language, true) });
    return;
  }
  if (state.step === "CHECKIN") {
    state.data.checkIn = result.date;
    state.step = "CHECKOUT";
    await setConversation(chatId, state);
    await reply(chatId, telegramText(language, "askCheckOut"), language, { reply_markup: cancelMarkup(language, true) });
    return;
  }
  if (result.date <= state.data.checkIn) {
    await reply(chatId, telegramDateError(language, "checkout"), language, { reply_markup: cancelMarkup(language, true) });
    return;
  }
  state.data.checkOut = result.date;
  try {
    await listAvailableRooms(chatId, state, language);
  } catch (error) {
    logTelegramError("Telegram room availability search failed", error);
    await reply(chatId, telegramText(language, "searchError"), language);
  }
};

const showBookingSummary = async (chatId, state, language) => {
  const quote = calculateReservationAmount({ room: state.room, checkIn: state.data.checkIn, checkOut: state.data.checkOut });
  await reply(chatId, telegramText(language, "confirmBooking", {
    house: state.guesthouse.name,
    room: telegramText(language, `room${state.room.roomType[0]}${state.room.roomType.slice(1).toLowerCase()}`),
    price: Number(state.room.price).toLocaleString("en-US"),
    checkIn: state.data.checkIn,
    checkOut: state.data.checkOut,
    guests: state.data.guests,
    total: quote.amount.toLocaleString("en-US"),
  }), language, { reply_markup: inlineMarkup([[{ text: telegramText(language, "back"), callback_data: "back" }, { text: telegramText(language, "confirm"), callback_data: "booking:confirm" }, { text: telegramText(language, "cancel"), callback_data: "cancel" }]]) });
};

const processBookingText = async (chatId, text, language, state) => {
  if (state.step !== "GUESTS") return;
  const count = Number(text);
  if (!Number.isInteger(count) || count < 1 || count > Number(state.room.capacity)) {
    await reply(chatId, telegramText(language, "askGuests"), language, { reply_markup: cancelMarkup(language, true) });
    return;
  }
  state.data.guests = count;
  state.step = "CONFIRM";
  await setConversation(chatId, state);
  await showBookingSummary(chatId, state, language);
};

const processPaymentText = async (chatId, text, language, state) => {
  if (state.step === "PHONE") {
    let mobile;
    try {
      mobile = normalizeChapaMobile(text);
    } catch {
      await reply(chatId, telegramText(language, "invalidPaymentMobile"), language, { reply_markup: cancelMarkup(language, true) });
      return;
    }
    const user = await getLinkedUser(chatId);
    if (!user || user.role !== "GUEST" || user.id !== state.userId) {
      await setConversation(chatId, null);
      await promptLogin(chatId, language);
      return;
    }
    let payment;
    try {
      payment = state.draftId
        ? await initiateChapaBookingDraftDirectCharge({
            draftId: state.draftId,
            userId: state.userId,
            type: state.data.type,
            mobile,
          })
        : await initiateChapaDirectCharge({
            reservationId: state.reservationId,
            type: state.data.type,
            mobile,
            retry: state.retry,
          });
      if (payment.checkoutUrl) {
        await setConversation(chatId, null);
        startPaymentPoller({
          chatId,
          userId: user.id,
          draftId: payment.draftId,
          draftExpiresAt: payment.expiresAt,
          paymentId: payment.paymentId,
          txRef: payment.txRef,
        });
        await sendCheckoutLinkMessage(chatId, telegramText(language, "completeEnatPortal"), payment.checkoutUrl, language);
        return;
      }
      const authorization = payment.authType === "otp"
        ? payment
        : await authorizeChapaDirectCharge({
            type: payment.type,
            authType: "ussd",
            reference: payment.reference,
            requestId: payment.requestId,
          });
      if (authorization.authType === "otp") {
        state.step = "OTP";
        state.data = {
          ...state.data,
          paymentId: payment.paymentId,
          draftId: payment.draftId || state.draftId,
          draftExpiresAt: payment.expiresAt || state.expiresAt,
          txRef: payment.txRef,
          reference: authorization.reference || payment.reference,
          requestId: authorization.requestId || payment.requestId,
          otpAttempts: 0,
        };
        await setConversation(chatId, state);
        await reply(chatId, telegramText(language, "askPaymentOtp"), language, { reply_markup: cancelMarkup(language) });
        return;
      }
      await setConversation(chatId, null);
      startPaymentPoller({
        chatId,
        userId: user.id,
        draftId: payment.draftId,
        draftExpiresAt: payment.expiresAt,
        paymentId: payment.paymentId,
        txRef: payment.txRef,
      });
      await reply(chatId, telegramText(language, "approvePhonePrompt"), language);
      return;
    } catch {
      if (state.draftId) {
        await markTelegramBookingDraftFailed(state.draftId, state.userId).catch(() => {});
        await setConversation(chatId, null);
        await reply(chatId, telegramText(language, "bookingDraftPaymentFailed"), language, {
          reply_markup: inlineMarkup([[
            { text: telegramText(language, "searchAgain"), callback_data: "search:start" },
          ]]),
        });
        return;
      }
      if (payment?.paymentId) {
        await updatePaymentStatus(payment.paymentId, "FAILED").catch(() => {});
        await setConversation(chatId, null);
        return;
      }
      await setConversation(chatId, null);
      await reply(chatId, telegramText(language, "paymentFailedRetry", { id: state.reservationId }), language, {
        reply_markup: inlineMarkup([[{
          text: telegramText(language, "tryAnotherMethod"),
          callback_data: `payment:choose:${state.reservationId}`,
        }]]),
      });
      return;
    }
  }

  if (state.step === "OTP") {
    if (!/^\d{4,8}$/.test(text)) {
      await reply(chatId, telegramText(language, "askPaymentOtp"), language, { reply_markup: cancelMarkup(language) });
      return;
    }
    try {
      const authorization = await authorizeChapaDirectCharge({
        type: state.data.type,
        authType: "otp",
        reference: state.data.reference,
        requestId: state.data.requestId,
        otp: text,
      });
      if (authorization.authType === "otp" && authorization.requestId) {
        state.data = { ...state.data, requestId: authorization.requestId };
        await setConversation(chatId, state);
        await reply(chatId, telegramText(language, "askPaymentOtp"), language, { reply_markup: cancelMarkup(language) });
        return;
      }
      const user = await getLinkedUser(chatId);
      await setConversation(chatId, null);
      if (user?.id === state.userId) {
        startPaymentPoller({
          chatId,
          userId: user.id,
          draftId: state.data.draftId,
          draftExpiresAt: state.data.draftExpiresAt,
          paymentId: state.data.paymentId,
          txRef: state.data.txRef,
        });
      }
      await reply(chatId, telegramText(language, "paymentVerifying"), language);
    } catch {
      const attempts = Number(state.data.otpAttempts || 0) + 1;
      if (attempts >= 5) {
        await setConversation(chatId, null);
        if (state.data.draftId) await markTelegramBookingDraftFailed(state.data.draftId, state.userId).catch(() => {});
        else await updatePaymentStatus(state.data.paymentId, "FAILED").catch(() => {});
        return;
      }
      state.data.otpAttempts = attempts;
      await setConversation(chatId, state);
      await reply(chatId, telegramText(language, "askPaymentOtp"), language, { reply_markup: cancelMarkup(language) });
    }
  }
};

export const reservationFailureMessage = (error) => {
  const message = String(error?.message || "");
  const capacity = /number of guests must be between \d+ and (\d+)/i.exec(message);
  if (capacity) return `this room allows ${capacity[1]} guests`;
  if (error?.statusCode === 401 || /authentication required|invalid session|session expired/i.test(message)) {
    return "please log in again";
  }
  if (/room.*(?:not available|no longer available|taken)|overlapping reservation/i.test(message)) {
    return "room no longer available";
  }
  return "something went wrong, please try again";
};

const processMessage = async (update) => {
  const message = update.message;
  const chatId = String(message.chat.id);
  const text = String(message.text || "").trim();
  if (!text) return;
  if (!allowChatMessage(chatId)) return;
  const language = await getLanguage(chatId, message.from?.language_code);
  const command = text.split(/\s+/, 1)[0].split("@", 1)[0].toLowerCase();
  const args = text.split(/\s+/).slice(1);
  const menuIntent = classifyTelegramIntent(text);
  if (command === "/start") await cancelActiveConversation(chatId);
  if (command === "/start" && !args[0]) {
    const user = await getLinkedUser(chatId);
    const state = await loadChatState(chatId);
    delete state.conversation;
    delete state.pendingAction;
    await saveChatState(chatId, state);
    await reply(
      chatId,
      telegramText(language, user ? "welcomeLinked" : "welcome"),
      language,
      user ? {} : { reply_markup: authButtons(language) }
    );
    return;
  }
  if ((command === "/start" || command === "/link") && args[0]) {
    await linkTelegramAccount(chatId, args[0], language);
    return;
  }
  if (menuIntent === "menu") {
    const user = await getLinkedUser(chatId);
    await cancelActiveConversation(chatId);
    const state = await loadChatState(chatId);
    delete state.conversation;
    delete state.pendingAction;
    await saveChatState(chatId, state);
    await reply(chatId, telegramText(language, user ? "welcomeLinked" : "welcome"), language,
      user ? {} : { reply_markup: authButtons(language) });
    return;
  }
  if (menuIntent === "cancel") {
    const state = await cancelActiveConversation(chatId);
    const chatState = await loadChatState(chatId);
    delete chatState.conversation;
    delete chatState.pendingAction;
    await saveChatState(chatId, chatState);
    const cancelKey = state?.kind === "booking"
      ? "bookingCancelled"
      : state?.kind === "payment"
        ? "paymentCancelled"
        : "searchCancelled";
    await reply(chatId, telegramText(language, cancelKey), language);
    return;
  }
  if (menuIntent === "logout") {
    await cancelActiveConversation(chatId);
    const user = await getLinkedUser(chatId);
    if (user) await unlinkTelegramUser(chatId, user.id);
    const state = await loadChatState(chatId);
    delete state.conversation;
    delete state.pendingAction;
    await saveChatState(chatId, state);
    await reply(chatId, telegramText(language, "welcome"), language, { reply_markup: authButtons(language) });
    return;
  }
  if (["help", "search", "reservations", "payments", "link", "language", "unlink"].includes(menuIntent)) {
    await cancelActiveConversation(chatId);
  }
  const pendingConversation = await getConversation(chatId);
  if (pendingConversation?.kind === "auth") {
    if (["REGISTER_ID_NUMBER", "REGISTER_PASSWORD", "REGISTER_CONFIRM_PASSWORD", "LOGIN_PASSWORD", "REGISTER_CODE"].includes(pendingConversation.step) && message.message_id) {
      await callTelegramApi("deleteMessage", { chat_id: chatId, message_id: message.message_id })
        .catch((error) => logTelegramError("Telegram secret message deletion failed", error));
    }
    try {
      await processAuthText(chatId, text, language, pendingConversation);
    } catch (error) {
      const sensitiveStep = ["REGISTER_ID_NUMBER", "REGISTER_PASSWORD", "REGISTER_CONFIRM_PASSWORD", "REGISTER_CODE"].includes(pendingConversation.step);
      if (!sensitiveStep) logTelegramError("Telegram authentication step failed", error);
      const canGoBack = ["REGISTER_EMAIL", "REGISTER_PHONE", "REGISTER_ADDRESS", "REGISTER_ID_NUMBER", "REGISTER_PASSWORD", "REGISTER_CONFIRM_PASSWORD", "LOGIN_PASSWORD"].includes(pendingConversation.step);
      await reply(chatId, error.message || telegramText(language, "authFailed"), language, {
        reply_markup: cancelMarkup(language, canGoBack),
      });
    }
    return;
  }
  if (pendingConversation?.kind === "payment") {
    if (["PHONE", "OTP"].includes(pendingConversation.step) && message.message_id) {
      await callTelegramApi("deleteMessage", { chat_id: chatId, message_id: message.message_id })
        .catch((error) => logTelegramError("Telegram payment credential deletion failed", error));
    }
    await processPaymentText(chatId, text, language, pendingConversation);
    return;
  }
  if (command === "/help" || menuIntent === "help") {
    await reply(chatId, telegramText(language, "help"), language);
    return;
  }
  if (command === "/unlink") {
    const user = await getLinkedUser(chatId);
    if (!user) await reply(chatId, telegramText(language, "notLinkedShort"), language);
    else {
      await unlinkTelegramUser(chatId, user.id);
      await reply(chatId, telegramText(language, "unlinked"), language);
    }
    return;
  }
  if (command === "/search") {
    await startSearch(chatId, language);
    return;
  }
  if (command === "/reservations" || menuIntent === "reservations") {
    const user = await getLinkedUser(chatId);
    if (!user) {
      await setPendingAction(chatId, { type: "reservations" });
      await promptLogin(chatId, language);
    }
    else await showReservations(chatId, user, language);
    return;
  }
  if (command === "/payments" || menuIntent === "payments") {
    const user = await getLinkedUser(chatId);
    if (!user) {
      await setPendingAction(chatId, { type: "payments" });
      await promptLogin(chatId, language);
    }
    else await showPayments(chatId, user, language);
    return;
  }
  if (command === "/link" || menuIntent === "link") {
    await sendLinkHelp(chatId, language);
    return;
  }
  if (menuIntent === "language") {
    await startLanguageChoice(chatId, language);
    return;
  }
  if (menuIntent === "search") {
    await startSearch(chatId, language);
    return;
  }
  if (menuIntent === "logout") {
    await reply(chatId, telegramText(language, "welcome"), language, { reply_markup: authButtons(language) });
    return;
  }

  const pending = await getConversation(chatId);
  if (pending?.kind === "search") {
    await processSearchText(chatId, text, language, pending);
    return;
  }
  if (pending?.kind === "booking") {
    await processBookingText(chatId, text, language, pending);
    return;
  }

  const intent = classifyTelegramIntent(text);
  if (intent === "location") {
    await startSearch(chatId, language);
    const searchState = await getConversation(chatId);
    if (searchState?.kind === "search") await processSearchText(chatId, text, language, searchState);
    return;
  }
  if (intent === "question") {
    const user = await getLinkedUser(chatId);
    if (!user) {
      await setPendingAction(chatId, { type: "question", message: text });
      await sendProfileLinkMessage(chatId, telegramText(language, "linkNeeded"), language);
      return;
    }
    try {
      const answer = await requestPlatformApi("/api/ai/chat", {
        method: "POST",
        token: generateToken(user),
        body: { message: text, history: [] },
      });
      await reply(chatId, answer.reply || telegramText(language, "actionFailed"), language);
    } catch (error) {
      logTelegramError("Telegram AI request failed", error);
      await reply(chatId, telegramText(language, "actionFailed"), language);
    }
    return;
  }
  await reply(chatId, telegramText(language, "help"), language);
};

const processCallback = async (update) => {
  const query = update.callback_query;
  const chatId = String(query.message.chat.id);
  const data = String(query.data || "");
  const language = await getLanguage(chatId, query.from?.language_code);
  try {
    if (!allowChatMessage(chatId)) return;
    if (data === "cancel") {
      const state = await cancelActiveConversation(chatId);
      const cancelKey = state?.kind === "booking"
        ? "bookingCancelled"
        : state?.kind === "payment"
          ? "paymentCancelled"
          : "searchCancelled";
      await reply(chatId, telegramText(language, cancelKey), language);
      return;
    }
    if (data === "search:start") {
      await setConversation(chatId, null);
      await startSearch(chatId, language);
      return;
    }
    if (data === "auth:register") {
      await startRegistration(chatId, language);
      return;
    }
    if (data === "auth:login") {
      await startLogin(chatId, language);
      return;
    }
    if (data.startsWith("auth:role:")) {
      const role = data.split(":")[2];
      if (!["GUEST", "OWNER"].includes(role)) return;
      const state = { kind: "auth", step: "REGISTER_NAME", data: { role } };
      await setConversation(chatId, state);
      await showRegistrationStep(chatId, state, language);
      return;
    }
    if (data === "auth:skip_email") {
      const state = await getConversation(chatId);
      if (state?.kind !== "auth" || state.step !== "REGISTER_EMAIL" || state.data.role !== "GUEST") return;
      state.data.email = null;
      state.data.normalizedEmail = null;
      state.step = "REGISTER_PHONE";
      await setConversation(chatId, state);
      await reply(chatId, telegramText(language, "askRegisterPhone"), language, { reply_markup: cancelMarkup(language, true) });
      return;
    }
    if (data === "auth:resend_code" || data === "auth:change_email") {
      const state = await getConversation(chatId);
      if (state?.kind !== "auth" || state.step !== "REGISTER_CODE") return;
      if (data === "auth:resend_code") {
        const waitMs = Number(state.data.codeSentAt || 0) + 60_000 - Date.now();
        if (waitMs > 0) {
          await reply(chatId, telegramText(language, "resendWait", { seconds: Math.ceil(waitMs / 1000) }), language, {
            reply_markup: registrationCodeMarkup(language),
          });
          return;
        }
        await sendRegistrationCode(chatId, language, state, { ...state.data });
        return;
      }
      state.step = "REGISTER_EMAIL";
      delete state.data.codeHash;
      delete state.data.codeExpiresAt;
      delete state.data.codeSentAt;
      delete state.data.email;
      delete state.data.normalizedEmail;
      delete state.data.failedCodeAttempts;
      await setConversation(chatId, state);
      await reply(chatId, telegramText(language, "askRegisterEmail"), language, {
        reply_markup: cancelMarkup(language),
      });
      return;
    }
    if (data.startsWith("auth:id_type:")) {
      const state = await getConversation(chatId);
      const optionIndex = Number(data.split(":")[2]);
      const idType = REGISTRATION_ID_TYPES[optionIndex];
      if (state?.kind !== "auth" || state.step !== "REGISTER_ID_TYPE" || !idType) return;
      state.data.idType = validateRegistrationIdType(idType);
      state.step = "REGISTER_ID_NUMBER";
      await setConversation(chatId, state);
      await reply(chatId, telegramText(language, "askRegisterIdNumber"), language, { reply_markup: cancelMarkup(language, true) });
      return;
    }
    if (data === "auth:consent") {
      const state = await getConversation(chatId);
      if (state?.kind !== "auth" || state.step !== "REGISTER_CONSENT") return;
      state.data.agreedToTerms = validateRegistrationConsent(true);
      await showRegistrationSummary(chatId, state, language);
      return;
    }
    if (data === "auth:confirm_registration") {
      const state = await getConversation(chatId);
      if (state?.kind !== "auth" || state.step !== "REGISTER_SUMMARY") return;
      try {
        const { user } = await registerUser({
          fullName: state.data.fullName,
          email: state.data.email || undefined,
          phone: state.data.phone,
          ...(state.data.role === "OWNER" ? {
            residentialAddress: state.data.residentialAddress,
            idType: state.data.idType,
            idNumber: readRegistrationSecrets(state.data).idNumber,
          } : {}),
          password: readRegistrationSecrets(state.data).password,
          confirmPassword: readRegistrationSecrets(state.data).confirmPassword,
          agreedToTerms: state.data.agreedToTerms,
          role: state.data.role,
        });
        await finishTelegramAuth(chatId, user, language, "registrationComplete");
      } catch (error) {
        const message = ["email", "phone", "residentialAddress", "idType", "idNumber"].includes(error.field)
          ? error.message
          : telegramText(language, "authFailed");
        await reply(chatId, message, language, { reply_markup: registrationSummaryMarkup(language) });
      }
      return;
    }
    if (data === "back") {
      const state = await getConversation(chatId);
      if (state?.kind === "auth") {
        if (state.step === "REGISTER_ROLE") {
          await setConversation(chatId, null);
          await reply(chatId, telegramText(language, "welcome"), language, { reply_markup: authButtons(language) });
          return;
        }
        const previousStep = state.step === "REGISTER_PASSWORD"
          ? state.data.role === "OWNER" ? "REGISTER_ID_NUMBER" : "REGISTER_PHONE"
          : state.step === "REGISTER_PHONE"
            ? state.data.role === "OWNER" ? "REGISTER_CODE" : "REGISTER_EMAIL"
            : ({
                REGISTER_NAME: "REGISTER_ROLE",
                REGISTER_EMAIL: "REGISTER_NAME",
                REGISTER_CODE: "REGISTER_EMAIL",
                REGISTER_ADDRESS: "REGISTER_PHONE",
                REGISTER_ID_TYPE: "REGISTER_ADDRESS",
                REGISTER_ID_NUMBER: "REGISTER_ID_TYPE",
                REGISTER_CONFIRM_PASSWORD: "REGISTER_PASSWORD",
                REGISTER_CONSENT: "REGISTER_CONFIRM_PASSWORD",
                REGISTER_SUMMARY: "REGISTER_CONSENT",
                LOGIN_PASSWORD: "LOGIN_EMAIL",
              }[state.step]);
        if (!previousStep) return;
        if (["REGISTER_CODE", "REGISTER_EMAIL"].includes(state.step) && previousStep === "REGISTER_EMAIL") {
          delete state.data.codeHash;
          delete state.data.codeExpiresAt;
          delete state.data.codeSentAt;
          delete state.data.email;
          delete state.data.normalizedEmail;
        }
        if (state.step === "REGISTER_PASSWORD") {
          delete state.data.registrationSecretCipher;
          delete state.data.registrationSecretExpiresAt;
        }
        if (state.step === "REGISTER_CONFIRM_PASSWORD") {
          deleteRegistrationSecret("password", state.data);
          deleteRegistrationSecret("confirmPassword", state.data);
        }
        if (state.step === "REGISTER_ADDRESS") delete state.data.residentialAddress;
        if (state.step === "REGISTER_ID_TYPE") {
          delete state.data.idType;
          delete state.data.idNumber;
        }
        if (state.step === "REGISTER_ID_NUMBER") deleteRegistrationSecret("idNumber", state.data);
        state.step = previousStep;
        await setConversation(chatId, state);
        await showRegistrationStep(chatId, state, language);
        return;
      }
      if (state?.kind === "search" && state.step === "AREA") {
        state.step = "CITY";
        delete state.data.city;
        delete state.houseOptions;
        delete state.areaOptions;
        await setConversation(chatId, state);
        await reply(chatId, telegramText(language, "askCity"), language, { reply_markup: cancelMarkup(language) });
        return;
      }
      if (state?.kind === "search" && state.step === "ROOMTYPE") {
        await showCityGuesthouses(chatId, state, state.data.city, language);
        return;
      }
      if (state?.kind === "search" && state.step === "ROOM") {
        state.step = "ROOMTYPE";
        await setConversation(chatId, state);
        await showRoomTypeChoices(chatId, language);
        return;
      }
      if (state?.kind === "search" && state.step === "CHECKOUT") {
        delete state.data.checkOut;
        state.step = "CHECKIN";
        await setConversation(chatId, state);
        await reply(chatId, telegramText(language, "askCheckIn"), language, { reply_markup: cancelMarkup(language, true) });
        return;
      }
      if (state?.kind === "search" && state.step === "CHECKIN") {
        state.step = "ROOMTYPE";
        delete state.data.checkIn;
        await setConversation(chatId, state);
        await showRoomTypeChoices(chatId, language);
        return;
      }
      if (state?.kind === "payment" && state.step === "PHONE") {
        state.step = "METHOD";
        state.data = {};
        await setConversation(chatId, state);
        const prompt = state.draftId
          ? telegramText(language, "draftPaymentChoicePrompt", { amount: Number(state.amount).toLocaleString("en-US") })
          : telegramText(language, "paymentChoicePrompt", { id: state.reservationId });
        await reply(chatId, prompt, language, { reply_markup: paymentMethodsMarkup(language) });
        return;
      }
      if (state?.kind === "booking" && state.step === "GUESTS") {
        state.kind = "search";
        state.step = "ROOM";
        delete state.room;
        delete state.guesthouse;
        delete state.data.guests;
        await setConversation(chatId, state);
        await showAvailableRoomChoices(chatId, state, language);
        return;
      }
      if (state?.kind === "booking" && state.step === "CONFIRM") {
        state.step = "GUESTS";
        state.data.guests = null;
        await setConversation(chatId, state);
        await reply(chatId, telegramText(language, "askGuests"), language, { reply_markup: cancelMarkup(language, true) });
        return;
      }
      return;
    }
    if (data.startsWith("flow:city:")) {
      const state = await getConversation(chatId);
      const cityIndex = Number(data.split(":")[2]);
      const city = state?.citySuggestionOptions?.[cityIndex];
      if (state?.kind !== "search" || state.step !== "CITY" || !city) return;
      await showCityGuesthouses(chatId, state, city, language);
      return;
    }
    if (data.startsWith("flow:area:")) {
      const state = await getConversation(chatId);
      if (state?.kind !== "search" || state.step !== "AREA") return;
      const key = data.split(":")[2];
      const option = key === "all" ? null : state.areaOptions?.[Number(key)];
      if (key !== "all" && !option) return;
      state.guesthouseIds = key === "all"
        ? state.houseOptions.map(({ id }) => id)
        : option.guesthouseIds;
      state.step = "ROOMTYPE";
      await setConversation(chatId, state);
      await showRoomTypeChoices(chatId, language);
      return;
    }
    if (data.startsWith("flow:type:")) {
      const state = await getConversation(chatId);
      const roomType = data.split(":")[2];
      if (state?.kind !== "search" || state.step !== "ROOMTYPE" || !ROOM_TYPES.includes(roomType)) return;
      state.data.roomType = roomType;
      state.step = "CHECKIN";
      await setConversation(chatId, state);
      await reply(chatId, telegramText(language, "askCheckIn"), language, { reply_markup: cancelMarkup(language, true) });
      return;
    }
    if (data.startsWith("flow:room:")) {
      const state = await getConversation(chatId);
      const roomId = Number(data.split(":")[2]);
      const room = state?.roomOptions?.find((item) => item.id === roomId);
      if (state?.kind !== "search" || state.step !== "ROOM" || !room) return;
      const user = await getLinkedUser(chatId);
      if (!user || user.role !== "GUEST" || user.id !== state.userId) {
        await promptLogin(chatId, language);
        return;
      }
      state.kind = "booking";
      state.step = "GUESTS";
      state.userId = user.id;
      state.room = room;
      state.guesthouse = { id: room.guesthouseId, name: room.guesthouse.name };
      state.data.guests = null;
      await setConversation(chatId, state);
      const max = Math.min(Math.max(1, Number(room.capacity) || 1), 12);
      const guestButtons = Array.from({ length: max }, (_, index) => ({ text: String(index + 1), callback_data: `guests:${index + 1}` }));
      const rows = [];
      for (let index = 0; index < guestButtons.length; index += 4) rows.push(guestButtons.slice(index, index + 4));
      rows.push([{ text: telegramText(language, "back"), callback_data: "back" }]);
      rows.push([{ text: telegramText(language, "cancel"), callback_data: "cancel" }]);
      await reply(chatId, telegramText(language, "askGuests"), language, { reply_markup: inlineMarkup(rows) });
      return;
    }
    if (data.startsWith("language:")) {
      const selected = data.split(":")[1] === "am" ? "am" : "en";
      const user = await getLinkedUser(chatId);
      if (user) await prisma.user.update({ where: { id: user.id }, data: { language: selected } });
      else {
        const state = await loadChatState(chatId);
        state.language = selected;
        await saveChatState(chatId, state);
      }
      await reply(chatId, telegramText(selected, "languageChanged", { language: telegramText(selected, selected === "am" ? "languageAmharic" : "languageEnglish") }), selected);
      return;
    }
    if (data.startsWith("guests:")) {
      const state = await getConversation(chatId);
      const count = Number(data.split(":")[1]);
      if (state?.kind !== "booking" || !Number.isInteger(count) || count < 1 || count > Number(state.room.capacity)) return;
      state.data.guests = count;
      state.step = "CONFIRM";
      await setConversation(chatId, state);
      await showBookingSummary(chatId, state, language);
      return;
    }
    if (data === "booking:confirm") {
      const state = await getConversation(chatId);
      if (state?.kind !== "booking" || state.step !== "CONFIRM") return;
      const user = await getLinkedUser(chatId);
      if (!user || user.id !== state.userId || user.role !== "GUEST") {
        await setConversation(chatId, null);
        await promptLogin(chatId, language);
        return;
      }
      try {
        const draft = await createTelegramBookingDraft({
          userId: user.id,
          roomId: state.room.id,
          checkIn: state.data.checkIn,
          checkOut: state.data.checkOut,
          guests: state.data.guests,
        });
        await showDraftPaymentMethods(chatId, draft, language);
      } catch (error) {
        logTelegramError("Telegram booking draft creation failed", error);
        const failureMessage = reservationFailureMessage(error);
        if (failureMessage === "please log in again") {
          await setConversation(chatId, null);
          await promptLogin(chatId, language);
        } else {
          await reply(chatId, failureMessage, language);
        }
      }
      return;
    }
    if (data.startsWith("payment:choose:")) {
      const reservationId = Number(data.split(":")[2]);
      const user = await getLinkedUser(chatId);
      if (!user || user.role !== "GUEST") {
        await promptLogin(chatId, language);
        return;
      }
      const reservations = await getReservationsForUser(user);
      const reservation = reservations.find((item) => item.id === reservationId);
      if (!reservation) return;
      const retry = reservation.payment?.status === "FAILED" && reservation.status === "CANCELLED";
      const unpaid = reservation.status === "PENDING" && !reservation.payment;
      if (!retry && !unpaid) return;
      await showPaymentMethods(chatId, reservationId, user.id, language, retry);
      return;
    }
    if (data.startsWith("payment:method:")) {
      const state = await getConversation(chatId);
      const method = data.split(":")[2];
      const user = await getLinkedUser(chatId);
      if (state?.kind !== "payment" || state.step !== "METHOD" || !user || user.id !== state.userId || user.role !== "GUEST") return;
      if (method === "bank_card") {
        if (state.draftId) {
          await sendHostedDraftPayment({ chatId, userId: user.id, draftId: state.draftId, language });
        } else {
          await sendHostedPayment({ chatId, userId: user.id, reservationId: state.reservationId, language, method: "CARD", retry: state.retry });
        }
        return;
      }
      if (["telebirr", "cbebirr", "ebirr", "mpesa"].includes(method)) {
        if (state.draftId) {
          const walletMethod = {
            telebirr: "TELEBIRR",
            cbebirr: "CBE_BIRR",
            ebirr: "EBIRR",
            mpesa: "MPESA",
          }[method];
          try {
            await selectTelegramBookingDraftPaymentMethod({ draftId: state.draftId, userId: user.id, method: walletMethod });
          } catch (error) {
            logTelegramError("Telegram booking draft unavailable at payment selection", error);
            await setConversation(chatId, null);
            await reply(chatId, telegramText(language, "noRoomsForDates"), language, {
              reply_markup: inlineMarkup([[
                { text: telegramText(language, "searchAgain"), callback_data: "search:start" },
              ]]),
            });
            return;
          }
        }
        state.step = "PHONE";
        state.data.type = method;
        await setConversation(chatId, state);
        await reply(chatId, telegramText(language, "askPaymentMobile"), language, { reply_markup: cancelMarkup(language, true) });
        return;
      }
    }
    if (data.startsWith("pay:")) {
      const reservationId = Number(data.split(":")[1]);
      const user = await getLinkedUser(chatId);
      if (!user || user.role !== "GUEST") {
        await promptLogin(chatId, language);
        return;
      }
      const reservations = await getReservationsForUser(user);
      const reservation = reservations.find((item) => item.id === reservationId);
      if (!reservation) return;
      const retry = reservation.payment?.status === "FAILED" && reservation.status === "CANCELLED";
      const unpaid = reservation.status === "PENDING" && !reservation.payment;
      if (!retry && !unpaid) return;
      await showPaymentMethods(chatId, reservationId, user.id, language, retry);
    }
  } catch (error) {
    logTelegramError("Telegram callback handling failed", error);
    await reply(chatId, telegramText(language, "actionFailed"), language);
  } finally {
    await callTelegramApi("answerCallbackQuery", { callback_query_id: query.id }).catch(() => {});
  }
};

export const handleTelegramUpdate = async (update) => {
  if (!privateChat(update)) return;
  if (update.callback_query) return processCallback(update);
  return processMessage(update);
};

export const startTelegramBot = () => {
  if (pollingStarted) return;
  conversationCleanupTimer ||= setInterval(() => {
    prisma.telegramConversation.deleteMany({ where: { expiresAt: { lte: new Date() } } })
      .catch((error) => logTelegramError("Telegram conversation cleanup failed", error));
    expireTelegramBookingDrafts()
      .catch((error) => logTelegramError("Telegram booking draft cleanup failed", error));
  }, 5 * 60 * 1000);
  conversationCleanupTimer.unref?.();
  if (!process.env.TELEGRAM_BOT_TOKEN?.trim()) return;
  pollingStarted = true;

  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL?.trim();
  if (webhookUrl) void configureTelegramWebhook(webhookUrl);
  else void pollTelegramUpdates();
};

const waitForTelegramRetry = (attempt) => new Promise((resolve) => {
  const delay = Math.min(30000, 1000 * (2 ** attempt)) + Math.floor(Math.random() * 500);
  setTimeout(resolve, delay);
});

const telegramCommands = [
  { command: "start", description: "Start the guesthouse assistant or link your account" },
  { command: "menu", description: "Return to the main menu" },
  { command: "cancel", description: "Cancel the current step" },
  { command: "logout", description: "Log out and disconnect Telegram" },
  { command: "help", description: "Show available commands" },
  { command: "search", description: "Find guesthouses and available rooms" },
  { command: "reservations", description: "View reservations for your account" },
  { command: "payments", description: "View your guest payment history" },
  { command: "link", description: "Link your platform account" },
  { command: "unlink", description: "Disconnect your Telegram account" },
];

const configureTelegramWebhook = async (url) => {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error("Telegram webhook mode requires TELEGRAM_WEBHOOK_SECRET.");
    pollingStarted = false;
    return;
  }
  if (!createPublicHttpsUrlButton("Webhook", url)) {
    console.error("Telegram webhook mode requires a public HTTPS TELEGRAM_WEBHOOK_URL.");
    pollingStarted = false;
    return;
  }

  for (let attempt = 0; pollingStarted; attempt += 1) {
    try {
      await callTelegramApi("setMyCommands", { commands: telegramCommands });
      await callTelegramApi("setWebhook", {
        url,
        secret_token: secret,
        allowed_updates: ["message", "callback_query"],
        drop_pending_updates: false,
      });
      console.log("Telegram bot webhook configured.");
      return;
    } catch (error) {
      logTelegramError("Telegram webhook setup failed", error);
      await waitForTelegramRetry(Math.min(attempt, 5));
    }
  }
};

const pollTelegramUpdates = async () => {
  let offset;
  for (let attempt = 0; pollingStarted; attempt += 1) {
    try {
      await callTelegramApi("setMyCommands", { commands: telegramCommands });
      await callTelegramApi("deleteWebhook", { drop_pending_updates: false });
      console.log("Telegram bot polling started.");
      break;
    } catch (error) {
      logTelegramError("Telegram polling initialization failed", error);
      await waitForTelegramRetry(Math.min(attempt, 5));
    }
  }

  let failures = 0;
  while (pollingStarted) {
    try {
      const updates = await callTelegramApi(
        "getUpdates",
        {
          ...(offset === undefined ? {} : { offset }),
          timeout: 25,
          allowed_updates: ["message", "callback_query"],
        },
        35000
      );
      failures = 0;
      for (const update of updates) {
        offset = update.update_id + 1;
        try {
          await handleTelegramUpdate(update);
        } catch (error) {
          logTelegramError("Telegram update handling failed", error);
          const chatId = update.message?.chat?.id || update.callback_query?.message?.chat?.id;
          if (chatId) {
            const language = await getLanguage(String(chatId), update.message?.from?.language_code || update.callback_query?.from?.language_code).catch(() => "en");
            await reply(chatId, telegramText(language, "actionFailed"), language).catch(() => {});
          }
        }
      }
    } catch (error) {
      failures += 1;
      logTelegramError("Telegram polling failed", error);
      await waitForTelegramRetry(Math.min(failures, 5));
    }
  }
};
