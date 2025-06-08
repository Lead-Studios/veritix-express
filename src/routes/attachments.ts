import express from "express"
import multer from "multer"
import path from "path"
import { authenticate, type AuthRequest } from "../middleware/auth"
import { db } from "../config/database"
import { UserRole } from "../types"
import { asyncHandler } from "../middleware/errorHandler"

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/")
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error("Invalid file type"))
    }
  },
})

// Get attachments for a ticket
router.get(
  "/ticket/:ticketId",
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const ticket = db.getTicketById(req.params.ticketId)

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      })
    }

    // Check permissions
    if (req.user?.role === UserRole.USER && ticket.createdBy !== req.user.id && ticket.assignedTo !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    const attachments = db.getAttachmentsByTicketId(req.params.ticketId)

    // Add uploader information
    const attachmentsWithUsers = attachments.map((attachment) => {
      const uploader = db.getUserById(attachment.uploadedBy)
      return {
        ...attachment,
        uploader: uploader
          ? {
              id: uploader.id,
              username: uploader.username,
              firstName: uploader.firstName,
              lastName: uploader.lastName,
            }
          : null,
      }
    })

    res.json({
      success: true,
      data: attachmentsWithUsers,
    })
  }),
)

// Upload attachment to ticket
router.post(
  "/ticket/:ticketId",
  authenticate,
  upload.single("file"),
  asyncHandler(async (req: AuthRequest, res) => {
    const ticket = db.getTicketById(req.params.ticketId)

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      })
    }

    // Check permissions
    const canUpload =
      req.user?.role === UserRole.ADMIN ||
      req.user?.role === UserRole.AGENT ||
      ticket.createdBy === req.user?.id ||
      ticket.assignedTo === req.user?.id

    if (!canUpload) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      })
    }

    const attachment = db.createAttachment({
      ticketId: req.params.ticketId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user!.id,
    })

    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      data: attachment,
    })
  }),
)

// Download attachment
router.get(
  "/:id/download",
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const attachment = db.getAttachments().find((a) => a.id === req.params.id)

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: "Attachment not found",
      })
    }

    const ticket = db.getTicketById(attachment.ticketId)
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Associated ticket not found",
      })
    }

    // Check permissions
    if (req.user?.role === UserRole.USER && ticket.createdBy !== req.user.id && ticket.assignedTo !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    const filePath = path.join(__dirname, "../../uploads", attachment.fileName)

    res.download(filePath, attachment.originalName, (err) => {
      if (err) {
        res.status(404).json({
          success: false,
          message: "File not found",
        })
      }
    })
  }),
)

// Delete attachment
router.delete(
  "/:id",
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const attachment = db.getAttachments().find((a) => a.id === req.params.id)

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: "Attachment not found",
      })
    }

    const ticket = db.getTicketById(attachment.ticketId)
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Associated ticket not found",
      })
    }

    // Check permissions - only uploader, ticket creator, assignee, or admin can delete
    const canDelete =
      req.user?.role === UserRole.ADMIN ||
      attachment.uploadedBy === req.user?.id ||
      ticket.createdBy === req.user?.id ||
      ticket.assignedTo === req.user?.id

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    db.deleteAttachment(req.params.id)

    res.json({
      success: true,
      message: "Attachment deleted successfully",
    })
  }),
)

export default router
