import express from "express";

import {
  create,
  getAll,
  getById,
  update,
  remove,
} from "../controllers/room.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: Get all rooms
 *     description: Returns all rooms in the guesthouse reservation platform.
 *     tags:
 *       - Rooms
 *     responses:
 *       200:
 *         description: Rooms fetched successfully
 */
router.get("/", getAll);

/**
 * @swagger
 * /api/rooms/guesthouse/:guesthouseId:
 *   get:
 *     summary: Get rooms by guesthouse ID
 *     description: Returns all rooms for a specific guesthouse.
 *     tags:
 *       - Rooms
 *     parameters:
 *       - in: path
 *         name: guesthouseId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Rooms fetched successfully
 *       404:
 *         description: Guesthouse not found
 */
router.get("/guesthouse/:guesthouseId", getAll);

/**
 * @swagger
 * /api/rooms/{id}:
 *   get:
 *     summary: Get room by ID
 *     description: Returns a single room using its ID.
 *     tags:
 *       - Rooms
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Room fetched successfully
 *       404:
 *         description: Room not found
 */
router.get("/:id", getById);

/**
 * @swagger
 * /api/rooms/{id}:
 *   put:
 *     summary: Update room
 *     description: Allows an OWNER to update a room.
 *     tags:
 *       - Rooms
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
 *               roomNumber:
 *                 type: string
 *                 example: "101"
 *               roomType:
 *                 type: string
 *                 example: DOUBLE
 *               price:
 *                 type: number
 *                 example: 1500
 *               capacity:
 *                 type: integer
 *                 example: 2
 *               available:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Room updated successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only OWNER can update a room
 *       404:
 *         description: Room not found
 */
router.put(
  "/:id",
  authenticate,
  authorize("OWNER"),
  update
);

/**
 * @swagger
 * /api/rooms/{id}:
 *   delete:
 *     summary: Delete room
 *     description: Allows an OWNER to delete a room.
 *     tags:
 *       - Rooms
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
 *         description: Room deleted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only OWNER can delete a room
 *       404:
 *         description: Room not found
 */
router.delete(
  "/:id",
  authenticate,
  authorize("OWNER"),
  remove
);

/**
 * @swagger
 * /api/rooms/{guesthouseId}:
 *   post:
 *     summary: Create a room
 *     description: Allows an OWNER to create a room inside a guesthouse.
 *     tags:
 *       - Rooms
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: guesthouseId
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
 *             required:
 *               - roomNumber
 *               - roomType
 *               - price
 *               - capacity
 *             properties:
 *               roomNumber:
 *                 type: string
 *                 example: "101"
 *               roomType:
 *                 type: string
 *                 example: DOUBLE
 *               price:
 *                 type: number
 *                 example: 1500
 *               capacity:
 *                 type: integer
 *                 example: 2
 *               available:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Room created successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only OWNER can create a room
 *       404:
 *         description: Guesthouse not found
 */
router.post(
  "/:guesthouseId",
  authenticate,
  authorize("OWNER"),
  create
);

export default router;