import prisma from "../config/prisma.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { generateToken } from "../utils/jwt.js";

// ==========================
// Register User
// ==========================
export const registerUser = async (data) => {
  // Clean phone number - remove spaces and special characters
  const cleanPhone = data.phone.replace(/\s/g, '').replace(/-/g, '');

  // Check email
  const existingEmail = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existingEmail) {
    throw new Error("Email already exists");
  }

  // Check phone
  const existingPhone = await prisma.user.findUnique({
    where: {
      phone: cleanPhone,
    },
  });

  if (existingPhone) {
    throw new Error("Phone already exists");
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create user
  const user = await prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      password: hashedPassword,
      phone: cleanPhone,
      role: data.role,
    },
  });

  // Generate JWT Token
  const token = generateToken(user);

  // Remove password before returning
  const { password, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
  };
};

// ==========================
// Login User
// ==========================
export const loginUser = async (email, password) => {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Compare password
  const isMatch = await comparePassword(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  // Generate JWT Token
  const token = generateToken(user);

  // Remove password before returning
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
  };
};