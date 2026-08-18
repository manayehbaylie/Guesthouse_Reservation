
import express from "express";

import {
  register,
  login,
} from "../controllers/auth.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: >
 *       Registers a Guest or Owner. Guest accounts are activated immediately.
 *       Owner registrations create a pending guesthouse application.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *               - phone
 *               - role
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Manayeh Baylie
 *               email:
 *                 type: string
 *                 format: email
 *                 example: manayeh@gmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: 12345678
 *               phone:
 *                 type: string
 *                 example: "0924392994"
 *               role:
 *                 type: string
 *                 enum:
 *                   - GUEST
 *                   - OWNER
 *                 example: GUEST
 *               guesthouseName:
 *                 type: string
 *                 description: Required when registering as an OWNER.
 *               guesthouseAddress:
 *                 type: string
 *                 description: Required when registering as an OWNER.
 *               city:
 *                 type: string
 *                 description: Required when registering as an OWNER.
 *               guesthouseDescription:
 *                 type: string
 *                 description: Required when registering as an OWNER.
 *               guesthouseImage:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Registration successful.
 *       400:
 *         description: Invalid request data.
 *       409:
 *         description: Email or phone already exists.
 */
router.post("/register", register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: >
 *       Authenticates a user and returns a JWT token.
 *       Owners must have an approved guesthouse before they can log in.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: manayeh@gmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: 12345678
 *     responses:
 *       200:
 *         description: Login successful.
 *       401:
 *         description: Invalid email/password or owner account is not approved.
 *       400:
 *         description: Invalid request data.
 */
router.post("/login", login);

export default router;
