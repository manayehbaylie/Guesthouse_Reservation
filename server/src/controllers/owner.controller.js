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

const ownerGuesthousePayload = (req) => ({
  ...req.body,
  licenseDocument: req.files?.licenseDocument?.[0]
    ? `/uploads/guesthouses/${req.files.licenseDocument[0].filename}`
    : typeof req.body.licenseDocument === "string"
      ? req.body.licenseDocument
      : undefined,
  photos: req.files?.photos?.length
    ? req.files.photos.map((file) => `/uploads/guesthouses/${file.filename}`)
    : Array.isArray(req.body.photos)
      ? req.body.photos.filter((photo) => typeof photo === "string")
      : undefined,
});

/*
==================================================
GET MY GUESTHOUSE
==================================================
*/
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

/*
==================================================
REGISTER GUESTHOUSE (from Owner Dashboard)
==================================================
POST /owner/guesthouse
Creates a new PENDING guesthouse for the logged-in owner.
==================================================
*/
export const createGuesthouse = async (
  req,
  res,
  next
) => {
  try {
    const guesthouse = await registerGuesthouseService(
      req.user.id,
      ownerGuesthousePayload(req)
    );

    return res.status(201).json({
      success: true,
      data: guesthouse,
      message: "Guesthouse registered successfully. Pending administrator approval.",
    });
  } catch (error) {
    next(error);
  }
};

/*
==================================================
RESUBMIT REJECTED GUESTHOUSE
==================================================
PUT /owner/guesthouse/resubmit
Owner edits rejected guesthouse and resubmits for review.
==================================================
*/
export const resubmitGuesthouse = async (
  req,
  res,
  next
) => {
  try {
    const guesthouse = await resubmitGuesthouseService(
      req.user.id,
      ownerGuesthousePayload(req)
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

/*
==================================================
UPDATE MY GUESTHOUSE
==================================================
*/
export const updateGuesthouse = async (
  req,
  res,
  next
) => {
  try {
    const guesthouse =
      await updateMyGuesthouse(
        req.user.id,
        ownerGuesthousePayload(req)
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

/*
==================================================
CREATE RECEPTIONIST
==================================================
*/
export const addReceptionist = async (
  req,
  res,
  next
) => {
  try {
    // Handle both 'name' and 'fullName' from frontend
    const data = {
      ...req.body,
      fullName: req.body.fullName || req.body.name,
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

/*
==================================================
GET RECEPTIONISTS
==================================================
*/
export const getStaff = async (
  req,
  res,
  next
) => {
  try {
    const receptionists =
      await getReceptionists(req.user.id);

    return successResponse(
      res,
      receptionists,
      "Receptionists fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

/*
==================================================
ASSIGN RECEPTIONIST TO GUESTHOUSE
==================================================
*/
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

/*
==================================================
REMOVE RECEPTIONIST FROM GUESTHOUSE
==================================================
*/
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
/*
==================================================
UPDATE OWNER PROFILE
==================================================
*/
export async function updateOwnerProfile(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in authentication token",
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
      data.password = await bcrypt.hash(
        password.trim(),
        10
      );
    }

    const updatedUser = await prisma.user.update({
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
/*
==================================================
GET OWNER PAYMENT REPORT
==================================================
*/
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

export const submitGuesthouseForReview = async (req, res, next) => {
  try {
    const guesthouse = await submitGuesthouseForReviewService(
      req.user.id,
      ownerGuesthousePayload(req)
    );

    return successResponse(res, guesthouse, "Guesthouse submitted for review successfully.");
  } catch (error) {
    next(error);
  }
};