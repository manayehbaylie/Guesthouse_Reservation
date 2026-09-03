import bcrypt from "bcrypt";
import prisma from "../config/prisma.js";
import { createNotification } from "./notification.service.js";

/*
==================================================
HELPERS
==================================================
*/

/**
 * Clean an image path.
 * Only strings are accepted because multer/controller
 * converts uploaded files into stored file paths.
 */
const cleanImagePath = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();

  return cleaned || null;
};

/**
 * Normalize photo paths.
 */
const normalizePhotos = (photos) => {
  if (!Array.isArray(photos)) {
    return [];
  }

  return photos
    .filter(
      (photo) =>
        typeof photo === "string" &&
        photo.trim()
    )
    .map((photo) => photo.trim());
};

/**
 * Get the primary guesthouse image.
 *
 * IMPORTANT:
 * The dedicated `image` field always has priority.
 * Additional photos are only used as fallback.
 */
const getPrimaryImage = (guesthouse, data = {}) => {
  const newImage = cleanImagePath(data.image);

  if (newImage) {
    return newImage;
  }

  const existingImage = cleanImagePath(guesthouse?.image);

  if (existingImage) {
    return existingImage;
  }

  const photos = normalizePhotos(
    data.photos !== undefined
      ? data.photos
      : guesthouse?.photos
  );

  return photos[0] || null;
};

/*
==================================================
1. GET OWNER GUESTHOUSE
==================================================

Returns null (not throws) when the owner has no
guesthouse yet, so the dashboard can show
"register your guesthouse" instead of an error.
==================================================
*/

export const getMyGuesthouse = async (ownerId) => {
  return await prisma.guesthouse.findFirst({
    where: {
      ownerId,
    },
    include: {
      rooms: true,
    },
  });
};

/*
==================================================
1.5. REGISTER GUESTHOUSE
==================================================

Creates a new guesthouse for the logged-in owner
with PENDING status.

The uploaded main image is stored in the `image`
database field.

Admin must approve before it goes live.
==================================================
*/

export const registerGuesthouse = async (ownerId, data) => {
  // Check if owner already has a guesthouse
  const existing = await prisma.guesthouse.findFirst({
    where: {
      ownerId,
    },
  });

  if (existing) {
    throw new Error(
      "You already have a guesthouse registered. You can edit it from your dashboard."
    );
  }

  // Required fields
  if (!data.name?.trim()) {
    throw new Error("Guesthouse name is required");
  }

  if (!data.address?.trim()) {
    throw new Error("Guesthouse address is required");
  }

  if (!data.city?.trim()) {
    throw new Error("City is required");
  }

  /*
  --------------------------------------------------
  IMAGE HANDLING
  --------------------------------------------------

  data.image comes from owner.controller.js.

  Example:
  /uploads/guesthouses/guesthouse-123.jpg
  --------------------------------------------------
  */

  const mainImage = cleanImagePath(data.image);

  /*
  --------------------------------------------------
  ADDITIONAL PHOTOS
  --------------------------------------------------
  */

  const normalizedPhotos = normalizePhotos(data.photos);

  /*
  --------------------------------------------------
  IMPORTANT:
  Main image comes from `data.image`.

  We DO NOT replace it with photos[0].
  --------------------------------------------------
  */

  const primaryImage =
    mainImage ||
    normalizedPhotos[0] ||
    null;

  /*
  --------------------------------------------------
  CREATE GUESTHOUSE
  --------------------------------------------------
  */

  const guesthouse = await prisma.guesthouse.create({
    data: {
      name: String(data.name).trim(),

      address: String(data.address).trim(),

      city: String(data.city).trim(),

      subCity: data.subCity
        ? String(data.subCity).trim()
        : null,

      woreda: data.woreda
        ? String(data.woreda).trim()
        : null,

      phone: data.phone
        ? String(data.phone).trim()
        : null,

      email: data.email
        ? String(data.email).trim()
        : null,

      numberOfRooms:
        data.numberOfRooms
          ? Number(data.numberOfRooms)
          : null,

      description:
        data.description
          ? String(data.description).trim()
          : "",

      /*
      IMPORTANT:
      Save uploaded main image here.
      */
      image: primaryImage,

      /*
      Additional gallery photos.
      */
      photos: normalizedPhotos,

      licenseNumber:
        data.licenseNumber
          ? String(data.licenseNumber).trim()
          : null,

      licenseDocument:
        typeof data.licenseDocument === "string"
          ? data.licenseDocument
          : null,

      /*
      New guesthouse always starts as PENDING.
      */
      status: "PENDING",

      ownerId,
    },
  });

  /*
  --------------------------------------------------
  NOTIFICATION
  --------------------------------------------------
  */

  try {
    await createNotification({
      title: "Guesthouse Registered",
      message: `Your property "${guesthouse.name}" has been submitted and is pending administrator approval.`,
      userId: ownerId,
      category: "guesthouse",
    });
  } catch (error) {
    console.error(
      "Failed to notify owner of guesthouse registration:",
      error
    );
  }

  return guesthouse;
};

