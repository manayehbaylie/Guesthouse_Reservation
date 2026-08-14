import {
  registerUser,
  loginUser,
} from "../services/auth.service.js";
import { registerSchema } from "../validators/auth.validator.js";
import { successResponse } from "../utils/response.js";

export const register = async (req, res, next) => {
  try {
    // Validate request data
    const validatedData = registerSchema.parse(req.body);
    const user = await registerUser(validatedData);

    successResponse(res, user, "User registered successfully");
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await loginUser(
      req.body.email,
      req.body.password
    );

    successResponse(res, result, "Login successful");
  } catch (error) {
    next(error);
  }
};