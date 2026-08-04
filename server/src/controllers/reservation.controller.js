import { reservationSchema } from "../validators/reservation.validator.js";
import { createReservation,  getAllReservations,  getReservationById,  updateReservationStatus,

   cancelReservation,
} from "../services/reservation.service.js";
import { successResponse } from "../utils/response.js";

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

    // Response
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
export const getAll = async (req, res, next) => {
  try {
    const reservations = await getAllReservations();

    successResponse(
      res,
      reservations,
      "Reservations fetched successfully"
    );

  } catch (error) {
    next(error);
  }
};
export const getById = async (req, res, next) => {
  try {
    const reservation = await getReservationById(
      req.params.id
    );

    if (!reservation) {
      throw new Error("Reservation not found");
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
export const cancel = async (req, res, next) => {
  try {
    const reservation = await cancelReservation(
      req.params.id
    );

    successResponse(
      res,
      reservation,
      "Reservation cancelled successfully"
    );

  } catch (error) {
    next(error);
  }
};