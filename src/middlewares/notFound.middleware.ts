import type { Request, Response, NextFunction } from "express"
import { ErrorResponse } from "../utils/errorResponse"

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new ErrorResponse(`Not found - ${req.originalUrl}`, 404)
  next(error)
}
