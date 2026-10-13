import prisma from "../config/prisma.js";
import { comparePassword } from "../utils/hash.js";

const initialCommissionRate = () => {
  const configuredRate = Number(process.env.COMMISSION_RATE ?? 10);
  return Number.isFinite(configuredRate)
    ? Math.min(100, Math.max(0, configuredRate))
    : 10;
};

const invalidSetting = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const ensureSystemLockRow = async (database = prisma) => {
  const settings = await database.systemSetting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, commissionRate: initialCommissionRate() },
  });

  return database.systemLock.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      isLocked: settings.systemLocked,
      message: settings.systemLockMessage,
    },
  });
};

export const getSystemSettings = async () => {
  const [settings, lock] = await Promise.all([
    prisma.systemSetting.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, commissionRate: initialCommissionRate() },
    }),
    ensureSystemLockRow(),
  ]);

  return {
    ...settings,
    systemLocked: lock.isLocked,
    systemLockMessage: lock.message,
  };
};

export const getSystemLockState = async () => {
  const lock = await ensureSystemLockRow();
  return {
    locked: lock.isLocked,
    message: lock.message,
    systemLocked: lock.isLocked,
    systemLockMessage: lock.message,
  };
};

export const updateSystemLockState = async ({ locked, message, password, adminId, ipAddress, method = "PUT", path = "/api/admin/system-lock" }) => {
  if (typeof locked !== "boolean") {
    throw invalidSetting("System lock state must be true or false.");
  }
  if (typeof message !== "string" || message.trim().length > 500 || (locked && !message.trim())) {
    throw invalidSetting("A lock message between 1 and 500 characters is required while locked.");
  }

  const admin = await prisma.user.findUnique({
    where: { id: Number(adminId) },
    select: { id: true, fullName: true, email: true, password: true, role: true },
  });
  if (!admin || admin.role !== "ADMIN") {
    const error = new Error("Administrator account not found.");
    error.statusCode = 401;
    throw error;
  }
  if (typeof password !== "string" || !password || !(await comparePassword(password, admin.password))) {
    const error = new Error("Password confirmation failed.");
    error.statusCode = 401;
    throw error;
  }

  const current = await ensureSystemLockRow();
  const nextMessage = message.trim() || current.message;

  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.systemLock.update({
      where: { id: 1 },
      data: { isLocked: locked, message: nextMessage, lockedBy: admin.id },
    });
    await transaction.systemSetting.upsert({
      where: { id: 1 },
      update: { systemLocked: locked, systemLockMessage: nextMessage },
      create: {
        id: 1,
        commissionRate: initialCommissionRate(),
        systemLocked: locked,
        systemLockMessage: nextMessage,
      },
    });

    if (current.isLocked !== locked || current.message !== nextMessage) {
      await transaction.auditLog.create({
        data: {
          actor: { connect: { id: admin.id } },
          actorName: admin.fullName,
          actorEmail: admin.email,
          eventCode: current.isLocked !== locked
            ? locked ? "system_locked" : "system_unlocked"
            : "system_lock_message_changed",
          setting: "system_access_lock",
          oldValue: current.isLocked ? "LOCKED" : "UNLOCKED",
          newValue: locked ? "LOCKED" : "UNLOCKED",
          action: current.isLocked !== locked
            ? locked ? "system_locked" : "system_unlocked"
            : "system_lock_message_changed",
          method,
          path,
          ipAddress: ipAddress || null,
          statusCode: 200,
          severity: current.isLocked !== locked && locked ? "WARNING" : "INFO",
        },
      });
    }

    return { locked: updated.isLocked, message: updated.message };
  });
};

