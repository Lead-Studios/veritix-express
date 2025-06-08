import multer from "multer"
import sharp from "sharp"
import path from "path"
import fs from "fs"
import { v4 as uuidv4 } from "uuid"
import { logger } from "../utils/logger"
import type { DisputeEvidence, EvidenceType } from "../types/dispute"
import type { Express } from "express"

export class FileUploadService {
  private uploadDir: string
  private maxFileSize: number
  private allowedMimeTypes: string[]

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads")
    this.maxFileSize = Number.parseInt(process.env.MAX_FILE_SIZE || "10485760") // 10MB
    this.allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "video/mp4",
      "video/mpeg",
      "audio/mpeg",
      "audio/wav",
    ]

    this.ensureUploadDir()
  }

  private ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true })
    }

    // Create subdirectories
    const subdirs = ["disputes", "evidence", "temp"]
    for (const subdir of subdirs) {
      const fullPath = path.join(this.uploadDir, subdir)
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true })
      }
    }
  }

  getMulterConfig() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(this.uploadDir, "temp"))
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`
        cb(null, uniqueName)
      },
    })

    return multer({
      storage,
      limits: {
        fileSize: this.maxFileSize,
        files: 5, // Maximum 5 files per upload
      },
      fileFilter: (req, file, cb) => {
        if (this.allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true)
        } else {
          cb(new Error(`File type ${file.mimetype} is not allowed`))
        }
      },
    })
  }

  async processEvidenceFiles(files: Express.Multer.File[], disputeId: string): Promise<DisputeEvidence[]> {
    const processedFiles: DisputeEvidence[] = []

    for (const file of files) {
      try {
        const evidence = await this.processFile(file, disputeId)
        processedFiles.push(evidence)
      } catch (error) {
        logger.error(`Error processing file ${file.originalname}:`, error)
        // Clean up failed file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path)
        }
      }
    }

    return processedFiles
  }

  private async processFile(file: Express.Multer.File, disputeId: string): Promise<DisputeEvidence> {
    const evidenceDir = path.join(this.uploadDir, "disputes", disputeId)
    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, { recursive: true })
    }

    const fileId = uuidv4()
    const fileExtension = path.extname(file.originalname)
    const finalFilename = `${fileId}${fileExtension}`
    const finalPath = path.join(evidenceDir, finalFilename)

    // Process image files
    if (file.mimetype.startsWith("image/")) {
      await this.processImage(file.path, finalPath)
    } else {
      // Move other files
      fs.renameSync(file.path, finalPath)
    }

    // Generate URL (in production, this would be a CDN URL)
    const url = `/uploads/disputes/${disputeId}/${finalFilename}`

    return {
      _id: fileId,
      type: this.getEvidenceType(file.mimetype),
      filename: finalFilename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url,
      uploadedAt: new Date(),
    }
  }

  private async processImage(inputPath: string, outputPath: string): Promise<void> {
    await sharp(inputPath)
      .resize(1920, 1080, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 85,
        progressive: true,
      })
      .toFile(outputPath)

    // Remove temporary file
    fs.unlinkSync(inputPath)
  }

  private getEvidenceType(mimeType: string): EvidenceType {
    if (mimeType.startsWith("image/")) return "image"
    if (mimeType.startsWith("video/")) return "video"
    if (mimeType.startsWith("audio/")) return "audio"
    if (mimeType.includes("pdf") || mimeType.includes("document") || mimeType.includes("text")) {
      return "document"
    }
    return "other"
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.uploadDir, filePath.replace("/uploads/", ""))
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
        return true
      }
      return false
    } catch (error) {
      logger.error("Error deleting file:", error)
      return false
    }
  }

  async deleteDisputeFiles(disputeId: string): Promise<boolean> {
    try {
      const disputeDir = path.join(this.uploadDir, "disputes", disputeId)
      if (fs.existsSync(disputeDir)) {
        fs.rmSync(disputeDir, { recursive: true, force: true })
        return true
      }
      return false
    } catch (error) {
      logger.error("Error deleting dispute files:", error)
      return false
    }
  }

  getFileStats(): { totalFiles: number; totalSize: number } {
    let totalFiles = 0
    let totalSize = 0

    const countFiles = (dir: string) => {
      const items = fs.readdirSync(dir)
      for (const item of items) {
        const fullPath = path.join(dir, item)
        const stat = fs.statSync(fullPath)
        if (stat.isDirectory()) {
          countFiles(fullPath)
        } else {
          totalFiles++
          totalSize += stat.size
        }
      }
    }

    try {
      countFiles(this.uploadDir)
    } catch (error) {
      logger.error("Error getting file stats:", error)
    }

    return { totalFiles, totalSize }
  }
}
