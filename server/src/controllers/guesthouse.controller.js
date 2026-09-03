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

// ============================================================
// CREATE GUESTHOUSE
// ============================================================

export const create = async (req, res, next) => {
  try {
    const rawBody = {
      ...req.body,
    };

    // ==========================================================
    // MAIN GUESTHOUSE IMAGE
    // ==========================================================

    if (req.file) {
      rawBody.image = `/uploads/guesthouses/${req.file.filename}`;
    } else if (
      typeof rawBody.image !== "string" ||
      !rawBody.image.trim()
    ) {
      delete rawBody.image;
    }

    // ==========================================================
    // VALIDATE REQUEST
    // ==========================================================

    const data = guesthouseSchema.parse(rawBody);

    // ==========================================================
    // LOGGED-IN OWNER ID
    // ==========================================================

    const ownerId = req.user.id;

    // ==========================================================
    // SAVE GUESTHOUSE
    // ==========================================================

    const guesthouse = await createGuesthouse(
      data,
      ownerId
    );

    // ==========================================================
    // RESPONSE
    // ==========================================================

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

// ============================================================
// GET ALL GUESTHOUSES
// ============================================================

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

// ============================================================
// GET GUESTHOUSE BY ID
// ============================================================

export const getById = async (req, res, next) => {
  try {
    const guesthouse = await getGuesthouseById(
      req.params.id
    );

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

// ============================================================
// GET MY GUESTHOUSE
// ============================================================

export const getMyGuesthouse = async (
  req,
  res,
  next
) => {
  try {
    const ownerId = req.user.id;

    const guesthouse =
      await getGuesthouseByOwnerId(ownerId);

    if (!guesthouse) {
      throw new Error(
        "You have not created a guesthouse yet"
      );
    }

    successResponse(
      res,
      guesthouse,
      "My guesthouse fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// UPDATE GUESTHOUSE
// ============================================================

export const update = async (req, res, next) => {
  try {
    const rawBody = {
      ...req.body,
    };

    // ==========================================================
    // MAIN GUESTHOUSE IMAGE
    //
    // If a new image was uploaded, save its path.
    // If no new image was uploaded, do NOT remove the
    // existing image from the database.
    // ==========================================================

    if (req.file) {
      rawBody.image = `/uploads/guesthouses/${req.file.filename}`;
    } else {
      // Don't send an empty/null image during normal updates.
      delete rawBody.image;
    }

    // ==========================================================
    // VALIDATE REQUEST
    // ==========================================================

    const data = guesthouseSchema.parse(rawBody);

    // ==========================================================
    // UPDATE GUESTHOUSE
    // ==========================================================

    const guesthouse = await updateGuesthouse(
      req.params.id,
      data
    );

    // ==========================================================
    // RESPONSE
    // ==========================================================

    successResponse(
      res,
      guesthouse,
      "Guesthouse updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// DELETE GUESTHOUSE
// ============================================================

export const remove = async (req, res, next) => {
  try {
    const guesthouse =
      await deleteGuesthouse(req.params.id);

    successResponse(
      res,
      guesthouse,
      "Guesthouse deleted successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET PENDING GUESTHOUSES
// ============================================================

export const pendingGuesthouses = async (
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

// ============================================================
// APPROVE GUESTHOUSE
// ============================================================

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

// ============================================================
// REJECT GUESTHOUSE
// ============================================================

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

    successResponse(
      res,
      guesthouse,
      "Guesthouse rejected successfully"
    );
  } catch (error) {
    next(error);
  }
};