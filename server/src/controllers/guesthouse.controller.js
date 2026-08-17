import { guesthouseSchema } from "../validators/guesthouse.validator.js";

import {
  createGuesthouse,
  getAllGuesthouses,
  getGuesthouseById,
   getGuesthouseByOwnerId,
  updateGuesthouse,
  deleteGuesthouse,
  getPendingGuesthouses,
  approveGuesthouse,
  rejectGuesthouse,
} from "../services/guesthouse.service.js";

import { successResponse } from "../utils/response.js";

// ==========================================================
// CREATE GUESTHOUSE
// ==========================================================
export const create = async (req, res, next) => {
  try {
    const data = guesthouseSchema.parse({
      ...req.body,

      // If an uploaded image exists, use it.
      image: req.file?.path || req.body.image,
    });

    const ownerId = req.user.id;

    const guesthouse = await createGuesthouse(
      data,
      ownerId
    );

    return successResponse(
      res,
      guesthouse,
      "Guesthouse created successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};

// ==========================================================
// GET ALL VERIFIED GUESTHOUSES
// ==========================================================
export const getAll = async (req, res, next) => {
  try {
    const guesthouses = await getAllGuesthouses(
      req.query
    );

    return successResponse(
      res,
      guesthouses,
      "Verified guesthouses fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ==========================================================
// GET ONE GUESTHOUSE
// ==========================================================
export const getById = async (req, res, next) => {
  try {
    const guesthouse = await getGuesthouseById(
      req.params.id
    );

    if (!guesthouse) {
      throw new Error("Guesthouse not found");
    }

    return successResponse(
      res,
      guesthouse,
      "Guesthouse fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ==========================================================
// GET OWNER GUESTHOUSE
// ==========================================================
export const getMyGuesthouse = async (req, res, next) => {
  try {
    const guesthouse = await getGuesthouseByOwnerId(req.user.id);
    return successResponse(
      res,
      guesthouse,
      "Owner guesthouse fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};
export const update = async (req, res, next) => {
  try {
    const data = guesthouseSchema.partial().parse({
      ...req.body,

      image: req.file?.path || req.body.image,
    });

    const guesthouse = await updateGuesthouse(
      req.params.id,
      data
    );

    return successResponse(
      res,
      guesthouse,
      "Guesthouse updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ==========================================================
// DELETE GUESTHOUSE
// ==========================================================
export const remove = async (req, res, next) => {
  try {
    const guesthouse = await deleteGuesthouse(
      req.params.id
    );

    return successResponse(
      res,
      guesthouse,
      "Guesthouse deleted successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ==========================================================
// GET PENDING GUESTHOUSES
// ADMIN ONLY
// ==========================================================
export const pendingGuesthouses = async (
  req,
  res,
  next
) => {
  try {
    const guesthouses =
      await getPendingGuesthouses();

    return successResponse(
      res,
      guesthouses,
      "Pending guesthouses fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ==========================================================
// APPROVE GUESTHOUSE
// ADMIN ONLY
// ==========================================================
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

    return successResponse(
      res,
      guesthouse,
      "Guesthouse approved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ==========================================================
// REJECT GUESTHOUSE
// ADMIN ONLY
// ==========================================================
export const reject = async (
  req,
  res,
  next
) => {
  try {
    const guesthouse =
      await rejectGuesthouse(
        req.params.id,
        req.body.reason
      );

    return successResponse(
      res,
      guesthouse,
      "Guesthouse rejected successfully"
    );
  } catch (error) {
    next(error);
  }
};