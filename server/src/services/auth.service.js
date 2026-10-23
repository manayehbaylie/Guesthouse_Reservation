import prisma from "../config/prisma.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { generateToken } from "../utils/jwt.js";
import { getSystemSettings } from "./system-settings.service.js";
import { getEthiopianPhoneLookupCandidates, normalizeGmailAddress } from "../utils/auth-normalization.js";
import {
  normalizeRegistrationPhone,
  validateRegistrationAddress,
  validateRegistrationConsent,
  validateRegistrationEmail,
  validateRegistrationIdNumber,
  validateRegistrationIdType,
  validateRegistrationName,
  validateRegistrationPassword,
  validateRegistrationPasswordConfirmation,
} from "./auth-validation.service.js";

function requireField(value, label) {
  if (value === undefined || value === null || String(value).trim() === "") {
    throw new Error(label + " is required");
  }
}

function removePassword(user) {
  if (!user) return null;

  const {
    password: _,
    normalizedEmail: _normalizedEmail,
    normalizedPhone: _normalizedPhone,
    telegramChatId: _telegramChatId,
    ...userWithoutPassword
  } = user;
  return userWithoutPassword;
}

// ==========================
// Register User
// ==========================
export const registerUser = async (data) => {
  const fullName = validateRegistrationName(data.fullName);
  const password = validateRegistrationPassword(data.password);
  validateRegistrationPasswordConfirmation(password, data.confirmPassword);
  validateRegistrationConsent(data.agreedToTerms);
  requireField(data.phone, "Phone");
  requireField(data.role, "Role");

  const role = String(data.role).toUpperCase();
  const { email, normalizedEmail } = await validateRegistrationEmail(data.email, role);
  const phone = normalizeRegistrationPhone(data.phone);

  // ==========================
  // Check email
  // ==========================
  if (email) {
    const existingEmail = await prisma.user.findFirst({
      where: { OR: [{ normalizedEmail }, { email }] },
    });

    if (existingEmail) {
      const error = new Error("This email is already registered.");
      error.statusCode = 409;
      error.field = "email";
      throw error;
    }
  }

  // ==========================
  // Check phone
  // ==========================
  const existingPhone = await prisma.user.findFirst({
    where: { OR: [
      { normalizedPhone: phone },
      { phone: { in: getEthiopianPhoneLookupCandidates(phone) } },
    ] },
  });

  if (existingPhone) {
    const error = new Error("This phone number is already registered.");
    error.statusCode = 409;
    error.field = "phone";
    throw error;
  }

  // ==========================
  // Validate role
  // ==========================
  // Only GUEST and OWNER can self-register publicly.
  // RECEPTIONIST and ADMIN accounts are created by administrators.
  if (role !== "GUEST" && role !== "OWNER") {
    throw new Error(
      "Invalid registration role. Only GUEST and OWNER can register publicly."
    );
  }

  if (role === "OWNER") {
    const settings = await getSystemSettings();
    if (!settings.ownerRegistrationEnabled) {
      const error = new Error("New owner registrations are temporarily disabled.");
      error.statusCode = 403;
      throw error;
    }
  }

  // ==========================
  // Hash password
  // ==========================
  const hashedPassword = await hashPassword(password);
  const consentFields = {
    termsAcceptedAt: new Date(),
    privacyPolicyAcceptedAt: new Date(),
  };

  // ============================================================
  // GUEST REGISTRATION
  // ============================================================
  if (role === "GUEST") {
    const user = await prisma.user.create({
      data: {
        fullName,
        ...(email ? { email } : {}),
        ...(normalizedEmail ? { normalizedEmail } : {}),
        password: hashedPassword,
        phone,
        normalizedPhone: phone,
        role: "GUEST",
        ...consentFields,
      },
    });

    const token = generateToken(user);

    return {
      user: removePassword(user),
      token,
      requiresApproval: false,
    };
  }

  // ============================================================
  // OWNER REGISTRATION
  // ============================================================
  //
  // Owner registration creates a personal account ONLY.
  // A JWT token is issued immediately — the owner can log in
  // right away and access the Owner Dashboard.
  //
  // Guesthouse registration is a SEPARATE step done from
  // the Owner Dashboard sidebar. Only the guesthouse submission
  // goes through admin approval — not the owner account itself.
  //
  // Frontend sends: fullName, email, password, phone, role=OWNER
  //
  // ============================================================

  if (role === "OWNER") {
    const residentialAddress = validateRegistrationAddress(data.residentialAddress);
    const idType = validateRegistrationIdType(data.idType);
    const idNumber = validateRegistrationIdNumber(data.idNumber);

    const owner = await prisma.user.create({
      data: {
        fullName,
        ...(email ? { email } : {}),
        ...(normalizedEmail ? { normalizedEmail } : {}),
        password: hashedPassword,
        phone,
        normalizedPhone: phone,
        role: "OWNER",
        residentialAddress,
        idType,
        idNumber,
        ...consentFields,
      },
    });

    const token = generateToken(owner);

    return {
      user: removePassword(owner),
      token,
      requiresApproval: false,
      message:
        "Owner account created successfully. You can now log in and register your guesthouse from your dashboard.",
    };
  }

  throw new Error("Unsupported registration role");
};

