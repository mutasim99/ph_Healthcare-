import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { PatientService } from "./patient.service";
import { sendResponse } from "../../shared/SendResponse";
import status from "http-status";

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const payload = req.body;

  const result = await PatientService.updateMyProfile(user, payload);

  sendResponse(res, {
    success: true,
    httpStatusCode: status.OK,
    message: "Profile update successfully",
    data: result,
  });
});

export const PatientController = {
  updateMyProfile,
};
