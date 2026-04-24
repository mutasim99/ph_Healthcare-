import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma";
import { PrescriptionController } from "./prescription.controller";

const router = Router();

router.get(
  "/",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
  PrescriptionController.getAllPrescriptions
);

router.get(
  "/my-prescriptions",
  checkAuth(Role.PATIENT, Role.DOCTOR),
  PrescriptionController.myPrescriptions
);

router.post(
  "/",
  checkAuth(Role.DOCTOR),
  PrescriptionController.givePrescription
);

router.patch(
  "/:id",
  checkAuth(Role.DOCTOR),
  PrescriptionController.updatePrescription
);

router.delete(
  "/:id",
  checkAuth(Role.DOCTOR),
  PrescriptionController.deletePrescription
);

export const PrescriptionRoutes = router;
