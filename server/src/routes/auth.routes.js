
import express from "express";
import rateLimit from "express-rate-limit";
import { recordAuditEvent, recordLoginAttempt } from "../services/security-audit.service.js";
import { enforceLoginIpBlock, enforceSystemLockOnLogin } from "../middleware/login-security.middleware.js";

import {
  register,
  validateRegistrationEmailAddress,
  login,
  forgotPassword,
  resetPassword,
  logout,
  refresh,
  resendPasswordReset,
  verifyResetCode,
  createTelegramNonce,
  verifyTelegramIdentity,
  telegramLogin,
} from "../controllers/auth.controller.js";

const router = express.Router();
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    const { email, phone } = req.body || {};
    const attempt = await recordLoginAttempt({
      identifier: email || phone || "",
      ipAddress: req.ip,
      device: req.get("user-agent") || "Unknown device",
      success: false,
    }).catch((error) => { console.error("Failed to record rate-limited login:", error); return {}; });
    await recordAuditEvent({
      actorId: attempt.actorId,
      actorName: attempt.actorName || String(email || phone || "Unknown"),
      actorEmail: attempt.actorEmail,
      eventCode: "login_rate_limited",
      method: req.method,
      path: req.originalUrl,
      ipAddress: req.ip,
      statusCode: 429,
      severity: "WARNING",
      action: "login_rate_limited",
      setting: "authentication",
    }).catch((error) => console.error("Failed to record rate-limit audit:", error));
    return res.status(429).json({
      success: false,
      message: "Too many attempts, try again later.",
    });
  },
});
const authRateLimit = (limit, windowMs = 15 * 60 * 1000) => rateLimit({
  windowMs,
  limit,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({
    success: false,
    message: "Too many attempts, try again later.",
  }),
});
const requireFrontendOrigin = (req, res, next) => {
  const expectedOrigin = new URL(process.env.FRONTEND_URL || "http://localhost:5175").origin;
  if (req.get("origin") === expectedOrigin) return next();
  return res.status(403).json({ success: false, message: "Request origin is not allowed." });
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: >
 *       Registers a Guest or Owner. Guest accounts are activated immediately.
 *       Owner registrations create a pending guesthouse application.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - password
 *               - phone
 *               - role
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Manayeh Baylie
 *               email:
 *                 type: string
 *                 format: email
 *                 nullable: true
 *                 description: Optional email address.
 *                 example: manayeh@gmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: 12345678
 *               phone:
 *                 type: string
 *                 example: "0924392994"
 *               role:
 *                 type: string
 *                 enum:
 *                   - GUEST
 *                   - OWNER
 *                 example: GUEST
 *               guesthouseName:
 *                 type: string
 *                 description: Required when registering as an OWNER.
 *               guesthouseAddress:
 *                 type: string
 *                 description: Required when registering as an OWNER.
 *               city:
 *                 type: string
 *                 description: Required when registering as an OWNER.
 *               guesthouseDescription:
 *                 type: string
 *                 description: Required when registering as an OWNER.
 *               guesthouseImage:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Registration successful.
 *       400:
 *         description: Invalid request data.
 *       409:
 *         description: Email or phone already exists.
 */
router.post("/register", authRateLimit(5, 60 * 60 * 1000), register);
router.post("/validate-email", authRateLimit(10), validateRegistrationEmailAddress);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: >
 *       Authenticates a user and returns a JWT token.
 *       Owners must have an approved guesthouse before they can log in.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: manayeh@gmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: 12345678
 *     responses:
 *       200:
 *         description: Login successful.
 *       401:
 *         description: Invalid email/password or owner account is not approved.
 *       400:
 *         description: Invalid request data.
 */
router.post("/login", enforceSystemLockOnLogin, loginRateLimit, enforceLoginIpBlock, login);
const telegramNonceRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
router.post("/telegram-login/nonce", telegramNonceRateLimit, createTelegramNonce);
router.post("/telegram-login", loginRateLimit, verifyTelegramIdentity, enforceSystemLockOnLogin, enforceLoginIpBlock, telegramLogin);
router.post("/refresh", authRateLimit(30), requireFrontendOrigin, refresh);
router.post("/logout", requireFrontendOrigin, logout);

router.post("/forgot-password", authRateLimit(5), forgotPassword);
router.post("/forgot-password/resend", authRateLimit(5), resendPasswordReset);
router.post("/forgot-password/verify", authRateLimit(10), verifyResetCode);
router.post("/reset-password", authRateLimit(5), resetPassword);

export default router;
