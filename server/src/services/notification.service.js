
// server/src/services/notification.service.js

import prisma from "../config/prisma.js";

// ========================================
// Ensure Approval Notifications
// ========================================
// Creates an approval notification automatically if a guesthouse
// was approved before the notification system was enabled.
const ensureApprovalNotifications = async (userId) => {
  const uid = Number(userId);

  if (!uid || Number.isNaN(uid)) {
    return;
  }

  const approvedGuesthouses = await prisma.guesthouse.findMany({
    where: {
      ownerId: uid,
      status: "APPROVED",
    },
    select: {
      id: true,
      name: true,
    },
  });

  for (const guesthouse of approvedGuesthouses) {
    const existing = await prisma.notification.findFirst({
      where: {
        userId: uid,
        category: "guesthouse",
        title: "Guesthouse Approved",
        message: {
          contains: `"${guesthouse.name}"`,
        },
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      await prisma.notification.create({
        data: {
          title: "Guesthouse Approved",
          message: `Congratulations! Your property "${guesthouse.name}" has been approved and is now live for guest bookings.`,
          userId: uid,
          category: "guesthouse",
          isRead: false,
        },
      });
    }
  }
};

// ========================================
// Get User Notifications
// ========================================
export const getNotifications = async (userId) => {
  const uid = Number(userId);

  if (!uid || Number.isNaN(uid)) {
    return [];
  }

  // Repair missing approval notifications.
  await ensureApprovalNotifications(uid);

  return await prisma.notification.findMany({
    where: {
      userId: uid,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

// ========================================
// Create Notification
// ========================================
// category examples:
// system
// guesthouse
// reservation
// payment
// review
// security
//
// guesthouseId is accepted for compatibility with callers that want
// to associate a notification with a particular guesthouse.
//
// NOTE:
// guesthouseId is only saved if your Prisma Notification model contains
// the guesthouseId field.
export const createNotification = async ({
  title,
  message,
  userId,
  guesthouseId = null,
  category = "system",
}) => {
  if (!userId || !title || !message) {
    console.warn(
      "⚠️ Missing required fields for notification:",
      {
        userId,
        title,
        message,
      }
    );

    return null;
  }

  const uid = Number(userId);

  if (!uid || Number.isNaN(uid)) {
    console.warn(
      "⚠️ Invalid userId for notification:",
      userId
    );

    return null;
  }

  try {
    console.log(
      `📨 Creating notification for user ${uid}: ${title}`
    );

    const notificationData = {
      title: String(title).trim(),
      message: String(message).trim(),
      userId: uid,
      category: String(category || "system")
        .trim()
        .toLowerCase(),
      isRead: false,
    };

    // Only add guesthouseId when a valid ID is supplied.
    if (
      guesthouseId !== null &&
      guesthouseId !== undefined &&
      Number(guesthouseId) > 0
    ) {
      notificationData.guesthouseId = Number(guesthouseId);
    }

    const notification = await prisma.notification.create({
      data: notificationData,
    });

    console.log(
      `✅ Notification created: ${notification.id}`
    );

    return notification;
  } catch (error) {
    console.error(
      "❌ Failed to create notification:",
      error?.message || error
    );

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

  if (
    !notificationId ||
    !uid ||
    Number.isNaN(notificationId) ||
    Number.isNaN(uid)
  ) {
    throw new Error("Invalid notification ID or user ID");
  }

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
export const markAllNotificationsAsRead = async (
  userId
) => {
  const uid = Number(userId);

  if (!uid || Number.isNaN(uid)) {
    throw new Error("Invalid user ID");
  }

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

  if (!uid || Number.isNaN(uid)) {
    return [];
  }

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
export const getUnreadNotificationCount = async (
  userId
) => {
  const uid = Number(userId);

  if (!uid || Number.isNaN(uid)) {
    return {
      count: 0,
    };
  }

  const count = await prisma.notification.count({
    where: {
      userId: uid,
      isRead: false,
    },
  });

  return {
    count,
  };
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

  if (
    !notificationId ||
    !uid ||
    Number.isNaN(notificationId) ||
    Number.isNaN(uid)
  ) {
    throw new Error("Invalid notification ID or user ID");
  }

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
// Delete All Notifications
// ========================================
export const deleteAllNotifications = async (
  userId
) => {
  const uid = Number(userId);

  if (!uid || Number.isNaN(uid)) {
    throw new Error("Invalid user ID");
  }

  await prisma.notification.deleteMany({
    where: {
      userId: uid,
    },
  });

  return {
    message: "All notifications cleared successfully",
  };
};