/*
==================================================
1.6. RESUBMIT REJECTED GUESTHOUSE
==================================================

Owner edits a REJECTED guesthouse and resubmits
it for admin review.

Status is reset to PENDING.
==================================================
*/

export const resubmitGuesthouse = async (ownerId, data) => {
  const guesthouse = await prisma.guesthouse.findFirst({
    where: {
      ownerId,
    },
  });

  if (!guesthouse) {
    throw new Error("Guesthouse not found");
  }

  /*
  --------------------------------------------------
  ALREADY PENDING
  --------------------------------------------------
  */

  if (guesthouse.status === "PENDING") {
    throw new Error(
      "Your guesthouse is already pending review. Please wait for the administrator's decision."
    );
  }

  /*
  --------------------------------------------------
  APPROVED
  --------------------------------------------------

  If an approved guesthouse is edited through this
  function, update it normally without resetting
  the status.
  --------------------------------------------------
  */

  if (guesthouse.status === "APPROVED") {
    const hasNewImage =
      typeof data.image === "string" &&
      data.image.trim();

    const hasNewPhotos =
      Array.isArray(data.photos);

    const normalizedPhotos = hasNewPhotos
      ? normalizePhotos(data.photos)
      : normalizePhotos(guesthouse.photos);

    /*
    New uploaded main image has priority.
    Existing image is preserved when no new image
    is uploaded.
    */
    const primaryImage =
      hasNewImage
        ? cleanImagePath(data.image)
        : cleanImagePath(guesthouse.image) ||
          normalizedPhotos[0] ||
          null;

    return await prisma.guesthouse.update({
      where: {
        id: guesthouse.id,
      },

      data: {
        ...(data.name !== undefined && {
          name: String(data.name).trim(),
        }),

        ...(data.address !== undefined && {
          address: String(data.address).trim(),
        }),

        ...(data.city !== undefined && {
          city: String(data.city).trim(),
        }),

        ...(data.description !== undefined && {
          description: String(data.description).trim(),
        }),

        ...(data.subCity !== undefined && {
          subCity: String(data.subCity).trim(),
        }),

        ...(data.woreda !== undefined && {
          woreda: String(data.woreda).trim(),
        }),

        ...(data.phone !== undefined && {
          phone: String(data.phone).trim(),
        }),

        ...(data.email !== undefined && {
          email: String(data.email).trim(),
        }),

        ...(data.numberOfRooms !== undefined && {
          numberOfRooms: Number(data.numberOfRooms),
        }),

        ...(data.licenseNumber !== undefined && {
          licenseNumber: String(data.licenseNumber).trim(),
        }),

        ...(typeof data.licenseDocument === "string" && {
          licenseDocument: data.licenseDocument,
        }),

        ...(hasNewPhotos && {
          photos: normalizedPhotos,
        }),

        /*
        Only update image when:
        - a new image was uploaded, OR
        - there is no existing image and a photo exists.
        */
        ...(
          hasNewImage ||
          (!guesthouse.image && normalizedPhotos[0])
            ? {
                image: primaryImage,
              }
            : {}
        ),
      },
    });
  }

  /*
  --------------------------------------------------
  REJECTED → PENDING
  --------------------------------------------------
  */

  const hasNewImage =
    typeof data.image === "string" &&
    data.image.trim();

  const hasNewPhotos =
    Array.isArray(data.photos);

  const normalizedPhotos = hasNewPhotos
    ? normalizePhotos(data.photos)
    : normalizePhotos(guesthouse.photos);

  /*
  New image wins.
  If no new image is uploaded, preserve old image.
  */
  const primaryImage =
    hasNewImage
      ? cleanImagePath(data.image)
      : cleanImagePath(guesthouse.image) ||
        normalizedPhotos[0] ||
        null;

  const updated = await prisma.guesthouse.update({
    where: {
      id: guesthouse.id,
    },

    data: {
      ...(data.name !== undefined && {
        name: String(data.name).trim(),
      }),

      ...(data.address !== undefined && {
        address: String(data.address).trim(),
      }),

      ...(data.city !== undefined && {
        city: String(data.city).trim(),
      }),

      ...(data.description !== undefined && {
        description: String(data.description).trim(),
      }),

      ...(data.subCity !== undefined && {
        subCity: String(data.subCity).trim(),
      }),

      ...(data.woreda !== undefined && {
        woreda: String(data.woreda).trim(),
      }),

      ...(data.phone !== undefined && {
        phone: String(data.phone).trim(),
      }),

      ...(data.email !== undefined && {
        email: String(data.email).trim(),
      }),

      ...(data.numberOfRooms !== undefined && {
        numberOfRooms: Number(data.numberOfRooms),
      }),

      ...(data.licenseNumber !== undefined && {
        licenseNumber: String(data.licenseNumber).trim(),
      }),

      ...(typeof data.licenseDocument === "string" && {
        licenseDocument: data.licenseDocument,
      }),

      ...(hasNewPhotos && {
        photos: normalizedPhotos,
      }),

      /*
      IMPORTANT:
      Preserve or replace the main image.
      */
      image: primaryImage,

      /*
      Rejected guesthouse becomes pending again.
      */
      status: "PENDING",

      rejectionReason: null,
    },
  });

  /*
  --------------------------------------------------
  NOTIFICATION
  --------------------------------------------------
  */

  try {
    await createNotification({
      title: "Guesthouse Resubmitted",
      message: `Your property "${updated.name}" has been resubmitted for review.`,
      userId: ownerId,
      category: "guesthouse",
    });
  } catch (error) {
    console.error(
      "Failed to notify owner of resubmission:",
      error
    );
  }

  return updated;
};

