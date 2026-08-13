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

/**
 * @swagger
 * /api/guesthouses:
 *   post:
 *     summary: Create a new guesthouse
 *     description: Allows an OWNER to create a guesthouse with an optional image.
 *     tags:
 *       - Guesthouses
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - city
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
 *                 example: Comfortable guesthouse in Addis Ababa.
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Guesthouse created successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only OWNER can create a guesthouse
 */
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

/**
 * @swagger
 * /api/guesthouses/{id}/approve:
 *   patch:
 *     summary: Approve guesthouse
 *     description: Allows an ADMIN to approve a pending guesthouse.
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
 *         description: Guesthouse approved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only ADMIN can approve guesthouses
 *       404:
 *         description: Guesthouse not found
 */
router.patch(
  "/:id/approve",
  authenticate,
  authorize("ADMIN"),
  approve
);

/**
 * @swagger
 * /api/guesthouses/{id}/reject:
 *   patch:
 *     summary: Reject guesthouse
 *     description: Allows an ADMIN to reject a guesthouse.
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
 *         description: Guesthouse rejected successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only ADMIN can reject guesthouses
 *       404:
 *         description: Guesthouse not found
 */
router.patch(
  "/:id/reject",
  authenticate,
  authorize("ADMIN"),
  reject
);
router.get(
  "/owner/me",
  authenticate,
  authorize("OWNER"),
  getMyGuesthouse
);

export default router;