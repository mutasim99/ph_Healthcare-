import status from "http-status";
import { Specialty } from "../../../generated/prisma/client";
import AppError from "../../errorHelper/AppError";
import { prisma } from "../../lib/prisma";

const getAllSpecialties = async (): Promise<Specialty[]> => {
  try {
    const specialties = await prisma.specialty.findMany();
    return specialties;
  } catch (error) {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Error fetching specialties: " + (error as Error).message
    );
  }
};

const createSpecialty = async (payload: Specialty): Promise<Specialty> => {
  try {
    const specialty = await prisma.specialty.create({
      data: payload,
    });

    return specialty;
  } catch (error) {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Error creating specialty: " + (error as Error).message
    );
  }
};

const deleteSpecialty = async (id: string): Promise<Specialty> => {
  try {
    const specialty = await prisma.specialty.delete({
      where: {
        id,
      },
    });
    return specialty;
  } catch (error) {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Error deleting specialty: " + (error as Error).message
    );
  }
};

export const specialtyService = {
  createSpecialty,
  getAllSpecialties,
  deleteSpecialty,
};
