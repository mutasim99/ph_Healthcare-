import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { ReviewService } from "./review.service";
import { sendResponse } from "../../shared/SendResponse";
import status from "http-status";

const giveReview = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const payload = req.body;

  const result = await ReviewService.giveReview(user, payload);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Review created successfully",
    data: result,
  });
});

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.getAllReviews();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Reviews retrieval successfully",
    data: result,
  });
});

const getMyReviews = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await ReviewService.myReviews(user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Reviews retrieval successfully",
    data: result,
  });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const reviewId = req.params.id as string;
  const payload = req.body;

  const result = await ReviewService.updateReview(user, reviewId, payload);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Review updated successfully",
    data: result,
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const reviewId = req.params.id as string;

  const result = await ReviewService.deleteReview(user, reviewId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Review deleted successfully",
    data: result,
  });
});

export const ReviewController = {
  giveReview,
  getAllReviews,
  getMyReviews,
  updateReview,
  deleteReview,
};
