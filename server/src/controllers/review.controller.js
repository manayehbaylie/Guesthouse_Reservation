import {
  createReview,
  getReviewsByGuesthouse,
  getReviewsByGuest,
  respondToReview,
  getOwnerReviews as getOwnerReviewsService,
} from "../services/review.service.js";

import { successResponse } from "../utils/response.js";

export const create = async (req, res, next) => {
  try {
    const review = await createReview(
      req.user.id,
      req.body
    );

    return successResponse(
      res,
      review,
      "Review created successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};

export const getByGuesthouse = async (req, res, next) => {
  try {
    const reviews = await getReviewsByGuesthouse(
      req.params.guesthouseId
    );

    return successResponse(
      res,
      reviews,
      "Reviews fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const getByGuest = async (req, res, next) => {
  try {
    const reviews = await getReviewsByGuest(
      req.user.id
    );

    return successResponse(
      res,
      reviews,
      "Guest reviews fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const getOwnerReviews = async (req, res, next) => {
  try {
    const reviews = await getOwnerReviewsService(
      req.user.id
    );

    return successResponse(
      res,
      reviews,
      "Owner reviews fetched successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const respond = async (req, res, next) => {
  try {
    const review = await respondToReview(
      req.user.id,
      req.params.reviewId,
      req.body.response
    );

    return successResponse(
      res,
      review,
      "Response added successfully"
    );
  } catch (error) {
    next(error);
  }
};