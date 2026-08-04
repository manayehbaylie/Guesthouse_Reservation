import express from "express";

import {
  create,
  getAll,
  getById,
  update,
  remove,
} from "../controllers/guesthouse.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("OWNER"),
  upload.single("image"),   // 👈 upload middleware
  create                    // 👈 controller
);
router.get("/", getAll);
router.get("/:id", getById);
router.put(
  "/:id",
  authenticate,
  authorize("OWNER"),
  update
);
router.delete(
  "/:id",
  authenticate,
  authorize("OWNER"),
  remove
);
export default router;