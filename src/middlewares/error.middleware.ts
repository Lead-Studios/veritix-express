import type { Request, Response, NextFunction } from "express"

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack)

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

