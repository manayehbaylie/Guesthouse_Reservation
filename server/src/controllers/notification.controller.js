import { getNotifications,  markNotificationAsRead,  getUnreadNotifications,  deleteNotification,


} from "../services/notification.service.js";

import {successResponse,} from "../utils/response.js";
// ========================================
// Get User Notifications
// ========================================

export const notifications = async (
  req,
  res,
  next
) => {

  try {

    const notifications =
      await getNotifications(req.user.id);

    successResponse(
      res,
      notifications,
      "Notifications fetched successfully"
    );

  } catch (error) {

    next(error);

  }

};
// ========================================
// Mark Notification As Read
// ========================================
export const readNotification = async (

  req,

  res,

  next

) => {

  try {

    const notification =
      await markNotificationAsRead(

        req.params.id,

        req.user.id

      );

    successResponse(

      res,

      notification,

      "Notification marked as read"

    );

  } catch (error) {

    next(error);

  }

};
// ========================================
// Get Unread Notifications
// ========================================
export const unreadNotifications = async (

  req,

  res,

  next

) => {

  try {

    const notifications =
      await getUnreadNotifications(

        req.user.id

      );

    successResponse(

      res,

      notifications,

      "Unread notifications fetched successfully"

    );

  } catch (error) {

    next(error);

  }

};
// ========================================
// Delete Notification
// ========================================
export const removeNotification = async (

  req,

  res,

  next

) => {

  try {

    const result =
      await deleteNotification(

        req.params.id,

        req.user.id

      );

    successResponse(

      res,

      result,

      "Notification deleted successfully"

    );

  } catch (error) {

    next(error);

  }

};