import nodemailer from "nodemailer";

const BREVO_TIMEOUT_MS = 15000;
const SMTP_TIMEOUT_MS = 30000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let cachedTransporter = null;

function parseFrom(value) {
  const from = (value || "").trim();
  const match = from.match(/^(.*)<(.+)>$/);
  if (match) {
    return {
      name: match[1].trim().replace(/^"|"$/g, ""),
      email: match[2].trim(),
    };
  }
  return { email: from };
}

function htmlToText(html) {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Brevo (HTTPS API): used on Render, where SMTP ports are blocked
async function sendWithBrevo({ to, subject, html, text }) {
  const sender = parseFrom(process.env.AUTH_EMAIL_FROM);
  if (!sender.email) {
    throw new Error("AUTH_EMAIL_FROM is missing");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BREVO_TIMEOUT_MS);

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender,
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Brevo error ${res.status}: ${await res.text()}`);
    }
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Brevo request timed out");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// Gmail SMTP: used on localhost
function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  const missing = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"].filter(
    (key) => !process.env[key]
  );
  if (missing.length > 0) {
    throw new Error(`Missing in .env: ${missing.join(", ")}`);
  }

  const port = Number(SMTP_PORT || 587);

  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    family: 4, // connect over IPv4 only (avoids IPv6 timeouts on some networks)
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
  });

  return cachedTransporter;
}

export default async function sendEmail({ to, subject, html, text }) {
  if (typeof to !== "string" || !EMAIL_PATTERN.test(to.trim())) {
    throw new Error("A valid recipient email is required");
  }
  if (!subject || !html) {
    throw new Error("Email subject and html are required");
  }

  const recipient = to.trim();
  const plainText = text || htmlToText(html);

  // 1) Brevo, if its key exists (Render / production)
  if (process.env.BREVO_API_KEY) {
    await sendWithBrevo({ to: recipient, subject, html, text: plainText });
    return;
  }

  // 2) In production, never fall back to SMTP (blocked on Render free tier)
  if (process.env.NODE_ENV === "production") {
    throw new Error("BREVO_API_KEY is missing in production");
  }

  // 3) Gmail SMTP (localhost)
  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.AUTH_EMAIL_FROM || process.env.SMTP_USER,
    to: recipient,
    subject,
    html,
    text: plainText,
  });
}

// Ready-made reset code email
export function buildResetCodeEmail(code, minutes = 10) {
  return {
    subject: "Your password reset code",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="margin:0 0 12px;color:#0b3d5c">Guesthouse Platform</h2>
        <p style="color:#374151">Use this code to reset your password:</p>
        <p style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#0b3d5c;margin:16px 0">${code}</p>
        <p style="color:#6b7280;font-size:14px">This code expires in ${minutes} minutes. If you did not request it, you can ignore this email.</p>
      </div>
    `,
  };
}