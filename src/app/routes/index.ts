import { Router } from "express";
import { specialtyRoutes } from "../modules/specialty/specialty.routes";
import { authRoutes } from "../modules/auth/auth.routes";
import { UserRoutes } from "../modules/user/user.routes";
import { DoctorRoutes } from "../modules/doctor/doctor.routes";
import { AdminRoutes } from "../modules/admin/admin.routes";
import { scheduleRoutes } from "../modules/schedule/schedule.routes";
import { DoctorScheduleRoutes } from "../modules/doctorSchedule/doctorSchedule.routes";
import { AppointmentsRoutes } from "../modules/appointment/appointment.routes";
import { ReviewRoutes } from "../modules/reviews/review.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/specialties", specialtyRoutes);
router.use("/users", UserRoutes);
router.use("/doctors", DoctorRoutes);
router.use("/admin", AdminRoutes);
router.use("/schedules", scheduleRoutes);
router.use("/doctor-schedules", DoctorScheduleRoutes);
router.use("/appointments", AppointmentsRoutes);
router.use("/reviews", ReviewRoutes)
export const indexRoutes = router;
