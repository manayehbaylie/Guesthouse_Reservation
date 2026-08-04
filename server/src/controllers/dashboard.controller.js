import { getDashboardStats,  getMonthlyRevenue,  getRecentReservations,  getRecentPayments,
  getOwnerDashboard,getOwnerRevenue,
 } from "../services/dashboard.service.js";
import { successResponse } from "../utils/response.js";

export const getStats = async (req, res, next) => {
  try {
    const stats = await getDashboardStats();

    successResponse(
      res,
      stats,
      "Dashboard statistics fetched successfully"
    );

  } catch (error) {
    next(error);
  }
};
export const monthlyRevenue = async (
  req,
  res,
  next
) => {
  try {
    const revenue =
      await getMonthlyRevenue();

    successResponse(
      res,
      revenue,
      "Monthly revenue fetched successfully"
    );

  } catch (error) {
    next(error);
  }
};
export const recentReservations = async (
  req,
  res,
  next
) => {
  try {
    const reservations =
      await getRecentReservations();

    successResponse(
      res,
      reservations,
      "Recent reservations fetched successfully"
    );

  } catch (error) {
    next(error);
  }
};
export const recentPayments = async (
  req,
  res,
  next
) => {
  try {
    const payments =
      await getRecentPayments();

    successResponse(
      res,
      payments,
      "Recent payments fetched successfully"
    );

  } catch (error) {
    next(error);
  }
};
export const ownerDashboard = async (
  req,
  res,
  next
) => {
  try {
    const dashboard =
      await getOwnerDashboard(req.user.id);

    successResponse(
      res,
      dashboard,
      "Owner dashboard fetched successfully"
    );

  } catch (error) {
    next(error);
  }
};
export const ownerRevenue = async (req, res, next) => {
  try {
    const revenue = await getOwnerRevenue(req.user.id);

    successResponse(
      res,
      revenue,
      "Owner revenue fetched successfully"
    );

  } catch (error) {
    next(error);
  }
};