export const updateSystemSettings = async (settings, { adminId, password, ipAddress, method = "PUT", path = "/api/admin/settings" }) => {
  const commissionRate = settings?.commissionRate;
  if (typeof commissionRate !== "number" || !Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 100) {
    throw invalidSetting("Commission rate must be between 0 and 100%.");
  }
  if (typeof settings?.ownerRegistrationEnabled !== "boolean") {
    throw invalidSetting("Owner registration must be enabled or disabled.");
  }
  if (typeof settings?.guestBookingEnabled !== "boolean") {
    throw invalidSetting("Guest bookings must be enabled or disabled.");
  }
  if (typeof settings?.systemLocked !== "boolean") {
    throw invalidSetting("System lock must be enabled or disabled.");
  }
  if (typeof settings?.systemLockMessage !== "string" || settings.systemLockMessage.trim().length > 500) {
    throw invalidSetting("System lock message must be 1 to 500 characters.");
  }
  if (settings.systemLocked && !settings.systemLockMessage.trim()) {
    throw invalidSetting("A message is required while the system is locked.");
  }

  const admin = await prisma.user.findUnique({
    where: { id: Number(adminId) },
    select: { id: true, fullName: true, email: true, password: true, role: true },
  });
  if (!admin || admin.role !== "ADMIN") {
    const error = new Error("Administrator account not found.");
    error.statusCode = 401;
    throw error;
  }

  const current = await getSystemSettings();
  const needsPassword =
    (current.ownerRegistrationEnabled && !settings.ownerRegistrationEnabled) ||
    (current.guestBookingEnabled && !settings.guestBookingEnabled) ||
    current.systemLocked !== settings.systemLocked ||
    current.commissionRate !== commissionRate ||
    current.systemLockMessage !== settings.systemLockMessage.trim();

  if (needsPassword) {
    if (typeof password !== "string" || !password || !(await comparePassword(password, admin.password))) {
      const error = new Error("Password confirmation failed.");
      error.statusCode = 401;
      throw error;
    }
  }

  const changes = [
    ["ownerRegistrationEnabled", "Owner registration", current.ownerRegistrationEnabled, settings.ownerRegistrationEnabled],
    ["guestBookingEnabled", "Guest bookings", current.guestBookingEnabled, settings.guestBookingEnabled],
    ["commissionRate", "Commission rate", current.commissionRate, commissionRate],
    ["systemLocked", "System lock", current.systemLocked, settings.systemLocked],
    ["systemLockMessage", "System lock message", current.systemLockMessage, settings.systemLockMessage.trim()],
  ].filter(([, , oldValue, newValue]) => oldValue !== newValue);

  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.systemSetting.update({
      where: { id: 1 },
      data: {
        ownerRegistrationEnabled: settings.ownerRegistrationEnabled,
        guestBookingEnabled: settings.guestBookingEnabled,
        commissionRate,
        systemLocked: settings.systemLocked,
        systemLockMessage: settings.systemLockMessage.trim(),
      },
    });

    if (current.systemLocked !== settings.systemLocked || current.systemLockMessage !== settings.systemLockMessage.trim()) {
      await transaction.systemLock.update({
        where: { id: 1 },
        data: {
          isLocked: settings.systemLocked,
          message: settings.systemLockMessage.trim(),
          lockedBy: admin.id,
        },
      });
    }

    if (changes.length) {
      await transaction.auditLog.createMany({
        data: changes.map(([, setting, oldValue, newValue]) => {
          const formatValue = (value) => {
            if (setting === "Commission rate") return `${value}%`;
            if (setting === "System lock") return value ? "LOCKED" : "UNLOCKED";
            if (setting !== "System lock message" && typeof value === "boolean") return value ? "ON" : "OFF";
            return String(value);
          };

          return {
            actorId: admin.id,
            actorName: admin.fullName,
            actorEmail: admin.email,
            eventCode: "admin_setting_changed",
            setting,
            oldValue: formatValue(oldValue),
            newValue: formatValue(newValue),
            action: "admin_setting_changed",
            method,
            path,
            ipAddress: ipAddress || null,
            statusCode: 200,
            severity: "INFO",
          };
        }),
      });
    }

    return updated;
  });
};
