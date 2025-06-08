import { FileUploadService } from "../services/fileUploadService"
import type { Request, Response, NextFunction } from "express"

const fileUploadService = new FileUploadService()

export const uploadMiddleware = fileUploadService.getMulterConfig()

export const handleUploadErrors = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File size too large. Maximum size is 10MB per file.",
      })
    }

    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        error: "Too many files. Maximum 5 files per upload.",
      })
    }

    return res.status(400).json({
      success: false,
      error: error.message || "File upload error",
    })
  }

  next()
}
