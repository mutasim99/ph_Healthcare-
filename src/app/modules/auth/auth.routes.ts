import { Router } from "express";
import { AuthController } from "./auth.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma";

const router = Router();

router.post("/register", AuthController.createPatient);
router.post("/signin", AuthController.signInUser);
router.get(
  "/me",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.DOCTOR, Role.PATIENT),
  AuthController.getMe
);
router.post("/refresh-token", AuthController.getNewToken);

router.post(
  "/change-password",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.DOCTOR, Role.PATIENT),
  AuthController.changePassword
);

router.post(
  "/logout",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.DOCTOR, Role.PATIENT),
  AuthController.logoutUser
);

router.post("/verify-email", AuthController.verifyEmail);

router.post("/forget-password", AuthController.forgetPassword);
router.post("/reset-password", AuthController.resetPassword);

router.get("/login/google", AuthController.googleLogin);
router.get("/login/google/success", AuthController.googleLoginSuccess);
router.get("/oauth/error", AuthController.handleOAuthError);

export const authRoutes = router;
