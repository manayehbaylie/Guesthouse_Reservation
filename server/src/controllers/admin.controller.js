import {
  approveGuesthouse,
  rejectGuesthouse,
  deleteGuesthouse,
  deleteUser,
  getAllUsers,
  getAllGuesthousesForAdmin,
  updateUserRole,
  updateAdminProfile,
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
    const guesthouse = await approveGuesthouse(req.params.id);
    return successResponse(res, guesthouse, "Guesthouse approved successfully");
  } catch (error) {
    next(error);
  }
};

/*
==================================================
REJECT GUESTHOUSE
==================================================
*/
export const reject = async (req, res, next) => {
  try {
    const guesthouse = await rejectGuesthouse(req.params.id, req.body.reason);
    return successResponse(res, guesthouse, "Guesthouse rejected successfully");
  } catch (error) {
    next(error);
  }
};

/*
==================================================
DELETE GUESTHOUSE
==================================================
*/
export const deleteGuesthouseController = async (req, res, next) => {
  try {
    const guesthouse = await deleteGuesthouse(req.params.id);
    return successResponse(res, guesthouse, "Guesthouse deleted successfully");
  } catch (error) {
    next(error);
  }
};

/*
==================================================
DELETE USER
==================================================
*/
export const deleteUserController = async (req, res, next) => {
  try {
    const user = await deleteUser(req.params.id);
    return successResponse(res, user, "User deleted successfully");
  } catch (error) {
    next(error);
  }
};

export const getGuesthouses = async (req, res, next) => {
  try {
    const guesthouses = await getAllGuesthousesForAdmin();

    return successResponse(
      res,
      guesthouses,
      "Guesthouses fetched successfully"
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
export const updateAdminProfileController = async (
  req,
  res,
  next
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const user = await updateAdminProfile(
      req.user.id,
      req.body
    );

    return successResponse(
      res,
      {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        guesthouseId: user.guesthouseId,
        createdAt: user.createdAt,
      },
      "Profile updated successfully"
    );
  } catch (error) {
    next(error);
  }
};