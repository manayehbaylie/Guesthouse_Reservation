import {
  registerUser,
  loginUser,
  requestPasswordReset,
  resetUserPassword,
} from "../services/auth.service.js";
import { registerSchema } from "../validators/auth.validator.js";
import { successResponse } from "../utils/response.js";
import { recordLoginAttempt } from "../services/security-audit.service.js";
import { createActiveSession, recordAuditEvent, revokeActiveSession } from "../services/security-audit.service.js";
import prisma from "../config/prisma.js";

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
  const { email, phone, password } = req.body || {};
  const identifier = email || phone || "";
  const loginMethod = email ? 'email' : 'phone';
  const attemptMetadata = {
    identifier,
    ipAddress: req.ip,
    device: req.get("user-agent") || "Unknown device",
  };

  let result;
  try {
    result = await loginUser(identifier, password, loginMethod);
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

export const logout = async (req, res, next) => {
  try {
    await revokeActiveSession(req.user.jti);
    const user = await prisma.user.findUnique({
      where: { id: Number(req.user.id) },
      select: { id: true, fullName: true, email: true },
    });
    await recordAuditEvent({
      actorId: user?.id,
      actorName: user?.fullName,
      actorEmail: user?.email,
      eventCode: "logout",
      method: req.method,
      path: req.originalUrl,
      ipAddress: req.ip,
      statusCode: 200,
      severity: "INFO",
      action: "logout",
      setting: "authentication",
    });
    return successResponse(res, null, "Logout successful");
  } catch (error) {
    return next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await requestPasswordReset(email);

    return successResponse(
      res,
      result,
      result.message || "Password reset request received."
    );
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const result = await resetUserPassword(token, newPassword);

    return successResponse(
      res,
      result,
      result.message || "Password reset successful."
    );
  } catch (error) {
    next(error);
  }
};