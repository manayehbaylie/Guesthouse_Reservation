
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

      // Sub-city
      subCity: data.subCity || null,

      city: data.city,
      description: data.description || null,

      image: firstPhoto,
      photos,

      ownerId: Number(ownerId),

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
    updateData.description = data.description;
  }

  if (data.image !== undefined) {
    updateData.image = data.image;
  }

  if (data.photos !== undefined) {
    updateData.photos = Array.isArray(data.photos)
      ? data.photos.filter(
          (photo) =>
            typeof photo === "string" &&
            photo.trim() &&
            photo !== "[object Object]"
        )
      : [];
  }

  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  if (data.ownerId !== undefined) {
    updateData.ownerId = Number(data.ownerId);
  }

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

  return await prisma.guesthouse.delete({
    where: {
      id: guesthouseId,
    },
  });
};

// ============================================================
// GET PENDING GUESTHOUSES
// ============================================================

export const getPendingGuesthouses = async () => {
  return await prisma.guesthouse.findMany({
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
          idType: true,
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

  const primaryImage =
    getPrimaryGuesthouseImage(guesthouse) ||
    guesthouse.image ||
    null;

  const updatedGuesthouse =
    await prisma.guesthouse.update({
      where: {
        id: guesthouseId,
      },

      data: {
        image: primaryImage,
        status: "APPROVED",
        rejectionReason: null,
      },
    });

  // Notify owner after approval
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

  const updatedGuesthouse =
    await prisma.guesthouse.update({
      where: {
        id: guesthouseId,
      },

      data: {
        status: "REJECTED",
        rejectionReason: reason,
      },
    });

  // Notify owner after rejection
  await createNotification({
    title: "Guesthouse Rejected",

    message: `Your guesthouse has been rejected by the administrator. Reason: ${reason}`,

    userId: guesthouse.ownerId,

    guesthouseId: guesthouse.id,

    category: "guesthouse",
  });

  return updatedGuesthouse;
};

