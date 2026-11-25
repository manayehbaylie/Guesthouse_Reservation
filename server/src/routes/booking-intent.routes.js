import express from "express";
import rateLimit from "express-rate-limit";
import { claim, create } from "../controllers/booking-intent.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();
const createRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/", createRateLimit, create);
router.post("/claim", authenticate, authorize("GUEST"), claim);

export default router;
