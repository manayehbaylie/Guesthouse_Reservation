import { reservationSchema } from "../validators/reservation.validator.js";

import {
  createReservation,
  getAllReservations,
  getReservationById,
  updateReservationStatus,
} from "../services/reservation.service.js";

import { successResponse } from "../utils/response.js";

// ========================================
// Create Reservation
// ========================================
export const create = async (req, res, next) => {
  try {

    // Validate request
    const data = reservationSchema.parse(req.body);

    // Logged-in guest ID
    const guestId = req.user.id;

    // Create reservation
    const reservation = await createReservation(
      data,
      guestId
    );

    successResponse(
      res,
      reservation,
      "Reservation created successfully",
      201
    );

  } catch (error) {
    next(error);
  }
};

// ========================================
// Get All Reservations
// ========================================
export const getAll = async (req, res, next) => {
  try {

    const reservations =
      await getAllReservations();

    successResponse(
      res,
      reservations,
      "Reservations fetched successfully"
    );

  } catch (error) {
    next(error);
  }
};

// ========================================
// Get Reservation By ID
// ========================================
export const getById = async (req, res, next) => {
  try {

    const reservation =
      await getReservationById(req.params.id);

    if (!reservation) {
      throw new Error(
        "Reservation not found"
      );
    }

    successResponse(
      res,
      reservation,
      "Reservation fetched successfully"
    );

  } catch (error) {
    next(error);
  }
};

// ========================================
// Update Reservation Status
// ========================================
export const updateStatus = async (
  req,
  res,
  next
) => {
  try {

    const reservation =
      await updateReservationStatus(
        req.params.id,
        req.body.status
      );

    successResponse(
      res,
      reservation,
      "Reservation status updated successfully"
    );

  } catch (error) {
    next(error);
  }
};