import express from "express";
import { lockStatus } from "../controllers/system.controller.js";

const router = express.Router();
router.get("/status", lockStatus);
router.get("/lock-status", lockStatus);

export default router;