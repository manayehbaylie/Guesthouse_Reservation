import test from "node:test";
import assert from "node:assert/strict";
import {
  advanceTelegramSearch,
  classifyTelegramIntent,
  formatTelegramSearchResults,
  getTelegramProfileLink,
  getTelegramIntentAccess,
  handleTelegramUpdate,
  logTelegramError,
  matchTelegramCity,
  parseTelegramDate,
  parseTelegramSearch,
  paymentMethodsMarkup,
  reservationFailureMessage,
  validateTelegramDate,
} from "./telegram-bot.service.js";
import prisma from "../config/prisma.js";
import { hashPassword } from "../utils/hash.js";
import { telegramText } from "./telegram-bot.i18n.js";

const mockTelegramConversationStore = (context) => {
  const descriptor = Object.getOwnPropertyDescriptor(prisma, "telegramConversation");
  const accountDescriptor = Object.getOwnPropertyDescriptor(prisma, "telegramAccount");
  const rows = new Map();
  const accounts = new Map();
  const delegate = {
    findUnique: async ({ where }) => {
      const row = rows.get(where.chatId);
      return row ? structuredClone(row) : null;
    },
    upsert: async ({ where, create, update }) => {
      const row = { ...(rows.get(where.chatId) || create), ...update };
      rows.set(where.chatId, structuredClone(row));
      return structuredClone(row);
    },
    deleteMany: async ({ where }) => {
      if (where.expiresAt?.lte) {
        let count = 0;
        for (const [chatId, row] of rows) {
          if (row.expiresAt <= where.expiresAt.lte) {
            rows.delete(chatId);
            count += 1;
          }
        }
        return { count };
      }
      return { count: rows.delete(where.chatId) ? 1 : 0 };
    },
  };
  Object.defineProperty(prisma, "telegramConversation", {
    configurable: true,
    enumerable: true,
    value: delegate,
  });
  Object.defineProperty(prisma, "telegramAccount", {
    configurable: true,
    enumerable: true,
    value: {
      findUnique: async ({ where }) => {
        const row = where.telegramId
          ? accounts.get(String(where.telegramId))
          : [...accounts.values()].find((account) => account.userId === where.userId);
        return row ? { ...row, user: row.user || { id: row.userId, role: "GUEST", language: null } } : null;
      },
      upsert: async ({ where, create, update }) => {
        const row = { ...(accounts.get(where.telegramId) || create), ...update };
        row.user ||= { id: row.userId, role: "GUEST", language: null };
        accounts.set(where.telegramId, row);
        return row;
      },
      deleteMany: async ({ where }) => ({ count: accounts.delete(String(where.telegramId)) ? 1 : 0 }),
    },
  });
  context.after(() => {
    if (descriptor) Object.defineProperty(prisma, "telegramConversation", descriptor);
    else delete prisma.telegramConversation;
    if (accountDescriptor) Object.defineProperty(prisma, "telegramAccount", accountDescriptor);
    else delete prisma.telegramAccount;
  });
  rows.accounts = accounts;
  return rows;
};

test("search parser accepts arbitrary Ethiopian locations, room type, price, and dates", () => {
  const params = parseTelegramSearch(
    "/search in Gambella FAMILY under 2,500 2026-11-10 2026-11-12"
  );

  assert.equal(params.get("location"), "Gambella");
  assert.equal(params.get("roomType"), "FAMILY");
  assert.equal(params.get("maxPrice"), "2500");
  assert.equal(params.get("checkIn"), "2026-11-10");
  assert.equal(params.get("checkOut"), "2026-11-12");
});

test("search parser accepts non-Latin location names", () => {
  const params = parseTelegramSearch("/search ጎንደር");
  assert.equal(params.get("location"), "ጎንደር");
});

test("search formatter includes guesthouse, location, room, rate, and availability", () => {
  const message = formatTelegramSearchResults(
    [{
      name: "Blue Nile Guesthouse",
      city: "Bahir Dar",
      subCity: "Kebele 03",
      rooms: [{ roomType: "DOUBLE", price: 1500 }],
    }],
    new URLSearchParams()
  );

  assert.match(message, /Blue Nile Guesthouse/);
  assert.match(message, /Kebele 03, Bahir Dar/);
  assert.match(message, /DOUBLE/);
  assert.match(message, /1,500 ETB\/night/);
  assert.match(message, /Available/);
});

test("plain-text search results preserve special characters in guesthouse names", () => {
  const guesthouseName = "A&B <Guesthouse> _ * \"Downtown\"";
  const message = formatTelegramSearchResults(
    [{ name: guesthouseName, city: "Bahir Dar", rooms: [{ roomType: "DOUBLE", price: 1500 }] }],
    new URLSearchParams()
  );
  assert.ok(message.includes(guesthouseName));
});

test("search result formatting deduplicates identical room displays", () => {
  const message = formatTelegramSearchResults(
    [{
      name: "Blue Nile Guesthouse",
      city: "Bahir Dar",
      rooms: [
        { id: 1, roomType: "DOUBLE", price: 1500, capacity: 2 },
        { id: 2, roomType: "DOUBLE", price: 1500, capacity: 4 },
        { id: 3, roomType: "FAMILY", price: 2500, capacity: 5 },
      ],
    }],
    new URLSearchParams()
  );

  assert.equal((message.match(/DOUBLE/g) || []).length, 1);
  assert.equal((message.match(/FAMILY/g) || []).length, 1);
});

test("detects English and Amharic plain-text intents", () => {
  assert.equal(classifyTelegramIntent("my reservations"), "reservations");
  assert.equal(classifyTelegramIntent("ቦታ ማስያዣዎቼ"), "reservations");
  assert.equal(classifyTelegramIntent("payments"), "payments");
  assert.equal(classifyTelegramIntent("ክፍያ"), "payments");
  assert.equal(classifyTelegramIntent("እርዳታ"), "help");
  assert.equal(classifyTelegramIntent("Where can I stay?"), "question");
  assert.equal(classifyTelegramIntent("ምን አይነት ክፍሎች አሉ"), "question");
  assert.equal(classifyTelegramIntent("ጎንደር"), "location");
  assert.equal(classifyTelegramIntent("hello"), "unknown");
  assert.equal(classifyTelegramIntent("Logout"), "logout");
});

test("every English and Amharic menu label maps to its stable action", () => {
  const menuActions = {
    menuSearch: "search",
    menuReservations: "reservations",
    menuPayments: "payments",
    menuLink: "link",
    menuLanguage: "language",
    menuHelp: "help",
    menuLogout: "logout",
  };

  for (const language of ["en", "am"]) {
    for (const [key, action] of Object.entries(menuActions)) {
      assert.equal(classifyTelegramIntent(telegramText(language, key)), action, `${language}:${key}`);
    }
  }
});

