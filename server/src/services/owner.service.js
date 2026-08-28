import bcrypt from "bcrypt";
import prisma from "../config/prisma.js";
import { createNotification } from "./notification.service.js";

/*
==================================================
1. GET OWNER GUESTHOUSE
==================================================
Returns null (not throws) when the owner has no guesthouse yet,
so the dashboard can show "register your guesthouse" instead of
an error.
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
1.5. REGISTER GUESTHOUSE (from Owner Dashboard)
==================================================
Creates a new guesthouse for the logged-in owner with
status PENDING. Admin must approve before it goes live.
==================================================
*/
export const registerGuesthouse = async (ownerId, data) => {
  // Check if owner already has a guesthouse
  const existing = await prisma.guesthouse.findFirst({
    where: { ownerId },
  });

  if (existing) {
    throw new Error(
      "You already have a guesthouse registered. You can edit it from your dashboard."
    );
  }

  if (!data.name?.trim()) {
    throw new Error("Guesthouse name is required");
  }
  if (!data.address?.trim()) {
    throw new Error("Guesthouse address is required");
  }
  if (!data.city?.trim()) {
    throw new Error("City is required");
  }

  const guesthouse = await prisma.guesthouse.create({
    data: {
      name: String(data.name).trim(),
      address: String(data.address).trim(),
      city: String(data.city).trim(),
      subCity: data.subCity ? String(data.subCity).trim() : null,
      woreda: data.woreda ? String(data.woreda).trim() : null,
      phone: data.phone ? String(data.phone).trim() : null,
      email: data.email ? String(data.email).trim() : null,
      numberOfRooms: data.numberOfRooms ? Number(data.numberOfRooms) : null,
      description: data.description ? String(data.description).trim() : "",
      image: data.image ? String(data.image).trim() : null,
      photos: Array.isArray(data.photos) ? data.photos : [],
      licenseNumber: data.licenseNumber ? String(data.licenseNumber).trim() : null,
      licenseDocument: typeof data.licenseDocument === "string"
        ? data.licenseDocument
        : null,
      status: "DRAFT",
      ownerId,
    },
  });

  return guesthouse;
};

/*
==================================================
1.6. RESUBMIT REJECTED GUESTHOUSE
==================================================
Owner edits a REJECTED guesthouse and resubmits it
for admin review. Status is reset to PENDING.
==================================================
*/
export const resubmitGuesthouse = async (ownerId, data) => {
  const guesthouse = await prisma.guesthouse.findFirst({
    where: { ownerId },
  });

  if (!guesthouse) {
    throw new Error("Guesthouse not found");
  }

  if (guesthouse.status === "PENDING") {
    throw new Error(
      "Your guesthouse is already pending review. Please wait for the administrator's decision."
    );
  }

  if (guesthouse.status === "APPROVED") {
    // APPROVED → just do a normal update, no re-review needed
    return await prisma.guesthouse.update({
      where: { id: guesthouse.id },
      data: {
        ...(data.name !== undefined && { name: String(data.name).trim() }),
        ...(data.address !== undefined && { address: String(data.address).trim() }),
        ...(data.city !== undefined && { city: String(data.city).trim() }),
        ...(data.description !== undefined && { description: String(data.description).trim() }),
        ...(data.subCity !== undefined && { subCity: String(data.subCity).trim() }),
        ...(data.woreda !== undefined && { woreda: String(data.woreda).trim() }),
        ...(data.phone !== undefined && { phone: String(data.phone).trim() }),
        ...(data.email !== undefined && { email: String(data.email).trim() }),
        ...(data.numberOfRooms !== undefined && { numberOfRooms: Number(data.numberOfRooms) }),
        ...(data.licenseNumber !== undefined && { licenseNumber: String(data.licenseNumber).trim() }),
        ...(typeof data.licenseDocument === "string" && { licenseDocument: data.licenseDocument }),
        ...(Array.isArray(data.photos) && { photos: data.photos }),
        ...(data.image !== undefined && { image: data.image }),
      },
    });
  }

  // REJECTED → update fields and reset to PENDING
  const updated = await prisma.guesthouse.update({
    where: { id: guesthouse.id },
    data: {
      ...(data.name !== undefined && { name: String(data.name).trim() }),
      ...(data.address !== undefined && { address: String(data.address).trim() }),
      ...(data.city !== undefined && { city: String(data.city).trim() }),
      ...(data.description !== undefined && { description: String(data.description).trim() }),
      ...(data.subCity !== undefined && { subCity: String(data.subCity).trim() }),
      ...(data.woreda !== undefined && { woreda: String(data.woreda).trim() }),
      ...(data.phone !== undefined && { phone: String(data.phone).trim() }),
      ...(data.email !== undefined && { email: String(data.email).trim() }),
      ...(data.numberOfRooms !== undefined && { numberOfRooms: Number(data.numberOfRooms) }),
      ...(data.licenseNumber !== undefined && { licenseNumber: String(data.licenseNumber).trim() }),
      ...(typeof data.licenseDocument === "string" && { licenseDocument: data.licenseDocument }),
      ...(Array.isArray(data.photos) && { photos: data.photos }),
      ...(data.image !== undefined && { image: data.image }),
      status: "PENDING",
      rejectionReason: null,
    },
  });

  try {
    await createNotification({
      title: "Guesthouse Resubmitted",
      message: `Your property "${updated.name}" has been resubmitted for review.`,
      userId: ownerId,
    });
  } catch (error) {
    console.error("Failed to notify owner of resubmission:", error);
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

  return await prisma.guesthouse.update({
    where: {
      id: guesthouse.id,
    },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...((data.address !== undefined || data.location !== undefined) && {
        address: data.address || data.location,
      }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.subCity !== undefined && { subCity: data.subCity }),
      ...(data.woreda !== undefined && { woreda: data.woreda }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.numberOfRooms !== undefined && { numberOfRooms: Number(data.numberOfRooms) }),
      ...(data.licenseNumber !== undefined && { licenseNumber: data.licenseNumber }),
      ...(data.licenseDocument !== undefined && { licenseDocument: data.licenseDocument }),
      ...(Array.isArray(data.photos) && { photos: data.photos }),
      ...(data.image !== undefined && { image: data.image }),
      ...(data.images?.[0] && { image: data.images[0] }),
    },
  });
};

