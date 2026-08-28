import prisma from "../config/prisma.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { generateToken } from "../utils/jwt.js";

function requireField(value, label) {
  if (value === undefined || value === null || String(value).trim() === "") {
    throw new Error(label + " is required");
  }
}

function removePassword(user) {
  if (!user) return null;

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// ==========================
// Register User
// ==========================
export const registerUser = async (data) => {
  requireField(data.fullName, "Full name");
  requireField(data.email, "Email");
  requireField(data.password, "Password");
  requireField(data.phone, "Phone");
  requireField(data.role, "Role");

  const email = String(data.email).trim().toLowerCase();
  const phone = String(data.phone).trim();
  const role = String(data.role).toUpperCase();

  // ==========================
  // Check email
  // ==========================
  const existingEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (existingEmail) {
    throw new Error("Email already exists");
  }

  // ==========================
  // Check phone
  // ==========================
  const existingPhone = await prisma.user.findUnique({
    where: { phone },
  });

  if (existingPhone) {
    throw new Error("Phone already exists");
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

  // ==========================
  // Hash password
  // ==========================
  const hashedPassword = await hashPassword(data.password);

  // ============================================================
  // GUEST REGISTRATION
  // ============================================================
  if (role === "GUEST") {
    const user = await prisma.user.create({
      data: {
        fullName: String(data.fullName).trim(),
        email,
        password: hashedPassword,
        phone,
        role: "GUEST",
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
    requireField(data.residentialAddress, "Residential address");
    requireField(data.idType, "ID type");
    requireField(data.idNumber, "ID number");

    const owner = await prisma.user.create({
      data: {
        fullName: String(data.fullName).trim(),
        email,
        password: hashedPassword,
        phone,
        role: "OWNER",
        residentialAddress: String(data.residentialAddress).trim(),
        idType: String(data.idType).trim(),
        idNumber: String(data.idNumber).trim(),
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
export const loginUser = async (email, password) => {
  requireField(email, "Email");
  requireField(password, "Password");

  const normalizedEmail = String(email).trim().toLowerCase();

  // ==========================
  // Find user
  // ==========================
  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
    include: {
      guesthouses: true,
    },
  });

  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  // ==========================
  // Check password
  // ==========================
  const isMatch = await comparePassword(password, user.password);

  if (!isMatch) {
    const error = new Error("Invalid email or password");
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