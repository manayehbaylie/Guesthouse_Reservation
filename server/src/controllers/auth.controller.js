import {
  registerUser,
  loginUser,
} from "../services/auth.service.js";
import { registerSchema } from "../validators/auth.validator.js";
import { successResponse } from "../utils/response.js";

/**
 * Register user
 */
export const register = async (req, res, next) => {
  try {
    const result = await registerUser(req.body);

    return successResponse(
      res,
      result,
      "User registered successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
export const login = async (req, res, next) => {
  try {
    const result = await loginUser(
      req.body.email,
      req.body.password
    );

    return successResponse(
      res,
      result,
      "Login successful"
    );
  } catch (error) {
    next(error);
  }
};