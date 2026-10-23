import test from "node:test";
import assert from "node:assert/strict";
import { handleTelegramWebhook } from "./telegram.controller.js";

test("Telegram webhook is unavailable when no secret is configured", async (context) => {
  const previousSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  delete process.env.TELEGRAM_WEBHOOK_SECRET;
  context.after(() => {
    if (previousSecret !== undefined) process.env.TELEGRAM_WEBHOOK_SECRET = previousSecret;
  });
  const response = {
    statusCode: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };

  await handleTelegramWebhook({ get: () => "anything", body: {} }, response);

  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.body, { ok: false });
});

test("Telegram webhook rejects missing or invalid secret tokens", async (context) => {
  const previousSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  process.env.TELEGRAM_WEBHOOK_SECRET = "test-webhook-secret";
  context.after(() => {
    if (previousSecret === undefined) delete process.env.TELEGRAM_WEBHOOK_SECRET;
    else process.env.TELEGRAM_WEBHOOK_SECRET = previousSecret;
  });

  const response = () => ({
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  });
  const invalidResponse = response();
  await handleTelegramWebhook({ get: () => "wrong-secret", body: {} }, invalidResponse);
  assert.equal(invalidResponse.statusCode, 401);

  const validResponse = response();
  await handleTelegramWebhook({
    get: (header) => header.toLowerCase() === "x-telegram-bot-api-secret-token" ? "test-webhook-secret" : undefined,
    body: { update_id: 123 },
  }, validResponse);
  assert.equal(validResponse.statusCode, 200);
  assert.deepEqual(validResponse.body, { ok: true });
});
