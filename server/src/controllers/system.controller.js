import { successResponse } from "../utils/response.js";
import { getSystemLockState, updateSystemLockState } from "../services/system-settings.service.js";

export const lockStatus = async (req, res, next) => {
  try {
    const { locked, message } = await getSystemLockState();
    return successResponse(res, { locked, message }, "System lock status fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const updateLock = async (req, res, next) => {
  try {
    const state = await updateSystemLockState({
      ...req.body,
      adminId: req.user.id,
      ipAddress: req.ip,
      method: req.method,
      path: req.originalUrl,
    });
    return successResponse(res, state, "System lock updated successfully");
  } catch (error) {
    next(error);
  }
};