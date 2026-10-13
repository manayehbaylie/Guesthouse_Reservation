import {
  getCommunicationContacts,
  getConversation,
  sendCommunicationMessage,
  editCommunicationMessage,
  deleteCommunicationMessage,
} from "../services/communication.service.js";
import { successResponse } from "../utils/response.js";

export const contacts = async (req, res, next) => {
  try {
    return successResponse(res, await getCommunicationContacts(req.user), "Contacts fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const conversation = async (req, res, next) => {
  try {
    return successResponse(res, await getConversation(req.user, req.params.userId), "Conversation fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    return successResponse(
      res,
      await sendCommunicationMessage(req.user, req.params.userId, req.body?.content),
      "Message sent successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};

export const editMessage = async (req, res, next) => {
  try {
    return successResponse(
      res,
      await editCommunicationMessage(req.user, req.params.messageId, req.body?.content),
      "Message updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    return successResponse(
      res,
      await deleteCommunicationMessage(req.user, req.params.messageId),
      "Message deleted successfully"
    );
  } catch (error) {
    next(error);
  }
};