/*
==================================================
2. UPDATE OWNER GUESTHOUSE
==================================================
*/

export const updateMyGuesthouse = async (
  ownerId,
  data
) => {
  const guesthouse =
    await prisma.guesthouse.findFirst({
      where: {
        ownerId,
      },
    });

  if (!guesthouse) {
    throw new Error("Guesthouse not found");
  }

  /*
  --------------------------------------------------
  PHOTOS
  --------------------------------------------------
  */

  const hasNewPhotos =
    Array.isArray(data.photos);

  const normalizedPhotos = hasNewPhotos
    ? normalizePhotos(data.photos)
    : normalizePhotos(guesthouse.photos);

  /*
  --------------------------------------------------
  MAIN IMAGE
  --------------------------------------------------

  If a new image was uploaded:
      use new image.

  If no new image:
      keep existing image.

  Never replace the main image accidentally with
  an unrelated old/default value.
  --------------------------------------------------
  */

  const hasNewImage =
    typeof data.image === "string" &&
    data.image.trim();

  const primaryImage =
    hasNewImage
      ? cleanImagePath(data.image)
      : cleanImagePath(guesthouse.image) ||
        normalizedPhotos[0] ||
        null;

  /*
  --------------------------------------------------
  UPDATE DATABASE
  --------------------------------------------------
  */

  return await prisma.guesthouse.update({
    where: {
      id: guesthouse.id,
    },

    data: {
      ...(data.name !== undefined && {
        name: data.name,
      }),

      ...(data.description !== undefined && {
        description: data.description,
      }),

      ...(
        data.address !== undefined ||
        data.location !== undefined
      ) && {
        address:
          data.address || data.location,
      },

      ...(data.city !== undefined && {
        city: data.city,
      }),

      ...(data.subCity !== undefined && {
        subCity: data.subCity,
      }),

      ...(data.woreda !== undefined && {
        woreda: data.woreda,
      }),

      ...(data.phone !== undefined && {
        phone: data.phone,
      }),

      ...(data.email !== undefined && {
        email: data.email,
      }),

      ...(data.numberOfRooms !== undefined && {
        numberOfRooms:
          Number(data.numberOfRooms),
      }),

      ...(data.licenseNumber !== undefined && {
        licenseNumber: data.licenseNumber,
      }),

      ...(data.licenseDocument !== undefined && {
        licenseDocument:
          data.licenseDocument,
      }),

      ...(hasNewPhotos && {
        photos: normalizedPhotos,
      }),

      /*
      IMPORTANT:
      Save the main image.
      */
      ...(hasNewImage && {
        image: primaryImage,
      }),

      /*
      If there is no image in the database at all,
      allow the first gallery photo to become the
      fallback image.
      */
      ...(
        !hasNewImage &&
        !guesthouse.image &&
        normalizedPhotos[0]
          ? {
              image: normalizedPhotos[0],
            }
          : {}
      ),
    },
  });
};

