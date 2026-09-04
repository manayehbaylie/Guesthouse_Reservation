import { paymentSchema } from "../validators/payment.validator.js";

import {
  createPayment,
  getAllPayments,
  getPaymentById,
  updatePaymentStatus,
  initiatePayment,
  getPaymentHistory,
  processChapaCallback,
  getChapaPaymentStatus,
} from "../services/payment.service.js";

import { successResponse } from "../utils/response.js";

export const create = async (req, res, next) => {
  try {
    const data = paymentSchema.parse(req.body);

    const payment = await createPayment(data);

    return successResponse(
      res,
      payment,
      "Payment request created successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};

export const initiate = async (req, res, next) => {
  try {
    const payment = await initiatePayment(req.body);

    return successResponse(
      res,
      payment,
      "Payment initialized successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (req, res, next) => {
  try {
    const payments = await getPaymentHistory(req.user.id);

    return successResponse(
      res,
      payments,
      "Payment history fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const getAll = async (req, res, next) => {
  try {
    const payments = await getAllPayments();

    return successResponse(
      res,
      payments,
      "Payments fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const payment = await getPaymentById(req.params.id);

    return successResponse(
      res,
      payment,
      "Payment fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const payment = await updatePaymentStatus(
      req.params.id,
      req.body.status
    );

    return successResponse(
      res,
      payment,
      "Payment status updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const chapaCallback = async (req, res) => {
  try {
    const payment = await processChapaCallback({
      ...(req.query || {}),
      ...(req.body || {}),
    });

    return res.json({ success: true, data: payment });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Chapa verification failed.",
    });
  }
};

export const chapaStatus = async (req, res, next) => {
  try {
    const payment = await getChapaPaymentStatus(
      req.user.id,
      req.query.tx_ref || req.query.txRef
    );
    return successResponse(res, payment, "Chapa payment status fetched successfully");
  } catch (error) {
    next(error);
  }
};