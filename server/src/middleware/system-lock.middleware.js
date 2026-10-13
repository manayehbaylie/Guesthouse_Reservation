import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { getSystemLockState } from "../services/system-settings.service.js";

export const enforceSystemLock = async (req, res, next) => {
  if (
    req.path === "/system/status" ||
    req.path === "/system/lock-status" ||
    ((req.path === "/auth/login" || req.path === "/auth/logout") && req.method === "POST")
  ) {
    return next();
  }

  try {
    const lockState = await getSystemLockState();
    if (!lockState.systemLocked) return next();

    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        const currentUser = await prisma.user.findUnique({
          where: { id: Number(user.id) },
          select: { role: true },
        });
        if (currentUser?.role === "ADMIN") return next();
      } catch {
        // Invalid and expired sessions remain blocked while the lock is active.
      }
    }

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