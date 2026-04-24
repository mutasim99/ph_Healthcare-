import { specialtyService } from "./specialty.service";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/SendResponse";
import status from "http-status";

const getAllSpecialties = catchAsync(async (req, res) => {
  const result = await specialtyService.getAllSpecialties();
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Specialties retrieved successfully",
    data: result,
  });
});

const createSpecialty = catchAsync(async (req, res) => {
  const payload = {
    ...req.body,
    icons: req.file?.path,
  };
  const result = await specialtyService.createSpecialty(payload);
  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Specialty created successfully",
    data: result,
  });
});

const deleteSpecialty = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await specialtyService.deleteSpecialty(id as string);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Specialty deleted successfully",
    data: result,
  });
});

export const specialtyController = {
  createSpecialty,
  getAllSpecialties,
  deleteSpecialty,
};
