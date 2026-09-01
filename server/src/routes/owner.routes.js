import express from "express";

import {
  getGuesthouse,
  updateGuesthouse,
  createGuesthouse,
  resubmitGuesthouse,
  submitGuesthouseForReview,
  addReceptionist,
  getStaff,
  assignStaff,
  removeReceptionist,
  updateOwnerProfile,
  getPayments,
} from "../controllers/owner.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/owner/guesthouse:
 *   post:
 *     summary: Register a new guesthouse (from Owner Dashboard)
 *     description: Creates a new guesthouse with PENDING status. Admin must approve before it goes live.
 *     tags:
 *       - Owner
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Guesthouse registered, pending approval
 */
router.post(
  "/guesthouse",
  authenticate,
  authorize("OWNER"),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "licenseDocument", maxCount: 1 },
    { name: "photos", maxCount: 10 },
  ]),
  createGuesthouse
);

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
 * /api/owner/guesthouse/resubmit:
 *   put:
 *     summary: Resubmit a rejected guesthouse
 *     description: Owner edits a rejected guesthouse and resubmits for admin review. Status resets to PENDING.
 *     tags:
 *       - Owner
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Guesthouse resubmitted for review
 */
router.put(
  "/guesthouse/resubmit",
  authenticate,
  authorize("OWNER"),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "licenseDocument", maxCount: 1 },
    { name: "photos", maxCount: 10 },
  ]),
  resubmitGuesthouse
);

router.put(
  "/guesthouse/submit",
  authenticate,
  authorize("OWNER"),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "licenseDocument", maxCount: 1 },
    { name: "photos", maxCount: 10 },
  ]),
  submitGuesthouseForReview
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
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "licenseDocument", maxCount: 1 },
    { name: "photos", maxCount: 10 },
  ]),
  updateGuesthouse
);

/**
 * @swagger
 * /api/owner/receptionists/:staffId:
 *   delete:
 *     summary: Remove receptionist from guesthouse
 *     tags:
 *       - Owner
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Receptionist removed successfully
 */
router.delete(
  "/receptionists/:staffId",
  authenticate,
  authorize("OWNER"),
  removeReceptionist
);

/**
 * @swagger
 * /api/owner/receptionists/assign:
 *   post:
 *     summary: Assign existing receptionist to guesthouse
 *     tags:
 *       - Owner
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               staffId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Receptionist assigned successfully
 */
router.post(
  "/receptionists/assign",
  authenticate,
  authorize("OWNER"),
  assignStaff
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
router.put(
  "/profile",
  authenticate,
  authorize("OWNER"),
  updateOwnerProfile
);
router.get(
  "/payments",
  authenticate,
  authorize("OWNER"),
  getPayments
);

export default router;