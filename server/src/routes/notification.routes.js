import express from "express";

import {
  notifications,
  readNotification,
  unreadNotifications,
  removeNotification,
} from "../controllers/notification.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// ======================================
// Get User Notifications
// ======================================

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     description: Get all notifications belonging to the authenticated user.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications fetched successfully
 *       401:
 *         description: Authentication required
 */
router.get(
  "/",
  authenticate,
  notifications
);


// ======================================
// Mark Notification As Read
// ======================================

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     description: Mark a specific notification as read for the authenticated user.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Notification ID
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Notification not found
 */
router.patch(
  "/:id/read",
  authenticate,
  readNotification
);


// ======================================
// Get Unread Notifications
// ======================================

/**
 * @swagger
 * /api/notifications/unread:
 *   get:
 *     summary: Get unread notifications
 *     description: Get all unread notifications for the authenticated user.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread notifications fetched successfully
 *       401:
 *         description: Authentication required
 */
router.get(
  "/unread",
  authenticate,
  unreadNotifications
);


// ======================================
// Delete Notification
// ======================================

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     description: Delete a specific notification belonging to the authenticated user.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Notification ID
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Notification not found
 */
router.delete(
  "/:id",
  authenticate,
  removeNotification
);


export default router;