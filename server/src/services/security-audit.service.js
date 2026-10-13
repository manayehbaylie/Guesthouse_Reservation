import prisma from "../config/prisma.js";
import jwt from "jsonwebtoken";
import { isIP } from "node:net";

export const recordAuditEvent = async ({
  actorId = null,
  actorName = "Unknown",
  actorEmail = null,
  eventCode,
  method = "SYSTEM",
  path = "/",
  ipAddress = null,
  statusCode = 200,
  severity = "INFO",
  action = eventCode,
  setting = eventCode,
  oldValue = "",
  newValue = "",
}) => prisma.auditLog.create({
  data: {
    ...(actorId ? { actor: { connect: { id: Number(actorId) } } } : {}),
    actorName: String(actorName || "Unknown").slice(0, 200),
    actorEmail: actorEmail ? String(actorEmail).slice(0, 320) : null,
    eventCode: String(eventCode || "unknown_event").slice(0, 100),
    method: String(method).slice(0, 16),
    path: String(path).slice(0, 500),
    ipAddress: ipAddress ? String(ipAddress).slice(0, 128) : null,
    statusCode: Number(statusCode) || 200,
    severity: String(severity).toUpperCase().slice(0, 16),
    action: String(action || eventCode || "").slice(0, 500),
    setting: String(setting || eventCode || "").slice(0, 200),
    oldValue: String(oldValue ?? "").slice(0, 1000),
    newValue: String(newValue ?? "").slice(0, 1000),
  },
});

export const createActiveSession = async ({ token, userId, ipAddress, device }) => {
  const claims = jwt.decode(token);
  if (!claims?.jti || !claims?.exp) return null;
  return prisma.activeSession.create({
    data: {
      tokenId: claims.jti,
      userId: Number(userId),
      ipAddress: ipAddress || null,
      device: device || null,
      expiresAt: new Date(claims.exp * 1000),
    },
  });
};

export const revokeActiveSession = async (tokenId) => {
  if (!tokenId) return null;
  return prisma.activeSession.updateMany({
    where: { tokenId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

export const getActiveSessions = async () => prisma.activeSession.findMany({
  where: { revokedAt: null, expiresAt: { gt: new Date() } },
  include: { user: { select: { fullName: true, email: true, role: true } } },
  orderBy: { lastActivity: "desc" },
  take: 250,
});

export const listBlockedIps = async () => prisma.blockedIp.findMany({ orderBy: { createdAt: "desc" } });

export const normalizeIpAddress = (value) => {
  const address = String(value || "").trim().replace(/^::ffff:/i, "");
  return isIP(address) ? address : null;
};

export const isIpBlocked = async (ipAddress) => {
  const address = normalizeIpAddress(ipAddress);
  return address ? Boolean(await prisma.blockedIp.findUnique({ where: { ipAddress: address }, select: { ipAddress: true } })) : false;
};

export const blockIpAddress = async ({ ipAddress, reason, admin, request }) => {
  const address = normalizeIpAddress(ipAddress);
  if (!address) {
    const error = new Error("A valid IP address is required.");
    error.statusCode = 400;
    throw error;
  }
  const record = await prisma.blockedIp.upsert({
    where: { ipAddress: address },
    update: { reason: reason ? String(reason).slice(0, 300) : null, blockedBy: admin.id },
    create: { ipAddress: address, reason: reason ? String(reason).slice(0, 300) : null, blockedBy: admin.id },
  });
  await recordAuditEvent({
    actorId: admin.id,
    actorName: admin.fullName,
    actorEmail: admin.email,
    eventCode: "ip_blocked",
    method: request.method,
    path: request.originalUrl,
    ipAddress: request.ip,
    statusCode: 200,
    severity: "WARNING",
    action: "ip_blocked",
    setting: "blocked_ip",
    oldValue: "",
    newValue: address,
  });
  return record;
};

export const unblockIpAddress = async ({ ipAddress, admin, request }) => {
  const address = normalizeIpAddress(ipAddress);
  if (!address) {
    const error = new Error("A valid IP address is required.");
    error.statusCode = 400;
    throw error;
  }
  const record = await prisma.blockedIp.delete({ where: { ipAddress: address } });
  await recordAuditEvent({
    actorId: admin.id,
    actorName: admin.fullName,
    actorEmail: admin.email,
    eventCode: "ip_unblocked",
    method: request.method,
    path: request.originalUrl,
    ipAddress: request.ip,
    statusCode: 200,
    severity: "INFO",
    action: "ip_unblocked",
    setting: "blocked_ip",
    oldValue: address,
    newValue: "",
  });
  return record;
};

const pagination = (query) => {
  const parseInteger = (value, fallback, maximum) => {
    if (value === undefined || value === "") return fallback;
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
      const error = new Error(`Pagination values must be between 1 and ${maximum}.`);
      error.statusCode = 400;
      throw error;
    }
    return parsed;
  };
  const page = parseInteger(query.page, 1, 1000000);
  const pageSize = parseInteger(query.pageSize, 20, 100);
  return { page, pageSize, skip: (page - 1) * pageSize };
};

const validateSearch = (search) => {
  const query = String(search || "").trim();
  if (query.length > 200) {
    const error = new Error("Search text cannot exceed 200 characters.");
    error.statusCode = 400;
    throw error;
  }
  return query;
};

export const recordLoginAttempt = async ({ identifier, email, role, ipAddress, device, success }) => {
  const rawIdentifier = String(identifier || "").trim();
  const normalizedIdentifier = rawIdentifier.includes("@") ? rawIdentifier.toLowerCase() : rawIdentifier;
  const normalizedEmail = String(email || (normalizedIdentifier.includes("@") ? normalizedIdentifier : ""))
    .trim()
    .toLowerCase();
  const user = normalizedEmail
    ? await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, fullName: true, email: true, role: true },
    })
    : await prisma.user.findFirst({
      where: { phone: normalizedIdentifier },
      select: { id: true, fullName: true, email: true, role: true },
    });

  const attempt = await prisma.loginAttempt.create({
    data: {
      email: user?.email || normalizedEmail || null,
      identifier: normalizedIdentifier.slice(0, 320) || "unknown",
      role: role || user?.role || null,
      ipAddress: ipAddress?.slice(0, 128) || null,
      device: device?.slice(0, 512) || null,
      success,
    },
  });
  return { ...attempt, actorId: user?.id || null, actorName: user?.fullName || normalizedIdentifier || "Unknown", actorEmail: user?.email || normalizedEmail || null };
};

