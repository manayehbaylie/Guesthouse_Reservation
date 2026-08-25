import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotifications,
  getUnreadNotificationCount,
  deleteNotification,
  deleteAllNotifications,
} from "../services/notification.service.js";

import { successResponse } from "../utils/response.js";

// ========================================
// Get User Notifications
// ========================================
export const notifications = async (req, res, next) => {
  try {
    const data = await getNotifications(req.user.id);

    return successResponse(
      res,
      data,
      "Notifications fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ========================================
// Mark Notification As Read
// ========================================
export const readNotification = async (req, res, next) => {
  try {
    const notification = await markNotificationAsRead(
      req.params.id,
      req.user.id
    );

    return successResponse(
      res,
      notification,
      "Notification marked as read"
    );
  } catch (error) {
    next(error);
  }
};

// ========================================
// Mark All Notifications As Read
// ========================================
export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await markAllNotificationsAsRead(req.user.id);

    return successResponse(
      res,
      result,
      "All notifications marked as read"
    );
  } catch (error) {
    next(error);
  }
};

// ========================================
// Get Unread Notifications
// ========================================
export const unreadNotifications = async (req, res, next) => {
  try {
    const data = await getUnreadNotifications(req.user.id);

    return successResponse(
      res,
      data,
      "Unread notifications fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ========================================
// Get Unread Notification Count
// ========================================
export const unreadCount = async (req, res, next) => {
  try {
    const data = await getUnreadNotificationCount(req.user.id);

    return successResponse(
      res,
      data,
      "Unread count fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ========================================
// Delete Single Notification
// ========================================
export const removeNotification = async (req, res, next) => {
  try {
    const result = await deleteNotification(
      req.params.id,
      req.user.id
    );

    return successResponse(
      res,
      result,
      "Notification deleted successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ========================================
// Delete All Notifications (Clear All)
// ========================================
export const clearAllNotifications = async (req, res, next) => {
  try {
    const result = await deleteAllNotifications(req.user.id);

    return successResponse(
      res,
      result,
      "All notifications cleared successfully"
    );
  } catch (error) {
    next(error);
  }
};