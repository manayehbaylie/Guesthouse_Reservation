import prisma from "../config/prisma.js";
import { createNotification } from "./notification.service.js";

// ============================================================
// HELPERS
// ============================================================

/**
 * Clean and normalize an image path.
 *
 * Prevents invalid values such as:
 * - null
 * - undefined
 * - [object Object]
 * - empty strings
 */
const cleanImagePath = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();

  if (
    !cleaned ||
    cleaned === "[object Object]" ||
    cleaned === "null" ||
    cleaned === "undefined"
  ) {
    return null;
  }

  return cleaned;
};

/**
 * Get the primary guesthouse image.
 *
 * Priority:
 * 1. guesthouse.image
 * 2. first valid photo from guesthouse.photos
 */
const getPrimaryGuesthouseImage = (guesthouse) => {
  if (!guesthouse) {
    return null;
  }

  // ==========================================================
  // MAIN IMAGE HAS PRIORITY
  // ==========================================================

  const mainImage = cleanImagePath(guesthouse.image);

  if (mainImage) {
    return mainImage;
  }

  // ==========================================================
  // FALLBACK TO PHOTOS
  // ==========================================================

  const photos = Array.isArray(guesthouse.photos)
    ? guesthouse.photos
        .map(cleanImagePath)
        .filter(Boolean)
    : [];

  return photos[0] || null;
};

// ============================================================
// CREATE GUESTHOUSE
// ============================================================

export const createGuesthouse = async (data, ownerId) => {
  const numericOwnerId = Number(ownerId);

  if (!Number.isInteger(numericOwnerId) || numericOwnerId <= 0) {
    throw new Error(`Invalid owner ID: ${ownerId}`);
  }

  const photos = Array.isArray(data.photos)
    ? data.photos
        .map(cleanImagePath)
        .filter(Boolean)
    : [];

  // ==========================================================
  // IMPORTANT:
  // data.image should already contain the uploaded image path
  // created by the controller/Multer.
  // ==========================================================

  const mainImage = cleanImagePath(data.image);

  // Main uploaded image has priority.
  // If there is no main image, use the first additional photo.
  const firstPhoto = mainImage || photos[0] || null;

  return await prisma.guesthouse.create({
    data: {
      name: data.name,
      address: data.address,

      // Sub-city
      subCity: data.subCity || null,

      city: data.city,

      description: data.description || null,

      // ======================================================
      // SAVE OWNER-UPLOADED MAIN IMAGE
      // ======================================================
      image: firstPhoto,

      // Additional guesthouse photos
      photos,

      ownerId: numericOwnerId,

      // New guesthouses require admin approval.
      status: "PENDING",
    },

    include: {
      owner: true,
      rooms: true,
    },
  });
};

// ============================================================
// GET ALL APPROVED GUESTHOUSES
// ============================================================

export const getAllGuesthouses = async () => {
  const guesthouses = await prisma.guesthouse.findMany({
    where: {
      status: "APPROVED",
    },

    orderBy: {
      createdAt: "desc",
    },

    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          residentialAddress: true,
          idType: true,
          idNumber: true,
          createdAt: true,
        },
      },

      rooms: true,
    },
  });

  return guesthouses.map((guesthouse) => ({
    ...guesthouse,

    // ========================================================
    // RETURN OWNER-UPLOADED IMAGE
    // ========================================================
    image: getPrimaryGuesthouseImage(guesthouse),

    photos: Array.isArray(guesthouse.photos)
      ? guesthouse.photos
      : [],
  }));
};

// ============================================================
// UPDATE GUESTHOUSE
// ============================================================

