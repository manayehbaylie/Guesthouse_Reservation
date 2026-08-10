import prisma from "../config/prisma.js";

// ========================================
// Get User Notifications
// ========================================

export const getNotifications = async (userId) => {
  return await prisma.notification.findMany({
    where: {
      userId,
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};

// ========================================
// Create Notification
// ========================================

export const createNotification = async ({
  title,
  message,
  userId,
}) => {
  return await prisma.notification.create({
    data: {
      title,
      message,
      userId,
    },
  });
};
// ========================================
// Mark Notification As Read
// ========================================
export const markNotificationAsRead = async (
  id,
  userId
) => {

  const notification =
    await prisma.notification.findFirst({

      where: {
        id: Number(id),
        userId,
      },

    });

  if (!notification) {
    throw new Error("Notification not found");
  }

  return await prisma.notification.update({

    where: {
      id: Number(id),
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

  return await prisma.notification.findMany({

    where: {

      userId,

      isRead: false,

    },

    orderBy: {

      createdAt: "desc",

    },

  });

};
// ========================================
// Delete Notification
// ========================================
export const deleteNotification = async (
  id,
  userId
) => {

  const notification =
    await prisma.notification.findFirst({

      where: {
        id: Number(id),
        userId,
      },

    });

  if (!notification) {
    throw new Error("Notification not found");
  }

  await prisma.notification.delete({

    where: {
      id: Number(id),
    },

  });

  return {
    message: "Notification deleted successfully",
  };

};