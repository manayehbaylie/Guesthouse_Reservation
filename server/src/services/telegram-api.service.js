const telegramApiUrl = (method) =>
  `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`;

export const callTelegramApi = async (method, payload, timeoutMs = 15000) => {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  }

  const response = await fetch(telegramApiUrl(method), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(`Telegram API ${method} failed (HTTP ${response.status}).`);
  }

  return result.result;
};

export const sendTelegramMessage = async (chatId, text) => {
  if (!process.env.TELEGRAM_BOT_TOKEN?.trim()) return false;

  await callTelegramApi("sendMessage", {
    chat_id: chatId,
    text: String(text).slice(0, 4000),
    disable_web_page_preview: true,
  });
  return true;
};
