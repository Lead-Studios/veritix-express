import express from "express"
import { authenticate, authorize, type AuthRequest } from "../middleware/auth"
import { validate, validateQuery } from "../middleware/validation"
import { createTicketSchema, updateTicketSchema, ticketQuerySchema } from "../validation/schemas"
import { db } from "../config/database"
import { UserRole, TicketStatus, type Ticket } from "../types"
import { asyncHandler } from "../middleware/errorHandler"
import { sendTicketNotification } from "../utils/email"

const router = express.Router()

// Get all tickets with filtering and pagination
router.get(
  "/",
  authenticate,
  validateQuery(ticketQuerySchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      status,
      priority,
      category,
      assignedTo,
      createdBy,
      search,
      tags,
      dateFrom,
      dateTo,
    } = req.query as any

    let tickets = db.getTickets()

    // Apply filters
    if (status) {
      const statusArray = Array.isArray(status) ? status : [status]
      tickets = tickets.filter((ticket) => statusArray.includes(ticket.status))
    }

    if (priority) {
      const priorityArray = Array.isArray(priority) ? priority : [priority]
      tickets = tickets.filter((ticket) => priorityArray.includes(ticket.priority))
    }

    if (category) {
      const categoryArray = Array.isArray(category) ? category : [category]
      tickets = tickets.filter((ticket) => categoryArray.includes(ticket.category))
    }

    if (assignedTo) {
      const assignedToArray = Array.isArray(assignedTo) ? assignedTo : [assignedTo]
      tickets = tickets.filter((ticket) => ticket.assignedTo && assignedToArray.includes(ticket.assignedTo))
    }

    if (createdBy) {
      const createdByArray = Array.isArray(createdBy) ? createdBy : [createdBy]
      tickets = tickets.filter((ticket) => createdByArray.includes(ticket.createdBy))
    }

    if (search) {
      const searchLower = search.toLowerCase()
      tickets = tickets.filter(
        (ticket) =>
          ticket.title.toLowerCase().includes(searchLower) || ticket.description.toLowerCase().includes(searchLower),
      )
    }

    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : [tags]
      tickets = tickets.filter((ticket) => ticket.tags.some((tag) => tagsArray.includes(tag)))
    }

    if (dateFrom) {
      tickets = tickets.filter((ticket) => ticket.createdAt >= new Date(dateFrom))
    }

    if (dateTo) {
      tickets = tickets.filter((ticket) => ticket.createdAt <= new Date(dateTo))
    }

    // Filter by user role
    if (req.user?.role === UserRole.USER) {
      tickets = tickets.filter((ticket) => ticket.createdBy === req.user?.id || ticket.assignedTo === req.user?.id)
    }

    // Sort tickets
    tickets.sort((a, b) => {
      const aValue = a[sortBy as keyof Ticket]
      const bValue = b[sortBy as keyof Ticket]

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    // Pagination
    const total = tickets.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedTickets = tickets.slice(startIndex, endIndex)

    res.json({
      success: true,
      data: paginatedTickets,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total,
        totalPages,
      },
    })
  }),
)

// Get ticket by ID
router.get(
  "/:id",
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const ticket = db.getTicketById(req.params.id)

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

    // Get related data
    const comments = db.getCommentsByTicketId(ticket.id)
    const attachments = db.getAttachmentsByTicketId(ticket.id)
    const creator = db.getUserById(ticket.createdBy)
    const assignee = ticket.assignedTo ? db.getUserById(ticket.assignedTo) : null

    res.json({
      success: true,
      data: {
        ...ticket,
        creator: creator
          ? {
              id: creator.id,
              username: creator.username,
              firstName: creator.firstName,
              lastName: creator.lastName,
            }
          : null,
        assignee: assignee
          ? {
              id: assignee.id,
              username: assignee.username,
              firstName: assignee.firstName,
              lastName: assignee.lastName,
            }
          : null,
        comments: comments.length,
        attachments: attachments.length,
      },
    })
  }),
)

