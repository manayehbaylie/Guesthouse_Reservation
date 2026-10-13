import { isIpBlocked, recordAuditEvent, recordLoginAttempt } from "../services/security-audit.service.js";
import prisma from "../config/prisma.js";
import { getSystemLockState } from "../services/system-settings.service.js";

const normalizePhone = (value) => {
  let phone = String(value || "").trim().replace(/[\s\-()]/g, "");
  if (/^09\d{8}$/.test(phone)) phone = `+251${phone.slice(1)}`;
  else if (/^9\d{8}$/.test(phone)) phone = `+251${phone}`;
  else if (/^2519\d{8}$/.test(phone)) phone = `+${phone}`;
  return phone;
};

const findLoginUser = ({ email, phone }) => email
  ? prisma.user.findUnique({
    where: { email: String(email).trim().toLowerCase() },
    select: { id: true, fullName: true, email: true, role: true },
  })
  : phone
    ? prisma.user.findUnique({
      where: { phone: normalizePhone(phone) },
      select: { id: true, fullName: true, email: true, role: true },
    })
    : null;

export const enforceSystemLockOnLogin = async (req, res, next) => {
  try {
    const lockState = await getSystemLockState();
    if (!lockState.systemLocked) return next();

    const { email, phone } = req.body || {};
    const user = await findLoginUser({ email, phone });

    if (!user || user.role === "ADMIN") return next();

    const attempt = await recordLoginAttempt({
      identifier: email || phone,
      email: user.email,
      role: user.role,
      ipAddress: req.ip,
      device: req.get("user-agent") || "Unknown device",
      success: false,
    }).catch((error) => { console.error("Failed to record locked login attempt:", error); return null; });
    await recordAuditEvent({
      actorId: user.id,
      actorName: user.fullName,
      actorEmail: user.email,
      eventCode: "login_blocked_maintenance",
      method: req.method,
      path: req.originalUrl,
      ipAddress: req.ip,
      statusCode: 403,
      severity: "WARNING",
      action: "login_blocked_maintenance",
      setting: "authentication",
    }).catch((error) => console.error("Failed to record locked login audit event:", error));

    return res.status(403).json({
      success: false,
      code: "SYSTEM_LOCKED",
      systemLocked: true,
      message: "System locked by system admin",
      lockMessage: lockState.systemLockMessage,
    });
  } catch (error) {
    return next(error);
  }
};

export const enforceLoginIpBlock = async (req, res, next) => {
  try {
    if (!(await isIpBlocked(req.ip))) return next();

    const { email, phone } = req.body || {};
    const user = await findLoginUser({ email, phone });
    if (user?.role === "ADMIN") return next();

    const attempt = await recordLoginAttempt({
      identifier: email || phone || "",
      email: user?.email,
      role: user?.role,
      ipAddress: req.ip,
      device: req.get("user-agent") || "Unknown device",
      success: false,
    });
    await recordAuditEvent({
      actorId: attempt.actorId,
      actorName: attempt.actorName,
      actorEmail: attempt.actorEmail,
      eventCode: "login_blocked_ip",
      method: req.method,
      path: req.originalUrl,
      ipAddress: req.ip,
      statusCode: 403,
      severity: "WARNING",
      action: "login_blocked_ip",
      setting: "authentication",
    });

    return res.status(403).json({
      success: false,
      code: "IP_BLOCKED",
      message: "Login is unavailable from this IP address.",
    });
  } catch (error) {
    return next(error);
  }
};