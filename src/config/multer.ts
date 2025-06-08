import multer from "multer"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import type { Express } from "express"

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/posters/")
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  },
})

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, and WebP images are allowed."))
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
})
