import express from "express";

import {
  search,  roomSearch,  reservationSearch,

} from "../controllers/search.controller.js";

const router = express.Router();

router.get(
  "/guesthouses",
  search
);
// ===============================
// Search Rooms
// ===============================

router.get(
  "/rooms",
  roomSearch
);
// ======================================
// Search Reservations
// ======================================

router.get(
  "/reservations",
  reservationSearch
);
export default router;