export const submitGuesthouseForReview = async (ownerId, data = {}) => {
  let guesthouse = await prisma.guesthouse.findFirst({ where: { ownerId } });

  if (!guesthouse) {
    guesthouse = await prisma.guesthouse.create({
      data: {
        name: String(data.name || "").trim(),
        address: String(data.address || "").trim(),
        city: String(data.city || "").trim(),
        subCity: data.subCity ? String(data.subCity).trim() : null,
        woreda: data.woreda ? String(data.woreda).trim() : null,
        phone: data.phone ? String(data.phone).trim() : null,
        email: data.email ? String(data.email).trim() : null,
        numberOfRooms: data.numberOfRooms ? Number(data.numberOfRooms) : null,
        description: String(data.description || "").trim(),
        licenseNumber: data.licenseNumber ? String(data.licenseNumber).trim() : null,
        licenseDocument: typeof data.licenseDocument === "string"
          ? data.licenseDocument
          : null,
        photos: Array.isArray(data.photos) ? data.photos : [],
        status: "DRAFT",
        ownerId,
      },
    });
  }

  if (!guesthouse) {
    throw new Error("Guesthouse not found");
  }

  const merged = {
    ...guesthouse,
    ...data,
    licenseDocument: data.licenseDocument || guesthouse.licenseDocument,
    photos: Array.isArray(data.photos) ? data.photos : guesthouse.photos,
  };
  if (!String(merged.name || "").trim()) throw new Error("Guesthouse name is required");
  if (!String(merged.address || "").trim()) throw new Error("Guesthouse address is required");
  if (!String(merged.city || "").trim()) throw new Error("City is required");
  if (!String(merged.description || "").trim()) throw new Error("Guesthouse description is required");
  if (!merged.numberOfRooms || Number(merged.numberOfRooms) < 1) throw new Error("Number of rooms must be at least 1");
  if (!String(merged.licenseNumber || "").trim()) throw new Error("Business/license number is required");
  if (typeof merged.licenseDocument !== "string" || !merged.licenseDocument.trim()) {
    throw new Error("License document is required");
  }

  const updated = await prisma.guesthouse.update({
    where: { id: guesthouse.id },
    data: {
      name: String(merged.name).trim(),
      address: String(merged.address).trim(),
      city: String(merged.city).trim(),
      subCity: merged.subCity ? String(merged.subCity).trim() : null,
      woreda: merged.woreda ? String(merged.woreda).trim() : null,
      phone: merged.phone ? String(merged.phone).trim() : null,
      email: merged.email ? String(merged.email).trim() : null,
      numberOfRooms: Number(merged.numberOfRooms),
      description: String(merged.description).trim(),
      licenseNumber: String(merged.licenseNumber).trim(),
      licenseDocument: merged.licenseDocument,
      ...(Array.isArray(merged.photos) && { photos: merged.photos }),
      status: "PENDING",
      rejectionReason: null,
    },
  });

  await createNotification({
    title: "Guesthouse Submitted",
    message: `Your property "${updated.name}" is pending administrator review.`,
    userId: ownerId,
  });

  return updated;
};

