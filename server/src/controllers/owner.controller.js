import {
  getMyGuesthouse,
  updateMyGuesthouse,
  registerGuesthouse as registerGuesthouseService,
  resubmitGuesthouse as resubmitGuesthouseService,
  submitGuesthouseForReview as submitGuesthouseForReviewService,
  createReceptionist,
  getReceptionists,
  assignReceptionistToGuesthouse,
  removeReceptionistFromGuesthouse,
} from "../services/owner.service.js";

import {
  getOwnerPaymentReport,
} from "../services/payment.service.js";

import { successResponse } from "../utils/response.js";

import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";

// ============================================================
// OWNER GUESTHOUSE PAYLOAD
// ============================================================

const ownerGuesthousePayload = (req) => {
  const payload = {
    ...req.body,
  };

  // ==========================================================
  // MAIN GUESTHOUSE IMAGE
  // ==========================================================

  if (
    req.files?.image &&
    Array.isArray(req.files.image) &&
    req.files.image.length > 0
  ) {
    const imageFile = req.files.image[0];

    payload.image = `/uploads/guesthouses/${imageFile.filename}`;
  } else if (
    typeof req.body.image === "string" &&
    req.body.image.trim()
  ) {
    // Keep existing image when no new file was uploaded.
    payload.image = req.body.image.trim();
  }

  // ==========================================================
  // LICENSE DOCUMENT
  // ==========================================================

  if (
    req.files?.licenseDocument &&
    Array.isArray(req.files.licenseDocument) &&
    req.files.licenseDocument.length > 0
  ) {
    const licenseFile =
      req.files.licenseDocument[0];

    payload.licenseDocument =
      `/uploads/guesthouses/${licenseFile.filename}`;
  } else if (
    typeof req.body.licenseDocument === "string" &&
    req.body.licenseDocument.trim()
  ) {
    payload.licenseDocument =
      req.body.licenseDocument.trim();
  }

  // ==========================================================
  // ADDITIONAL PHOTOS
  // ==========================================================

  if (
    req.files?.photos &&
    Array.isArray(req.files.photos) &&
    req.files.photos.length > 0
  ) {
    payload.photos = req.files.photos.map(
      (file) =>
        `/uploads/guesthouses/${file.filename}`
    );
  } else if (
    Array.isArray(req.body.photos)
  ) {
    payload.photos = req.body.photos.filter(
      (photo) =>
        typeof photo === "string" &&
        photo.trim()
    );
  }

  return payload;
};

// ============================================================
// GET MY GUESTHOUSE
// ============================================================

export const getGuesthouse = async (
  req,
  res,
  next
) => {
  try {
    const guesthouse =
      await getMyGuesthouse(req.user.id);

    return successResponse(
      res,
      guesthouse,
      "Guesthouse fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// REGISTER GUESTHOUSE
// ============================================================
// POST /owner/guesthouse
// Creates a new PENDING guesthouse for the logged-in owner.
// ============================================================

export const createGuesthouse = async (
  req,
  res,
  next
) => {
  try {
    const payload =
      ownerGuesthousePayload(req);

    const guesthouse =
      await registerGuesthouseService(
        req.user.id,
        payload
      );

    return res.status(201).json({
      success: true,

      data: guesthouse,

      message:
        "Guesthouse registered successfully. Pending administrator approval.",
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// RESUBMIT REJECTED GUESTHOUSE
// ============================================================
// PUT /owner/guesthouse/resubmit
// ============================================================

export const resubmitGuesthouse = async (
  req,
  res,
  next
) => {
  try {
    const payload =
      ownerGuesthousePayload(req);

    const guesthouse =
      await resubmitGuesthouseService(
        req.user.id,
        payload
      );

    return successResponse(
      res,
      guesthouse,
      "Guesthouse resubmitted for review successfully."
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// UPDATE MY GUESTHOUSE
// ============================================================

export const updateGuesthouse = async (
  req,
  res,
  next
) => {
  try {
    const payload =
      ownerGuesthousePayload(req);

    const guesthouse =
      await updateMyGuesthouse(
        req.user.id,
        payload
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

// ============================================================
// CREATE RECEPTIONIST
// ============================================================

export const addReceptionist = async (
  req,
  res,
  next
) => {
  try {
    // Handle both "name" and "fullName" from frontend.
    const data = {
      ...req.body,

      fullName:
        req.body.fullName ||
        req.body.name,
    };

    const receptionist =
      await createReceptionist(
        req.user.id,
        data
      );

    return successResponse(
      res,
      receptionist,
      "Receptionist created successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET RECEPTIONISTS
// ============================================================

export const getStaff = async (
  req,
  res,
  next
) => {
  try {
    const receptionists =
      await getReceptionists(
        req.user.id
      );

    return successResponse(
      res,
      receptionists,
      "Receptionists fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ASSIGN RECEPTIONIST TO GUESTHOUSE
// ============================================================

export const assignStaff = async (
  req,
  res,
  next
) => {
  try {
    const assignment =
      await assignReceptionistToGuesthouse(
        req.user.id,
        req.body.staffId
      );

    return successResponse(
      res,
      assignment,
      "Receptionist assigned successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// REMOVE RECEPTIONIST FROM GUESTHOUSE
// ============================================================

export const removeReceptionist = async (
  req,
  res,
  next
) => {
  try {
    const assignment =
      await removeReceptionistFromGuesthouse(
        req.user.id,
        req.params.staffId
      );

    return successResponse(
      res,
      assignment,
      "Receptionist removed successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// UPDATE OWNER PROFILE
// ============================================================

export async function updateOwnerProfile(
  req,
  res
) {
  try {
    const userId =
      req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,

        message:
          "User ID not found in authentication token",
      });
    }

    const {
      fullName,
      email,
      phone,
      password,
    } = req.body;

    const data = {
      fullName,
      email,
      phone,
    };

    if (password?.trim()) {
      data.password =
        await bcrypt.hash(
          password.trim(),
          10
        );
    }

    const updatedUser =
      await prisma.user.update({
        where: {
          id: userId,
        },

        data,
      });

    return res.status(200).json({
      success: true,

      data: updatedUser,
    });
  } catch (error) {
    console.error(
      "UPDATE OWNER PROFILE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error?.message ||
        "Failed to update owner profile",
    });
  }
}

// ============================================================
// GET OWNER PAYMENT REPORT
// ============================================================

export const getPayments = async (
  req,
  res,
  next
) => {
  try {
    const payments =
      await getOwnerPaymentReport(
        req.user.id
      );

    return successResponse(
      res,
      payments,
      "Owner payments fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// SUBMIT GUESTHOUSE FOR REVIEW
// ============================================================
// PUT /owner/guesthouse/submit
// ============================================================

export const submitGuesthouseForReview =
  async (
    req,
    res,
    next
  ) => {
    try {
      const payload =
        ownerGuesthousePayload(req);

      const guesthouse =
        await submitGuesthouseForReviewService(
          req.user.id,
          payload
        );

      return successResponse(
        res,
        guesthouse,
        "Guesthouse submitted for review successfully."
      );
    } catch (error) {
      next(error);
    }
  };