// ==========================
// Login User
// ==========================
export const loginUser = async (identifier, password, loginMethod = 'email', ipAddress = null) => {
  requireField(identifier, loginMethod === 'phone' ? "Phone" : "Email");
  requireField(password, "Password");

  // ==========================
  // Normalize and find user
  // ==========================
  const normalizedIdentifier = loginMethod === "phone"
    ? normalizeRegistrationPhone(identifier)
    : (normalizeGmailAddress(String(identifier)) || String(identifier).trim().toLowerCase());
  const recentFailures = await prisma.loginAttempt.count({
    where: {
      identifier: normalizedIdentifier,
      ipAddress,
      success: false,
      createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
    },
  });
  if (recentFailures >= 5) {
    const error = new Error("Too many attempts, try again later.");
    error.statusCode = 429;
    throw error;
  }

  let user;
  
  if (loginMethod === 'phone') {
    // Normalize phone number with same logic as frontend
    user = await prisma.user.findFirst({
      where: { OR: [
        { normalizedPhone: normalizedIdentifier },
        { phone: { in: getEthiopianPhoneLookupCandidates(normalizedIdentifier) } },
      ] },
      include: {
        guesthouses: true,
      },
    });
  } else {
    // Email login - normalize to lowercase
    user = await prisma.user.findFirst({
      where: { OR: [{ normalizedEmail: normalizedIdentifier }, { email: normalizedIdentifier }] },
      include: {
        guesthouses: true,
      },
    });
  }

  if (!user) {
    const error = new Error(
      loginMethod === 'phone'
        ? "This account is not registered."
        : "This account is not registered."
    );
    error.statusCode = 401;
    throw error;
  }

  const systemSettings = await getSystemSettings();
  if (systemSettings.systemLocked && user.role !== "ADMIN") {
    const error = new Error("System locked by system admin");
    error.statusCode = 403;
    error.code = "SYSTEM_LOCKED";
    error.systemLockMessage = systemSettings.systemLockMessage;
    throw error;
  }

  // ==========================
  // Check password
  // ==========================
  const isMatch = await comparePassword(password, user.password);

  if (!isMatch) {
    const error = new Error("Incorrect password.");
    error.statusCode = 401;
    throw error;
  }

  // ============================================================
  // NOTE ON OWNER LOGIN:
  // Owners can always log in regardless of their guesthouse
  // status (PENDING, APPROVED, REJECTED, or no guesthouse yet).
  // The guesthouse status is displayed on the Owner Dashboard —
  // it does NOT block access to the platform.
  // ============================================================

  // ==========================
  // Generate JWT
  // ==========================
  const token = generateToken(user);

  return {
    user: removePassword(user),
    token,
    requiresApproval: false,
  };
};
export const loginUserWithTelegramId = async (telegramId) => {
  const account = await prisma.telegramAccount.findUnique({
    where: { telegramId: String(telegramId) },
    include: { user: { include: { guesthouses: true } } },
  });
  const user = account?.user;

  if (!user) {
    const error = new Error("Log in to Telegram in the bot before using Telegram login.");
    error.statusCode = 401;
    throw error;
  }

  const systemSettings = await getSystemSettings();
  if (systemSettings.systemLocked && user.role !== "ADMIN") {
    const error = new Error("System locked by system admin");
    error.statusCode = 403;
    error.code = "SYSTEM_LOCKED";
    error.systemLockMessage = systemSettings.systemLockMessage;
    throw error;
  }

  return {
    user: removePassword(user),
    token: generateToken(user),
    requiresApproval: false,
  };
};
