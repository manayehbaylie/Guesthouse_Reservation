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
    const data = registerSchema.parse(req.body);
    const result = await registerUser(data);

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
 * Login user (supports email or phone)
 */
export const login = async (req, res, next) => {
  try {
    const { email, phone, password } = req.body;
    
    // Accept either email or phone as identifier
    const identifier = email || phone;
    const loginMethod = email ? 'email' : 'phone';
    
    const result = await loginUser(
      identifier,
      password,
      loginMethod
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