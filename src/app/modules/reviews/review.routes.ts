import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma";
import { ReviewController } from "./review.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { ReviewValidation } from "./review.validation";

const router = Router();

router.get("/", ReviewController.getAllReviews);

router.post(
  "/",
  checkAuth(Role.PATIENT),
  validateRequest(ReviewValidation.createReviewZodSchema),
  ReviewController.giveReview
);

router.get(
  "/my-reviews",
  checkAuth(Role.DOCTOR, Role.PATIENT),
  ReviewController.getMyReviews
);

router.patch(
  "/:id",
  checkAuth(Role.PATIENT),
  validateRequest(ReviewValidation.updateReviewZodSchema),
  ReviewController.updateReview
);

router.delete("/:id", checkAuth(Role.PATIENT), ReviewController.deleteReview);

export const ReviewRoutes = router;