test("payment choices expose the four wallet methods and hosted Bank/Card option", () => {
  const expected = {
    en: ["Telebirr", "CBE Birr", "Ebirr", "M-Pesa", "Bank/Card", "Cancel"],
    am: ["ቴሌብር", "CBE ብር", "ኢብር", "M-Pesa", "ባንክ/ካርድ", "ሰርዝ"],
  };
  const actionIds = [
    "payment:method:telebirr",
    "payment:method:cbebirr",
    "payment:method:ebirr",
    "payment:method:mpesa",
    "payment:method:bank_card",
    "cancel",
  ];

  for (const language of ["en", "am"]) {
    const buttons = paymentMethodsMarkup(language).inline_keyboard.flat();
    assert.deepEqual(buttons.map(({ text }) => text), expected[language]);
    assert.deepEqual(buttons.map(({ callback_data }) => callback_data), actionIds);
  }
});

test("booking confirmation creates a draft and offers payment methods without a reservation", async (context) => {
  const conversations = mockTelegramConversationStore(context);
  const transactionDescriptor = Object.getOwnPropertyDescriptor(prisma, "$transaction");
  const settingUpsert = prisma.systemSetting.upsert;
  const lockUpsert = prisma.systemLock.upsert;
  const originalFetch = globalThis.fetch;
  const previousToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = 930200;
  const telegramRequests = [];
  const draftWrites = [];
  process.env.TELEGRAM_BOT_TOKEN = "123456789:telegram-draft-confirm-test-token";
  conversations.accounts.set(String(chatId), {
    telegramId: String(chatId),
    userId: 42,
    user: { id: 42, role: "GUEST", language: "en" },
  });
  prisma.systemSetting.upsert = async () => ({ guestBookingEnabled: true });
  prisma.systemLock.upsert = async () => ({ isLocked: false, message: "" });
  prisma.$transaction = async (callback) => callback({
    $queryRaw: async () => [],
    room: {
      findUnique: async () => ({
        id: 81,
        price: 500,
        capacity: 2,
        available: true,
        maintenanceStatus: "AVAILABLE",
        guesthouse: { status: "APPROVED" },
      }),
    },
    reservation: { findFirst: async () => null },
    bookingDraft: {
      create: async ({ data }) => {
        draftWrites.push(data);
        return {
          id: 301,
          ...data,
          userId: 42,
          user: { id: 42, fullName: "Guest Example", email: "guest@gmail.com", phone: "+251911111111" },
        };
      },
    },
  });
  globalThis.fetch = async (url, options) => {
    telegramRequests.push({ url: String(url), ...JSON.parse(options.body) });
    return { ok: true, json: async () => ({ ok: true, result: { message_id: telegramRequests.length } }) };
  };
  context.after(() => {
    if (transactionDescriptor) Object.defineProperty(prisma, "$transaction", transactionDescriptor);
    else delete prisma.$transaction;
    prisma.systemSetting.upsert = settingUpsert;
    prisma.systemLock.upsert = lockUpsert;
    globalThis.fetch = originalFetch;
    if (previousToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = previousToken;
  });
  const state = {
    kind: "booking",
    step: "CONFIRM",
    userId: 42,
    room: {
      id: 81,
      price: 500,
      roomType: "DOUBLE",
      capacity: 2,
      guesthouseId: 8,
      guesthouse: { id: 8, name: "Blue Nile House" },
    },
    data: { checkIn: "2030-11-10", checkOut: "2030-11-12", guests: 2 },
  };
  conversations.set(String(chatId), {
    chatId: String(chatId),
    state: { language: "en", conversation: state },
    expiresAt: new Date(Date.now() + 60_000),
  });

  await handleTelegramUpdate({
    callback_query: {
      id: "confirm-draft",
      data: "booking:confirm",
      message: { chat: { id: chatId, type: "private" } },
      from: { id: chatId, language_code: "en" },
    },
  });

  assert.equal(draftWrites.length, 1);
  assert.equal(draftWrites[0].status, "PENDING");
  assert.equal(draftWrites[0].amount, 1000);
  assert.equal(draftWrites[0].expiresAt.getTime() - Date.now() <= 30 * 60 * 1000, true);
  assert.equal(conversations.get(String(chatId)).state.conversation.draftId, 301);
  assert.deepEqual(
    telegramRequests.at(-2).reply_markup.inline_keyboard.flat().map((button) => button.text),
    ["Telebirr", "CBE Birr", "Ebirr", "M-Pesa", "Bank/Card", "Cancel"]
  );
  assert.equal(Object.hasOwn(conversations.get(String(chatId)).state.conversation, "reservationId"), false);
});

test("Telegram error logs redact phone numbers, OTPs, and configured secrets", () => {
  const previousSecret = process.env.CHAPA_SECRET_KEY;
  const originalConsoleError = console.error;
  const output = [];
  process.env.CHAPA_SECRET_KEY = "local-chapa-secret-for-redaction";
  console.error = (message) => output.push(String(message));
  try {
    logTelegramError("payment authorization failed", new Error(
      'phone=0912345678 otp=123456 token=local-chapa-secret-for-redaction'
    ));
  } finally {
    console.error = originalConsoleError;
    if (previousSecret === undefined) delete process.env.CHAPA_SECRET_KEY;
    else process.env.CHAPA_SECRET_KEY = previousSecret;
  }
  assert.match(output[0], /\[REDACTED_PHONE\]/);
  assert.match(output[0], /\[REDACTED_CODE\]/);
  assert.match(output[0], /\[REDACTED_SECRET\]/);
  assert.doesNotMatch(output[0], /0912345678|123456|local-chapa-secret-for-redaction/);
});

test("logout and escape commands clear pending steps in English and Amharic", async (context) => {
  const conversations = mockTelegramConversationStore(context);
  const originalTransaction = prisma.$transaction;
  const originalFetch = globalThis.fetch;
  const previousToken = process.env.TELEGRAM_BOT_TOKEN;
  const requests = [];
  process.env.TELEGRAM_BOT_TOKEN = "123456789:telegram-logout-test-token";
  prisma.$transaction = async (callback) => callback({
    telegramAccount: {
      deleteMany: async ({ where }) => ({ count: conversations.accounts.delete(String(where.telegramId)) ? 1 : 0 }),
    },
    user: { update: async () => ({}) },
  });
  globalThis.fetch = async (_url, options) => {
    requests.push(JSON.parse(options.body));
    return { ok: true, json: async () => ({ ok: true, result: { message_id: requests.length } }) };
  };
  context.after(() => {
    prisma.$transaction = originalTransaction;
    globalThis.fetch = originalFetch;
    if (previousToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = previousToken;
  });

  let chatId = 930000;
  for (const language of ["en", "am"]) {
    for (const command of ["/cancel", "/menu", "/start"]) {
      const id = chatId++;
      conversations.set(String(id), {
        chatId: String(id),
        state: { language, conversation: { kind: "auth", step: "REGISTER_NAME", data: {} } },
        expiresAt: new Date(Date.now() + 60_000),
      });
      await handleTelegramUpdate({
        message: { text: command, chat: { id, type: "private" }, from: { id, language_code: language } },
      });
      assert.equal(conversations.get(String(id)).state.conversation, undefined, `${language} ${command}`);
    }

    const id = chatId++;
    conversations.accounts.set(String(id), {
      telegramId: String(id),
      userId: id,
      user: { id, role: "GUEST", language },
    });
    conversations.set(String(id), {
      chatId: String(id),
      state: {
        language,
        conversation: { kind: "search", step: "CITY", data: {} },
        pendingAction: { type: "payments" },
      },
      expiresAt: new Date(Date.now() + 60_000),
    });
    await handleTelegramUpdate({
      message: {
        text: telegramText(language, "menuLogout"),
        chat: { id, type: "private" },
        from: { id, language_code: language },
      },
    });
    assert.equal(conversations.accounts.has(String(id)), false);
    assert.equal(conversations.get(String(id)).state.conversation, undefined);
    assert.equal(conversations.get(String(id)).state.pendingAction, undefined);
    const response = requests.at(-1);
    assert.equal(response.text, telegramText(language, "welcome"));
    assert.deepEqual(
      response.reply_markup.inline_keyboard.flat().map((button) => button.text),
      [telegramText(language, "register"), telegramText(language, "login")]
    );
  }
});

test("guided search requires check-in and check-out dates", () => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const checkout = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  let state = { kind: "search", step: "CHECKIN", data: {} };
  state = advanceTelegramSearch(state, tomorrow).state;
  assert.equal(state.step, "CHECKOUT");
  const invalid = advanceTelegramSearch(state, "skip");
  assert.equal(invalid.error, true);
  assert.equal(invalid.state.step, "CHECKOUT");
  state = advanceTelegramSearch(state, checkout).state;
  assert.equal(state.step, "RUN");
  assert.deepEqual(state.data, {
    checkIn: tomorrow,
    checkOut: checkout,
  });
});

test("city matching accepts aliases and minor spelling variations", () => {
  assert.equal(matchTelegramCity("Gonder", ["Gondar", "Bahir Dar"]), "Gondar");
  assert.equal(matchTelegramCity("bahir dar", ["Bahir Dar", "Gondar"]), "Bahir Dar");
  assert.equal(matchTelegramCity("Nowhere", ["Bahir Dar", "Gondar"]), null);
});

test("reservation errors produce specific Telegram messages", () => {
  assert.equal(reservationFailureMessage(new Error("Room is not available for the selected dates.")), "room no longer available");
  assert.equal(reservationFailureMessage(new Error("Number of guests must be between 1 and 2.")), "this room allows 2 guests");
  assert.equal(reservationFailureMessage(Object.assign(new Error("Authentication required."), { statusCode: 401 })), "please log in again");
  assert.equal(reservationFailureMessage(new Error("Database connection failed.")), "something went wrong, please try again");
});

test("date parser accepts only YYYY-MM-DD and DD/MM/YYYY", () => {
  const today = new Date(2026, 9, 18, 15);
  assert.equal(parseTelegramDate("2026-10-19", today), "2026-10-19");
  assert.equal(parseTelegramDate("19/10/2026", today), "2026-10-19");
  assert.equal(parseTelegramDate("2026/10/19", today), null);
  assert.equal(parseTelegramDate("19-10-2026", today), null);
  assert.equal(parseTelegramDate("11/19/2026", today), null);
});

test("ambiguous slash dates are interpreted as DD/MM/YYYY", () => {
  const today = new Date(2026, 8, 1);
  assert.equal(parseTelegramDate("10/11/2026", today), "2026-11-10");
  assert.equal(parseTelegramDate("11/10/2026", today), "2026-10-11");
});

test("date validation distinguishes bad format, impossible dates, and past dates", () => {
  const today = new Date(2026, 9, 18, 23, 59);
  assert.deepEqual(validateTelegramDate("2026.10.19", today), { date: null, problem: "format" });
  assert.deepEqual(validateTelegramDate("31/02/2026", today), { date: null, problem: "invalid" });
  assert.deepEqual(validateTelegramDate("2026-02-29", today), { date: null, problem: "invalid" });
  assert.deepEqual(validateTelegramDate("17/10/2026", today), { date: null, problem: "past" });
  assert.deepEqual(validateTelegramDate("18/10/2026", today), { date: "2026-10-18", problem: null });
});

test("search rejects checkout on the check-in day with a checkout-specific error", () => {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const checkIn = advanceTelegramSearch({ step: "CHECKIN", data: {} }, today);
  const checkOut = advanceTelegramSearch({ ...checkIn.state, step: "CHECKOUT" }, today);
  assert.equal(checkOut.error, true);
  assert.equal(checkOut.errorKey, "checkout");
});

test("guided search accepts typed cities, suggests matches, and requires explicit dates", async (context) => {
  const conversationRows = mockTelegramConversationStore(context);
  const originalGuesthouseFindMany = prisma.guesthouse.findMany;
  const originalRoomFindMany = prisma.room.findMany;
  const originalFetch = globalThis.fetch;
  const previousToken = process.env.TELEGRAM_BOT_TOKEN;
  const payloads = [];
  const messages = () => payloads.filter((payload) => typeof payload.text === "string");
  const chatId = 880001;
  process.env.TELEGRAM_BOT_TOKEN = "123456789:telegram-date-test-token-not-real";
  conversationRows.accounts.set(String(chatId), {
    telegramId: String(chatId), userId: 42,
    user: { id: 42, role: "GUEST", language: "en" },
  });
  prisma.guesthouse.findMany = async ({ select }) => select?.city
    ? [{ city: "Bahir Dar" }]
    : [{ id: 8, name: "Blue Nile Guesthouse", address: "Kebele 03", woreda: "Kebele 03" }];
  prisma.room.findMany = async () => [{
    id: 81,
    guesthouseId: 8,
    roomType: "DOUBLE",
    price: 700,
    capacity: 2,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    guesthouse: { id: 8, name: "Blue Nile Guesthouse", city: "Bahir Dar", address: "Kebele 03", woreda: "Kebele 03" },
  }];
  globalThis.fetch = async (_url, options) => {
    const payload = JSON.parse(options.body);
    payloads.push(payload);
    return { ok: true, json: async () => ({ ok: true, result: { message_id: payloads.length } }) };
  };
  context.after(() => {
    prisma.guesthouse.findMany = originalGuesthouseFindMany;
    prisma.room.findMany = originalRoomFindMany;
    globalThis.fetch = originalFetch;
    if (previousToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = previousToken;
  });

  const message = (text) => handleTelegramUpdate({
    message: { text, chat: { id: chatId, type: "private" }, from: { id: chatId, language_code: "en" } },
  });
  const callback = (data, id) => handleTelegramUpdate({
    callback_query: {
      id,
      data,
      message: { chat: { id: chatId, type: "private" } },
      from: { id: chatId, language_code: "en" },
    },
  });

  await message("Search");
  assert.equal(conversationRows.get(String(chatId)).state.conversation.step, "CITY");
  assert.ok(messages().at(-1).text.includes("Type a city or location"));
  assert.deepEqual(
    messages().at(-1).reply_markup.inline_keyboard.flat().map((button) => button.text),
    ["Cancel"]
  );
  await message("Addis Ababa");
  assert.equal(conversationRows.get(String(chatId)).state.conversation.step, "CITY");
  assert.deepEqual(
    messages().at(-1).reply_markup.inline_keyboard.flat().map((button) => button.text),
    ["Bahir Dar", "Cancel"]
  );
  await message("bahir dar");
  assert.equal(conversationRows.get(String(chatId)).state.conversation.step, "AREA");
  assert.ok(messages().at(-1).text.includes("Blue Nile Guesthouse"));
  await callback("flow:area:all", "date-test-area");
  await callback("flow:type:DOUBLE", "date-test-type");

  const checkInPrompt = payloads.find((payload) => payload.text?.startsWith("Enter your required check-in date"));
  const checkInLabels = checkInPrompt.reply_markup.inline_keyboard.flat().map((button) => button.text);
  assert.deepEqual(checkInLabels, ["Back", "Cancel"]);
  const invalidDateCount = payloads.length;
  await message("skip");
  assert.equal(conversationRows.get(String(chatId)).state.conversation.step, "CHECKIN");
  assert.ok(payloads.length > invalidDateCount);

  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const checkout = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  await message(tomorrow);
  const checkoutPrompt = payloads.find((payload) => payload.text?.startsWith("Enter your required check-out date"));
  const checkoutLabels = checkoutPrompt.reply_markup.inline_keyboard.flat().map((button) => button.text);
  assert.deepEqual(checkoutLabels, ["Back", "Cancel"]);
  await message(tomorrow);
  assert.equal(conversationRows.get(String(chatId)).state.conversation.step, "CHECKOUT");
  await message(checkout);
  assert.equal(conversationRows.get(String(chatId)).state.conversation.step, "ROOM");
  assert.equal(
    conversationRows.get(String(chatId)).state.conversation.roomOptions[0].createdAt,
    "2026-01-01T00:00:00.000Z"
  );
  await callback("flow:room:81", "date-test-room");
  assert.equal(conversationRows.get(String(chatId)).state.conversation.step, "GUESTS");
  await callback("guests:2", "date-test-guests");
  assert.equal(conversationRows.get(String(chatId)).state.conversation.step, "CONFIRM");
  assert.ok(messages().at(-1).text.includes("700 ETB/night"));
  assert.ok(messages().at(-1).text.includes("Total: 700 ETB"));
});

test("unlinked private actions request account linking", () => {
  const access = getTelegramIntentAccess("reservations", false);
  assert.equal(access.requiresLink, true);
  assert.equal(access.linkButton, true);
  assert.equal(getTelegramIntentAccess("location", false).requiresLink, false);
});

test("bot profile links direct users to the Telegram connect flow", () => {
  assert.equal(
    getTelegramProfileLink("https://guesthouse.example.com/"),
    "https://guesthouse.example.com/profile?telegram=link"
  );
});

test("/start and /link codes localize success, show the menu, and resume pending account actions", async (context) => {
  const conversations = mockTelegramConversationStore(context);
  const originalFindUnique = prisma.user.findUnique;
  const originalTransaction = prisma.$transaction;
  const originalReservationFindMany = prisma.reservation.findMany;
  const originalFetch = globalThis.fetch;
  const previousToken = process.env.TELEGRAM_BOT_TOKEN;
  const previousApiBase = process.env.TELEGRAM_API_BASE_URL;
  const payloads = [];
  const validCode = "abcdefghijklmnopqrstuvwx12345678";
  process.env.TELEGRAM_BOT_TOKEN = "123456789:telegram-link-flow-test-token";
  process.env.TELEGRAM_API_BASE_URL = "http://platform.test";
  prisma.user.findUnique = async ({ where }) => {
    if (where.telegramChatId) return null;
    return {
      id: 42,
      role: "GUEST",
      language: "am",
      telegramLinkExpiresAt: new Date(Date.now() + 60_000),
    };
  };
  prisma.$transaction = async (callback) => callback({
    user: { updateMany: async () => ({ count: 1 }) },
    telegramAccount: {
      findUnique: async ({ where }) => where.telegramId
        ? conversations.accounts.get(String(where.telegramId)) || null
        : [...conversations.accounts.values()].find((account) => account.userId === where.userId) || null,
      create: async ({ data }) => {
        const account = { ...data, user: { id: data.userId, role: "GUEST", language: "am" } };
        conversations.accounts.set(data.telegramId, account);
        return account;
      },
    },
  });
  prisma.reservation.findMany = async () => [];
  globalThis.fetch = async (url, options) => {
    if (String(url).includes("platform.test")) {
      return { ok: true, json: async () => ({ success: true, data: [] }) };
    }
    const payload = JSON.parse(options.body);
    payloads.push(payload);
    return { ok: true, json: async () => ({ ok: true, result: { message_id: payloads.length } }) };
  };
  context.after(() => {
    prisma.user.findUnique = originalFindUnique;
    prisma.$transaction = originalTransaction;
    prisma.reservation.findMany = originalReservationFindMany;
    globalThis.fetch = originalFetch;
    if (previousToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = previousToken;
    if (previousApiBase === undefined) delete process.env.TELEGRAM_API_BASE_URL;
    else process.env.TELEGRAM_API_BASE_URL = previousApiBase;
  });

  const sendText = (chatId, text) => handleTelegramUpdate({
    message: { text, chat: { id: chatId, type: "private" }, from: { id: chatId, language_code: "en" } },
  });

  await sendText(880002, "My Reservations");
  await sendText(880002, `/link ${validCode}`);
  await sendText(880003, `/start ${validCode}`);

  const linkSuccess = payloads.filter((payload) => payload.text === "✅ መለያዎ ተገናኝቷል");
  assert.equal(linkSuccess.length, 1);
  assert.ok(linkSuccess[0].reply_markup?.keyboard?.length);
  assert.equal(linkSuccess[0].reply_markup.keyboard[0][0].text, "ፈልግ");
  assert.ok(payloads.some((payload) => payload.text.includes("linked to another platform account")));
  assert.ok(payloads.some((payload) => payload.text === "ለመለያዎ ምንም ማስያዣ የለም።"));
});

test("start, help, and every menu action send a localized reply", async (context) => {
  mockTelegramConversationStore(context);
  const originalFindUnique = prisma.user.findUnique;
  const originalFetch = globalThis.fetch;
  const previousToken = process.env.TELEGRAM_BOT_TOKEN;
  process.env.TELEGRAM_BOT_TOKEN = "123456789:telegram-test-token-not-real";
  prisma.user.findUnique = async () => null;
  context.after(() => {
    prisma.user.findUnique = originalFindUnique;
    globalThis.fetch = originalFetch;
    if (previousToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = previousToken;
  });

  const actions = [
    ["/start", /Welcome to the Guesthouse Reservation assistant/],
    ["/help", /I can find approved guesthouses/],
    ["Search", /log in again/],
    ["My Reservations", /log in again/],
    ["My Payments", /log in again/],
    ["Link Account", /isn't linked yet/],
    ["Language", /Choose your language/],
  ];

  for (const [index, [text, expected]] of actions.entries()) {
    const payloads = [];
    globalThis.fetch = async (_url, options) => {
      payloads.push(JSON.parse(options.body));
      return { ok: true, json: async () => ({ ok: true, result: { message_id: index + 1 } }) };
    };
    await handleTelegramUpdate({
      message: {
        text,
        chat: { id: 900000 + index, type: "private" },
        from: { id: 900000 + index, language_code: "en" },
      },
    });
    assert.equal(payloads.length, 1, `${text} should send one Telegram reply`);
    assert.match(payloads[0].text, expected, `${text} reply text`);
    assert.ok(payloads[0].reply_markup, `${text} should preserve menu or inline buttons`);
    if (text === "/start") {
      const buttons = payloads[0].reply_markup.inline_keyboard.flat().map((button) => button.text);
      assert.deepEqual(buttons, ["Register", "Login"]);
    }
  }
});

test("registration asks for the website account type before collecting the full name", async (context) => {
  const conversations = mockTelegramConversationStore(context);
  const originalUserFindUnique = prisma.user.findUnique;
  const originalFetch = globalThis.fetch;
  const previousToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = 900101;
  const payloads = [];
  process.env.TELEGRAM_BOT_TOKEN = "123456789:telegram-role-test-token";
  prisma.user.findUnique = async () => null;
  globalThis.fetch = async (_url, options) => {
    payloads.push(JSON.parse(options.body));
    return { ok: true, json: async () => ({ ok: true, result: { message_id: payloads.length } }) };
  };
  context.after(() => {
    prisma.user.findUnique = originalUserFindUnique;
    globalThis.fetch = originalFetch;
    if (previousToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = previousToken;
  });

  const callback = (data, id) => handleTelegramUpdate({
    callback_query: {
      id,
      data,
      message: { chat: { id: chatId, type: "private" } },
      from: { id: chatId, language_code: "en" },
    },
  });

  await handleTelegramUpdate({
    message: { text: "/start", chat: { id: chatId, type: "private" }, from: { id: chatId, language_code: "en" } },
  });
  assert.deepEqual(payloads[0].reply_markup.inline_keyboard.flat().map((button) => button.text), ["Register", "Login"]);
  assert.equal(payloads[0].reply_markup.keyboard, undefined);

  await callback("auth:register", "register");
  assert.equal(conversations.get(String(chatId)).state.conversation.step, "REGISTER_ROLE");
  assert.deepEqual(
    payloads.filter((payload) => typeof payload.text === "string").at(-1).reply_markup.inline_keyboard.flat().map((button) => button.text),
    ["Guest", "Owner", "Back", "Cancel"]
  );
  await callback("auth:role:GUEST", "register-guest");
  assert.equal(conversations.get(String(chatId)).state.conversation.step, "REGISTER_NAME");
  assert.equal(conversations.get(String(chatId)).state.conversation.data.role, "GUEST");
  const registerPrompt = payloads.find((payload) => payload.text?.includes("Enter your full name"));
  assert.ok(registerPrompt);
  assert.deepEqual(registerPrompt.reply_markup.inline_keyboard.flat().map((button) => button.text), ["Back", "Cancel"]);
});

test("owner registration verifies email, collects website fields, records consent, and masks secrets", async (context) => {
  const conversations = mockTelegramConversationStore(context);
  const originalUserFindFirst = prisma.user.findFirst;
  const originalUserCreate = prisma.user.create;
  const originalSettingsUpsert = prisma.systemSetting.upsert;
  const originalLockUpsert = prisma.systemLock.upsert;
  const originalFetch = globalThis.fetch;
  const previousEnvironment = Object.fromEntries(
    ["TELEGRAM_BOT_TOKEN", "JWT_SECRET", "RESET_CODE_SECRET", "AUTH_EMAIL_FROM", "BREVO_API_KEY", "FRONTEND_URL"]
      .map((key) => [key, process.env[key]])
  );
  const chatId = 900104;
  const telegramMessages = [];
  const createdUsers = [];
  let verificationCode;
  let verificationEmailCount = 0;
  process.env.TELEGRAM_BOT_TOKEN = "123456789:telegram-registration-test-token";
  process.env.JWT_SECRET = "telegram-registration-test-jwt-secret";
  process.env.RESET_CODE_SECRET = "telegram-registration-test-reset-secret";
  process.env.AUTH_EMAIL_FROM = "Guesthouse <noreply@example.com>";
  process.env.BREVO_API_KEY = "telegram-registration-test-api-key";
  process.env.FRONTEND_URL = "https://guesthouse.example.com";
  prisma.user.findFirst = async () => null;
  prisma.user.create = async ({ data }) => {
    createdUsers.push(data);
    return { id: 9101, language: "en", ...data };
  };
  prisma.systemSetting.upsert = async () => ({ ownerRegistrationEnabled: true, guestBookingEnabled: true });
  prisma.systemLock.upsert = async () => ({ isLocked: false, message: "" });
  globalThis.fetch = async (url, options) => {
    const payload = JSON.parse(options.body);
    if (String(url).includes("api.brevo.com")) {
      verificationEmailCount += 1;
      verificationCode = /font-size:32px[^>]*>(\d{6})</.exec(payload.htmlContent)?.[1];
      return { ok: true, json: async () => ({}) };
    }
    telegramMessages.push({ url: String(url), payload });
    return { ok: true, json: async () => ({ ok: true, result: { message_id: telegramMessages.length } }) };
  };
  context.after(() => {
    prisma.user.findFirst = originalUserFindFirst;
    prisma.user.create = originalUserCreate;
    prisma.systemSetting.upsert = originalSettingsUpsert;
    prisma.systemLock.upsert = originalLockUpsert;
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(previousEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  const callback = (data) => handleTelegramUpdate({
    callback_query: {
      id: "registration-start",
      data,
      message: { chat: { id: chatId, type: "private" } },
      from: { id: chatId, language_code: "en" },
    },
  });
  const message = (text, messageId) => handleTelegramUpdate({
    message: {
      text,
      message_id: messageId,
      chat: { id: chatId, type: "private" },
      from: { id: chatId, language_code: "en" },
    },
  });

  await callback("auth:register");
  await callback("auth:role:OWNER");
  await message("Owner Example", 201);
  assert.equal(conversations.get(String(chatId)).state.conversation.step, "REGISTER_EMAIL");
  await message("ownerfirst@gmail.com", 202);
  const codePrompt = telegramMessages.find(({ payload }) => payload.text?.includes("A 6-digit code was sent"))?.payload;
  assert.ok(codePrompt?.text.includes("o***t@gmail.com"));
  assert.ok(!codePrompt?.text.includes("ownerfirst@gmail.com"));
  assert.deepEqual(
    codePrompt.reply_markup.inline_keyboard.flat().map((button) => button.text),
    ["Resend code", "Change email", "Back", "Cancel"]
  );
  assert.match(verificationCode || "", /^\d{6}$/);
  await callback("auth:resend_code");
  assert.ok(telegramMessages.some(({ payload }) => payload.text?.includes("wait") && payload.text.includes("seconds")));
  assert.equal(verificationEmailCount, 1);
  const codeState = conversations.get(String(chatId));
  codeState.state.conversation.data.codeSentAt = Date.now() - 61_000;
  conversations.set(String(chatId), codeState);
  await callback("auth:resend_code");
  assert.equal(verificationEmailCount, 2);
  await message("ownerfirst@gmail.com", 203);
  assert.ok(telegramMessages.some(({ payload }) => payload.text === "Please enter the 6-digit code sent to o***t@gmail.com."));
  await callback("auth:change_email");
  assert.equal(conversations.get(String(chatId)).state.conversation.step, "REGISTER_EMAIL");
  await message("ownerupdated@gmail.com", 204);
  assert.equal(verificationEmailCount, 3);
  await message(verificationCode, 205);
  assert.equal(conversations.get(String(chatId)).state.conversation.step, "REGISTER_PHONE");
  await message("251911111112", 206);
  assert.equal(conversations.get(String(chatId)).state.conversation.step, "REGISTER_ADDRESS");
  await message("12 Example Street, Gondar", 207);
  assert.equal(conversations.get(String(chatId)).state.conversation.step, "REGISTER_ID_TYPE");
  const idTypePrompt = telegramMessages.filter(({ payload }) => payload.text === "Choose your ID type:").at(-1).payload;
  assert.deepEqual(
    idTypePrompt.reply_markup.inline_keyboard.flat().map((button) => button.text),
    ["National ID", "Passport", "Driver License", "Back", "Cancel"]
  );
  await callback("auth:id_type:0");
  assert.equal(conversations.get(String(chatId)).state.conversation.step, "REGISTER_ID_NUMBER");
  await message("ABCD1234", 208);
  await message("securepass", 209);
  await message("wrongpass", 210);
  assert.ok(telegramMessages.some(({ payload }) => payload.text === "Passwords do not match."));
  await message("securepass", 211);
  const consentState = conversations.get(String(chatId)).state.conversation;
  assert.equal(consentState.step, "REGISTER_CONSENT");
  assert.equal(consentState.data.idNumber, undefined);
  assert.equal(consentState.data.password, undefined);
  assert.equal(consentState.data.confirmPassword, undefined);
  assert.equal(typeof consentState.data.registrationSecretCipher, "string");
  assert.equal(JSON.stringify(consentState).includes("ABCD1234"), false);
  assert.equal(JSON.stringify(consentState).includes("securepass"), false);

  const policyPrompt = telegramMessages.filter(({ payload }) => payload.text?.includes("Review the Terms of Service")).at(-1).payload;
  const policyButtons = policyPrompt.reply_markup.inline_keyboard.flat();
  assert.deepEqual(policyButtons.map((button) => button.text), ["Terms of Service", "Privacy Policy", "I agree", "Back", "Cancel"]);
  assert.equal(policyButtons[0].url, "https://guesthouse.example.com/terms");
  assert.equal(policyButtons[1].url, "https://guesthouse.example.com/privacy");
  await callback("auth:consent");
  const summary = telegramMessages.filter(({ payload }) => payload.text?.startsWith("Review your registration")).at(-1).payload;
  assert.ok(summary.text.includes("ID number: ****1234"));
  assert.ok(!summary.text.includes("ABCD1234"));
  await callback("auth:confirm_registration");

  assert.equal(conversations.accounts.get(String(chatId)).userId, 9101);
  assert.equal(createdUsers.length, 1);
  assert.equal(createdUsers[0].fullName, "Owner Example");
  assert.equal(createdUsers[0].email, "ownerupdated@gmail.com");
  assert.equal(createdUsers[0].phone, "+251911111112");
  assert.equal(createdUsers[0].residentialAddress, "12 Example Street, Gondar");
  assert.equal(createdUsers[0].idType, "National ID");
  assert.equal(createdUsers[0].idNumber, "ABCD1234");
  assert.equal(createdUsers[0].agreedToTerms, undefined);
  assert.ok(createdUsers[0].termsAcceptedAt instanceof Date);
  assert.ok(createdUsers[0].privacyPolicyAcceptedAt instanceof Date);
  assert.equal(createdUsers[0].role, "OWNER");
  assert.equal(conversations.get(String(chatId)).state.conversation, undefined);
  for (const messageId of [208, 209, 210, 211]) {
    assert.ok(telegramMessages.some(({ url, payload }) => url.endsWith("/deleteMessage") && payload.message_id === messageId));
  }
  assert.ok(telegramMessages.some(({ payload }) => payload.text === "Registration complete."));
  const registeredOwnerGuidance = telegramMessages.find(({ payload }) => payload.text?.includes("required documents, and images"))?.payload;
  assert.equal(
    registeredOwnerGuidance.reply_markup.inline_keyboard.flat().find((button) => button.text === "Open Owner Dashboard")?.url,
    "https://guesthouse.example.com/owner"
  );

  const secondChatId = 900105;
  const secondCallback = (data) => handleTelegramUpdate({
    callback_query: {
      id: "registration-lockout",
      data,
      message: { chat: { id: secondChatId, type: "private" } },
      from: { id: secondChatId, language_code: "am" },
    },
  });
  const secondMessage = (text, messageId) => handleTelegramUpdate({
    message: {
      text,
      message_id: messageId,
      chat: { id: secondChatId, type: "private" },
      from: { id: secondChatId, language_code: "am" },
    },
  });
  await secondCallback("auth:register");
  await secondCallback("auth:role:OWNER");
  await secondMessage("Second Customer", 301);
  await secondMessage("secondcustomer@gmail.com", 302);
  const amharicCodePrompt = telegramMessages.find(({ payload }) => payload.text?.includes("6 አሃዝ ያለው ኮድ"))?.payload;
  assert.ok(amharicCodePrompt?.text.includes("s***r@gmail.com"));
  assert.deepEqual(
    amharicCodePrompt.reply_markup.inline_keyboard.flat().map((button) => button.text),
    ["ኮዱን እንደገና ላክ", "ኢሜል ቀይር", "ተመለስ", "ሰርዝ"]
  );
  const lockoutCode = verificationCode === "000000" ? "000001" : "000000";
  for (let attempt = 0; attempt < 5; attempt += 1) await secondMessage(lockoutCode, 304 + attempt);
  assert.equal(conversations.get(String(secondChatId)).state.conversation, undefined);
  assert.ok(telegramMessages.some(({ payload }) => payload.text === "ብዙ የተሳሳቱ ኮዶች ገብተዋል። እባክዎ ምዝገባውን እንደገና ይጀምሩ።"));
});

test("guest registration mirrors optional email and required consent from the website", async (context) => {
  const conversations = mockTelegramConversationStore(context);
  const originalUserFindFirst = prisma.user.findFirst;
  const originalUserCreate = prisma.user.create;
  const originalFetch = globalThis.fetch;
  const previousEnvironment = Object.fromEntries(
    ["TELEGRAM_BOT_TOKEN", "JWT_SECRET"].map((key) => [key, process.env[key]])
  );
  const chatId = 900106;
  const telegramRequests = [];
  let createdUser;
  process.env.TELEGRAM_BOT_TOKEN = "123456789:telegram-guest-register-test-token";
  process.env.JWT_SECRET = "telegram-guest-register-test-jwt-secret";
  conversations.accounts.set(String(chatId), {
    telegramId: String(chatId),
    userId: 9106,
    user: { id: 9106, role: "GUEST", language: "en" },
  });
  prisma.user.findFirst = async () => null;
  prisma.user.create = async ({ data }) => {
    createdUser = data;
    return { id: 9106, language: "en", ...data };
  };
  globalThis.fetch = async (url, options) => {
    telegramRequests.push({ url: String(url), ...JSON.parse(options.body) });
    return { ok: true, json: async () => ({ ok: true, result: { message_id: telegramRequests.length } }) };
  };
  context.after(() => {
    prisma.user.findFirst = originalUserFindFirst;
    prisma.user.create = originalUserCreate;
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(previousEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  const callback = (data) => handleTelegramUpdate({
    callback_query: {
      id: `guest-${data}`,
      data,
      message: { chat: { id: chatId, type: "private" } },
      from: { id: chatId, language_code: "en" },
    },
  });
  const message = (text, messageId) => handleTelegramUpdate({
    message: { text, message_id: messageId, chat: { id: chatId, type: "private" }, from: { id: chatId, language_code: "en" } },
  });

  await callback("auth:register");
  await callback("auth:role:GUEST");
  await message("Guest Example", 401);
  await callback("auth:skip_email");
  await message("+251 91 234 5678", 402);
  await message("guestpass", 403);
  await message("guestpass", 404);
  await callback("auth:consent");
  const summary = telegramRequests.filter(({ text }) => text?.startsWith("Review your registration")).at(-1);
  assert.ok(summary);
  assert.ok(!summary.text.includes("ID number"));
  await callback("auth:confirm_registration");

  assert.equal(createdUser.role, "GUEST");
  assert.equal(createdUser.phone, "+251912345678");
  assert.equal(createdUser.email, undefined);
  assert.ok(createdUser.termsAcceptedAt instanceof Date);
  assert.ok(createdUser.privacyPolicyAcceptedAt instanceof Date);
  assert.ok(telegramRequests.some(({ url, message_id }) => url.endsWith("/deleteMessage") && message_id === 403));
  assert.ok(telegramRequests.some(({ url, message_id }) => url.endsWith("/deleteMessage") && message_id === 404));
});

test("owner login directs guesthouse setup to the website and hides guest search", async (context) => {
  const conversations = mockTelegramConversationStore(context);
  const originalUserFindUnique = prisma.user.findUnique;
  const originalUserFindFirst = prisma.user.findFirst;
  const originalLoginAttemptCount = prisma.loginAttempt.count;
  const originalSettingsUpsert = prisma.systemSetting.upsert;
  const originalLockUpsert = prisma.systemLock.upsert;
  const originalFetch = globalThis.fetch;
  const previousToken = process.env.TELEGRAM_BOT_TOKEN;
  const previousJwtSecret = process.env.JWT_SECRET;
  const previousFrontendUrl = process.env.FRONTEND_URL;
  const chatId = 900102;
  const payloads = [];
  process.env.TELEGRAM_BOT_TOKEN = "123456789:telegram-owner-login-test-token";
  process.env.JWT_SECRET = "telegram-owner-test-jwt-secret";
  process.env.FRONTEND_URL = "https://guesthouse.example.com/base";
  const owner = {
    id: 71,
    fullName: "Owner Test",
    email: "owner@gmail.com",
    normalizedEmail: "owner@gmail.com",
    phone: "+251911111111",
    normalizedPhone: "+251911111111",
    role: "OWNER",
    language: "en",
    password: await hashPassword("Ownerpass1"),
  };
  conversations.set(String(chatId), {
    chatId: String(chatId),
    state: { language: "en", conversation: { kind: "auth", step: "LOGIN_PASSWORD", data: { email: owner.email } } },
    expiresAt: new Date(Date.now() + 60_000),
  });
  conversations.accounts.set(String(chatId), {
    telegramId: String(chatId),
    userId: owner.id,
    user: { id: owner.id, role: owner.role, language: owner.language },
  });
  prisma.user.findUnique = async () => null;
  prisma.user.findFirst = async () => owner;
  prisma.loginAttempt.count = async () => 0;
  prisma.systemSetting.upsert = async () => ({ systemLocked: false, systemLockMessage: "", commissionRate: 10 });
  prisma.systemLock.upsert = async () => ({ isLocked: false, message: "" });
  globalThis.fetch = async (_url, options) => {
    payloads.push(JSON.parse(options.body));
    return { ok: true, json: async () => ({ ok: true, result: { message_id: payloads.length } }) };
  };
  context.after(() => {
    prisma.user.findUnique = originalUserFindUnique;
    prisma.user.findFirst = originalUserFindFirst;
    prisma.loginAttempt.count = originalLoginAttemptCount;
    prisma.systemSetting.upsert = originalSettingsUpsert;
    prisma.systemLock.upsert = originalLockUpsert;
    globalThis.fetch = originalFetch;
    if (previousToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = previousToken;
    if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousJwtSecret;
    if (previousFrontendUrl === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = previousFrontendUrl;
  });

  await handleTelegramUpdate({
    message: {
      text: "Ownerpass1",
      message_id: 88,
      chat: { id: chatId, type: "private" },
      from: { id: chatId, language_code: "en" },
    },
  });

  const ownerGuidance = payloads.find((payload) => payload.text?.includes("required documents, and images"));
  const registrationButton = ownerGuidance.reply_markup.inline_keyboard.flat().find((button) => button.text === "Register guesthouse on website");
  assert.equal(registrationButton.url, "https://guesthouse.example.com/owner/guesthouse");
  const dashboardButton = ownerGuidance.reply_markup.inline_keyboard.flat().find((button) => button.text === "Open Owner Dashboard");
  assert.equal(dashboardButton.url, "https://guesthouse.example.com/owner");
  const menu = payloads.find((payload) => payload.text === "What would you like to do?");
  const menuLabels = menu.reply_markup.keyboard.flat().map((button) => button.text);
  assert.ok(menuLabels.includes("My Reservations"));
  assert.ok(menuLabels.includes("My Payments"));
  assert.ok(!menuLabels.includes("Search"));
});

test("menu actions cancel password entry instead of being consumed as credentials", async (context) => {
  const conversations = mockTelegramConversationStore(context);
  const originalUserFindUnique = prisma.user.findUnique;
  const originalUserFindFirst = prisma.user.findFirst;
  const originalLoginAttemptCount = prisma.loginAttempt.count;
  const originalFetch = globalThis.fetch;
  const previousToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = 910001;
  const requests = [];
  process.env.TELEGRAM_BOT_TOKEN = "123456789:telegram-password-delete-test-token";
  conversations.set(String(chatId), {
    chatId: String(chatId),
    state: { language: "en", conversation: { kind: "auth", step: "LOGIN_PASSWORD", data: { email: "guest@gmail.com" } } },
    expiresAt: new Date(Date.now() + 60_000),
  });
  prisma.user.findUnique = async () => null;
  prisma.user.findFirst = async () => null;
  prisma.loginAttempt.count = async () => 0;
  globalThis.fetch = async (url, options) => {
    requests.push({ url: String(url), payload: JSON.parse(options.body) });
    return { ok: true, json: async () => ({ ok: true, result: { message_id: 1 } }) };
  };
  context.after(() => {
    prisma.user.findUnique = originalUserFindUnique;
    prisma.user.findFirst = originalUserFindFirst;
    prisma.loginAttempt.count = originalLoginAttemptCount;
    globalThis.fetch = originalFetch;
    if (previousToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = previousToken;
  });

  await handleTelegramUpdate({
    message: {
      text: "Search",
      message_id: 77,
      chat: { id: chatId, type: "private" },
      from: { id: chatId, language_code: "en" },
    },
  });

  const deletion = requests.find(({ url }) => url.endsWith("/deleteMessage"));
  assert.equal(deletion, undefined);
  assert.ok(requests.some(({ url }) => url.endsWith("/sendMessage")));
  assert.equal(conversations.get(String(chatId)).state.conversation, undefined);
  const response = requests.find(({ url }) => url.endsWith("/sendMessage"))?.payload;
  assert.deepEqual(response.reply_markup.inline_keyboard.flat().map((button) => button.text), ["Register", "Login"]);
});

test("Telegram login state uses the persisted account mapping instead of legacy user fields", async (context) => {
  mockTelegramConversationStore(context);
  const originalUserFindUnique = prisma.user.findUnique;
  const originalFetch = globalThis.fetch;
  const previousToken = process.env.TELEGRAM_BOT_TOKEN;
  const payloads = [];
  const chatId = 920001;
  process.env.TELEGRAM_BOT_TOKEN = "123456789:telegram-legacy-link-test-token";
  let userLookupCount = 0;
  prisma.user.findUnique = async () => {
    userLookupCount += 1;
    return { id: 51, role: "GUEST", language: "en" };
  };
  globalThis.fetch = async (_url, options) => {
    payloads.push(JSON.parse(options.body));
    return { ok: true, json: async () => ({ ok: true, result: { message_id: payloads.length } }) };
  };
  context.after(() => {
    prisma.user.findUnique = originalUserFindUnique;
    globalThis.fetch = originalFetch;
    if (previousToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = previousToken;
  });

  await handleTelegramUpdate({
    message: {
      text: "/start",
      chat: { id: chatId, type: "private" },
      from: { id: chatId, language_code: "en" },
    },
  });

  assert.equal(payloads.length, 1);
  assert.match(payloads[0].text, /Welcome to the Guesthouse Reservation assistant/);
  assert.deepEqual(payloads[0].reply_markup.inline_keyboard.flat().map((button) => button.text), ["Register", "Login"]);
  assert.equal(userLookupCount, 0);
});
