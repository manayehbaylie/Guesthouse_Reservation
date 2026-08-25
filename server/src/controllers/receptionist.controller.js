import {
  getReceptionReservations, 
  confirmReservation, 
  checkInGuest, 
  checkOutGuest, 
  cancelReservation,
    deleteReservation, 
  getTodayArrivals,
  getTodayDepartures,
  getDashboardStats,
  getReceptionistRooms,
  getInHouseGuests,
  searchReservations,
  updateRoomAvailability,
} from "../services/receptionist.service.js";

import { successResponse }
from "../utils/response.js";
import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
// ===================================
// Reception Reservation List
// ===================================
export const receptionReservations =
async (req, res, next) => {
  try {
    const reservations =
      await getReceptionReservations(req.user.id);

    successResponse(
      res,
      reservations,
      "Reservations fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ===================================
// Dashboard Stats
// ===================================
export const dashboardStats =
async (req, res, next) => {
  try {
    const stats =
      await getDashboardStats(req.user.id);

    successResponse(
      res,
      stats,
      "Dashboard stats fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ===================================
// Get Receptionist Rooms
// ===================================
export const receptionistRooms =
async (req, res, next) => {
  try {
    const rooms =
      await getReceptionistRooms(req.user.id);

    successResponse(
      res,
      rooms,
      "Rooms fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ===================================
// In-House Guests
// ===================================
export const inHouseGuests =
async (req, res, next) => {
  try {
    const guests =
      await getInHouseGuests(req.user.id);

    successResponse(
      res,
      guests,
      "In-house guests fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ===================================
// Search Reservations
// ===================================
export const searchReservationsController =
async (req, res, next) => {
  try {
    const { term } = req.query;
    const reservations =
      await searchReservations(req.user.id, term);

    successResponse(
      res,
      reservations,
      "Search results fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ===================================
// Update Room Availability
// ===================================
export const updateRoomAvailabilityController =
async (req, res, next) => {
  try {
    const { maintenanceStatus } = req.body;
    const room =
      await updateRoomAvailability(req.user.id, req.params.id, maintenanceStatus);

    successResponse(
      res,
      room,
      "Room availability updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ===================================
// Confirm Reservation
// ===================================
export const confirm = async (
  req,
  res,
  next
) => {
  try {
    const reservation =
      await confirmReservation(req.user.id, req.params.id);

    successResponse(
      res,
      reservation,
      "Reservation confirmed successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ===================================
// Check In Guest
// ===================================
export const checkIn = async (
  req,
  res,
  next
) => {
  try {
    const reservation =
      await checkInGuest(req.user.id, req.params.id);

    successResponse(
      res,
      reservation,
      "Guest checked in successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ===================================
// Check Out Guest
// ===================================
export const checkOut = async (
  req,
  res,
  next
) => {
  try {
    const reservation =
      await checkOutGuest(req.user.id, req.params.id);

    successResponse(
      res,
      reservation,
      "Guest checked out successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ===================================
// Cancel Reservation
// ===================================
export const cancel = async (
  req,
  res,
  next
) => {
  try {
    const reservation =
      await cancelReservation(req.user.id, req.params.id);

    successResponse(
      res,
      reservation,
      "Reservation cancelled successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ===================================
// Today's Arrivals
// ===================================
export const todayArrivals = async (
  req,
  res,
  next
) => {
  try {
    const arrivals =
      await getTodayArrivals(req.user.id);

    successResponse(
      res,
      arrivals,
      "Today's arrivals fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ===================================
// Today's Departures
// ===================================
export const todayDepartures = async (
  req,
  res,
  next
) => {
  try {
    const departures =
      await getTodayDepartures(req.user.id);

    successResponse(
      res,
      departures,
      "Today's departures fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};
// ===================================
// Delete Reservation
// ===================================
export const deleteReceptionReservation = async (
  req,
  res,
  next
) => {
  try {
    const reservation = await deleteReservation(
      req.user.id,
      req.params.id
    );

    successResponse(
      res,
      reservation,
      "Reservation deleted successfully"
    );
  } catch (error) {
    next(error);
  }
};
export async function updateReceptionistProfile(req, res) {
  try {
    console.log("PROFILE UPDATE REQUEST");
    console.log("User:", req.user);
    console.log("Body:", req.body);

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

    console.log("Updating user:", userId);
    console.log("Update data:", {
      ...data,
      password: password ? "***" : undefined,
    });

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data,
    });

    console.log("Updated user:", updatedUser);

    return res.status(200).json({
      success: true,
      data: updatedUser,
    });

  } catch (error) {
    console.error(
      "UPDATE RECEPTIONIST PROFILE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Failed to update receptionist profile",
    });
  }
}