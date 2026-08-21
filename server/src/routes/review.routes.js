import express from "express";

import {
  create,
  getByGuesthouse,
  getByGuest,
  getOwnerReviews,
  respond,
} from "../controllers/review.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a review
 *     tags:
 *       - Reviews
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - guesthouseId
 *               - reservationId
 *               - rating
 *               - comment
 *             properties:
 *               guesthouseId:
 *                 type: integer
 *               reservationId:
 *                 type: integer
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 */
router.post(
  "/",
  authenticate,
  authorize("GUEST"),
  create
);

/**
 * @swagger
 * /api/reviews/guesthouse/:guesthouseId:
 *   get:
 *     summary: Get reviews for a guesthouse
 *     tags:
 *       - Reviews
 *     parameters:
 *       - in: path
 *         name: guesthouseId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reviews fetched successfully
 */
router.get(
  "/guesthouse/:guesthouseId",
  getByGuesthouse
);

/**
 * @swagger
 * /api/reviews/my-reviews:
 *   get:
 *     summary: Get guest's own reviews
 *     tags:
 *       - Reviews
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Guest reviews fetched successfully
 */
router.get(
  "/my-reviews",
  authenticate,
  authorize("GUEST"),
  getByGuest
);

/**
 * @swagger
 * /api/reviews/owner-reviews:
 *   get:
 *     summary: Get owner's guesthouse reviews
 *     tags:
 *       - Reviews
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Owner reviews fetched successfully
 */
router.get(
  "/owner-reviews",
  authenticate,
  authorize("OWNER"),
  getOwnerReviews
);

/**
 * @swagger
 * /api/reviews/:reviewId/respond:
 *   put:
 *     summary: Owner responds to a review
 *     tags:
 *       - Reviews
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - response
 *             properties:
 *               response:
 *                 type: string
 *     responses:
 *       200:
 *         description: Response added successfully
 */
router.put(
  "/:reviewId/respond",
  authenticate,
  authorize("OWNER"),
  respond
);

export default router;