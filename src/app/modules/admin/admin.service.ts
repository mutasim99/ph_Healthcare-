import status from "http-status";
import AppError from "../../errorHelper/AppError";
import { prisma } from "../../lib/prisma";
import { IUpdateAdminInterface } from "./admin.interface";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { UserStatus } from "../../../generated/prisma";

const getAllAdmins = async () => {
  const admins = await prisma.admin.findMany({
    include: {
      user: true,
    },
  });
  return admins;
};

const getAdminById = async (id: string) => {
  const admin = await prisma.admin.findUnique({
    where: {
      id,
    },
    include: {
      user: true,
    },
  });
  return admin;
};

const updateAdmin = async (id: string, payload: IUpdateAdminInterface) => {
  const isAdminExist = await prisma.admin.findUnique({
    where: {
      id,
    },
  });
  if (isAdminExist) {
    throw new AppError(status.NOT_FOUND, "Admin not found");
  }
  const { admin } = payload;

  const updateAdmin = await prisma.admin.update({
    where: {
      id,
    },
    data: {
      ...admin,
    },
  });
  return updateAdmin;
};

//soft delete admin user by setting isDeleted to true and also delete the user session and account

const deleteAdmin = async (id: string, user: IRequestUser) => {
  const isAdminExist = await prisma.admin.findUnique({
    where: {
      id,
    },
  });
  if (!isAdminExist) {
    throw new AppError(status.NOT_FOUND, "Admin not found");
  }

  if (isAdminExist.id === user.userId) {
    throw new AppError(
      status.BAD_REQUEST,
      "You cannot delete your own account"
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.admin.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    await tx.user.update({
      where: {
        id: isAdminExist.userID,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        status: UserStatus.DELETED,
      },
    });

    await tx.session.deleteMany({
      where: {
        userId: isAdminExist.userID,
      },
    });

    await tx.account.deleteMany({
      where: {
        userId: isAdminExist.userID,
      },
    });

    const admin = await getAdminById(id);

    return admin;
  });

  return result;
};

export const AdminServices = {
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
};
