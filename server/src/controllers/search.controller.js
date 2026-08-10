import { searchGuesthouses ,  searchRooms,  searchReservations,
} from "../services/search.service.js";
import { successResponse } from "../utils/response.js";

export const search = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await searchGuesthouses(req.query);

    successResponse(
      res,
      result,
      "Guesthouses fetched successfully"
    );

  } catch (error) {
    next(error);
  }
};
// ======================================
// Search Rooms
// ======================================

export const roomSearch = async (
  req,
  res,
  next
) => {
  try {

    const result =
      await searchRooms(req.query);

    successResponse(
      res,
      result,
      "Rooms fetched successfully"
    );

  } catch (error) {
    next(error);
  }
};
// ======================================
// Search Reservations
// ======================================

export const reservationSearch = async (
  req,
  res,
  next
) => {
  try {

    const result =
      await searchReservations(req.query);

    successResponse(
      res,
      result,
      "Reservations fetched successfully"
    );

  } catch (error) {
    next(error);
  }
};