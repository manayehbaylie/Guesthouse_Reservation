import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";
import jwt from "jsonwebtoken";
import {
  createTelegramLoginNonce,
  verifyTelegramIdToken,
} from "./telegram-login.service.js";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const jwk = publicKey.export({ format: "jwk" });
jwk.kid = "telegram-test-key";
jwk.alg = "RS256";

const makeToken = (nonce, overrides = {}) => jwt.sign({
  iss: "https://oauth.telegram.org",
  aud: "123456",
  sub: "telegram-subject",
  id: 987654321,
  nonce,
  ...overrides,
}, privateKey, {
  algorithm: "RS256",
  keyid: jwk.kid,
  expiresIn: "5m",
});

test("verifies a signed Telegram ID token for this app and nonce", async (t) => {
  process.env.TELEGRAM_LOGIN_CLIENT_ID = "123456";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ keys: [jwk] }) });
  t.after(() => {
    globalThis.fetch = originalFetch;
    delete process.env.TELEGRAM_LOGIN_CLIENT_ID;
  });

  const nonce = createTelegramLoginNonce();
  const claims = await verifyTelegramIdToken(makeToken(nonce), nonce);
  assert.equal(String(claims.id), "987654321");
  await assert.rejects(
    verifyTelegramIdToken(makeToken(nonce), nonce),
    /could not be verified/
  );
});

test("rejects a Telegram ID token with a different nonce", async (t) => {
  process.env.TELEGRAM_LOGIN_CLIENT_ID = "123456";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ keys: [jwk] }) });
  t.after(() => {
    globalThis.fetch = originalFetch;
    delete process.env.TELEGRAM_LOGIN_CLIENT_ID;
  });

  const nonce = createTelegramLoginNonce();
  await assert.rejects(
    verifyTelegramIdToken(makeToken(nonce), "different-nonce"),
    /could not be verified/
  );
});

test("rejects tokens issued for a different client", async (t) => {
  process.env.TELEGRAM_LOGIN_CLIENT_ID = "123456";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ keys: [jwk] }) });
  t.after(() => {
    globalThis.fetch = originalFetch;
    delete process.env.TELEGRAM_LOGIN_CLIENT_ID;
  });

  await assert.rejects(
    verifyTelegramIdToken(
      makeToken(createTelegramLoginNonce(), { aud: "654321" }),
      "login-nonce"
    ),
    /invalid or expired/
  );
});