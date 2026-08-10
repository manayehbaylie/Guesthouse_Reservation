import {
  getMyGuesthouse,
  updateMyGuesthouse,
  createReceptionist,
  getReceptionists,
} from "../services/owner.service.js";

import { successResponse } from "../utils/response.js";

/*
==================================================
GET MY GUESTHOUSE
==================================================
*/
export const getGuesthouse = async (
  req,
  res,
  next
) => {
  try {
    const guesthouse =
      await getMyGuesthouse(req.user.id);

    return successResponse(
      res,
      guesthouse,
      "Guesthouse fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

/*
==================================================
UPDATE MY GUESTHOUSE
==================================================
*/
export const updateGuesthouse = async (
  req,
  res,
  next
) => {
  try {
    const guesthouse =
      await updateMyGuesthouse(
        req.user.id,
        req.body
      );

    return successResponse(
      res,
      guesthouse,
      "Guesthouse updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

/*
==================================================
CREATE RECEPTIONIST
==================================================
*/
export const addReceptionist = async (
  req,
  res,
  next
) => {
  try {
    const receptionist =
      await createReceptionist(
        req.user.id,
        req.body
      );

    return successResponse(
      res,
      receptionist,
      "Receptionist created successfully"
    );
  } catch (error) {
    next(error);
  }
};

/*
==================================================
GET RECEPTIONISTS
==================================================
*/
export const getStaff = async (
  req,
  res,
  next
) => {
  try {
    const receptionists =
      await getReceptionists(req.user.id);

    return successResponse(
      res,
      receptionists,
      "Receptionists fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};