const buildSearchWhere = (search) => {
  const query = String(search || "").trim();
  if (!query) return {};
  return {
    OR: [
      { email: { contains: query, mode: "insensitive" } },
      { identifier: { contains: query, mode: "insensitive" } },
      { ipAddress: { contains: query, mode: "insensitive" } },
      { device: { contains: query, mode: "insensitive" } },
    ],
  };
};

export const getLoginAttempts = async (query) => {
  const { page, pageSize, skip } = pagination(query);
  const where = buildSearchWhere(validateSearch(query.search));
  if (query.outcome && !["success", "failed"].includes(query.outcome)) {
    const error = new Error("Outcome filter must be success or failed.");
    error.statusCode = 400;
    throw error;
  }
  if (["success", "failed"].includes(query.outcome)) {
    where.success = query.outcome === "success";
  }
  if (query.role && !["ADMIN", "OWNER", "GUEST", "RECEPTIONIST"].includes(query.role)) {
    const error = new Error("Role filter is invalid.");
    error.statusCode = 400;
    throw error;
  }
  if (["ADMIN", "OWNER", "GUEST", "RECEPTIONIST"].includes(query.role)) {
    where.role = query.role;
  }

  const failureWhere = { ...where, success: false };
  const [items, total, failedGroups] = await Promise.all([
    prisma.loginAttempt.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.loginAttempt.count({ where }),
    prisma.loginAttempt.groupBy({
      by: ["identifier"],
      where: failureWhere,
      _count: { _all: true },
    }),
  ]);
  const failureCounts = new Map(failedGroups.map((group) => [group.identifier, group._count._all]));

  return {
    items: items.map((item) => ({
      ...item,
      failedCount: failureCounts.get(item.identifier) || 0,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

export const getAuditLogs = async (query, { all = false } = {}) => {
  const { page, pageSize, skip } = pagination(query);
  const search = validateSearch(query.search);
  const where = search ? {
    OR: [
      { actorName: { contains: search, mode: "insensitive" } },
      { actorEmail: { contains: search, mode: "insensitive" } },
      { eventCode: { contains: search, mode: "insensitive" } },
      { action: { contains: search, mode: "insensitive" } },
      { setting: { contains: search, mode: "insensitive" } },
      { oldValue: { contains: search, mode: "insensitive" } },
      { newValue: { contains: search, mode: "insensitive" } },
      { ipAddress: { contains: search, mode: "insensitive" } },
      { path: { contains: search, mode: "insensitive" } },
    ],
  } : {};
  if (query.severity && !["INFO", "WARNING", "CRITICAL"].includes(String(query.severity).toUpperCase())) {
    const error = new Error("Severity filter is invalid.");
    error.statusCode = 400;
    throw error;
  }
  if (query.severity) where.severity = String(query.severity).toUpperCase();
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: all ? 0 : skip, take: all ? 10000 : pageSize }),
    prisma.auditLog.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
};