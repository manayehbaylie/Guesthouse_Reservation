import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (decoded.jti) {
      const session = await prisma.activeSession.findUnique({ where: { tokenId: decoded.jti } });
      if (!session || session.revokedAt || session.expiresAt <= new Date()) {
        return res.status(401).json({ success: false, message: "Session expired or signed out." });
      }
      await prisma.activeSession.update({
        where: { tokenId: decoded.jti },
        data: { lastActivity: new Date() },
      });
    }

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};


// ==========================================
// AUTHORIZE USER ROLE
// ==========================================

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You do not have permission.",
        });
      }

      next();
    } catch (error) {
      return res.status(403).json({
        success: false,
        message: "Authorization failed.",
      });
    }
  };
};