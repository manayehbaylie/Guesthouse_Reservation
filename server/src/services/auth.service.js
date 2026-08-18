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
    where: {
      email,
    },
  });

  if (existingEmail) {
    throw new Error("Email already exists");
  }

  // ==========================
  // Check phone
  // ==========================
  const existingPhone = await prisma.user.findUnique({
    where: {
      phone,
    },
  });

  if (existingPhone) {
    throw new Error("Phone already exists");
  }

  // ==========================
  // Validate role
  // ==========================
  const allowedRoles = [
    "GUEST",
    "OWNER",
    "RECEPTIONIST",
    "ADMIN",
  ];

  if (!allowedRoles.includes(role)) {
    throw new Error("Invalid user role");
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
  // Owner registration requires admin verification.
  // The owner account is created but cannot log in normally
  // until the admin approves the application.
  //
  // The frontend should send:
  //
  // fullName
  // email
  // password
  // phone
  // role = OWNER
  // guesthouseName
  // guesthouseAddress
  // city
  // guesthouseDescription
  // guesthouseImage
  //
  // ============================================================

  if (role === "OWNER") {
    requireField(data.guesthouseName, "Guesthouse name");
    requireField(data.guesthouseAddress, "Guesthouse address");
    requireField(data.city, "City");
    requireField(
      data.guesthouseDescription,
      "Guesthouse description"
    );

    const result = await prisma.$transaction(async (tx) => {
      // Create owner account
      const owner = await tx.user.create({
        data: {
          fullName: String(data.fullName).trim(),
          email,
          password: hashedPassword,
          phone,
          role: "OWNER",
        },
      });

      // Create guesthouse with PENDING status.
      // Admin must approve it before the owner can use
      // the owner dashboard.
      const guesthouse = await tx.guesthouse.create({
        data: {
          name: String(data.guesthouseName).trim(),
          address: String(data.guesthouseAddress).trim(),
          city: String(data.city).trim(),
          description: String(data.guesthouseDescription).trim(),
          image: data.guesthouseImage
            ? String(data.guesthouseImage).trim()
            : null,
          status: "PENDING",
          ownerId: owner.id,
        },
      });

      return {
        owner,
        guesthouse,
      };
    });

    // IMPORTANT:
    // Do NOT give an owner a login token yet.
    // The admin has to approve the guesthouse/application first.
    return {
      user: removePassword(result.owner),
      guesthouse: result.guesthouse,
      token: null,
      requiresApproval: true,
      message:
        "Owner registration submitted successfully. Your application is waiting for admin approval.",
    };
  }

  // ============================================================
  // RECEPTIONIST / ADMIN
  // ============================================================
  //
  // These roles should normally be created by an administrator.
  // They are not intended to be freely selected by normal users.
  //
  if (role === "RECEPTIONIST" || role === "ADMIN") {
    throw new Error(
      "This role cannot be selected during public registration."
    );
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
    throw new Error("Invalid email or password");
  }

  // ==========================
  // Check password
  // ==========================
  const isMatch = await comparePassword(
    password,
    user.password
  );

  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  // ============================================================
  // OWNER APPROVAL CHECK
  // ============================================================
  if (user.role === "OWNER") {
    const ownerGuesthouse = user.guesthouses?.[0];

    if (ownerGuesthouse) {
      if (ownerGuesthouse.status === "PENDING") {
        throw new Error(
          "Your owner registration is still waiting for admin approval."
        );
      }

      if (ownerGuesthouse.status === "REJECTED") {
        const reason =
          ownerGuesthouse.rejectionReason ||
          "Your owner registration was rejected by the administrator.";

        throw new Error(reason);
      }
    }
  }

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