// Create ticket
router.post(
  "/",
  authenticate,
  validate(createTicketSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const ticketData = {
      ...req.body,
      status: TicketStatus.OPEN,
      createdBy: req.user!.id,
      tags: req.body.tags || [],
    }

    const ticket = db.createTicket(ticketData)

    // Send notification to assignee if assigned
    if (ticket.assignedTo) {
      const assignee = db.getUserById(ticket.assignedTo)
      if (assignee) {
        try {
          await sendTicketNotification(assignee.email, ticket.id, ticket.title, "Assigned")
        } catch (error) {
          console.error("Failed to send notification:", error)
        }
      }
    }

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: ticket,
    })
  }),
)

// Update ticket
router.put(
  "/:id",
  authenticate,
  validate(updateTicketSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const ticket = db.getTicketById(req.params.id)

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      })
    }

    // Check permissions
    const canUpdate =
      req.user?.role === UserRole.ADMIN ||
      req.user?.role === UserRole.AGENT ||
      ticket.createdBy === req.user?.id ||
      ticket.assignedTo === req.user?.id

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    // Handle status changes
    const updates = { ...req.body }
    if (updates.status === TicketStatus.RESOLVED && !ticket.resolvedAt) {
      updates.resolvedAt = new Date()
    }

    const updatedTicket = db.updateTicket(req.params.id, updates)

    // Send notifications for status changes
    if (req.body.status && req.body.status !== ticket.status) {
      const creator = db.getUserById(ticket.createdBy)
      if (creator && creator.id !== req.user?.id) {
        try {
          await sendTicketNotification(creator.email, ticket.id, ticket.title, `Status changed to ${req.body.status}`)
        } catch (error) {
          console.error("Failed to send notification:", error)
        }
      }
    }

    res.json({
      success: true,
      message: "Ticket updated successfully",
      data: updatedTicket,
    })
  }),
)

// Delete ticket
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.AGENT),
  asyncHandler(async (req: AuthRequest, res) => {
    const ticket = db.getTicketById(req.params.id)

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      })
    }

    // Delete related comments and attachments
    const comments = db.getCommentsByTicketId(req.params.id)
    comments.forEach((comment) => db.deleteComment(comment.id))

    const attachments = db.getAttachmentsByTicketId(req.params.id)
    attachments.forEach((attachment) => db.deleteAttachment(attachment.id))

    db.deleteTicket(req.params.id)

    res.json({
      success: true,
      message: "Ticket deleted successfully",
    })
  }),
)

// Assign ticket
router.patch(
  "/:id/assign",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.AGENT),
  asyncHandler(async (req: AuthRequest, res) => {
    const { assignedTo } = req.body
    const ticket = db.getTicketById(req.params.id)

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      })
    }

    if (assignedTo && !db.getUserById(assignedTo)) {
      return res.status(400).json({
        success: false,
        message: "Assigned user not found",
      })
    }

    const updatedTicket = db.updateTicket(req.params.id, { assignedTo })

    // Send notification
    if (assignedTo) {
      const assignee = db.getUserById(assignedTo)
      if (assignee) {
        try {
          await sendTicketNotification(assignee.email, ticket.id, ticket.title, "Assigned")
        } catch (error) {
          console.error("Failed to send notification:", error)
        }
      }
    }

    res.json({
      success: true,
      message: "Ticket assignment updated successfully",
      data: updatedTicket,
    })
  }),
)

// Bulk update tickets
router.patch(
  "/bulk",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.AGENT),
  asyncHandler(async (req: AuthRequest, res) => {
    const { ticketIds, updates } = req.body

    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Ticket IDs array is required",
      })
    }

    const updatedTickets = []
    const errors = []

    for (const ticketId of ticketIds) {
      const ticket = db.getTicketById(ticketId)
      if (!ticket) {
        errors.push(`Ticket ${ticketId} not found`)
        continue
      }

      const updatedTicket = db.updateTicket(ticketId, updates)
      if (updatedTicket) {
        updatedTickets.push(updatedTicket)
      }
    }

    res.json({
      success: true,
      message: `${updatedTickets.length} tickets updated successfully`,
      data: {
        updated: updatedTickets.length,
        errors,
      },
    })
  }),
)

export default router
