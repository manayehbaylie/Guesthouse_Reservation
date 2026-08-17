import {
  searchGuesthouses,
  searchRooms,
  searchReservations,
} from "../services/search.service.js";

import { successResponse } from "../utils/response.js";


/*
==================================================
SEARCH GUESTHOUSES
==================================================
*/
export const search = async (req, res, next) => {
  try {
    const guesthouses =
      await searchGuesthouses(req.query);

    return successResponse(
      res,
      guesthouses,
      "Verified guesthouses fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};


/*
==================================================
SEARCH ROOMS
==================================================
*/
export const roomSearch = async (
  req,
  res,
  next
) => {
  try {
    const rooms =
      await searchRooms(req.query);

    return successResponse(
      res,
      rooms,
      "Rooms fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};


/*
==================================================
SEARCH RESERVATIONS
==================================================
*/
export const reservationSearch = async (
  req,
  res,
  next
) => {
  try {
    const reservations =
      await searchReservations(req.query);

    return successResponse(
      res,
      reservations,
      "Reservations fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};