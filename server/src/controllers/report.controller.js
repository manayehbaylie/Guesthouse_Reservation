import {
  getRevenueReport,
  getAdminReport,
} from "../services/report.service.js";

import { successResponse } from "../utils/response.js";

// ======================================
// Owner Revenue Report
// ======================================
export const revenueReport = async (
  req,
  res,
  next
) => {
  try {
    const report =
      await getRevenueReport(req.user.id);

    successResponse(
      res,
      report,
      "Revenue report fetched successfully"
    );

  } catch (error) {
    next(error);
  }
};

// ======================================
// Admin Report
// ======================================
export const adminReport = async (
  req,
  res,
  next
) => {
  try {
    const report =
      await getAdminReport();

    successResponse(
      res,
      report,
      "Admin report fetched successfully"
    );

  } catch (error) {
    next(error);
  }
};