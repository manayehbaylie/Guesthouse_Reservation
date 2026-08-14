import {
  approveGuesthouse,
  getAllUsers,
  updateUserRole,
  getPlatformReport,
  getSystemActivity,
} from "../services/admin.service.js";

import { successResponse } from "../utils/response.js";

/*
==================================================
APPROVE GUESTHOUSE
==================================================
*/
export const approve = async (req, res, next) => {
  try {
    const guesthouse =
      await approveGuesthouse(req.params.id);

    return successResponse(
      res,
      guesthouse,
      "Guesthouse approved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/*
==================================================
GET ALL USERS
==================================================
*/
export const getUsers = async (req, res, next) => {
  try {
    const users = await getAllUsers();

    return successResponse(
      res,
      users,
      "Users fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

/*
==================================================
UPDATE USER ROLE
==================================================
*/
export const updateUserRoleController = async (req, res, next) => {
  try {
    const user = await updateUserRole(req.params.id, req.body.role);

    return successResponse(
      res,
      user,
      "User role updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

/*
==================================================
GET PLATFORM REPORT
==================================================
*/
export const getReports = async (req, res, next) => {
  try {
    const report = await getPlatformReport();

    return successResponse(
      res,
      report,
      "Platform report fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

/*
==================================================
GET SYSTEM ACTIVITY
==================================================
*/
export const getActivity = async (req, res, next) => {
  try {
    const activity = await getSystemActivity();

    return successResponse(
      res,
      activity,
      "System activity fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};