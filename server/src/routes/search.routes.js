import express from "express";

import {
  search,
  roomSearch,
  reservationSearch,
} from "../controllers/search.controller.js";


const router = express.Router();


/*
==================================================
GUESTHOUSE SEARCH
==================================================

Example:

GET /api/search/guesthouses

GET /api/search/guesthouses?city=Addis%20Ababa

GET /api/search/guesthouses?q=bole

GET /api/search/guesthouses?city=Hawassa&maxPrice=1500

GET /api/search/guesthouses?checkIn=2026-08-20&checkOut=2026-08-22

GET /api/search/guesthouses?city=Addis%20Ababa&maxPrice=1500&checkIn=2026-08-20&checkOut=2026-08-22
==================================================
*/

router.get(
  "/guesthouses",
  search
);


/*
==================================================
ROOM SEARCH
==================================================
*/

router.get(
  "/rooms",
  roomSearch
);


/*
==================================================
RESERVATION SEARCH
==================================================
*/

router.get(
  "/reservations",
  reservationSearch
);


export default router;