import type { Request, Response, NextFunction } from "express"

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack)

  // Handle custom errors
  if (err instanceof NotFoundError) {
    return res.status(404).json({
      status: "error",
      message: err.message,
    })
  }

  if (err instanceof BadRequestError) {
    return res.status(400).json({
      status: "error",
      message: err.message,
    })
  }

  // Handle multer errors
  if (err.name === "MulterError") {
    return res.status(400).json({
      status: "error",
      message: "File upload error",
      error: err.message,
    })
  }

  // Handle TypeORM errors
  if (err.name === "QueryFailedError") {
    return res.status(400).json({
      status: "error",
      message: "Database operation failed",
      error: err.message,
    })
  }

  // Default error response
  return res.status(500).json({
    status: "error",
    message: "Internal server error",
    error: process.env.NODE_ENV === "production" ? undefined : err.message,
  })
}

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    status: "error",
    message: "Resource not found",
  })
}
