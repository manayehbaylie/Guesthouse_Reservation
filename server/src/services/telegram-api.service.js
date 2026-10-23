import { isIP } from "node:net";

const telegramApiUrl = (method) =>
  `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`;

const redactToken = (value) => {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  return String(value || "")
    .replace(token || /$^/, "[REDACTED_TELEGRAM_TOKEN]")
    .replace(/bot\d+:[A-Za-z0-9_-]{20,}/g, "bot[REDACTED_TELEGRAM_TOKEN]");
};

const isPublicIpv4 = (hostname) => {
  const [a, b] = hostname.split(".").map(Number);
  return !(
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168)) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51) ||
    (a === 203 && b === 0) ||
    a >= 224
  );
};

const isPublicHostname = (hostname) => {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const ipType = isIP(normalized);
  if (ipType === 4) return isPublicIpv4(normalized);
  if (ipType === 6) {
    return !(
      normalized === "::" || normalized === "::1" ||
      normalized.startsWith("fc") || normalized.startsWith("fd") ||
      normalized.startsWith("fe80:") || normalized.startsWith("ff") ||
      normalized.startsWith("::ffff:127.") || normalized.startsWith("::ffff:10.") ||
      normalized.startsWith("::ffff:192.168.")
    );
  }
  return normalized.includes(".") && !/\.(?:localhost|local|internal|test|invalid|example|home|lan|corp|intranet|onion)$/i.test(normalized);
};

export const createPublicHttpsUrlButton = (text, targetUrl) => {
  try {
    const url = new URL(String(targetUrl));
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      !isPublicHostname(url.hostname)
    ) return null;
    return { text: String(text), url: url.toString() };
  } catch {
    return null;
  }
};

const safeButtonUrl = (value) => {
  try {
    const url = new URL(String(value));
    url.username = "";
    url.password = "";
    url.hash = "";
    if (url.search) {
      const keys = [...new Set([...url.searchParams.keys()])];
      url.search = keys.length ? `?${keys.map((key) => `${encodeURIComponent(key)}=[REDACTED]`).join("&")}` : "";
    }
    return redactToken(url.toString());
  } catch {
    return redactToken(value);
  }
};

const telegramPayloadSummary = (method, payload) => ({
  method,
  chat_id: payload.chat_id ?? null,
  text_length: Array.from(String(payload.text ?? "")).length,
  parse_mode: payload.parse_mode ?? null,
  reply_markup_button_urls: (payload.reply_markup?.inline_keyboard || [])
    .flat()
    .filter((button) => button.url)
    .map((button) => safeButtonUrl(button.url)),
});

const waitForRetry = (attempt, retryAfterSeconds = 0) => new Promise((resolve) => {
  const backoffMs = Math.min(15000, 300 * (2 ** attempt));
  const serverWaitMs = Math.min(30000, Number(retryAfterSeconds || 0) * 1000);
  setTimeout(resolve, Math.max(backoffMs, serverWaitMs) + Math.floor(Math.random() * 150));
});

export const callTelegramApi = async (method, payload, timeoutMs = 15000) => {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  }

  for (let attempt = 0; attempt < 4; attempt += 1) {
    let response;
    try {
      response = await fetch(telegramApiUrl(method), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (cause) {
      if (attempt < 3) {
        await waitForRetry(attempt);
        continue;
      }
      const error = new Error(`Telegram API ${method} network request failed after 4 attempts: ${redactToken(cause?.message || cause)}`);
      error.cause = cause;
      console.error(`Telegram API request failed: ${error.message}; payload=${JSON.stringify(telegramPayloadSummary(method, payload))}`);
      throw error;
    }

    let result;
    try {
      result = await response.json();
    } catch {
      result = {};
    }
    if (response.ok && result.ok) return result.result;

    const retryable = response.status === 429 || response.status >= 500;
    if (retryable && attempt < 3) {
      await waitForRetry(attempt, result.parameters?.retry_after);
      continue;
    }

    const description = redactToken(result.description || "Telegram returned no error description.");
    const error = new Error(`Telegram API ${method} failed (HTTP ${response.status}): ${description}`);
    error.telegramStatusCode = response.status;
    error.telegramRetryAfter = result.parameters?.retry_after;
    console.error(`Telegram API request failed: ${error.message}; payload=${JSON.stringify(telegramPayloadSummary(method, payload))}`);
    throw error;
  }

  throw new Error(`Telegram API ${method} failed after retries.`);
};

export const sendTelegramMessage = async (chatId, text, options = {}) => {
  if (!process.env.TELEGRAM_BOT_TOKEN?.trim()) return false;

  const chunks = [];
  let chunk = "";
  let chunkLength = 0;
  for (const character of String(text)) {
    if (chunkLength + character.length > 4096) {
      chunks.push(chunk);
      chunk = "";
      chunkLength = 0;
    }
    chunk += character;
    chunkLength += character.length;
  }
  if (chunk) chunks.push(chunk);
  if (!chunks.length) chunks.push("");

  for (const [index, chunk] of chunks.entries()) {
    const payload = {
      chat_id: chatId,
      text: chunk,
      disable_web_page_preview: true,
      ...options,
      ...(index === chunks.length - 1 ? {} : { reply_markup: undefined }),
    };
    try {
      await callTelegramApi("sendMessage", payload);
    } catch (error) {
      if (error.telegramStatusCode !== 400 || !payload.reply_markup) throw error;
      const { reply_markup: _replyMarkup, ...plainPayload } = payload;
      await callTelegramApi("sendMessage", plainPayload);
    }
  }
  return true;
};
