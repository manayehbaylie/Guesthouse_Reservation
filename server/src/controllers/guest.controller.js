import {
  getMyProfile,
  updateMyProfile,
  getMyReservations,
} from "../services/guest.service.js";

import { successResponse } from "../utils/response.js";

/*
==================================================
GET PROFILE
==================================================
*/
export const getProfile = async (
  req,
  res,
  next
) => {
  try {
    const profile =
      await getMyProfile(req.user.id);

    return successResponse(
      res,
      profile,
      "Profile fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

/*
==================================================
UPDATE PROFILE
==================================================
*/
export const updateProfile = async (
  req,
  res,
  next
) => {
  try {
    const profile =
      await updateMyProfile(
        req.user.id,
        req.body
      );

    return successResponse(
      res,
      profile,
      "Profile updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

/*
==================================================
GET RESERVATION HISTORY
==================================================
*/
export const getReservations = async (
  req,
  res,
  next
) => {
  try {
    const reservations =
      await getMyReservations(req.user.id);

    return successResponse(
      res,
      reservations,
      "Reservation history fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};