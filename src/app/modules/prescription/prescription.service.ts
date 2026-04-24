import status from "http-status";
import AppError from "../../errorHelper/AppError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { ICreatePrescriptionPayload } from "./prescription.interface";
import { generatePrescriptionPDF } from "./prescription.utils";
import { uploadFileToCloudinary } from "../../config/cloudinary.config";

const givePrescription = async (
  user: IRequestUser,
  payload: ICreatePrescriptionPayload
) => {
  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  const appointmentData = await prisma.appointment.findUniqueOrThrow({
    where: {
      id: payload.appointmentId,
    },
    include: {
      patient: true,
      doctor: {
        include: {
          specialties: true,
        },
      },
      schedule: {
        include: {
          DoctorSchedule: true,
        },
      },
    },
  });

  if (appointmentData.doctorId !== doctorData.id) {
    throw new AppError(
      status.BAD_REQUEST,
      "You can only give prescription for your own appointments"
    );
  }

  const isAlreadyPrescribe = await prisma.prescription.findFirst({
    where: {
      appointmentId: appointmentData.id,
    },
  });

  if (isAlreadyPrescribe) {
    throw new AppError(
      status.BAD_REQUEST,
      "You have already given prescription for this appointment. You can update the prescription instead."
    );
  }

  const followUpDate = new Date(payload.followUpDate);

  const result = await prisma.$transaction(async (tx) => {
    const result = await tx.prescription.create({
      data: {
        ...payload,
        followUpDate,
        doctorId: appointmentData.doctorId,
        patientId: appointmentData.patientId,
      },
    });

    const pdfBuffer = await generatePrescriptionPDF({
      doctorName: doctorData.name,
      patientName: appointmentData.patient.name,
      appointmentDate: appointmentData.schedule.startDateTime,
      instructions: payload.instructions,
      followUpDate,
      doctorEmail: doctorData.email,
      patientEmail: appointmentData.patient.email,
      prescriptionId: result.id,
      createAt: new Date(),
    });

    const fileName = `Prescription-${Date.now()}.pdf`;
    const uploadFile = await uploadFileToCloudinary(pdfBuffer, fileName);
    const pdfUrl = uploadFile.secure_url;

    const updatePrescription = await tx.prescription.update({
      where: {
        id: result.id,
      },
      data: {
        pdfUrl,
      },
    });

    return updatePrescription;
  });
  return result;
};

export const PrescriptionService = {
  givePrescription,
};