/*
==================================================
3. CREATE RECEPTIONIST
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
    throw new Error("Guesthouse not found");
  }

  // Clean phone number
  const cleanPhone = data.phone.replace(/\s/g, '').replace(/-/g, '');

  const existingUser =
    await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  const existingPhone =
    await prisma.user.findUnique({
      where: {
        phone: cleanPhone,
      },
    });

  if (existingPhone) {
    throw new Error("Phone already exists");
  }

  // Use default password if not provided
  const password = data.password || "Password123";
  const hashedPassword =
    await bcrypt.hash(password, 10);

  const receptionist = await prisma.user.create({
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
      guesthouseId: guesthouse.id,
      staffId: receptionist.id,
    },
  });

  try {
    await createNotification({
      title: "Staff Assignment",
      message: `You have been assigned as a Receptionist for "${guesthouse.name}". You can now manage front desk operations.`,
      userId: receptionist.id,
    });
  } catch (error) {
    console.error("Failed to notify receptionist of assignment:", error);
  }

  return receptionist;
};

/*
==================================================
4. GET RECEPTIONISTS
==================================================
*/
export const getReceptionists = async (
  ownerId
) => {
  const guesthouse = await prisma.guesthouse.findFirst({
    where: {
      ownerId,
    },
  });

  if (!guesthouse) {
    return [];
  }

  const assignments = await prisma.staffAssignment.findMany({
    where: {
      guesthouseId: guesthouse.id,
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

  return assignments.map(assignment => assignment.staff);
};

/*
==================================================
5. ASSIGN EXISTING RECEPTIONIST TO GUESTHOUSE
==================================================
*/
export const assignReceptionistToGuesthouse = async (
  ownerId,
  staffId
) => {
  const guesthouse = await prisma.guesthouse.findFirst({
    where: {
      ownerId,
    },
  });

  if (!guesthouse) {
    throw new Error("Guesthouse not found");
  }

  const staff = await prisma.user.findUnique({
    where: {
      id: staffId,
    },
  });

  if (!staff) {
    throw new Error("Staff not found");
  }

  if (staff.role !== "RECEPTIONIST") {
    throw new Error("User is not a receptionist");
  }

  // Check if already assigned
  const existingAssignment = await prisma.staffAssignment.findUnique({
    where: {
      guesthouseId_staffId: {
        guesthouseId: guesthouse.id,
        staffId: staffId,
      },
    },
  });

  if (existingAssignment) {
    throw new Error("Receptionist already assigned to this guesthouse");
  }

  const assignment = await prisma.staffAssignment.create({
    data: {
      guesthouseId: guesthouse.id,
      staffId: staffId,
    },
  });

  try {
    await createNotification({
      title: "Staff Assignment",
      message: `You have been assigned as a Receptionist for "${guesthouse.name}".`,
      userId: staffId,
    });
  } catch (error) {
    console.error("Failed to notify receptionist of assignment:", error);
  }

  return assignment;
};

/*
==================================================
6. REMOVE RECEPTIONIST FROM GUESTHOUSE
==================================================
*/
export const removeReceptionistFromGuesthouse = async (
  ownerId,
  staffId
) => {
  const guesthouse = await prisma.guesthouse.findFirst({
    where: {
      ownerId,
    },
  });

  if (!guesthouse) {
    throw new Error("Guesthouse not found");
  }

  const assignment = await prisma.staffAssignment.findUnique({
    where: {
      guesthouseId_staffId: {
        guesthouseId: guesthouse.id,
        staffId: Number(staffId),
      },
    },
  });

  if (!assignment) {
    throw new Error("Receptionist is not assigned to this guesthouse");
  }

  return await prisma.staffAssignment.delete({
    where: {
      guesthouseId_staffId: {
        guesthouseId: guesthouse.id,
        staffId: Number(staffId),
      },
    },
  });
};