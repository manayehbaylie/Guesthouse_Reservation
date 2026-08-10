import express from "express";

import {
  getGuesthouse,
  updateGuesthouse,
  addReceptionist,
  getStaff,
} from "../controllers/owner.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/owner/guesthouse:
 *   get:
 *     summary: Get owner's guesthouse
 *     tags:
 *       - Owner
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Guesthouse fetched successfully
 */
router.get(
  "/guesthouse",
  authenticate,
  authorize("OWNER"),
  getGuesthouse
);

/**
 * @swagger
 * /api/owner/guesthouse:
 *   put:
 *     summary: Update owner's guesthouse
 *     tags:
 *       - Owner
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Guesthouse updated successfully
 */
router.put(
  "/guesthouse",
  authenticate,
  authorize("OWNER"),
  updateGuesthouse
);

/**
 * @swagger
 * /api/owner/receptionists:
 *   post:
 *     summary: Create a receptionist
 *     tags:
 *       - Owner
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Receptionist created successfully
 */
router.post(
  "/receptionists",
  authenticate,
  authorize("OWNER"),
  addReceptionist
);

/**
 * @swagger
 * /api/owner/receptionists:
 *   get:
 *     summary: Get owner's receptionists
 *     tags:
 *       - Owner
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Receptionists fetched successfully
 */
router.get(
  "/receptionists",
  authenticate,
  authorize("OWNER"),
  getStaff
);

export default router;