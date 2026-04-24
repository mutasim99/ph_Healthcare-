import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { AdminServices } from "./admin.service";
import { sendResponse } from "../../shared/SendResponse";
import status from "http-status";

const getAllAdmins = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminServices.getAllAdmins();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Admin fetched successfully",
    data: result,
  });
});

const getAdminById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const admin = await AdminServices.getAdminById(id as string);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Admin fetched successfully",
    data: admin,
  });
});

const updateAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body;
  const result = await AdminServices.updateAdmin(id as string, payload);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Admin updated successfully",
    data: result,
  });
});

const deleteAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;

  const result = await AdminServices.deleteAdmin(id as string, user);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Admin deleted successfully",
    data: result,
  });
});

export const AdminController = {
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin
};
