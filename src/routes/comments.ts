import express from "express"
import { authenticate, type AuthRequest } from "../middleware/auth"
import { validate } from "../middleware/validation"
import { createCommentSchema, updateCommentSchema } from "../validation/schemas"
import { db } from "../config/database"
import { UserRole } from "../types"
import { asyncHandler } from "../middleware/errorHandler"

const router = express.Router()

// Get comments for a ticket
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

    let comments = db.getCommentsByTicketId(req.params.ticketId)

    // Filter internal comments for regular users
    if (req.user?.role === UserRole.USER) {
      comments = comments.filter((comment) => !comment.isInternal)
    }

    // Add user information to comments
    const commentsWithUsers = comments.map((comment) => {
      const user = db.getUserById(comment.userId)
      return {
        ...comment,
        user: user
          ? {
              id: user.id,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
            }
          : null,
      }
    })

    res.json({
      success: true,
      data: commentsWithUsers,
    })
  }),
)

// Create comment
router.post(
  "/ticket/:ticketId",
  authenticate,
  validate(createCommentSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const ticket = db.getTicketById(req.params.ticketId)

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      })
    }

    // Check permissions
    const canComment =
      req.user?.role === UserRole.ADMIN ||
      req.user?.role === UserRole.AGENT ||
      ticket.createdBy === req.user?.id ||
      ticket.assignedTo === req.user?.id

    if (!canComment) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    // Only agents and admins can create internal comments
    const isInternal = req.body.isInternal && (req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.AGENT)

    const comment = db.createComment({
      ticketId: req.params.ticketId,
      userId: req.user!.id,
      content: req.body.content,
      isInternal,
    })

    // Get user information
    const user = db.getUserById(comment.userId)

    res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: {
        ...comment,
        user: user
          ? {
              id: user.id,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
            }
          : null,
      },
    })
  }),
)

// Update comment
router.put(
  "/:id",
  authenticate,
  validate(updateCommentSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const comment = db.getComments().find((c) => c.id === req.params.id)

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      })
    }

    // Check permissions - only comment author or admin can update
    if (comment.userId !== req.user?.id && req.user?.role !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    const updatedComment = db.updateComment(req.params.id, {
      content: req.body.content,
    })

    res.json({
      success: true,
      message: "Comment updated successfully",
      data: updatedComment,
    })
  }),
)

// Delete comment
router.delete(
  "/:id",
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const comment = db.getComments().find((c) => c.id === req.params.id)

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      })
    }

    // Check permissions - only comment author or admin can delete
    if (comment.userId !== req.user?.id && req.user?.role !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    db.deleteComment(req.params.id)

    res.json({
      success: true,
      message: "Comment deleted successfully",
    })
  }),
)

export default router
