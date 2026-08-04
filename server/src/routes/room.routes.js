import express from "express";

import { create ,  getAll,  getById,  update, remove,


} from "../controllers/room.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();
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
// Create Room
router.post(
  "/:guesthouseId",
  authenticate,
  authorize("OWNER"),
  create
);


export default router;