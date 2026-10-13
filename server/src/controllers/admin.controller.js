import {
  approveGuesthouse,
  rejectGuesthouse,
  setGuesthouseActiveStatus,
  deleteGuesthouse,
  deleteUser,
  getAllUsers,
  getAllGuesthousesForAdmin,
  updateUserRole,
  updateAdminProfile,
  getPlatformReport,
  getSystemActivity,
  createSystemBackup,
  restoreSystemBackup,
} from "../services/admin.service.js";

import { successResponse } from "../utils/response.js";
import { getSystemSettings, updateSystemSettings } from "../services/system-settings.service.js";
import {
  blockIpAddress,
  getActiveSessions,
  getAuditLogs,
  getLoginAttempts,
  listBlockedIps,
  unblockIpAddress,
} from "../services/security-audit.service.js";

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

export const updateGuesthouseActiveStatus = async (req, res, next) => {
  try {
    const guesthouse = await setGuesthouseActiveStatus(
      req.params.id,
      req.body.active
    );
    const message = req.body.active
      ? "Guesthouse activated successfully"
      : "Guesthouse deactivated successfully";

    return successResponse(res, guesthouse, message);
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

export const downloadBackup = async (req, res, next) => {
  try {
    return successResponse(res, await createSystemBackup(), "System backup created successfully");
  } catch (error) {
    next(error);
  }
};

export const restoreBackup = async (req, res, next) => {
  try {
    return successResponse(res, await restoreSystemBackup(req.body), "System restored successfully");
  } catch (error) {
    next(error);
  }
};

export const getSettings = async (req, res, next) => {
  try {
    return successResponse(res, await getSystemSettings(), "System settings fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const saveSettings = async (req, res, next) => {
  try {
    const settings = await updateSystemSettings(req.body, {
      adminId: req.user.id,
      password: req.body?.password,
      ipAddress: req.ip,
      method: req.method,
      path: req.originalUrl,
    });
    return successResponse(res, settings, "System settings saved successfully");
  } catch (error) {
    next(error);
  }
};

export const getSecurityLoginAttempts = async (req, res, next) => {
  try {
    return successResponse(res, await getLoginAttempts(req.query), "Login attempts fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const getSecurityAuditLogs = async (req, res, next) => {
  try {
    return successResponse(res, await getAuditLogs(req.query), "Audit logs fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const getSecurityActiveSessions = async (req, res, next) => {
  try {
    return successResponse(res, await getActiveSessions(), "Active sessions fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const getSecurityBlockedIps = async (req, res, next) => {
  try {
    return successResponse(res, await listBlockedIps(), "Blocked IPs fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const blockSecurityIp = async (req, res, next) => {
  try {
    const record = await blockIpAddress({ ipAddress: req.body?.ipAddress, reason: req.body?.reason, admin: req.user, request: req });
    return successResponse(res, record, "IP address blocked successfully");
  } catch (error) {
    next(error);
  }
};

export const unblockSecurityIp = async (req, res, next) => {
  try {
    const record = await unblockIpAddress({ ipAddress: req.params.ipAddress, admin: req.user, request: req });
    return successResponse(res, record, "IP address unblocked successfully");
  } catch (error) {
    next(error);
  }
};

export const exportSecurityAuditLogs = async (req, res, next) => {
  try {
    const { items } = await getAuditLogs(req.query, { all: true });
    if (String(req.query.format || "json").toLowerCase() === "csv") {
      const columns = ["createdAt", "actorName", "actorEmail", "eventCode", "method", "path", "ipAddress", "statusCode", "severity"];
      const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
      const rows = [columns, ...items.map((item) => columns.map((key) => item[key]))]
        .map((row) => row.map(escapeCsv).join(","));
      res.type("text/csv").set("Content-Disposition", 'attachment; filename="security-audit.csv"');
      return res.send(rows.join("\r\n"));
    }
    res.type("application/json").set("Content-Disposition", 'attachment; filename="security-audit.json"');
    return res.send(JSON.stringify(items, null, 2));
  } catch (error) {
    next(error);
  }
};