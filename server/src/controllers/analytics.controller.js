import {

  getTopGuesthouses,

  getTopRooms,

  getMostActiveGuests,

  getRoomTypeStatistics,

} from "../services/analytics.service.js";

import { successResponse }from "../utils/response.js";
// ========================================
// Top Guesthouses (ADMIN)
// ========================================
export const topGuesthouses = async (

  req,

  res,

  next

) => {

  try {

    const guesthouses =
      await getTopGuesthouses();

    successResponse(

      res,

      guesthouses,

      "Top guesthouses fetched successfully"

    );

  } catch (error) {

    next(error);

  }

};
// ========================================
// Top Rooms (OWNER)
// ========================================
export const topRooms = async (

  req,

  res,

  next

) => {

  try {

    const rooms =
      await getTopRooms(

        req.user.id

      );

    successResponse(

      res,

      rooms,

      "Top rooms fetched successfully"

    );

  } catch (error) {

    next(error);

  }

};
// ========================================
// Most Active Guests (OWNER)
// ========================================
export const mostActiveGuests =
async (

  req,

  res,

  next

) => {

  try {

    const guests =
      await getMostActiveGuests(

        req.user.id

      );

    successResponse(

      res,

      guests,

      "Most active guests fetched successfully"

    );

  } catch (error) {

    next(error);

  }

};
// ========================================
// Room Type Statistics (ADMIN)
// ========================================
export const roomTypeStatistics =
async (

  req,

  res,

  next

) => {

  try {

    const statistics =
      await getRoomTypeStatistics();

    successResponse(

      res,

      statistics,

      "Room type statistics fetched successfully"

    );

  } catch (error) {

    next(error);

  }

};