import { Gender } from "../../../generated/prisma";

export interface IUpdateDoctorSpecialtyPayload {
  specialtyId: string;
  shouldDelete?: boolean;
}

export interface IUpdateDoctorPayload {
  doctor?: {
    name?: string;
    profilePhoto?: string;
    contactNumber?: string;
    address?: string;
    experience?: number;
    registrationNumber?: string;
    gender?: Gender;
    appointmentFee?: number;
    qualification?: string;
    currentWorkingPrice?: string;
    designation?: string;
  };
  specialties?: IUpdateDoctorSpecialtyPayload[];
}
