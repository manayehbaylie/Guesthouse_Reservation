import express from "express";

import {
  notifications,
  readNotification,
  markAllAsRead,
  unreadNotifications,
  unreadCount,
  removeNotification,
  clearAllNotifications,
} from "../controllers/notification.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// ======================================
// Get User Notifications
// ======================================
router.get(
  "/",
  authenticate,
  notifications
);

// ======================================
// Get Unread Notifications
// ======================================
router.get(
  "/unread",
  authenticate,
  unreadNotifications
);

// ======================================
// Get Unread Notification Count
// ======================================
router.get(
  "/count",
  authenticate,
  unreadCount
);

// ======================================
// Mark All Notifications As Read
// Note: Must be defined before /:id/read
// ======================================
router.patch(
  "/read-all",
  authenticate,
  markAllAsRead
);

// ======================================
// Mark Single Notification As Read
// ======================================
router.patch(
  "/:id/read",
  authenticate,
  readNotification
);

// ======================================
// Delete All Notifications (Clear All)
// Note: Must be defined before /:id
// ======================================
router.delete(
  "/",
  authenticate,
  clearAllNotifications
);

// ======================================
// Delete Single Notification
// ======================================
router.delete(
  "/:id",
  authenticate,
  removeNotification
);

export default router;