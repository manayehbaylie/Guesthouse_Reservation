import test from "node:test";
import assert from "node:assert/strict";
import {
  callTelegramApi,
  createPublicHttpsUrlButton,
  sendTelegramMessage,
} from "./telegram-api.service.js";

const setupTelegramMocks = (context) => {
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;
  const previousToken = process.env.TELEGRAM_BOT_TOKEN;
  const token = "987654321:abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN";
  const logs = [];
  process.env.TELEGRAM_BOT_TOKEN = token;
  console.error = (...args) => logs.push(args.join(" "));
  context.after(() => {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
    if (previousToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = previousToken;
  });
  return { logs, token };
};

test("only creates inline URL buttons for public HTTPS URLs", () => {
  const frontendUrl = "http://localhost:5173";
  assert.equal(createPublicHttpsUrlButton("Open profile", `${frontendUrl}/profile`), null);
  assert.equal(createPublicHttpsUrlButton("Open profile", "http://127.0.0.1/profile"), null);
  assert.equal(createPublicHttpsUrlButton("Open profile", "https://guesthouse.local/profile"), null);
  assert.equal(createPublicHttpsUrlButton("Open profile", "https://203.0.113.10/profile"), null);
  assert.deepEqual(
    createPublicHttpsUrlButton("Open profile", "https://guesthouse.example.com/profile"),
    { text: "Open profile", url: "https://guesthouse.example.com/profile" }
  );
});

test("Telegram API failures include description and log token-safe payload metadata", async (context) => {
  const { logs, token } = setupTelegramMocks(context);
  globalThis.fetch = async () => ({
    ok: false,
    status: 400,
    json: async () => ({ ok: false, description: "Bad Request: BUTTON_URL_INVALID" }),
  });

  await assert.rejects(
    callTelegramApi("sendMessage", {
      chat_id: "12345",
      text: "hello",
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: [[{ text: "Open", url: "https://example.com/path?token=private-value" }]] },
    }),
    /Bad Request: BUTTON_URL_INVALID/
  );

  const log = logs.join("\n");
  assert.match(log, /BUTTON_URL_INVALID/);
  assert.match(log, /sendMessage/);
  assert.match(log, /12345/);
  assert.match(log, /"text_length":5/);
  assert.match(log, /"parse_mode":"HTML"/);
  assert.match(log, /https:\/\/example\.com\/path\?token=\[REDACTED\]/);
  assert.equal(log.includes(token), false);
  assert.equal(log.includes("private-value"), false);
});

test("retries one markup 400 as plain text", async (context) => {
  const { logs } = setupTelegramMocks(context);
  const payloads = [];
  globalThis.fetch = async (_url, options) => {
    const payload = JSON.parse(options.body);
    payloads.push(payload);
    if (payloads.length === 1) {
      return { ok: false, status: 400, json: async () => ({ ok: false, description: "Bad Request: REPLY_MARKUP_INVALID" }) };
    }
    return { ok: true, status: 200, json: async () => ({ ok: true, result: { message_id: 1 } }) };
  };

  assert.equal(await sendTelegramMessage("12345", "Your answer", { reply_markup: { inline_keyboard: [] } }), true);
  assert.equal(payloads.length, 2);
  assert.ok(payloads[0].reply_markup);
  assert.equal(Object.hasOwn(payloads[1], "reply_markup"), false);
  assert.match(logs.join("\n"), /REPLY_MARKUP_INVALID/);
});

test("retries transient network errors with backoff", async (context) => {
  setupTelegramMocks(context);
  let attempts = 0;
  globalThis.fetch = async () => {
    attempts += 1;
    if (attempts === 1) throw new Error("temporary network interruption");
    return { ok: true, status: 200, json: async () => ({ ok: true, result: { message_id: 2 } }) };
  };

  assert.deepEqual(await callTelegramApi("sendMessage", { chat_id: 1, text: "retry" }), { message_id: 2 });
  assert.equal(attempts, 2);
});

test("splits long Telegram messages and attaches markup only to the final chunk", async (context) => {
  setupTelegramMocks(context);
  const payloads = [];
  globalThis.fetch = async (_url, options) => {
    payloads.push(JSON.parse(options.body));
    return { ok: true, status: 200, json: async () => ({ ok: true, result: { message_id: payloads.length } }) };
  };

  const message = Array.from({ length: 100 }, (_, index) => `Guesthouse ${index + 1}: available rooms and rates ${"details ".repeat(8)}`).join("\n");
  await sendTelegramMessage("12345", message, { reply_markup: { keyboard: [[{ text: "Help" }]] } });

  assert.ok(payloads.length > 1);
  assert.ok(payloads.every(({ text }) => text.length <= 4096));
  assert.equal(Object.hasOwn(payloads[0], "reply_markup"), false);
  assert.equal(Object.hasOwn(payloads[1], "reply_markup"), false);
  assert.ok(payloads[2].reply_markup);
  assert.equal(payloads.map(({ text }) => text).join(""), message);
});
