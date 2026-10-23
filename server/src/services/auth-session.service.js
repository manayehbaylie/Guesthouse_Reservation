import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { generateToken } from "../utils/jwt.js";

export const hashSessionToken = (token) => createHash("sha256").update(token).digest("hex");

export const createRefreshToken = async (userId, accessToken) => {
  const token = randomBytes(48).toString("base64url");
  const accessClaims = jwt.decode(accessToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashSessionToken(token),
      userId: Number(userId),
      accessTokenId: accessClaims?.jti || null,
      expiresAt,
    },
  });

  return { token, expiresAt };
};

export const rotateRefreshToken = async (token) => {
  if (!token) return null;
  const current = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: { include: { guesthouses: true } } },
  });
  if (!current || current.revokedAt || current.expiresAt <= new Date()) return null;

  const accessToken = generateToken(current.user);
  const nextToken = randomBytes(48).toString("base64url");
  const accessClaims = jwt.decode(accessToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const rotated = await prisma.$transaction(async (transaction) => {
    const revoked = await transaction.refreshToken.updateMany({
      where: { id: current.id, revokedAt: null, expiresAt: { gt: now } },
      data: { revokedAt: now },
    });
    if (revoked.count !== 1) return false;
    if (current.accessTokenId) {
      await transaction.activeSession.updateMany({
        where: { tokenId: current.accessTokenId, revokedAt: null },
        data: { revokedAt: now },
      });
    }
    await transaction.refreshToken.create({
      data: {
        tokenHash: hashSessionToken(nextToken),
        userId: current.userId,
        accessTokenId: accessClaims?.jti || null,
        expiresAt,
      },
    });
    return true;
  });

  return rotated ? { accessToken, refreshToken: nextToken, user: current.user } : null;
};

export const revokeRefreshToken = async (token) => {
  if (!token) return;
  const current = await prisma.refreshToken.findUnique({ where: { tokenHash: hashSessionToken(token) } });
  if (!current || current.revokedAt) return;
  await prisma.$transaction([
    prisma.refreshToken.update({ where: { id: current.id }, data: { revokedAt: new Date() } }),
    ...(current.accessTokenId ? [prisma.activeSession.updateMany({
      where: { tokenId: current.accessTokenId, revokedAt: null },
      data: { revokedAt: new Date() },
    })] : []),
  ]);
};

export const sanitizeAuthUser = (user) => {
  if (!user) return null;
  const { password: _password, normalizedEmail: _normalizedEmail, telegramChatId: _telegramChatId, ...safeUser } = user;
  return safeUser;
};