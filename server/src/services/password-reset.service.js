import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { hashPassword } from "../utils/hash.js";
import { getEthiopianPhoneLookupCandidates, normalizeGmailAddress } from "../utils/auth-normalization.js";
import { isPasswordResetEmailConfigured, sendPasswordResetEmail } from "./email.service.js";
import { isPasswordResetSmsConfigured, sendPasswordResetSms } from "./sms.service.js";
import { hashSessionToken } from "./auth-session.service.js";

const genericMessage = "If the account exists, a code has been sent.";
const resetSecret = () => process.env.RESET_TOKEN_SECRET || process.env.JWT_SECRET;
const hashCode = (code) => createHmac("sha256", process.env.RESET_CODE_SECRET || process.env.JWT_SECRET).update(code).digest("hex");
const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

const ensureDeliveryConfigured = (deliveryMethod) => {
  const configured = deliveryMethod === "email"
    ? isPasswordResetEmailConfigured()
    : isPasswordResetSmsConfigured();
    if (configured) return;
  const error = new Error(deliveryMethod === "email"
    ? "Email code delivery is not configured. Set AUTH_EMAIL_FROM and either BREVO_API_KEY or SMTP_HOST, SMTP_USER and SMTP_PASS in server/.env."
    : "SMS code delivery is not configured. Set AT_USERNAME and AT_API_KEY in server/.env.");
  error.statusCode = 503;
  throw error;
};

const deliverCode = async (user, code, deliveryMethod) => {
  if (deliveryMethod === "email") return sendPasswordResetEmail(user.email, code);
  return sendPasswordResetSms(user.phone, code);
};

