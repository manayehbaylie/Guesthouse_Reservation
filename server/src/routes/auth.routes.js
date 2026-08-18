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
 *     description: Creates a new user account.
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
 *                 example: GUEST
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid request data
 */
router.post("/register", register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticates a user and returns a JWT token.
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
 *         description: Login successful
 *       401:
 *         description: Invalid email or password
 */
router.post("/login", login);

export default router;