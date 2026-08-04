import { paymentSchema } from "../validators/payment.validator.js";
import { createPayment,  getAllPayments,  getPaymentById,  updatePaymentStatus,


 } from "../services/payment.service.js";
import { successResponse } from "../utils/response.js";

export const create = async (req, res, next) => {
  try {
    // Validate request
    const data = paymentSchema.parse(req.body);

    // Create payment
    const payment = await createPayment(data);

    // Response
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
export const updateStatus = async (
  req,
  res,
  next
) => {
  try {
    const payment =
      await updatePaymentStatus(
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