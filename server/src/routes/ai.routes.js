import express from "express";
import { chat } from "../controllers/ai.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

router.post(
  "/chat",
  authenticate,
  authorize("GUEST", "OWNER", "RECEPTIONIST", "ADMIN"),
  chat
);

export default router;