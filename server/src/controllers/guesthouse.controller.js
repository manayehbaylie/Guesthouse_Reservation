import { guesthouseSchema } from "../validators/guesthouse.validator.js";
import {
  createGuesthouse,
  getAllGuesthouses,
  getGuesthouseById,
  updateGuesthouse,
   deleteGuesthouse,
  getPendingGuesthouses,
  approveGuesthouse,
rejectGuesthouse,

} from "../services/guesthouse.service.js";
import { successResponse } from "../utils/response.js";

export const create = async (req, res, next) => {
  try {
    // Validate Request
    const data = guesthouseSchema.parse(req.body);

    // Logged in Owner ID
    const ownerId = req.user.id;

    // Save Guesthouse
    const guesthouse = await createGuesthouse(
      data,
      ownerId
    );

    // Response
    successResponse(
      res,
      guesthouse,
      "Guesthouse created successfully",
      201
    );

  } catch (error) {
    next(error);
  }
};
export const getAll = async (req, res, next) => {
  try {
    const guesthouses = await getAllGuesthouses();

    successResponse(
      res,
      guesthouses,
      "Guesthouses fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};
export const getById = async (req, res, next) => {
  try {
    const guesthouse = await getGuesthouseById(req.params.id);

    if (!guesthouse) {
      throw new Error("Guesthouse not found");
    }

    successResponse(
      res,
      guesthouse,
      "Guesthouse fetched successfully"
    );

  } catch (error) {
    next(error);
  }
};
export const update = async (req, res, next) => {
  try {
    const data = guesthouseSchema.parse(req.body);

    const guesthouse = await updateGuesthouse(
      req.params.id,
      data
    );

    successResponse(
      res,
      guesthouse,
      "Guesthouse updated successfully"
    );

  } catch (error) {
    next(error);
  }
};
export const remove = async (req, res, next) => {
  try {
    const guesthouse = await deleteGuesthouse(req.params.id);

    successResponse(
      res,
      guesthouse,
      "Guesthouse deleted successfully"
    );

  } catch (error) {
    next(error);
  }
};
// ========================================
// Get Pending Guesthouses
// ========================================
export const pendingGuesthouses =
  async (

    req,

    res,

    next

  ) => {

    try {

      const guesthouses =
        await getPendingGuesthouses();

      successResponse(

        res,

        guesthouses,

        "Pending guesthouses fetched successfully"

      );

    } catch (error) {

      next(error);

    }

};
// ========================================
// Approve Guesthouse
// ========================================
export const approve = async (

  req,

  res,

  next

) => {

  try {

    const guesthouse =
      await approveGuesthouse(

        req.params.id

      );

    successResponse(

      res,

      guesthouse,

      "Guesthouse approved successfully"

    );

  } catch (error) {

    next(error);

  }

};
// ========================================
// Reject Guesthouse
// ========================================
export const reject = async (

  req,

  res,

  next

) => {

  try {

    const guesthouse =await rejectGuesthouse(
  req.params.id,
  req.body.reason
);

    successResponse(

      res,

      guesthouse,

      "Guesthouse rejected successfully"

    );

  } catch (error) {

    next(error);

  }

};