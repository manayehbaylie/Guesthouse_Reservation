import { createPublicKey, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";

const telegramJwksUrl = "https://oauth.telegram.org/.well-known/jwks.json";
let jwksCache = null;
let jwksExpiresAt = 0;
const pendingNonces = new Map();

const authError = (message) => {
  const error = new Error(message);
  error.statusCode = 401;
  return error;
};

const getJwks = async (forceRefresh = false) => {
  if (!forceRefresh && jwksCache && jwksExpiresAt > Date.now()) {
    return jwksCache;
  }

  const response = await fetch(telegramJwksUrl, {
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    throw new Error("Unable to retrieve Telegram signing keys.");
  }

  const jwks = await response.json();
  if (!Array.isArray(jwks.keys)) {
    throw new Error("Telegram returned invalid signing keys.");
  }

  jwksCache = jwks.keys;
  jwksExpiresAt = Date.now() + 10 * 60 * 1000;
  return jwksCache;
};

const findSigningKey = async (keyId) => {
  let keys = await getJwks();
  let jwk = keys.find((key) => key.kid === keyId && key.kty === "RSA");
  if (!jwk) {
    keys = await getJwks(true);
    jwk = keys.find((key) => key.kid === keyId && key.kty === "RSA");
  }
  if (!jwk) {
    throw authError("Telegram login token has an unknown signing key.");
  }
  return createPublicKey({ key: jwk, format: "jwk" });
};

export const getTelegramLoginConfig = () => {
  const clientId = process.env.TELEGRAM_LOGIN_CLIENT_ID?.trim() || "";
  return {
    configured: /^\d+$/.test(clientId),
    clientId: /^\d+$/.test(clientId) ? Number(clientId) : null,
  };
};

export const createTelegramLoginNonce = () => {
  const { configured } = getTelegramLoginConfig();
  if (!configured) {
    const error = new Error("Telegram login is not configured.");
    error.statusCode = 503;
    throw error;
  }

  const now = Date.now();
  for (const [nonce, expiresAt] of pendingNonces) {
    if (expiresAt <= now) pendingNonces.delete(nonce);
  }
  const nonce = randomBytes(32).toString("base64url");
  pendingNonces.set(nonce, now + 5 * 60 * 1000);
  return nonce;
};

export const verifyTelegramIdToken = async (idToken, expectedNonce) => {
  const { clientId } = getTelegramLoginConfig();
  if (!clientId) {
    const error = new Error("Telegram login is not configured.");
    error.statusCode = 503;
    throw error;
  }
  if (typeof idToken !== "string" || !idToken || typeof expectedNonce !== "string" || !expectedNonce) {
    throw authError("Telegram login response is incomplete.");
  }

  const decoded = jwt.decode(idToken, { complete: true });
  if (!decoded?.header?.kid || decoded.header.alg !== "RS256") {
    throw authError("Telegram login token is invalid.");
  }

  const signingKey = await findSigningKey(decoded.header.kid);
  let claims;
  try {
    claims = jwt.verify(idToken, signingKey, {
      algorithms: ["RS256"],
      audience: String(clientId),
      issuer: "https://oauth.telegram.org",
      clockTolerance: 5,
    });
  } catch {
    throw authError("Telegram login token is invalid or expired.");
  }

  const nonceExpiresAt = pendingNonces.get(expectedNonce);
  if (
    claims.nonce !== expectedNonce ||
    !nonceExpiresAt ||
    nonceExpiresAt <= Date.now() ||
    !/^\d+$/.test(String(claims.id || ""))
  ) {
    throw authError("Telegram login could not be verified. Please try again.");
  }
  pendingNonces.delete(expectedNonce);

  return claims;
};