import express from "express";
import {
  createLinkCode,
  getBotInfo,
  getLoginInfo,
  getLinkStatus,
  handleTelegramWebhook,
  unlink,
} from "../controllers/telegram.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();
const allRoles = authorize("GUEST", "OWNER", "RECEPTIONIST", "ADMIN");

router.get("/bot-info", getBotInfo);
router.get("/login-info", getLoginInfo);
router.post("/webhook", handleTelegramWebhook);
router.get("/status", authenticate, allRoles, getLinkStatus);
router.get("/link", authenticate, allRoles, getLinkStatus);
router.post("/link-code", authenticate, allRoles, createLinkCode);
router.delete("/link", authenticate, allRoles, unlink);

export default router;
