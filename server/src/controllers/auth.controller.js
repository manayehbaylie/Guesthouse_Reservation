import {
  registerUser,
  loginUser,
} from "../services/auth.service.js";

import { successResponse } from "../utils/response.js";

export const register = async (req, res, next) => {
  try {
    const user = await registerUser(req.body);

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