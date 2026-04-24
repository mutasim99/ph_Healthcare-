/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";
import AppError from "../../errorHelper/AppError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { ICreatePrescriptionPayload } from "./prescription.interface";
import { generatePrescriptionPDF } from "./prescription.utils";
import {
  deleteFileFromCloudinary,
  uploadFileToCloudinary,
} from "../../config/cloudinary.config";
import { sendEmail } from "../../utils/email";
import { Role } from "../../../generated/prisma";

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
      createdAt: new Date(),
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

    try {
      const patient = appointmentData.patient;
      const doctor = appointmentData.doctor;

      await sendEmail({
        to: patient.email,
        subject: `You have received a new prescription from Dr. ${doctor.name}`,
        templateName: "Prescription",
        templateData: {
          doctorName: doctor.name,
          patientName: patient.name,
          specialization: doctor.specialties.map((s: any) => s.title).join(","),
          appointmentDate: new Date(
            appointmentData.schedule.startDateTime
          ).toLocaleString(),
          issuedDate: new Date().toLocaleDateString(),
          prescriptionId: result.id,
          instructions: payload.instructions,
          followUpDate: followUpDate.toLocaleDateString(),
          pdfUrl: pdfUrl,
        },
        attachments: [
          {
            fileName: fileName,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });
    } catch (error) {
      console.log("Failed to send email notification for prescription", error);
    }

    return updatePrescription;
  });
  return result;
};

const myPrescriptions = async (user: IRequestUser) => {
  const isUserExist = await prisma.user.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  if (!isUserExist) {
    throw new AppError(status.BAD_REQUEST, "User not found");
  }

  if (isUserExist.role === Role.DOCTOR) {
    const prescriptions = await prisma.prescription.findMany({
      where: {
        doctor: {
          email: user?.email,
        },
      },
      include: {
        patient: true,
        doctor: true,
        appointment: true,
      },
    });
    return prescriptions;
  }

  if (isUserExist.role === Role.PATIENT) {
    const prescriptions = await prisma.prescription.findMany({
      where: {
        patient: {
          email: user.email,
        },
      },
      include: {
        patient: true,
        doctor: true,
        appointment: true,
      },
    });
    return prescriptions;
  }
};

const getAllPrescriptions = async () => {
  const result = await prisma.prescription.findMany({
    include: {
      patient: true,
      doctor: true,
      appointment: true,
    },
  });
  return result;
};

const updatePrescriptions = async (
  user: IRequestUser,
  prescriptionId: string,
  payload: any
) => {
  const isUserExists = await prisma.user.findUniqueOrThrow({
    where: {
      email: user?.email,
    },
  });

  if (!isUserExists) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  const prescriptionData = await prisma.prescription.findUniqueOrThrow({
    where: {
      id: prescriptionId,
    },
    include: {
      doctor: true,
      patient: true,
      appointment: {
        include: {
          schedule: true,
        },
      },
    },
  });

  if (!(user?.email === prescriptionData.doctor.email)) {
    throw new AppError(status.BAD_REQUEST, "This is not your prescription!");
  }

  const updatedInstructions =
    payload.instructions || prescriptionData.instructions;
  const updatedFollowUpDate = payload.followUpDate
    ? new Date(payload.followUpDate)
    : prescriptionData.followUpDate;

  const pdfBuffer = await generatePrescriptionPDF({
    doctorName: prescriptionData.doctor.name,
    doctorEmail: prescriptionData.doctor.email,
    patientName: prescriptionData.patient.name,
    patientEmail: prescriptionData.patient.email,
    appointmentDate: prescriptionData.appointment.schedule.startDateTime,
    instructions: updatedInstructions,
    followUpDate: updatedFollowUpDate,
    prescriptionId: prescriptionData.id,
    createdAt: prescriptionData.cratedAt,
  });

  const fileName = `Prescription-updated-${Date.now()}.pdf`;
  const uploadFile = await uploadFileToCloudinary(pdfBuffer, fileName);
  const newPdfUrl = uploadFile.secure_url;

  if (prescriptionData.pdfUrl) {
    try {
      await deleteFileFromCloudinary(prescriptionData.pdfUrl);
    } catch (deleteError) {
      console.log("Failed to delete from cloudinary", deleteError);
    }
  }

  const result = await prisma.prescription.update({
    where: {
      id: prescriptionId,
    },
    data: {
      instructions: updatedInstructions,
      followUpDate: updatedFollowUpDate,
      pdfUrl: newPdfUrl,
    },
    include: {
      patient: true,
      doctor: true,
      appointment: {
        include: {
          schedule: true,
        },
      },
    },
  });
  /* send email */
  try {
    await sendEmail({
      to: result.patient.email,
      subject: `Your Prescription has been Updated by ${result.doctor.name}`,
      templateName: "prescription",
      templateData: {
        patientName: result.patient.name,
        doctorName: result.doctor.name,
        specialization: "Healthcare Provider",
        prescriptionId: result.id,
        appointmentDate: new Date(
          result.appointment.schedule.startDateTime
        ).toLocaleString(),
        issuedDate: new Date(result.cratedAt).toLocaleDateString(),
        followUpDate: new Date(result.followUpDate).toLocaleDateString(),
        instructions: result.instructions,
        pdfUrl: newPdfUrl,
      },
      attachments: [
        {
          fileName: `Prescription-${result.id}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });
  } catch (emailError) {
    // Log email error but don't fail the prescription update
    console.error("Failed to send updated prescription email:", emailError);
  }

  return result;
};

const deletePrescriptions = async (
  user: IRequestUser,
  prescriptionId: string
) => {
  // Verify user exists
  const isUserExists = await prisma.user.findUnique({
    where: {
      email: user?.email,
    },
  });

  if (!isUserExists) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  // Fetch prescription data
  const prescriptionData = await prisma.prescription.findUniqueOrThrow({
    where: {
      id: prescriptionId,
    },
    include: {
      doctor: true,
    },
  });

  // Verify the user is the doctor for this prescription
  if (!(user?.email === prescriptionData.doctor.email)) {
    throw new AppError(status.BAD_REQUEST, "This is not your prescription!");
  }

  if (prescriptionData.pdfUrl) {
    try {
      await deleteFileFromCloudinary(prescriptionData.id);
    } catch (deleteError) {
      console.error("Failed to delete PDF from Cloudinary:", deleteError);
    }
  }

  await prisma.prescription.delete({
    where: {
      id: prescriptionId,
    },
  });
};

export const PrescriptionService = {
  givePrescription,
  myPrescriptions,
  getAllPrescriptions,
  updatePrescriptions,
  deletePrescriptions
};