export const updateGuesthouse = async (id, data) => {
  const guesthouseId = Number(id);

  if (!Number.isInteger(guesthouseId) || guesthouseId <= 0) {
    throw new Error(`Invalid guesthouse ID: ${id}`);
  }

  const updateData = {};

  // ==========================================================
  // BASIC INFORMATION
  // ==========================================================

  if (data.name !== undefined) {
    updateData.name = data.name;
  }

  if (data.address !== undefined) {
    updateData.address = data.address;
  }

  if (data.subCity !== undefined) {
    updateData.subCity = data.subCity || null;
  }

  if (data.city !== undefined) {
    updateData.city = data.city;
  }

  if (data.description !== undefined) {
    updateData.description = data.description || null;
  }

  // ==========================================================
  // MAIN IMAGE UPDATE
  // ==========================================================

  if (Object.prototype.hasOwnProperty.call(data, "image")) {
    const image = cleanImagePath(data.image);

    if (image) {
      updateData.image = image;
    }

    // Do not overwrite the existing image with null/empty data.
  }

  // ==========================================================
  // ADDITIONAL PHOTOS UPDATE
  // ==========================================================

  if (data.photos !== undefined) {
    updateData.photos = Array.isArray(data.photos)
      ? data.photos
          .map(cleanImagePath)
          .filter(Boolean)
      : [];
  }

  // ==========================================================
  // STATUS
  // ==========================================================

  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  // ==========================================================
  // OWNER
  // ==========================================================

  if (data.ownerId !== undefined) {
    const numericOwnerId = Number(data.ownerId);

    if (!Number.isInteger(numericOwnerId) || numericOwnerId <= 0) {
      throw new Error(`Invalid owner ID: ${data.ownerId}`);
    }

    updateData.ownerId = numericOwnerId;
  }

  // ==========================================================
  // UPDATE DATABASE
  // ==========================================================

  const guesthouse = await prisma.guesthouse.update({
    where: {
      id: guesthouseId,
    },

    data: updateData,

    include: {
      owner: true,
      rooms: true,
    },
  });

  // ==========================================================
  // RETURN CLEAN IMAGE DATA
  // ==========================================================

  return {
    ...guesthouse,

    image: getPrimaryGuesthouseImage(guesthouse),

    photos: Array.isArray(guesthouse.photos)
      ? guesthouse.photos
      : [],
  };
};

// ============================================================
// GET GUESTHOUSE BY ID
// ============================================================

export const getGuesthouseById = async (id) => {
  const guesthouseId = Number(id);

  if (!Number.isInteger(guesthouseId) || guesthouseId <= 0) {
    throw new Error(`Invalid guesthouse ID: ${id}`);
  }

  const guesthouse = await prisma.guesthouse.findFirst({
    where: {
      id: guesthouseId,
      status: "APPROVED",
    },

    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      },

      rooms: true,
    },
  });

  if (!guesthouse) {
    return null;
  }

  return {
    ...guesthouse,

    image: getPrimaryGuesthouseImage(guesthouse),

    photos: Array.isArray(guesthouse.photos)
      ? guesthouse.photos
      : [],
  };
};

// ============================================================
// GET GUESTHOUSE BY OWNER ID
// ============================================================

export const getGuesthouseByOwnerId = async (ownerId) => {
  const numericOwnerId = Number(ownerId);

  if (
    !Number.isInteger(numericOwnerId) ||
    numericOwnerId <= 0
  ) {
    throw new Error(`Invalid owner ID: ${ownerId}`);
  }

  const guesthouses = await prisma.guesthouse.findMany({
    where: {
      ownerId: numericOwnerId,
    },

    include: {
      rooms: true,
    },

    orderBy: {
      id: "asc",
    },
  });

  return guesthouses.map((guesthouse) => ({
    ...guesthouse,

    // ========================================================
    // IMPORTANT FOR OWNER DASHBOARD
    // ========================================================
    image: getPrimaryGuesthouseImage(guesthouse),

    photos: Array.isArray(guesthouse.photos)
      ? guesthouse.photos
      : [],
  }));
};

// ============================================================
// DELETE GUESTHOUSE
// ============================================================

export const deleteGuesthouse = async (id) => {
  const guesthouseId = Number(id);

  if (!Number.isInteger(guesthouseId) || guesthouseId <= 0) {
    throw new Error(`Invalid guesthouse ID: ${id}`);
  }

  return await prisma.$transaction(async (tx) => {
    await tx.reservation.deleteMany({
      where: {
        room: {
          guesthouseId,
        },
      },
    });

    await tx.room.deleteMany({
      where: {
        guesthouseId,
      },
    });

    return tx.guesthouse.delete({
      where: {
        id: guesthouseId,
      },
    });
  });
};

// ============================================================
// GET PENDING GUESTHOUSES
// ============================================================

