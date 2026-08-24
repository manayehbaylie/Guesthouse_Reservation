import { reservationSchema } from "../validators/reservation.validator.js";

import {
  createReservation,
  getAllReservations,
  getReservationById,
  updateReservationStatus,
    checkoutReservation,

} from "../services/reservation.service.js";

import { successResponse } from "../utils/response.js";


// ============================================================
// CREATE RESERVATION
// ============================================================

export const create = async (
  req,
  res,
  next
) => {
  try {
    // --------------------------------------------------------
    // Authentication
    // --------------------------------------------------------

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    // --------------------------------------------------------
    // Validate request body
    // --------------------------------------------------------

    const data =
      reservationSchema.parse(
        req.body
      );

    // --------------------------------------------------------
    // Create reservation
    // --------------------------------------------------------

    const reservation =
      await createReservation(
        data,
        req.user.id
      );

    return successResponse(
      res,
      reservation,
      "Reservation created successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};


// ============================================================
// GET ALL RESERVATIONS
// ============================================================

export const getAll = async (
  req,
  res,
  next
) => {
  try {
    const reservations =
      await getAllReservations();

    return successResponse(
      res,
      reservations,
      "Reservations fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};


// ============================================================
// GET RESERVATION BY ID
// ============================================================

export const getById = async (
  req,
  res,
  next
) => {
  try {
    const reservation =
      await getReservationById(
        req.params.id
      );

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message:
          "Reservation not found.",
      });
    }

    return successResponse(
      res,
      reservation,
      "Reservation fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};


// ============================================================
// UPDATE RESERVATION STATUS
// ============================================================

export const updateStatus =
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        status,
      } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message:
            "Reservation status is required.",
        });
      }

      const reservation =
        await updateReservationStatus(
          req.params.id,
          status
        );

      return successResponse(
        res,
        reservation,
        "Reservation status updated successfully"
      );
    } catch (error) {
      next(error);
    }
  };
  export const checkout = async (req, res, next) => {
  try {

    const reservation = await checkoutReservation(
      req.params.id
    );

    successResponse(
      res,
      reservation,
      "Guest checked out successfully"
    );

  } catch (error) {
    next(error);
  }
};