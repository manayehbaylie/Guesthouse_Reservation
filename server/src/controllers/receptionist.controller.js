import {
  getReceptionReservations,  confirmReservation,  checkInGuest,  checkOutGuest,  cancelReservation,  getTodayArrivals,
  getTodayDepartures,
} from "../services/receptionist.service.js";

import { successResponse }
from "../utils/response.js";

// ===================================
// Reception Reservation List
// ===================================
export const receptionReservations =
async (req, res, next) => {
  try {

    const reservations =
      await getReceptionReservations();

    successResponse(

      res,

      reservations,

      "Reservations fetched successfully"

    );

  } catch (error) {

    next(error);

  }

};
// ===================================
// Confirm Reservation
// ===================================
export const confirm = async (
  req,
  res,
  next
) => {

  try {

    const reservation =
      await confirmReservation(
        req.params.id
      );

    successResponse(

      res,

      reservation,

      "Reservation confirmed successfully"

    );

  } catch (error) {

    next(error);

  }

};
// ===================================
// Check In Guest
// ===================================
export const checkIn = async (

  req,

  res,

  next

) => {

  try {

    const reservation =
      await checkInGuest(

        req.params.id

      );

    successResponse(

      res,

      reservation,

      "Guest checked in successfully"

    );

  } catch (error) {

    next(error);

  }

};
// ===================================
// Check Out Guest
// ===================================
export const checkOut = async (

  req,

  res,

  next

) => {

  try {

    const reservation =
      await checkOutGuest(
        req.params.id
      );

    successResponse(

      res,

      reservation,

      "Guest checked out successfully"

    );

  } catch (error) {

    next(error);

  }

};
// ===================================
// Cancel Reservation
// ===================================
export const cancel = async (

  req,

  res,

  next

) => {

  try {

    const reservation =
      await cancelReservation(
        req.params.id
      );

    successResponse(

      res,

      reservation,

      "Reservation cancelled successfully"

    );

  } catch (error) {

    next(error);

  }

};
// ===================================
// Today's Arrivals
// ===================================
export const todayArrivals = async (

  req,

  res,

  next

) => {

  try {

    const arrivals =
      await getTodayArrivals();

    successResponse(

      res,

      arrivals,

      "Today's arrivals fetched successfully"

    );

  } catch (error) {

    next(error);

  }

};
// ===================================
// Today's Departures
// ===================================
export const todayDepartures = async (

  req,

  res,

  next

) => {

  try {

    const departures =
      await getTodayDepartures();

    successResponse(

      res,

      departures,

      "Today's departures fetched successfully"

    );

  } catch (error) {

    next(error);

  }

};