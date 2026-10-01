import jwt from "jsonwebtoken";

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

export const generatePasswordResetToken = (email) => {
  return jwt.sign(
    {
      email,
      purpose: "password-reset",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    }
  );
};

export const verifyPasswordResetToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};