/*
==================================================
3. SUBMIT GUESTHOUSE FOR REVIEW
==================================================

This function is important because it can create
the guesthouse when it does not exist yet.

The uploaded main image MUST be saved here too.
==================================================
*/

export const submitGuesthouseForReview = async (
  ownerId,
  data = {}
) => {
  let guesthouse =
    await prisma.guesthouse.findFirst({
      where: {
        ownerId,
      },
    });

  /*
  --------------------------------------------------
  CREATE IF NOT EXISTS
  --------------------------------------------------
  */

  if (!guesthouse) {
    const submittedImage =
      cleanImagePath(data.image);

    const submittedPhotos =
      normalizePhotos(data.photos);

    const primaryImage =
      submittedImage ||
      submittedPhotos[0] ||
      null;

    guesthouse =
      await prisma.guesthouse.create({
        data: {
          name: String(
            data.name || ""
          ).trim(),

          address: String(
            data.address || ""
          ).trim(),

          city: String(
            data.city || ""
          ).trim(),

          subCity: data.subCity
            ? String(data.subCity).trim()
            : null,

          woreda: data.woreda
            ? String(data.woreda).trim()
            : null,

          phone: data.phone
            ? String(data.phone).trim()
            : null,

          email: data.email
            ? String(data.email).trim()
            : null,

          numberOfRooms:
            data.numberOfRooms
              ? Number(data.numberOfRooms)
              : null,

          description: String(
            data.description || ""
          ).trim(),

          licenseNumber:
            data.licenseNumber
              ? String(
                  data.licenseNumber
                ).trim()
              : null,

          licenseDocument:
            typeof data.licenseDocument ===
            "string"
              ? data.licenseDocument
              : null,

          /*
          IMPORTANT:
          Save uploaded main image.
          */
          image: primaryImage,

          /*
          Save additional photos.
          */
          photos: submittedPhotos,

          status: "PENDING",

          ownerId,
        },
      });
  }

  if (!guesthouse) {
    throw new Error("Guesthouse not found");
  }

  /*
  --------------------------------------------------
  MERGE EXISTING + NEW DATA
  --------------------------------------------------
  */

  const merged = {
    ...guesthouse,
    ...data,

    licenseDocument:
      data.licenseDocument ||
      guesthouse.licenseDocument,

    /*
    If new photos are supplied, use them.
    Otherwise keep existing photos.
    */
    photos: Array.isArray(data.photos)
      ? data.photos
      : guesthouse.photos,

    /*
    IMPORTANT:
    If new image exists, use it.
    Otherwise preserve existing database image.
    */
    image:
      cleanImagePath(data.image) ||
      cleanImagePath(guesthouse.image),
  };

  /*
  --------------------------------------------------
  VALIDATION
  --------------------------------------------------
  */

  if (
    !String(merged.name || "").trim()
  ) {
    throw new Error(
      "Guesthouse name is required"
    );
  }

  if (
    !String(merged.address || "").trim()
  ) {
    throw new Error(
      "Guesthouse address is required"
    );
  }

  if (
    !String(merged.city || "").trim()
  ) {
    throw new Error("City is required");
  }

  if (
    !String(
      merged.description || ""
    ).trim()
  ) {
    throw new Error(
      "Guesthouse description is required"
    );
  }

  if (
    !merged.numberOfRooms ||
    Number(merged.numberOfRooms) < 1
  ) {
    throw new Error(
      "Number of rooms must be at least 1"
    );
  }

  if (
    !String(
      merged.licenseNumber || ""
    ).trim()
  ) {
    throw new Error(
      "Business/license number is required"
    );
  }

  if (
    typeof merged.licenseDocument !==
      "string" ||
    !merged.licenseDocument.trim()
  ) {
    throw new Error(
      "License document is required"
    );
  }

  /*
  --------------------------------------------------
  IMAGE FOR SUBMISSION
  --------------------------------------------------
  */

  const mergedPhotos =
    normalizePhotos(merged.photos);

  const finalImage =
    cleanImagePath(merged.image) ||
    mergedPhotos[0] ||
    null;

  /*
  --------------------------------------------------
  UPDATE + SUBMIT
  --------------------------------------------------
  */

  const updated =
    await prisma.guesthouse.update({
      where: {
        id: guesthouse.id,
      },

      data: {
        name: String(
          merged.name
        ).trim(),

        address: String(
          merged.address
        ).trim(),

        city: String(
          merged.city
        ).trim(),

        subCity: merged.subCity
          ? String(
              merged.subCity
            ).trim()
          : null,

        woreda: merged.woreda
          ? String(
              merged.woreda
            ).trim()
          : null,

        phone: merged.phone
          ? String(
              merged.phone
            ).trim()
          : null,

        email: merged.email
          ? String(
              merged.email
            ).trim()
          : null,

        numberOfRooms:
          Number(
            merged.numberOfRooms
          ),

        description: String(
          merged.description
        ).trim(),

        licenseNumber: String(
          merged.licenseNumber
        ).trim(),

        licenseDocument:
          merged.licenseDocument,

        /*
        IMPORTANT:
        Keep uploaded main image.
        */
        image: finalImage,

        /*
        Keep gallery photos.
        */
        photos: mergedPhotos,

        /*
        Submit for admin approval.
        */
        status: "PENDING",

        rejectionReason: null,
      },
    });

  /*
  --------------------------------------------------
  NOTIFICATION
  --------------------------------------------------
  */

  await createNotification({
    title: "Guesthouse Submitted",
    message: `Your property "${updated.name}" is pending administrator review.`,
    userId: ownerId,
    category: "guesthouse",
  });

  return updated;
};

