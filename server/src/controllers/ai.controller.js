import { chatWithAssistant } from "../services/ai-assistant.service.js";
import { successResponse } from "../utils/response.js";

export const chat = async (req, res, next) => {
  const { message, history } = req.body || {};

  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: "A message is required.",
    });
  }

  if (message.length > 2000) {
    return res.status(400).json({
      success: false,
      message: "Messages must be 2,000 characters or fewer.",
    });
  }

  try {
    const result = await chatWithAssistant({
      message: message.trim(),
      history,
      user: req.user,
      language: req.body.language,
    });

    return successResponse(res, result, "Assistant response generated");
  } catch (error) {
    next(error);
  }
};