export const getPendingGuesthouses = async () => {
  const guesthouses = await prisma.guesthouse.findMany({
    where: {
      status: "PENDING",
    },

    orderBy: {
      createdAt: "desc",
    },

    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          residentialAddress: true,
          idNumber: true,
          idType: true,
          createdAt: true,
        },
      },

      rooms: true,
    },
  });

  return guesthouses.map((guesthouse) => ({
    ...guesthouse,

    // ========================================================
    // ADMIN SHOULD ALSO SEE THE OWNER IMAGE BEFORE APPROVAL
    // ========================================================
    image: getPrimaryGuesthouseImage(guesthouse),

    photos: Array.isArray(guesthouse.photos)
      ? guesthouse.photos
      : [],
  }));
};

// ============================================================
// GET ALL GUESTHOUSES FOR ADMIN
// ============================================================

export const getAllGuesthousesAdmin = async () => {
  const guesthouses = await prisma.guesthouse.findMany({
    orderBy: {
      createdAt: "desc",
    },

    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          residentialAddress: true,
          idNumber: true,
          idType: true,
          createdAt: true,
        },
      },

      rooms: true,
    },
  });

  return guesthouses.map((guesthouse) => ({
    ...guesthouse,

    // ========================================================
    // ADMIN GETS THE REAL SAVED IMAGE
    // ========================================================
    image: getPrimaryGuesthouseImage(guesthouse),

    photos: Array.isArray(guesthouse.photos)
      ? guesthouse.photos
      : [],
  }));
};

// ============================================================
// APPROVE GUESTHOUSE
// ============================================================

export const approveGuesthouse = async (id) => {
  const guesthouseId = Number(id);

  if (!Number.isInteger(guesthouseId) || guesthouseId <= 0) {
    throw new Error(`Invalid guesthouse ID: ${id}`);
  }

  const guesthouse = await prisma.guesthouse.findUnique({
    where: {
      id: guesthouseId,
    },
  });

  if (!guesthouse) {
    throw new Error("Guesthouse not found");
  }

  // ==========================================================
  // IMPORTANT:
  // DO NOT CREATE OR REPLACE THE IMAGE DURING APPROVAL.
  //
  // Keep the image that was uploaded during registration.
  // ==========================================================

  const primaryImage = getPrimaryGuesthouseImage(guesthouse);

  const updatedGuesthouse = await prisma.guesthouse.update({
    where: {
      id: guesthouseId,
    },

    data: {
      // Preserve owner's uploaded image.
      image: primaryImage,

      // Only change approval status.
      status: "APPROVED",

      // Clear any previous rejection reason.
      rejectionReason: null,
    },
  });

  // ==========================================================
  // NOTIFY OWNER
  // ==========================================================

  await createNotification({
    title: "Guesthouse Approved",

    message:
      "Congratulations! Your guesthouse has been approved by the administrator.",

    userId: guesthouse.ownerId,

    guesthouseId: guesthouse.id,

    category: "guesthouse",
  });

  return {
    ...updatedGuesthouse,

    image: getPrimaryGuesthouseImage(updatedGuesthouse),
  };
};

// ============================================================
// REJECT GUESTHOUSE
// ============================================================

export const rejectGuesthouse = async (
  id,
  reason = "Does not meet platform standards"
) => {
  const guesthouseId = Number(id);

  if (!Number.isInteger(guesthouseId) || guesthouseId <= 0) {
    throw new Error(`Invalid guesthouse ID: ${id}`);
  }

  const guesthouse = await prisma.guesthouse.findUnique({
    where: {
      id: guesthouseId,
    },
  });

  if (!guesthouse) {
    throw new Error("Guesthouse not found");
  }

  const rejectionReason =
    typeof reason === "string" && reason.trim()
      ? reason.trim()
      : "Does not meet platform standards";

  const updatedGuesthouse = await prisma.guesthouse.update({
    where: {
      id: guesthouseId,
    },

    data: {
      // ======================================================
      // IMPORTANT:
      // DO NOT REMOVE OR CHANGE THE IMAGE WHEN REJECTING.
      // ======================================================

      status: "REJECTED",

      rejectionReason,
    },
  });

  // ==========================================================
  // NOTIFY OWNER
  // ==========================================================

  await createNotification({
    title: "Guesthouse Rejected",

    message: `Your guesthouse has been rejected by the administrator. Reason: ${rejectionReason}`,

    userId: guesthouse.ownerId,

    guesthouseId: guesthouse.id,

    category: "guesthouse",
  });

  return {
    ...updatedGuesthouse,

    image: getPrimaryGuesthouseImage(updatedGuesthouse),
  };
};