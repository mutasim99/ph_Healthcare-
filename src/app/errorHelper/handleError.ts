import status from "http-status";
import { TErrorResponse, TErrorInterface } from "../interfaces/error.interface";
import z from "zod";

export const handleZodError = (err: z.ZodError): TErrorResponse => {
  const statusCode = status.BAD_REQUEST;
  const message = "Zod validation error";
  const errorSources: TErrorInterface[] = [];

  err.issues.forEach((issue) => {
    errorSources.push({
      path:
        issue.path.length > 1
          ? issue.path.join(" => ")
          : issue.path[0].toString(),
      message: issue.message,
    });
  });
  return {
    success: false,
    message,
    errorSources,
    statusCode,
  };
};
