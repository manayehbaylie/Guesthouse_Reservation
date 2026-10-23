import prisma from "../config/prisma.js";

const peerRolesFor = (role) => {
  if (role === "ADMIN") return ["OWNER"];
  if (role === "OWNER") return ["ADMIN", "RECEPTIONIST"];
  if (role === "RECEPTIONIST") return ["OWNER"];
  return null;
};

const contactFilterFor = (user) => {
  if (user.role === "ADMIN") return { role: "OWNER" };
  if (user.role === "OWNER") {
    return {
      OR: [
        { role: "ADMIN" },
        {
          role: "RECEPTIONIST",
          staffAssignments: { some: { guesthouse: { ownerId: user.id } } },
        },
      ],
    };
  }
  if (user.role === "RECEPTIONIST") {
    return {
      role: "OWNER",
      guesthouses: { some: { staffAssignments: { some: { staffId: user.id } } } },
    };
  }
  return null;
};

const publicUser = {
  id: true,
  fullName: true,
  email: true,
  role: true,
};

export const getCommunicationContacts = async (user) => {
  const peerRoles = peerRolesFor(user.role);
  const where = contactFilterFor(user);
  if (!peerRoles || !where) return [];

  const propertySelection = user.role === "OWNER"
    ? {
      staffAssignments: {
        where: { guesthouse: { ownerId: user.id } },
        select: { guesthouse: { select: { id: true, name: true } } },
      },
    }
    : user.role === "RECEPTIONIST"
      ? {
        guesthouses: {
          where: { staffAssignments: { some: { staffId: user.id } } },
          select: { id: true, name: true },
        },
      }
      : {};

  return prisma.user.findMany({
    where,
    select: {
      ...publicUser,
      ...propertySelection,
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
    const guesthouses = user.role === "OWNER"
      ? contact.staffAssignments.map((assignment) => assignment.guesthouse)
      : contact.guesthouses || [];

    return {
      id: contact.id,
      fullName: contact.fullName,
      email: contact.email,
      role: contact.role,
      guesthouses,
      latestMessage,
      unreadCount,
    };
  }));
};

const assertPeer = async (user, peerId) => {
  const peerRoles = peerRolesFor(user.role);
  if (!peerRoles) {
    const error = new Error("This account cannot use communication.");
    error.statusCode = 403;
    throw error;
  }

  const peer = await prisma.user.findFirst({
    where: { id: Number(peerId), role: { in: peerRoles } },
    select: publicUser,
  });
  if (!peer) {
    const error = new Error("Communication contact not found.");
    error.statusCode = 404;
    throw error;
  }

  const isOwnerReceptionistPair =
    (user.role === "OWNER" && peer.role === "RECEPTIONIST") ||
    (user.role === "RECEPTIONIST" && peer.role === "OWNER");
  if (isOwnerReceptionistPair) {
    const ownerId = user.role === "OWNER" ? user.id : peer.id;
    const staffId = user.role === "OWNER" ? peer.id : user.id;
    const assignment = await prisma.staffAssignment.findFirst({
      where: { staffId, guesthouse: { ownerId } },
      select: { id: true },
    });
    if (!assignment) {
      const error = new Error("You can only communicate with owners and receptionists connected to your guesthouse.");
      error.statusCode = 403;
      throw error;
    }
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
  const peerRoles = peerRolesFor(user.role);
  if (!peerRoles) {
    const error = new Error("This account cannot use communication.");
    error.statusCode = 403;
    throw error;
  }

  const message = await prisma.communicationMessage.findFirst({
    where: {
      id: Number(messageId),
      senderId: user.id,
      sender: { role: user.role },
      recipient: { role: { in: peerRoles } },
    },
  });
  if (!message) {
    const error = new Error("Message not found or you cannot change it.");
    error.statusCode = 404;
    throw error;
  }
  await assertPeer(user, message.recipientId);
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