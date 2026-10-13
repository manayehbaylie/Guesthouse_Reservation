import prisma from "../config/prisma.js";
import { parseDateOnly } from "../utils/date.utils.js";
import { reservationOverlapWhere } from "../utils/reservation-overlap.utils.js";
import { parseOptionalCoordinates } from "../utils/geo.utils.js";

const invalidSearchInput = (message) =>
  Object.assign(new Error(message), { statusCode: 400 });

export const buildSearchRoomWhere = ({
  roomType,
  minPrice,
  maxPrice,
  minCapacity,
  checkIn,
  checkOut,
} = {}) => {
  const normalizedRoomType = roomType && String(roomType).toUpperCase();
  if (
    normalizedRoomType &&
    !["SINGLE", "DOUBLE", "TWIN", "FAMILY", "SUITE"].includes(normalizedRoomType)
  ) {
    throw invalidSearchInput("Room type is invalid.");
  }

  const where = {
    available: true,
    maintenanceStatus: "AVAILABLE",
    ...(normalizedRoomType && { roomType: normalizedRoomType }),
  };

  if (minPrice || maxPrice) {
    const lowerBound = minPrice === undefined ? undefined : Number(minPrice);
    const upperBound = maxPrice === undefined ? undefined : Number(maxPrice);
    if (
      (lowerBound !== undefined && (!Number.isFinite(lowerBound) || lowerBound < 0)) ||
      (upperBound !== undefined && (!Number.isFinite(upperBound) || upperBound < 0)) ||
      (lowerBound !== undefined && upperBound !== undefined && lowerBound > upperBound)
    ) {
      throw invalidSearchInput("Price range must contain valid increasing amounts.");
    }

    where.price = {
      ...(lowerBound !== undefined && { gte: lowerBound }),
      ...(upperBound !== undefined && { lte: upperBound }),
    };
  }

  if (minCapacity) {
    const capacity = Number(minCapacity);
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw invalidSearchInput("Minimum capacity must be a positive whole number.");
    }
    where.capacity = { gte: capacity };
  }

  if (checkIn || checkOut) {
    if (!checkIn || !checkOut) {
      throw invalidSearchInput("Both check-in and check-out dates are required.");
    }

    const start = parseDateOnly(checkIn);
    const end = parseDateOnly(checkOut);
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      throw invalidSearchInput("Check-out date must be after a valid check-in date.");
    }

    where.reservations = {
      none: reservationOverlapWhere(null, start, end),
    };
  }

  return where;
};

export const buildGuesthouseSearchWhere = (query = {}) => {
  const where = { status: "APPROVED" };
  const { name, location, city, roomType, minPrice, maxPrice, minCapacity } = query;
  const searchLocation = location || city;

  if (name) {
    where.name = { contains: String(name), mode: "insensitive" };
  }

  if (searchLocation) {
    where.OR = ["city", "address", "subCity", "woreda", "name"].map((field) => ({
      [field]: { contains: String(searchLocation), mode: "insensitive" },
    }));
  }

  where.rooms = {
    some: buildSearchRoomWhere({
      roomType,
      minPrice,
      maxPrice,
      minCapacity,
      checkIn: query.checkIn,
      checkOut: query.checkOut,
    }),
  };

  return where;
};

// ========================================
// Search Guesthouses
// ========================================

