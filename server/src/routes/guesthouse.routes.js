import express from "express";

import {
  create,
  getAll,
  getById,
   getMyGuesthouse,
  update,
  remove,
  pendingGuesthouses,
  approve,
  reject,
} from "../controllers/guesthouse.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

// ==========================================================
// OWNER
// ==========================================================

// Create a guesthouse
router.post(
  "/",
  authenticate,
  authorize("OWNER"),
  upload.single("image"),
  create
);

/**
 * @swagger
 * /api/guesthouses:
 *   get:
 *     summary: Get all guesthouses
 *     description: Returns all guesthouses.
 *     tags:
 *       - Guesthouses
 *     responses:
 *       200:
 *         description: Guesthouses fetched successfully
 */
router.get("/", getAll);

// Get current owner's guesthouse
router.get(
  "/owner/me",
  authenticate,
  authorize("OWNER"),
  getMyGuesthouse
);

/**
 * @swagger
 * /api/guesthouses/{id}:
 *   get:
 *     summary: Get guesthouse by ID
 *     description: Returns a single guesthouse using its ID.
 *     tags:
 *       - Guesthouses
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Guesthouse fetched successfully
 *       404:
 *         description: Guesthouse not found
 */
router.get("/:id", getById);

/**
 * @swagger
 * /api/guesthouses/{id}:
 *   put:
 *     summary: Update guesthouse
 *     description: Allows an OWNER to update their guesthouse.
 *     tags:
 *       - Guesthouses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Sunrise Guesthouse
 *               address:
 *                 type: string
 *                 example: Bole, Addis Ababa
 *               city:
 *                 type: string
 *                 example: Addis Ababa
 *               description:
 *                 type: string
 *                 example: Updated guesthouse description
 *               image:
 *                 type: string
 *                 example: guesthouse.jpg
 *     responses:
 *       200:
 *         description: Guesthouse updated successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only OWNER can update a guesthouse
 *       404:
 *         description: Guesthouse not found
 */
router.put(
  "/:id",
  authenticate,
  authorize("OWNER"),
  update
);

/**
 * @swagger
 * /api/guesthouses/{id}:
 *   delete:
 *     summary: Delete guesthouse
 *     description: Allows an OWNER to delete a guesthouse.
 *     tags:
 *       - Guesthouses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Guesthouse deleted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only OWNER can delete a guesthouse
 *       404:
 *         description: Guesthouse not found
 */
router.delete(
  "/:id",
  authenticate,
  authorize("OWNER"),
  remove
);

/**
 * @swagger
 * /api/guesthouses/pending:
 *   get:
 *     summary: Get pending guesthouses
 *     description: Returns guesthouses waiting for administrator approval.
 *     tags:
 *       - Guesthouses
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending guesthouses fetched successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only ADMIN can view pending guesthouses
 */
router.get(
  "/pending",
  authenticate,
  authorize("ADMIN"),
  pendingGuesthouses
);

// Approve guesthouse
router.put(
  "/:id/approve",
  authenticate,
  authorize("ADMIN"),
  approve
);

// Reject guesthouse
router.put(
  "/:id/reject",
  authenticate,
  authorize("ADMIN"),
  reject
);

export default router;