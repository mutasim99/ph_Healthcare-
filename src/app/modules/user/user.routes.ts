import { Router } from "express";
import { UserController } from "./user.controller";
import { createZodSchema } from "./user.validation";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();


router.post(
  "/create-doctor",
  validateRequest(createZodSchema),
  UserController.createDoctor
);

export const UserRoutes = router;
