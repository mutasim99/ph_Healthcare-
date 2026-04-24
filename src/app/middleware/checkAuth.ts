import { NextFunction, Request, Response } from "express";
import { Role, UserStatus } from "../../generated/prisma";
import { cookieUtils } from "../utils/cookie";
import AppError from "../errorHelper/AppError";
import status from "http-status";
import { prisma } from "../lib/prisma";
import { jwtUtils } from "../utils/jwt";
import { envVars } from "../config/env";

export const checkAuth =
  (...authRoles: Role[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionToken = cookieUtils.getCookie(
        req,
        "better-auth.session_token"
      );
      if (!sessionToken) {
        throw new AppError(
          status.UNAUTHORIZED,
          "Unauthorized: No session token provided"
        );
      }
      if (sessionToken) {
        const sessionExists = await prisma.session.findFirst({
          where: {
            token: sessionToken,
            expiresAt: {
              gt: new Date(),
            },
          },
          include: {
            user: true,
          },
        });
        if (sessionExists && sessionExists.user) {
          const user = sessionExists.user;

          const now = new Date();
          const expireAt = new Date(sessionExists.expiresAt);
          const createAt = new Date(sessionExists.createdAt);

          const sessionLifeTime = expireAt.getTime() - createAt.getTime();
          const timeRemaining = expireAt.getTime() - now.getTime();
          const percentRemaining = (timeRemaining / sessionLifeTime) * 100;

          if (percentRemaining < 20) {
            res.setHeader("X-Session-Expiring", "true");
            res.setHeader("X-Session-Expires-At", expireAt.toISOString());
            res.setHeader("X-Time_Remaining", timeRemaining.toString());

            console.log("session is expiring soon!!");
          }

          if (
            user.status === UserStatus.BLOCKED ||
            user.status === UserStatus.DELETED
          ) {
            throw new AppError(
              status.FORBIDDEN,
              "Your account has been deleted. Please contact support for assistance."
            );
          }

          if (user.isDeleted) {
            throw new AppError(
              status.FORBIDDEN,
              "Your account has been deleted. Please contact support for assistance."
            );
          }

          if (authRoles.length > 0 && !authRoles.includes(user.role)) {
            throw new AppError(
              status.FORBIDDEN,
              "Forbidden: You don't have permission to access this resource"
            );
          }

          req.user = {
            userId: user.id,
            email: user.email,
            role: user.role,
          };
        }
      }

      // Access token verification
      const accessToken = cookieUtils.getCookie(req, "accessToken");
      if (!accessToken) {
        throw new AppError(
          status.UNAUTHORIZED,
          "Unauthorized: No access token provided"
        );
      }

      const verifiedToken = jwtUtils.verifyToken(
        accessToken,
        envVars.JWT_ACCESS_TOKEN_SECRET
      );

      if (!verifiedToken.success) {
        throw new AppError(
          status.UNAUTHORIZED,
          "Unauthorized: Invalid access token"
        );
      }

      if (
        authRoles.length > 0 &&
        !authRoles.includes(verifiedToken.data!.role as Role)
      ) {
        throw new AppError(
          status.FORBIDDEN,
          "Forbidden: You don't have permission to access this resource"
        );
      }
      next();
    } catch (error) {
      next(error);
    }
  };
