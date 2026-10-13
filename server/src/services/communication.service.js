import prisma from "../config/prisma.js";

const peerRoleFor = (role) => {
  if (role === "ADMIN") return "OWNER";
  if (role === "OWNER") return "ADMIN";
  return null;
};

const publicUser = {
  id: true,
  fullName: true,
  email: true,
  role: true,
};

export const getCommunicationContacts = async (user) => {
  const peerRole = peerRoleFor(user.role);
  if (!peerRole) return [];

  return prisma.user.findMany({
    where: { role: peerRole },
    select: {
      ...publicUser,
      communicationsSent: {
        where: { recipientId: user.id },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, createdAt: true, senderId: true },
      },
      communicationsReceived: {
        where: { senderId: user.id },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, createdAt: true, senderId: true },
      },
      _count: {
        select: {
          communicationsSent: {
            where: { recipientId: user.id, readAt: null },
          },
        },
      },
    },
    orderBy: { fullName: "asc" },
  }).then((contacts) => contacts.map((contact) => {
    const latestMessage = [
      ...contact.communicationsSent,
      ...contact.communicationsReceived,
    ].sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))[0] || null;
    const unreadCount = contact._count.communicationsSent;

    return {
      id: contact.id,
      fullName: contact.fullName,
      email: contact.email,
      role: contact.role,
      latestMessage,
      unreadCount,
    };
  }));
};

const assertPeer = async (user, peerId) => {
  const peerRole = peerRoleFor(user.role);
  if (!peerRole) {
    const error = new Error("Only administrators and owners can use communication.");
    error.statusCode = 403;
    throw error;
  }

  const peer = await prisma.user.findFirst({
    where: { id: Number(peerId), role: peerRole },
    select: publicUser,
  });
  if (!peer) {
    const error = new Error("Communication contact not found.");
    error.statusCode = 404;
    throw error;
  }
  return peer;
};

export const getConversation = async (user, peerId) => {
  await assertPeer(user, peerId);
  await prisma.communicationMessage.updateMany({
    where: { senderId: Number(peerId), recipientId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  return prisma.communicationMessage.findMany({
    where: {
      OR: [
        { senderId: user.id, recipientId: Number(peerId) },
        { senderId: Number(peerId), recipientId: user.id },
      ],
    },
    include: {
      sender: { select: publicUser },
      recipient: { select: publicUser },
    },
    orderBy: { createdAt: "asc" },
  });
};

export const sendCommunicationMessage = async (user, peerId, content) => {
  const peer = await assertPeer(user, peerId);
  const message = String(content || "").trim();
  if (!message || message.length > 4000) {
    const error = new Error("Message must be between 1 and 4000 characters.");
    error.statusCode = 400;
    throw error;
  }

  return prisma.communicationMessage.create({
    data: {
      senderId: user.id,
      recipientId: peer.id,
      content: message,
    },
    include: {
      sender: { select: publicUser },
      recipient: { select: publicUser },
    },
  });
};

const findOwnedMessage = async (user, messageId) => {
  if (!peerRoleFor(user.role)) {
    const error = new Error("Only administrators and owners can use communication.");
    error.statusCode = 403;
    throw error;
  }

  const message = await prisma.communicationMessage.findFirst({
    where: {
      id: Number(messageId),
      senderId: user.id,
      sender: { role: user.role },
      recipient: { role: peerRoleFor(user.role) },
    },
  });
  if (!message) {
    const error = new Error("Message not found or you cannot change it.");
    error.statusCode = 404;
    throw error;
  }
  return message;
};

export const editCommunicationMessage = async (user, messageId, content) => {
  await findOwnedMessage(user, messageId);
  const message = String(content || "").trim();
  if (!message || message.length > 4000) {
    const error = new Error("Message must be between 1 and 4000 characters.");
    error.statusCode = 400;
    throw error;
  }

  return prisma.communicationMessage.update({
    where: { id: Number(messageId) },
    data: { content: message, editedAt: new Date() },
    include: {
      sender: { select: publicUser },
      recipient: { select: publicUser },
    },
  });
};

export const deleteCommunicationMessage = async (user, messageId) => {
  await findOwnedMessage(user, messageId);
  await prisma.communicationMessage.delete({ where: { id: Number(messageId) } });
  return { id: Number(messageId) };
};