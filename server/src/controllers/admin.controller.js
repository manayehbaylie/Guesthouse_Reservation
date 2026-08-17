import {
  approveGuesthouse,
  getAllUsers,
  getPlatformReport,
  getSystemActivity,
} from "../services/admin.service.js";

import { successResponse } from "../utils/response.js";

/**
 * Approve guesthouse
 */
export const approve = async (req, res, next) => {
  try {
    const guesthouse = await approveGuesthouse(req.params.id);

    return successResponse(
      res,
      guesthouse,
      "Guesthouse approved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users
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

/**
 * Get platform reports
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

/**
 * Get system activity
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