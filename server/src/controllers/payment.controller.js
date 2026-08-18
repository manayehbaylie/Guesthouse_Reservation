import {
  createPayment,
  getAllPayments,
  getPaymentById,
  updatePaymentStatus,
} from "../services/payment.service.js";

import { successResponse } from "../utils/response.js";

// ========================================
// Create Payment
// ========================================
export const create = async (req, res, next) => {
  try {
    const payment = await createPayment(req.body);

    successResponse(
      res,
      payment,
      "Payment created successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};

// ========================================
// Get All Payments
// ========================================
export const getAll = async (req, res, next) => {
  try {
    const payments = await getAllPayments();

    successResponse(
      res,
      payments,
      "Payments fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ========================================
// Get Payment By ID
// ========================================
export const getById = async (req, res, next) => {
  try {
    const payment = await getPaymentById(req.params.id);

    if (!payment) {
      throw new Error("Payment not found");
    }

    successResponse(
      res,
      payment,
      "Payment fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ========================================
// Update Payment Status
// ========================================
export const updateStatus = async (req, res, next) => {
  try {
    const payment = await updatePaymentStatus(
      req.params.id,
      req.body.status
    );

    successResponse(
      res,
      payment,
      "Payment status updated successfully"
    );
  } catch (error) {
    next(error);
  }
};