const createChallenge = async (user, deliveryMethod) => {
  const challengeId = randomUUID();
  if (!user) return challengeId;

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
  const resendAvailableAt = new Date(now.getTime() + 60 * 1000);

  await prisma.passwordResetCode.updateMany({
    where: { userId: user.id, consumedAt: null },
    data: { consumedAt: now },
  });
  await prisma.passwordResetCode.create({
    data: { challengeId, userId: user.id, deliveryMethod, codeHash: hashCode(code), expiresAt, resendAvailableAt },
  });
  try {
    await deliverCode(user, code, deliveryMethod);
  } catch {
    await prisma.passwordResetCode.updateMany({
      where: { challengeId, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    const error = new Error(deliveryMethod === "email"
      ? "The reset email could not be sent. Check the email provider configuration and try again."
      : "The reset SMS could not be sent. Check the SMS provider configuration and try again.");
    error.statusCode = 502;
    throw error;
  }
  return challengeId;
};

const findResetUser = async ({ email, phone }) => {
  if (email) {
    const normalizedEmail = normalizeGmailAddress(String(email));
    const emailValue = String(email).trim().toLowerCase();
    return prisma.user.findFirst({
      where: { OR: [{ normalizedEmail: normalizedEmail || emailValue }, { email: emailValue }] },
    });
  }
  const candidates = getEthiopianPhoneLookupCandidates(phone);
  return candidates.length ? prisma.user.findFirst({
    where: { OR: [{ normalizedPhone: candidates[0] }, { phone: { in: candidates } }] },
  }) : null;
};

export const requestPasswordReset = async ({ email, phone }) => {
  const deliveryMethod = email ? "email" : "sms";
  ensureDeliveryConfigured(deliveryMethod);
  const user = await findResetUser({ email, phone });
  const challengeId = await createChallenge(user, deliveryMethod);
  return { message: genericMessage, challengeId };
};

export const resendPasswordResetCode = async (challengeId) => {
  if (typeof challengeId !== "string" || !/^[0-9a-f-]{36}$/i.test(challengeId)) return { message: genericMessage };
  const challenge = await prisma.passwordResetCode.findUnique({ where: { challengeId }, include: { user: true } });
  if (!challenge || challenge.consumedAt || challenge.verifiedAt || challenge.expiresAt <= new Date()) {
    return { message: genericMessage };
  }
  if (challenge.resendAvailableAt > new Date()) {
    const error = new Error("Please wait before requesting another code.");
    error.statusCode = 429;
    throw error;
  }

  ensureDeliveryConfigured(challenge.deliveryMethod);
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await prisma.passwordResetCode.update({
    where: { id: challenge.id },
    data: {
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      resendAvailableAt: new Date(Date.now() + 60 * 1000),
    },
  });
  try {
    await deliverCode(challenge.user, code, challenge.deliveryMethod);
  } catch {
    await prisma.passwordResetCode.updateMany({
      where: { id: challenge.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    const error = new Error(challenge.deliveryMethod === "email"
      ? "The reset email could not be sent. Check the email provider configuration and try again."
      : "The reset SMS could not be sent. Check the SMS provider configuration and try again.");
    error.statusCode = 502;
    throw error;
  }
  return { message: genericMessage };
};

export const verifyPasswordResetCode = async (challengeId, code) => {
  if (typeof challengeId !== "string" || !/^[0-9a-f-]{36}$/i.test(challengeId)) {
    const error = new Error("Invalid or expired code.");
    error.statusCode = 400;
    throw error;
  }
  const challenge = await prisma.passwordResetCode.findUnique({ where: { challengeId } });
  if (!challenge || challenge.consumedAt || challenge.verifiedAt || challenge.expiresAt <= new Date() || challenge.attempts >= 5) {
    const error = new Error("Invalid or expired code.");
    error.statusCode = 400;
    throw error;
  }

  const attempt = await prisma.passwordResetCode.updateMany({
    where: { id: challenge.id, attempts: { lt: 5 }, consumedAt: null, expiresAt: { gt: new Date() } },
    data: { attempts: { increment: 1 } },
  });
  if (attempt.count !== 1) {
    const error = new Error("Invalid or expired code.");
    error.statusCode = 400;
    throw error;
  }

  const matched = /^\d{6}$/.test(String(code)) && safeEqual(challenge.codeHash, hashCode(String(code)));
  if (!matched) {
    const error = new Error("Invalid or expired code.");
    error.statusCode = 400;
    throw error;
  }

  const resetToken = jwt.sign({ sub: String(challenge.userId), resetId: challenge.id, purpose: "password-reset" }, resetSecret(), { expiresIn: "10m" });
  await prisma.passwordResetCode.update({
    where: { id: challenge.id },
    data: { verifiedAt: new Date(), resetTokenHash: hashSessionToken(resetToken) },
  });
  return { resetToken };
};

export const resetUserPassword = async (resetToken, newPassword, confirmPassword) => {
  if (typeof newPassword !== "string" || newPassword.length < 8 || newPassword.length > 128 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
    const error = new Error("Use at least 8 characters, including a letter and a number.");
    error.statusCode = 400;
    throw error;
  }

  let claims;
  try {
    claims = jwt.verify(resetToken, resetSecret());
  } catch {
    const error = new Error("Invalid or expired reset token.");
    error.statusCode = 400;
    throw error;
  }
  if (claims.purpose !== "password-reset" || !claims.resetId) {
    const error = new Error("Invalid or expired reset token.");
    error.statusCode = 400;
    throw error;
  }
  if (newPassword !== confirmPassword) {
    const error = new Error("Passwords do not match.");
    error.statusCode = 400;
    throw error;
  }

  const resetRecord = await prisma.passwordResetCode.findUnique({ where: { id: claims.resetId } });
  if (!resetRecord || !resetRecord.verifiedAt || resetRecord.consumedAt || resetRecord.resetTokenHash !== hashSessionToken(resetToken)) {
    const error = new Error("Invalid or expired reset token.");
    error.statusCode = 400;
    throw error;
  }

  const password = await hashPassword(newPassword);
  const now = new Date();
  await prisma.$transaction(async (transaction) => {
    const consumed = await transaction.passwordResetCode.updateMany({
      where: { id: resetRecord.id, verifiedAt: { not: null }, consumedAt: null, expiresAt: { gt: now } },
      data: { consumedAt: now },
    });
    if (consumed.count !== 1) {
      const error = new Error("Invalid or expired reset token.");
      error.statusCode = 400;
      throw error;
    }
    await transaction.user.update({ where: { id: resetRecord.userId }, data: { password } });
    await transaction.refreshToken.updateMany({ where: { userId: resetRecord.userId, revokedAt: null }, data: { revokedAt: now } });
    await transaction.activeSession.updateMany({ where: { userId: resetRecord.userId, revokedAt: null }, data: { revokedAt: now } });
  });
  return { success: true, message: "Password reset successfully. You can now sign in with your new password." };
};