
import prisma from "../config/prisma.js";
import { createNotification } from "./notification.service.js";

// ============================================================
// HELPERS
// ============================================================

const getPrimaryGuesthouseImage = (guesthouse) => {
  if (!guesthouse) {
    return null;
  }

  const photos = Array.isArray(guesthouse.photos)
    ? guesthouse.photos.filter(
        (photo) =>
          typeof photo === "string" &&
          photo.trim() &&
          photo !== "[object Object]"
      )
    : [];

  const image =
    typeof guesthouse.image === "string"
      ? guesthouse.image.trim()
      : "";

  return image && image !== "[object Object]"
    ? image
    : photos[0] || null;
};

// ============================================================
// CREATE GUESTHOUSE
// ============================================================

export const createGuesthouse = async (data, ownerId) => {
  const photos = Array.isArray(data.photos)
    ? data.photos.filter(
        (photo) =>
          typeof photo === "string" &&
          photo.trim() &&
          photo !== "[object Object]"
      )
    : [];

  const firstPhoto =
    photos[0] ||
    (typeof data.image === "string"
      ? data.image.trim()
      : null) ||
    null;

  return await prisma.guesthouse.create({
    data: {
      name: data.name,
      address: data.address,
      city: data.city,
      description: data.description,
      image: firstPhoto,
      photos,
      ownerId,
      status: "PENDING",
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
  return await prisma.guesthouse.update({
    where: {
      id: Number(id),
    },

    data,
  });
};

// ============================================================
// GET GUESTHOUSE BY ID
// ============================================================

export const getGuesthouseById = async (id) => {
  const guesthouse = await prisma.guesthouse.findFirst({
    where: {
      id: Number(id),
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
  const guesthouse = await prisma.guesthouse.findFirst({
    where: {
      ownerId: Number(ownerId),
    },

    include: {
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
// DELETE GUESTHOUSE
// ============================================================

export const deleteGuesthouse = async (id) => {
  return await prisma.guesthouse.delete({
    where: {
      id: Number(id),
    },
  });
};

// ============================================================
// GET PENDING GUESTHOUSES
// ============================================================

export const getPendingGuesthouses = async () => {
  return await prisma.guesthouse.findMany({
    where: {
      // GuesthouseStatus only contains PENDING,
      // APPROVED and REJECTED.
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
          createdAt: true,
        },
      },

      rooms: true,
    },
  });
};

// ============================================================
// GET ALL GUESTHOUSES FOR ADMIN
// ============================================================

export const getAllGuesthousesAdmin = async () => {
  return await prisma.guesthouse.findMany({
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
          createdAt: true,
        },
      },

      rooms: true,
    },
  });
};

// ============================================================
// APPROVE GUESTHOUSE
// ============================================================

export const approveGuesthouse = async (id) => {
  const guesthouse = await prisma.guesthouse.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!guesthouse) {
    throw new Error("Guesthouse not found");
  }

  const primaryImage =
    getPrimaryGuesthouseImage(guesthouse) ||
    guesthouse.image ||
    null;

  const updatedGuesthouse =
    await prisma.guesthouse.update({
      where: {
        id: Number(id),
      },

      data: {
        image: primaryImage,
        status: "APPROVED",
        rejectionReason: null,
      },
    });

  // Notify the owner after approval.
  await createNotification({
    title: "Guesthouse Approved",

    message:
      "Congratulations! Your guesthouse has been approved by the administrator.",

    userId: guesthouse.ownerId,

    guesthouseId: guesthouse.id,

    category: "guesthouse",
  });

  return updatedGuesthouse;
};

// ============================================================
// REJECT GUESTHOUSE
// ============================================================

export const rejectGuesthouse = async (
  id,
  reason = "Does not meet platform standards"
) => {
  const guesthouse = await prisma.guesthouse.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!guesthouse) {
    throw new Error("Guesthouse not found");
  }

  const updatedGuesthouse =
    await prisma.guesthouse.update({
      where: {
        id: Number(id),
      },

      data: {
        status: "REJECTED",
        rejectionReason: reason,
      },
    });

  // Notify the owner after rejection.
  await createNotification({
    title: "Guesthouse Rejected",

    message: `Your guesthouse has been rejected by the administrator. Reason: ${reason}`,

    userId: guesthouse.ownerId,

    guesthouseId: guesthouse.id,

    category: "guesthouse",
  });

  return updatedGuesthouse;
};

