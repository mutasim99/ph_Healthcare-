import z from "zod";
import { BloodGroup, Gender } from "../../../generated/prisma";

const updatePatientProfileZodSchema = z.object({
  patientInfo: z
    .object({
      name: z
        .string("Name must be a string")
        .min(1, "Name can not be empty")
        .max(100, "Name must be less than 100 character")
        .optional(),
      profilePhoto: z.url("profile photo mus be a valid url").optional(),
      contactNumber: z
        .string("contact number mus be a string")
        .min(1, "contact number can not be null")
        .max(200, "contact number can not be grater than 20")
        .optional(),
      address: z
        .string("Address number mus be a string")
        .min(1, "Address can not be null")
        .max(200, "Address can not be grater than 200 character")
        .optional(),
    })
    .optional(),
  patientHealthData: z
    .object({
      gender: z.enum([Gender.FEMALE, Gender.MALE], Gender.OTHER).optional(),
      dateOfBirth: z
        .string()
        .refine((date) => !isNaN(Date.parse(date)), {
          message: "Invalid date format",
        })
        .optional(),
      bloodGroup: z
        .enum([
          BloodGroup.A_POSITIVE,
          BloodGroup.A_NEGATIVE,
          BloodGroup.B_POSITIVE,
          BloodGroup.B_NEGATIVE,
          BloodGroup.AB_POSITIVE,
          BloodGroup.AB_NEGATIVE,
          BloodGroup.O_POSITIVE,
          BloodGroup.O_NEGATIVE,
        ])
        .optional(),
      hasAllergies: z.boolean().optional(),
      hasDiabetes: z.boolean().optional(),
      height: z.string().optional(),
      weight: z.string().optional(),
      smokingStatus: z.boolean().optional(),
      dietaryPreferences: z.string().optional(),
      pregnancyStatus: z.boolean().optional(),
      mentalHealthHistory: z.string().optional(),
      immunizationStatus: z.string().optional(),
      hasPastSurgeries: z.boolean().optional(),
      recentAnxiety: z.boolean().optional(),
      recentDepression: z.boolean().optional(),
      maritalStatus: z.string().optional(),
    })
    .optional(),
  medicalReports: z
    .array(
      z.object({
        shouldDelete: z.boolean().optional(),
        reportId: z.uuid().optional(),
        reportName: z.string().optional(),
        reportLink: z.url().optional(),
      })
    )
    .optional()
    .refine(
      (reports) => {
        if (!reports || reports.length === 0) return true;

        for (const report of reports) {
          if (report.shouldDelete === true && !report.reportId) {
            return false;
          }

          if (report.reportId && !report.shouldDelete) {
            return false;
          }

          if (report.reportName && !report.reportLink) {
            return false;
          }

          if (report.reportLink && !report.reportName) {
            return false;
          }
          return true;
        }
      },
      {
        message:
          "Invalid medical report data. If shouldDelete is true, reportId must be provided. If reportId is provided, shouldDelete must be true. If reportName is provided, reportLink must also be provided and vice versa.",
      }
    ),
});

export const PatientValidation = {
  updatePatientProfileZodSchema,
};
