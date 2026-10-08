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
import { cloudinary, uploadToCloudinary } from "../config/cloudinary.js";

const isCloudinaryAsset = (url, publicId, folder) => {
  if (
    typeof url !== "string" ||
    typeof publicId !== "string" ||
    !publicId.startsWith(`${folder}/`)
  ) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    const cloudName = cloudinary.config().cloud_name;

    return (
      parsedUrl.protocol === "https:" &&
      parsedUrl.hostname === "res.cloudinary.com" &&
      parsedUrl.pathname.startsWith(`/${cloudName}/`)
    );
  } catch {
    return false;
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

    const config = cloudinary.config();
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!config.cloud_name || !config.api_key || !apiSecret) {
      return res.status(503).json({
        success: false,
        message: "Cloudinary is not configured.",
      });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const mediaFolder = resourceType === "image" ? "rooms" : "videos";
    const folder = `guesthouses/${req.user.id}/${mediaFolder}`;
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      apiSecret
    );

    return successResponse(res, {
      cloudName: config.cloud_name,
      apiKey: config.api_key,
      timestamp,
      signature,
      folder,
    }, "Cloudinary upload signature created.");
  } catch (error) {
    next(error);
  }
};

export const createRoomImages = async (req, res, next) => {
  try {
    const items = req.body?.items;

    if (!Array.isArray(items) || items.length === 0 || items.length > 30) {
      return res.status(400).json({
        success: false,
        message: "Provide between 1 and 30 room images.",
      });
    }

    const normalizedItems = [];

    for (const item of items) {
      const roomId = Number(item?.roomId);
      const url = typeof item?.url === "string" ? item.url.trim() : "";
      const publicId = typeof item?.publicId === "string"
        ? item.publicId.trim()
        : "";

      if (
        !Number.isInteger(roomId) ||
        roomId <= 0 ||
        !isCloudinaryAsset(
          url,
          publicId,
          `guesthouses/${req.user.id}/rooms`
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Each image must include an owned room and Cloudinary asset.",
        });
      }

      normalizedItems.push({ roomId, url, publicId });
    }

    const roomIds = [...new Set(normalizedItems.map((item) => item.roomId))];
    const rooms = await prisma.room.findMany({
      where: {
        id: { in: roomIds },
        guesthouse: { ownerId: req.user.id },
      },
      select: { id: true },
    });

    if (rooms.length !== roomIds.length) {
      return res.status(403).json({
        success: false,
        message: "One or more rooms do not belong to your guesthouse.",
      });
    }

    const existingImages = await prisma.roomImage.groupBy({
      by: ["roomId"],
      where: { roomId: { in: roomIds } },
      _count: { _all: true },
    });
    const imageCounts = new Map(
      existingImages.map((entry) => [entry.roomId, entry._count._all])
    );
    const batchCounts = new Map();

    for (const item of normalizedItems) {
      batchCounts.set(item.roomId, (batchCounts.get(item.roomId) || 0) + 1);
    }

    for (const [roomId, batchCount] of batchCounts) {
      if ((imageCounts.get(roomId) || 0) + batchCount > 10) {
        return res.status(400).json({
          success: false,
          message: "A room cannot have more than 10 images.",
        });
      }
    }

    const nextSortOrder = new Map(imageCounts);
    const result = await prisma.roomImage.createMany({
      data: normalizedItems.map((item) => {
        const sortOrder = nextSortOrder.get(item.roomId) || 0;
        nextSortOrder.set(item.roomId, sortOrder + 1);
        return { ...item, sortOrder };
      }),
    });

    return successResponse(
      res,
      { count: result.count },
      "Room images saved successfully.",
      201
    );
  } catch (error) {
    next(error);
  }
};

export const deleteRoomImage = async (req, res, next) => {
  try {
    const imageId = Number(req.params.id);

    if (!Number.isInteger(imageId) || imageId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid room image ID is required.",
      });
    }

    const image = await prisma.roomImage.findFirst({
      where: {
        id: imageId,
        room: { guesthouse: { ownerId: req.user.id } },
      },
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Room image not found.",
      });
    }

    const result = await cloudinary.uploader.destroy(image.publicId, {
      resource_type: "image",
    });

    if (!["ok", "not found"].includes(result.result)) {
      throw new Error("Cloudinary could not delete the room image.");
    }

    await prisma.roomImage.delete({ where: { id: image.id } });

    return successResponse(res, null, "Room image deleted successfully.");
  } catch (error) {
    next(error);
  }
};

export const updateGuesthouseVideo = async (req, res, next) => {
  try {
    const url = typeof req.body?.url === "string" ? req.body.url.trim() : "";
    const publicId = typeof req.body?.publicId === "string"
      ? req.body.publicId.trim()
      : "";

    if (!isCloudinaryAsset(
      url,
      publicId,
      `guesthouses/${req.user.id}/videos`
    )) {
      return res.status(400).json({
        success: false,
        message: "A valid Cloudinary video URL and public ID are required.",
      });
    }

    const guesthouse = await prisma.guesthouse.findFirst({
      where: { ownerId: req.user.id },
      select: { id: true, videoPublicId: true },
    });

    if (!guesthouse) {
      return res.status(404).json({
        success: false,
        message: "Guesthouse not found.",
      });
    }

    if (guesthouse.videoPublicId && guesthouse.videoPublicId !== publicId) {
      const result = await cloudinary.uploader.destroy(
        guesthouse.videoPublicId,
        { resource_type: "video" }
      );

      if (!["ok", "not found"].includes(result.result)) {
        throw new Error("Cloudinary could not delete the existing video.");
      }
    }

    const updatedGuesthouse = await prisma.guesthouse.update({
      where: { id: guesthouse.id },
      data: { videoUrl: url, videoPublicId: publicId },
      select: { id: true, videoUrl: true, videoPublicId: true },
    });

    return successResponse(
      res,
      updatedGuesthouse,
      "Guesthouse video updated successfully."
    );
  } catch (error) {
    next(error);
  }
};

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