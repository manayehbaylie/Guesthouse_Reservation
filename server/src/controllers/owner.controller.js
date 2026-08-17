import {
  getMyGuesthouse,
  updateMyGuesthouse,
  createReceptionist,
  getReceptionists,
  assignReceptionistToGuesthouse,
  removeReceptionistFromGuesthouse,
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
    // Handle both 'name' and 'fullName' from frontend
    const data = {
      ...req.body,
      fullName: req.body.fullName || req.body.name,
    };

    const receptionist =
      await createReceptionist(
        req.user.id,
        data
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

/*
==================================================
ASSIGN RECEPTIONIST TO GUESTHOUSE
==================================================
*/
export const assignStaff = async (
  req,
  res,
  next
) => {
  try {
    const assignment =
      await assignReceptionistToGuesthouse(
        req.user.id,
        req.body.staffId
      );

    return successResponse(
      res,
      assignment,
      "Receptionist assigned successfully"
    );
  } catch (error) {
    next(error);
  }
};

/*
==================================================
REMOVE RECEPTIONIST FROM GUESTHOUSE
==================================================
*/
export const removeReceptionist = async (
  req,
  res,
  next
) => {
  try {
    const assignment =
      await removeReceptionistFromGuesthouse(
        req.user.id,
        req.params.staffId
      );

    return successResponse(
      res,
      assignment,
      "Receptionist removed successfully"
    );
  } catch (error) {
    next(error);
  }
};