import { roomSchema, roomUpdateSchema } from "../validators/room.validator.js";
import { createRoom ,  getAllRooms,getRoomById,  updateRoom,  deleteRoom,

} from "../services/room.service.js";
import { successResponse } from "../utils/response.js";

export const create = async (req, res, next) => {
  try {
    // Validate Request Body
    const data = roomSchema.parse(req.body);

    // Get Guesthouse ID from URL
    const guesthouseId = req.params.guesthouseId;

    // Save Room
    const room = await createRoom(data, guesthouseId);

    // Send Response
    successResponse(
      res,
      room,
      "Room created successfully",
      201
    );

  } catch (error) {
    next(error);
  }
};
export const getAll = async (req, res, next) => {
  try {
    const guesthouseId = req.params.guesthouseId;
    const rooms = await getAllRooms(guesthouseId);

    successResponse(
      res,
      rooms,
      "Rooms fetched successfully"
    );

  } catch (error) {
    next(error);
  }
};
export const getById = async (req, res, next) => {
  try {
    const room = await getRoomById(req.params.id);

    if (!room) {
      throw new Error("Room not found");
    }

    successResponse(
      res,
      room,
      "Room fetched successfully"
    );

  } catch (error) {
    next(error);
  }
};
export const update = async (req, res, next) => {
  try {
    const data = roomUpdateSchema.parse(req.body);

    const room = await updateRoom(
      req.params.id,
      data
    );

    successResponse(
      res,
      room,
      "Room updated successfully"
    );

  } catch (error) {
    next(error);
  }
};
export const remove = async (req, res, next) => {
  try {
    const room = await deleteRoom(req.params.id);

    successResponse(
      res,
      room,
      "Room deleted successfully"
    );

  } catch (error) {
    next(error);
  }
};
export const updateAvailability = async (req, res, next) => {
  try {
    const { available } = req.body;

    if (typeof available !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "available must be true or false.",
      });
    }

    const room = await updateRoom(
      req.params.id,
      {
        available,
        maintenanceStatus: available
          ? "AVAILABLE"
          : "UNAVAILABLE",
      }
    );

    successResponse(
      res,
      room,
      "Room availability updated successfully"
    );
  } catch (error) {
    next(error);
  }
};