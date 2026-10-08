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
  createRoomImages as createRoomImagesService,
  deleteRoomImage as deleteRoomImageService,
  replaceGuesthouseVideo,
} from "../services/owner.service.js";

import {
  getOwnerPaymentReport,
} from "../services/payment.service.js";

import { successResponse } from "../utils/response.js";

import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import {
  cloudinary,
  uploadToCloudinary,
} from "../config/cloudinary.js";

// ============================================================
// OWNER GUESTHOUSE PAYLOAD
// ============================================================

const ownerGuesthousePayload = async (req) => {
  const payload = {
    ...req.body,
  };

  // MAIN GUESTHOUSE IMAGE
  const imageFile = req.files?.image?.[0];

  if (imageFile) {
    const result = await uploadToCloudinary(imageFile, "guesthouse/images");
    payload.image = result.secure_url;
  } else if (
    typeof req.body.image === "string" &&
    req.body.image.trim()
  ) {
    // Keep existing image when no new file was uploaded.
    payload.image = req.body.image.trim();
  }

  // LICENSE DOCUMENT
  const licenseFile = req.files?.licenseDocument?.[0];

  if (licenseFile) {
    const result = await uploadToCloudinary(licenseFile, "guesthouse/licenses");
    payload.licenseDocument = result.secure_url;
  } else if (
    typeof req.body.licenseDocument === "string" &&
    req.body.licenseDocument.trim()
  ) {
    payload.licenseDocument = req.body.licenseDocument.trim();
  }

  // ADDITIONAL PHOTOS
  const photoFiles = req.files?.photos;

  if (Array.isArray(photoFiles) && photoFiles.length > 0) {
    const results = await Promise.all(
      photoFiles.map((file) =>
        uploadToCloudinary(file, "guesthouse/photos")
      )
    );
    payload.photos = results.map((result) => result.secure_url);
  } else if (Array.isArray(req.body.photos)) {
    payload.photos = req.body.photos.filter(
      (photo) => typeof photo === "string" && photo.trim()
    );
  } else if (
    typeof req.body.photos === "string" &&
    req.body.photos.trim()
  ) {
    payload.photos = [req.body.photos.trim()];
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

export const getMediaSignature = async (req, res, next) => {
  try {
    const resourceType = req.query.resourceType;

    if (!["image", "video"].includes(resourceType)) {
      return res.status(400).json({
        success: false,
        message: "Resource type must be image or video.",
      });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      const error = new Error("Cloudinary credentials are not configured.");
      error.statusCode = 503;
      throw error;
    }

    const mediaFolder = resourceType === "image" ? "rooms" : "videos";
    const folder = `guesthouses/${req.user.id}/${mediaFolder}`;
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { folder, timestamp },
      apiSecret
    );

    return successResponse(
      res,
      { cloudName, apiKey, folder, timestamp, signature },
      "Upload signature created successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const createRoomImages = async (req, res, next) => {
  try {
    const result = await createRoomImagesService(
      req.user.id,
      req.body?.items
    );

    return successResponse(
      res,
      result,
      "Room images saved successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};

export const deleteRoomImage = async (req, res, next) => {
  try {
    await deleteRoomImageService(
      req.user.id,
      req.params.id
    );

    return successResponse(
      res,
      null,
      "Room image deleted successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const updateGuesthouseVideo = async (req, res, next) => {
  try {
    const { url, publicId } = req.body || {};

    if (typeof url !== "string" || typeof publicId !== "string") {
      return res.status(400).json({
        success: false,
        message: "A video URL and public ID are required.",
      });
    }

    const guesthouse = await replaceGuesthouseVideo(
      req.user.id,
      url,
      publicId
    );

    return successResponse(
      res,
      guesthouse,
      "Guesthouse video updated successfully"
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
    await ownerGuesthousePayload(req);

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
      await ownerGuesthousePayload(req);
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
       await ownerGuesthousePayload(req);

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

    if (phone !== undefined) {
      const phoneOwner = await prisma.user.findFirst({
        where: {
          phone: String(phone).trim(),
          id: { not: userId },
        },
        select: { id: true },
      });

      if (phoneOwner) {
        return res.status(409).json({
          success: false,
          message: "This phone number is already in use.",
        });
      }
    }

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

    if (error?.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: error.meta?.target?.includes("phone")
          ? "This phone number is already in use."
          : "This information is already in use.",
      });
    }

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
// DELETE OWNER PAYMENT
// ============================================================

export const deletePayment = async (
  req,
  res,
  next
) => {
  try {
    const paymentId = Number(req.params.paymentId);
    const ownerId = Number(req.user?.id);

    if (!paymentId || !ownerId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required.",
      });
    }

    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        reservation: {
          room: {
            guesthouse: {
              ownerId,
            },
          },
        },
      },
      select: { id: true },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found for your guesthouse.",
      });
    }

    await prisma.payment.delete({
      where: { id: paymentId },
    });

    return res.status(200).json({
      success: true,
      message: "Payment deleted successfully.",
    });
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
        await ownerGuesthousePayload(req);
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