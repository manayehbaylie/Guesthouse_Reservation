import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import {
  registerUser,
  loginUser,
} from "../services/auth.service.js";
import {
  requestPasswordReset,
  resendPasswordResetCode,
  verifyPasswordResetCode,
  resetUserPassword,
} from "../services/password-reset.service.js";
import { createRefreshToken, rotateRefreshToken, revokeRefreshToken, sanitizeAuthUser } from "../services/auth-session.service.js";
import { normalizeEthiopianPhone, normalizeGmailAddress } from "../utils/auth-normalization.js";
import { validateRegistrationEmail } from "../services/auth-validation.service.js";
import { loginUserWithTelegramId } from "../services/auth.service.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";
import { successResponse } from "../utils/response.js";
import { recordLoginAttempt } from "../services/security-audit.service.js";
import { createActiveSession, recordAuditEvent, revokeActiveSession } from "../services/security-audit.service.js";
import {
  createTelegramLoginNonce,
  verifyTelegramIdToken,
} from "../services/telegram-login.service.js";

const REFRESH_COOKIE = "guesthouse_refresh";
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/api/auth",
  maxAge: 30 * 24 * 60 * 60 * 1000,
});
const readRefreshCookie = (req) => {
  const cookieHeader = req.headers.cookie || "";
  const value = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${REFRESH_COOKIE}=`));
  return value ? decodeURIComponent(value.slice(REFRESH_COOKIE.length + 1)) : null;
};
const saveRefreshCookie = async (res, userId, accessToken) => {
  const refresh = await createRefreshToken(userId, accessToken);
  res.cookie(REFRESH_COOKIE, refresh.token, cookieOptions());
};

/**
 * Register user
 */
export const register = async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await registerUser(data);
    await createActiveSession({
      token: result.token,
      userId: result.user.id,
      ipAddress: req.ip,
      device: req.get("user-agent") || "Unknown device",
    });
    await saveRefreshCookie(res, result.user.id, result.token);

    return successResponse(
      res,
      result,
      "User registered successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Login user (supports email or phone)
 */
export const login = async (req, res, next) => {
  let credentials;
  try {
    credentials = loginSchema.parse(req.body || {});
  } catch (error) {
    return next(error);
  }
  const { email, phone, password } = credentials;
  const identifier = email || phone || "";
  const loginMethod = email ? 'email' : 'phone';
  const normalizedIdentifier = loginMethod === "phone"
    ? (normalizeEthiopianPhone(identifier) || String(identifier).trim())
    : (normalizeGmailAddress(identifier) || String(identifier).trim().toLowerCase());
  const attemptMetadata = {
    identifier: normalizedIdentifier,
    ipAddress: req.ip,
    device: req.get("user-agent") || "Unknown device",
  };

  let result;
  try {
    result = await loginUser(identifier, password, loginMethod, req.ip);
  } catch (error) {
    const attempt = await recordLoginAttempt({ ...attemptMetadata, success: false })
      .catch((loggingError) => { console.error("Failed to record login attempt:", loggingError); return {}; });
    await recordAuditEvent({
      actorId: attempt.actorId,
      actorName: attempt.actorName || String(identifier || "Unknown"),
      actorEmail: attempt.actorEmail,
      eventCode: error.code === "SYSTEM_LOCKED" ? "login_blocked_maintenance" : "login_failed",
      method: req.method,
      path: req.originalUrl,
      ipAddress: req.ip,
      statusCode: error.statusCode || 401,
      severity: error.code === "SYSTEM_LOCKED" ? "WARNING" : "INFO",
      action: error.code === "SYSTEM_LOCKED" ? "login_blocked_maintenance" : "login_failed",
      setting: "authentication",
    }).catch((loggingError) => console.error("Failed to record login audit event:", loggingError));
    return next(error);
  }

  const attempt = await recordLoginAttempt({
    ...attemptMetadata,
    email: result.user.email,
    role: result.user.role,
    success: true,
  }).catch((loggingError) => console.error("Failed to record login attempt:", loggingError));
  await createActiveSession({
    token: result.token,
    userId: result.user.id,
    ipAddress: req.ip,
    device: attemptMetadata.device,
  });
  await saveRefreshCookie(res, result.user.id, result.token);
  await recordAuditEvent({
    actorId: result.user.id,
    actorName: result.user.fullName,
    actorEmail: result.user.email,
    eventCode: "login_succeeded",
    method: req.method,
    path: req.originalUrl,
    ipAddress: req.ip,
    statusCode: 200,
    severity: "INFO",
    action: "login_succeeded",
    setting: "authentication",
  }).catch((loggingError) => console.error("Failed to record login audit event:", loggingError));

  return successResponse(res, result, "Login successful");
};

export const createTelegramNonce = (req, res, next) => {
  try {
    return successResponse(res, { nonce: createTelegramLoginNonce() }, "Telegram login nonce created");
  } catch (error) {
    next(error);
  }
};

export const verifyTelegramIdentity = async (req, res, next) => {
  try {
    req.telegramClaims = await verifyTelegramIdToken(req.body?.idToken, req.body?.nonce);
    next();
  } catch (error) {
    next(error);
  }
};

export const telegramLogin = async (req, res, next) => {
  const telegramId = req.telegramClaims.id;
  const attemptMetadata = {
    identifier: `telegram:${telegramId}`,
    ipAddress: req.ip,
    device: req.get("user-agent") || "Unknown device",
  };

  let result;
  try {
    result = await loginUserWithTelegramId(telegramId);
  } catch (error) {
    const attempt = await recordLoginAttempt({ ...attemptMetadata, success: false })
      .catch((loggingError) => { console.error("Failed to record Telegram login attempt:", loggingError); return {}; });
    await recordAuditEvent({
      actorId: attempt.actorId,
      actorName: attempt.actorName || attemptMetadata.identifier,
      actorEmail: attempt.actorEmail,
      eventCode: error.code === "SYSTEM_LOCKED" ? "login_blocked_maintenance" : "login_failed",
      method: req.method,
      path: req.originalUrl,
      ipAddress: req.ip,
      statusCode: error.statusCode || 401,
      severity: error.code === "SYSTEM_LOCKED" ? "WARNING" : "INFO",
      action: error.code === "SYSTEM_LOCKED" ? "login_blocked_maintenance" : "login_failed",
      setting: "authentication",
    }).catch((loggingError) => console.error("Failed to record Telegram login audit event:", loggingError));
    return next(error);
  }

  await recordLoginAttempt({
    ...attemptMetadata,
    email: result.user.email,
    role: result.user.role,
    success: true,
  }).catch((loggingError) => console.error("Failed to record Telegram login attempt:", loggingError));
  await createActiveSession({
    token: result.token,
    userId: result.user.id,
    ipAddress: req.ip,
    device: attemptMetadata.device,
  });
  await saveRefreshCookie(res, result.user.id, result.token);
  await recordAuditEvent({
    actorId: result.user.id,
    actorName: result.user.fullName,
    actorEmail: result.user.email,
    eventCode: "login_succeeded",
    method: req.method,
    path: req.originalUrl,
    ipAddress: req.ip,
    statusCode: 200,
    severity: "INFO",
    action: "login_succeeded",
    setting: "authentication",
  }).catch((loggingError) => console.error("Failed to record Telegram login audit event:", loggingError));

  return successResponse(res, result, "Telegram login successful");
};

export const logout = async (req, res, next) => {
  try {
    await revokeRefreshToken(readRefreshCookie(req));
    const authorization = req.headers.authorization || "";
    const accessToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : null;
    if (accessToken) {
      const claims = jwt.decode(accessToken);
      if (claims?.jti) await revokeActiveSession(claims.jti);
    }
    res.clearCookie(REFRESH_COOKIE, cookieOptions());
    return successResponse(res, null, "Logout successful");
  } catch (error) {
    return next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email, phone } = req.body || {};
    const result = await requestPasswordReset({ email, phone });
    return successResponse(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

export const resendPasswordReset = async (req, res, next) => {
  try {
    const result = await resendPasswordResetCode(req.body?.challengeId);
    return successResponse(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

export const verifyResetCode = async (req, res, next) => {
  try {
    const { challengeId, code } = req.body || {};
    return successResponse(res, await verifyPasswordResetCode(challengeId, code), "Code verified.");
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword, confirmPassword } = req.body || {};
    const result = await resetUserPassword(token, newPassword, confirmPassword);

    return successResponse(
      res,
      result,
      result.message || "Password reset successful."
    );
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const refreshCookie = readRefreshCookie(req);
    if (!refreshCookie) {
      return successResponse(res, { user: null, token: null }, "No active session.");
    }

    const session = await rotateRefreshToken(refreshCookie);
    if (!session) {
      res.clearCookie(REFRESH_COOKIE, cookieOptions());
      const error = new Error("Session expired. Please sign in again.");
      error.statusCode = 401;
      throw error;
    }
    await createActiveSession({ token: session.accessToken, userId: session.user.id, ipAddress: req.ip, device: req.get("user-agent") || "Unknown device" });
    res.cookie(REFRESH_COOKIE, session.refreshToken, cookieOptions());
    return successResponse(res, { user: sanitizeAuthUser(session.user), token: session.accessToken }, "Session refreshed.");
  } catch (error) {
    next(error);
  }
};

export const validateRegistrationEmailAddress = async (req, res, next) => {
  try {
    if (typeof req.body?.email !== "string" || !req.body.email.trim()) {
      const error = new Error("Please enter a valid Gmail address.");
      error.statusCode = 400;
      error.field = "email";
      throw error;
    }
    const { email, normalizedEmail } = await validateRegistrationEmail(req.body?.email, "GUEST");
    const existingUser = await prisma.user.findFirst({ where: { OR: [{ normalizedEmail }, { email }] } });
    if (existingUser) {
      const error = new Error("This email is already registered.");
      error.statusCode = 409;
      throw error;
    }
    return successResponse(res, { valid: true }, "Email is available.");
  } catch (error) {
    next(error);
  }
};