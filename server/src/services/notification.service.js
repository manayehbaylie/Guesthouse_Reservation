// server/src/services/notification.service.js

import prisma from "../config/prisma.js";

// ========================================
// Get User Notifications
// ========================================
export const getNotifications = async (userId) => {
  if (!userId) return [];

  return await prisma.notification.findMany({
    where: {
      userId: Number(userId),
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

// ========================================
// Create Notification - UPDATED with type and guesthouseId
// ========================================
export const createNotification = async ({
  title,
  message,
  userId,
  guesthouseId = null,
  type = 'system',
}) => {
  if (!userId || !title || !message) {
    console.warn('⚠️ Missing required fields for notification:', { userId, title, message });
    return null;
  }

  try {
    console.log(`📨 Creating notification for user ${userId}: ${title}`);
    
    const notification = await prisma.notification.create({
      data: {
        title: String(title).trim(),
        message: String(message).trim(),
        userId: Number(userId),
        guesthouseId: guesthouseId ? Number(guesthouseId) : null,
        type: type || 'system',
        isRead: false,
      },
    });
    
    console.log(`✅ Notification created: ${notification.id}`);
    return notification;
  } catch (error) {
    console.error("❌ Failed to create notification:", error.message || error);
    return null;
  }
};

// ========================================
// Mark Notification As Read
// ========================================
export const markNotificationAsRead = async (
  id,
  userId
) => {
  const notificationId = Number(id);
  const uid = Number(userId);

  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId: uid,
    },
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  return await prisma.notification.update({
    where: {
      id: notificationId,
    },
    data: {
      isRead: true,
    },
  });
};

// ========================================
// Mark All Notifications As Read
// ========================================
export const markAllNotificationsAsRead = async (userId) => {
  const uid = Number(userId);

  return await prisma.notification.updateMany({
    where: {
      userId: uid,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
};

// ========================================
// Get Unread Notifications
// ========================================
export const getUnreadNotifications = async (
  userId
) => {
  const uid = Number(userId);

  return await prisma.notification.findMany({
    where: {
      userId: uid,
      isRead: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

// ========================================
// Get Unread Notification Count
// ========================================
export const getUnreadNotificationCount = async (userId) => {
  const uid = Number(userId);

  const count = await prisma.notification.count({
    where: {
      userId: uid,
      isRead: false,
    },
  });

  return { count };
};

// ========================================
// Delete Notification
// ========================================
export const deleteNotification = async (
  id,
  userId
) => {
  const notificationId = Number(id);
  const uid = Number(userId);

  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId: uid,
    },
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  await prisma.notification.delete({
    where: {
      id: notificationId,
    },
  });

  return {
    message: "Notification deleted successfully",
  };
};

// ========================================
// Delete All Notifications (Clear All)
// ========================================
export const deleteAllNotifications = async (userId) => {
  const uid = Number(userId);

  await prisma.notification.deleteMany({
    where: {
      userId: uid,
    },
  });

  return {
    message: "All notifications cleared successfully",
  };
};