/*
==================================================
4. CREATE RECEPTIONIST
==================================================
*/

export const createReceptionist = async (
  ownerId,
  data
) => {
  const guesthouse =
    await prisma.guesthouse.findFirst({
      where: {
        ownerId,
      },
    });

  if (!guesthouse) {
    throw new Error(
      "Guesthouse not found"
    );
  }

  // Clean phone number
  const cleanPhone = data.phone
    .replace(/\s/g, "")
    .replace(/-/g, "");

  const existingUser =
    await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

  if (existingUser) {
    throw new Error(
      "Email already exists"
    );
  }

  const existingPhone =
    await prisma.user.findUnique({
      where: {
        phone: cleanPhone,
      },
    });

  if (existingPhone) {
    throw new Error(
      "Phone already exists"
    );
  }

  // Use default password if not provided
  const password =
    data.password ||
    "Password123";

  const hashedPassword =
    await bcrypt.hash(
      password,
      10
    );

  const receptionist =
    await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        password: hashedPassword,
        phone: cleanPhone,
        role: "RECEPTIONIST",
      },
    });

  // Assign receptionist to guesthouse
  await prisma.staffAssignment.create({
    data: {
      guesthouseId:
        guesthouse.id,
      staffId:
        receptionist.id,
    },
  });

  try {
    await createNotification({
      title: "Staff Assignment",
      message: `You have been assigned as a Receptionist for "${guesthouse.name}". You can now manage front desk operations.`,
      userId:
        receptionist.id,
      category: "guesthouse",
    });
  } catch (error) {
    console.error(
      "Failed to notify receptionist of assignment:",
      error
    );
  }

  return receptionist;
};

