import express from "express";
import { contacts, conversation, sendMessage, editMessage, deleteMessage } from "../controllers/communication.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();
router.use(authenticate, authorize("ADMIN", "OWNER"));
router.get("/contacts", contacts);
router.get("/:userId/messages", conversation);
router.post("/:userId/messages", sendMessage);
router.patch("/messages/:messageId", editMessage);
router.delete("/messages/:messageId", deleteMessage);

export default router;