export const searchGuesthouses = async (query) => {
  const where = buildGuesthouseSearchWhere(query);
  const roomWhere = buildSearchRoomWhere(query);
  return await prisma.guesthouse.findMany({
    where,
    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      rooms: {
        where: roomWhere,
        orderBy: { price: "asc" },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const EARTH_RADIUS_KM = 6371.0088;
const ALLOWED_RADII_KM = new Set([1, 5, 10, 25, 50]);

export const calculateDistanceKm = (from, to) => {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const fromLatitude = radians(from.latitude);
  const toLatitude = radians(to.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  const boundedHaversine = Math.min(1, Math.max(0, haversine));

  return (
    EARTH_RADIUS_KM *
    2 *
    Math.atan2(
      Math.sqrt(boundedHaversine),
      Math.sqrt(1 - boundedHaversine)
    )
  );
};

export const validateNearbySearchQuery = (query = {}) => {
  const coordinates = parseOptionalCoordinates({
    latitude: query.latitude,
    longitude: query.longitude,
  });
  const hasCoordinates = Number.isFinite(coordinates.latitude);
  const place = String(query.place || "").trim();

  if (!hasCoordinates && !place) {
    throw invalidSearchInput("Provide GPS coordinates or a city or place.");
  }
  if (place.length > 120) {
    throw invalidSearchInput("City or place must be 120 characters or fewer.");
  }

  const radiusKm = query.radiusKm === undefined ? 5 : Number(query.radiusKm);
  if (!ALLOWED_RADII_KM.has(radiusKm)) {
    throw invalidSearchInput("Radius must be 1, 5, 10, 25, or 50 kilometers.");
  }

  return { ...coordinates, place, radiusKm, hasCoordinates };
};

export const rankNearbyGuesthouses = (guesthouses, criteria) =>
  guesthouses
    .map((guesthouse) => {
      const latitude = Number(guesthouse.latitude);
      const longitude = Number(guesthouse.longitude);
      const hasValidCoordinates =
        guesthouse.latitude !== null &&
        guesthouse.longitude !== null &&
        Number.isFinite(latitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        Number.isFinite(longitude) &&
        longitude >= -180 &&
        longitude <= 180;
      const distanceKm =
        criteria.hasCoordinates && hasValidCoordinates
          ? calculateDistanceKm(
              criteria,
              { latitude, longitude }
            )
          : null;

      return { ...guesthouse, distanceKm };
    })
    .filter(
      (guesthouse) =>
        !criteria.hasCoordinates ||
        (guesthouse.distanceKm !== null &&
          guesthouse.distanceKm <= criteria.radiusKm)
    )
    .sort((first, second) => {
      if (first.distanceKm === null) return second.distanceKm === null ? 0 : 1;
      if (second.distanceKm === null) return -1;
      return first.distanceKm - second.distanceKm;
    });

export const searchNearbyGuesthouses = async (query = {}) => {
  const criteria = validateNearbySearchQuery(query);
  const where = {
    status: "APPROVED",
    ...(criteria.hasCoordinates
      ? { latitude: { not: null }, longitude: { not: null } }
      : {
          OR: ["city", "address", "subCity", "woreda"].map((field) => ({
            [field]: { contains: criteria.place, mode: "insensitive" },
          })),
        }),
  };

  const guesthouses = await prisma.guesthouse.findMany({
    where,
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      subCity: true,
      woreda: true,
      image: true,
      photos: true,
      latitude: true,
      longitude: true,
      status: true,
    },
  });

  return rankNearbyGuesthouses(guesthouses, criteria);
};
// ========================================
// Search Rooms
// ========================================

export const searchRooms = async ({
  roomType,
  minPrice,
  maxPrice,
  available,
  minCapacity,
  checkIn,
  checkOut,
}) => {
  const where = {
    ...buildSearchRoomWhere({
      roomType,
      minPrice,
      maxPrice,
      minCapacity,
      checkIn,
      checkOut,
    }),
    guesthouse: { status: "APPROVED" },
  };

  if (available !== undefined) {
    where.available = available === "true";
  }

  return await prisma.room.findMany({
    where,
    include: {
      guesthouse: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          subCity: true,
          woreda: true,
        },
      },
    },
    orderBy: {
      price: "asc",
    },
  });
};
// ======================================
// Search Reservations
// ======================================

export const searchReservations = async ({
  status,
  guestName,
  roomNumber,
}) => {
  const where = {};

  // Reservation Status
  if (status) {
    where.status = status;
  }

  // Guest Name
  if (guestName) {
    where.guest = {
      fullName: {
        contains: guestName,
        mode: "insensitive",
      },
    };
  }

  // Room Number
  if (roomNumber) {
    where.room = {
      roomNumber: {
        contains: roomNumber,
        mode: "insensitive",
      },
    };
  }

  return await prisma.reservation.findMany({
    where,

    include: {
      guest: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },

      room: {
        select: {
          id: true,
          roomNumber: true,
          roomType: true,
          price: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};