/*
==================================================
5. GET RECEPTIONISTS
==================================================
*/

export const getReceptionists = async (
  ownerId
) => {
  const guesthouse =
    await prisma.guesthouse.findFirst({
      where: {
        ownerId,
      },
    });

  if (!guesthouse) {
    return [];
  }

  const assignments =
    await prisma.staffAssignment.findMany({
      where: {
        guesthouseId:
          guesthouse.id,
      },

      include: {
        staff: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

  return assignments.map(
    (assignment) =>
      assignment.staff
  );
};

/*
==================================================
6. ASSIGN EXISTING RECEPTIONIST
==================================================
*/

export const assignReceptionistToGuesthouse =
  async (
    ownerId,
    staffId
  ) => {
    const guesthouse =
      await prisma.guesthouse.findFirst({
        where: {
          ownerId,
        },
      });

    if (!guesthouse) {
      throw new Error(
        "Guesthouse not found"
      );
    }

    const staff =
      await prisma.user.findUnique({
        where: {
          id: staffId,
        },
      });

    if (!staff) {
      throw new Error(
        "Staff not found"
      );
    }

    if (
      staff.role !==
      "RECEPTIONIST"
    ) {
      throw new Error(
        "User is not a receptionist"
      );
    }

    // Check if already assigned
    const existingAssignment =
      await prisma.staffAssignment.findUnique(
        {
          where: {
            guesthouseId_staffId: {
              guesthouseId:
                guesthouse.id,
              staffId:
                staffId,
            },
          },
        }
      );

    if (existingAssignment) {
      throw new Error(
        "Receptionist already assigned to this guesthouse"
      );
    }

    const assignment =
      await prisma.staffAssignment.create(
        {
          data: {
            guesthouseId:
              guesthouse.id,
            staffId:
              staffId,
          },
        }
      );

    try {
      await createNotification({
        title: "Staff Assignment",
        message: `You have been assigned as a Receptionist for "${guesthouse.name}".`,
        userId: staffId,
        category: "guesthouse",
      });
    } catch (error) {
      console.error(
        "Failed to notify receptionist of assignment:",
        error
      );
    }

    return assignment;
  };

/*
==================================================
7. REMOVE RECEPTIONIST
==================================================
*/

export const removeReceptionistFromGuesthouse =
  async (
    ownerId,
    staffId
  ) => {
    const guesthouse =
      await prisma.guesthouse.findFirst({
        where: {
          ownerId,
        },
      });

    if (!guesthouse) {
      throw new Error(
        "Guesthouse not found"
      );
    }

    const assignment =
      await prisma.staffAssignment.findUnique(
        {
          where: {
            guesthouseId_staffId: {
              guesthouseId:
                guesthouse.id,
              staffId:
                Number(staffId),
            },
          },
        }
      );

    if (!assignment) {
      throw new Error(
        "Receptionist is not assigned to this guesthouse"
      );
    }

    return await prisma.staffAssignment.delete(
      {
        where: {
          guesthouseId_staffId: {
            guesthouseId:
              guesthouse.id,
            staffId:
              Number(staffId),
          },
        },
      }
    );
  };