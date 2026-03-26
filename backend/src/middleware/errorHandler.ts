import { ErrorRequestHandler } from "express";

import { AppError } from "../errors";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.constructor.name,
      message: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: "InternalError",
    message: "Internal server error",
    statusCode: 500,
  });
};
