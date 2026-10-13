
import express from "express";
import rateLimit from "express-rate-limit";
import { recordAuditEvent, recordLoginAttempt } from "../services/security-audit.service.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { enforceLoginIpBlock, enforceSystemLockOnLogin } from "../middleware/login-security.middleware.js";

import {
  register,
  login,
  forgotPassword,
  resetPassword,
  logout,
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
      message: "Too many login attempts. Try again in 15 minutes.",
    });
  },
});

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
router.post("/register", register);

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
router.post("/logout", authenticate, logout);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
