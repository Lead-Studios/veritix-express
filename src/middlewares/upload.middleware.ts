import multer from "multer"
import path from "path"
import type { Request, Express } from "express"
import fs from "fs"

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../../uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const posterUploadsDir = path.join(uploadsDir, "posters")
if (!fs.existsSync(posterUploadsDir)) {
  fs.mkdirSync(posterUploadsDir, { recursive: true })
}

// Configure storage for profile images
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, `profile-${uniqueSuffix}${ext}`)
  },
})

// Configure storage for poster images
const posterStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, posterUploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, `poster-${uniqueSuffix}${ext}`)
  },
})

// File filter for images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error("Invalid file type. Only JPEG, JPG, PNG, GIF and WebP files are allowed."))
  }
}

// Export configured multer middleware for profile images
export const uploadProfileImage = multer({
  storage: profileStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
}).single("profileImage")

// Export configured multer middleware for poster images
export const uploadPosterImage = multer({
  storage: posterStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
}).single("posterImage")

