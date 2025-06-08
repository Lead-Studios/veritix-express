import express from "express"
import { authenticate, authorize, type AuthRequest } from "../middleware/auth"
import { db } from "../config/database"
import { UserRole, TicketStatus, TicketPriority } from "../types"
import { asyncHandler } from "../middleware/errorHandler"

const router = express.Router()

// Get performance report
router.get(
  "/performance",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.AGENT),
  asyncHandler(async (req: AuthRequest, res) => {
    const { startDate, endDate, userId } = req.query

    let tickets = db.getTickets()

    // Filter by date range
    if (startDate) {
      tickets = tickets.filter((t) => t.createdAt >= new Date(startDate as string))
    }
    if (endDate) {
      tickets = tickets.filter((t) => t.createdAt <= new Date(endDate as string))
    }

    // Filter by user if specified
    if (userId) {
      tickets = tickets.filter((t) => t.assignedTo === userId || t.createdBy === userId)
    }

    // Calculate metrics
    const totalTickets = tickets.length
    const resolvedTickets = tickets.filter((t) => t.status === TicketStatus.RESOLVED).length
    const closedTickets = tickets.filter((t) => t.status === TicketStatus.CLOSED).length
    const resolutionRate = totalTickets > 0 ? ((resolvedTickets + closedTickets) / totalTickets) * 100 : 0

    // Average resolution time
    const resolvedTicketsWithTime = tickets.filter((t) => t.resolvedAt)
    const avgResolutionTime =
      resolvedTicketsWithTime.length > 0
        ? resolvedTicketsWithTime.reduce((acc, ticket) => {
            const resolutionTime = ticket.resolvedAt!.getTime() - ticket.createdAt.getTime()
            return acc + resolutionTime
          }, 0) /
          resolvedTicketsWithTime.length /
          (1000 * 60 * 60) // Convert to hours
        : 0

    // Priority distribution
    const priorityDistribution = Object.values(TicketPriority).map((priority) => ({
      priority,
      count: tickets.filter((t) => t.priority === priority).length,
      percentage: totalTickets > 0 ? (tickets.filter((t) => t.priority === priority).length / totalTickets) * 100 : 0,
    }))

    // Category distribution
    const categories = [...new Set(tickets.map((t) => t.category))]
    const categoryDistribution = categories.map((category) => ({
      category,
      count: tickets.filter((t) => t.category === category).length,
      percentage: totalTickets > 0 ? (tickets.filter((t) => t.category === category).length / totalTickets) * 100 : 0,
    }))

    res.json({
      success: true,
      data: {
        summary: {
          totalTickets,
          resolvedTickets,
          closedTickets,
          resolutionRate: Math.round(resolutionRate * 100) / 100,
          avgResolutionTime: Math.round(avgResolutionTime * 100) / 100,
        },
        priorityDistribution,
        categoryDistribution,
      },
    })
  }),
)

// Get agent performance report
router.get(
  "/agents",
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(async (req: AuthRequest, res) => {
    const { startDate, endDate } = req.query

    let tickets = db.getTickets()

    // Filter by date range
    if (startDate) {
      tickets = tickets.filter((t) => t.createdAt >= new Date(startDate as string))
    }
    if (endDate) {
      tickets = tickets.filter((t) => t.createdAt <= new Date(endDate as string))
    }

    const agents = db.getUsers().filter((u) => u.role === UserRole.AGENT || u.role === UserRole.ADMIN)

    const agentPerformance = agents.map((agent) => {
      const assignedTickets = tickets.filter((t) => t.assignedTo === agent.id)
      const resolvedTickets = assignedTickets.filter((t) => t.status === TicketStatus.RESOLVED)
      const closedTickets = assignedTickets.filter((t) => t.status === TicketStatus.CLOSED)

      const resolutionRate =
        assignedTickets.length > 0
          ? ((resolvedTickets.length + closedTickets.length) / assignedTickets.length) * 100
          : 0

      // Average resolution time for this agent
      const resolvedWithTime = resolvedTickets.filter((t) => t.resolvedAt)
      const avgResolutionTime =
        resolvedWithTime.length > 0
          ? resolvedWithTime.reduce((acc, ticket) => {
              const resolutionTime = ticket.resolvedAt!.getTime() - ticket.createdAt.getTime()
              return acc + resolutionTime
            }, 0) /
            resolvedWithTime.length /
            (1000 * 60 * 60)
          : 0

      return {
        agent: {
          id: agent.id,
          username: agent.username,
          firstName: agent.firstName,
          lastName: agent.lastName,
        },
        metrics: {
          assignedTickets: assignedTickets.length,
          resolvedTickets: resolvedTickets.length,
          closedTickets: closedTickets.length,
          resolutionRate: Math.round(resolutionRate * 100) / 100,
          avgResolutionTime: Math.round(avgResolutionTime * 100) / 100,
        },
      }
    })

    res.json({
      success: true,
      data: agentPerformance,
    })
  }),
)

// Get SLA report
router.get(
  "/sla",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.AGENT),
  asyncHandler(async (req: AuthRequest, res) => {
    const { startDate, endDate } = req.query

    let tickets = db.getTickets()

    // Filter by date range
    if (startDate) {
      tickets = tickets.filter((t) => t.createdAt >= new Date(startDate as string))
    }
    if (endDate) {
      tickets = tickets.filter((t) => t.createdAt <= new Date(endDate as string))
    }

    // SLA thresholds (in hours)
    const slaThresholds = {
      [TicketPriority.CRITICAL]: 4,
      [TicketPriority.URGENT]: 8,
      [TicketPriority.HIGH]: 24,
      [TicketPriority.MEDIUM]: 72,
      [TicketPriority.LOW]: 168,
    }

    const slaReport = Object.values(TicketPriority).map((priority) => {
      const priorityTickets = tickets.filter((t) => t.priority === priority)
      const threshold = slaThresholds[priority]

      let withinSLA = 0
      let breachedSLA = 0

      priorityTickets.forEach((ticket) => {
        const resolutionTime = ticket.resolvedAt
          ? (ticket.resolvedAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60)
          : (new Date().getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60)

        if (resolutionTime <= threshold) {
          withinSLA++
        } else {
          breachedSLA++
        }
      })

      const slaCompliance = priorityTickets.length > 0 ? (withinSLA / priorityTickets.length) * 100 : 0

      return {
        priority,
        threshold,
        totalTickets: priorityTickets.length,
        withinSLA,
        breachedSLA,
        slaCompliance: Math.round(slaCompliance * 100) / 100,
      }
    })

    res.json({
      success: true,
      data: slaReport,
    })
  }),
)

// Export tickets to CSV
router.get(
  "/export/tickets",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.AGENT),
  asyncHandler(async (req: AuthRequest, res) => {
    const { startDate, endDate, status, priority } = req.query

    let tickets = db.getTickets()

    // Apply filters
    if (startDate) {
      tickets = tickets.filter((t) => t.createdAt >= new Date(startDate as string))
    }
    if (endDate) {
      tickets = tickets.filter((t) => t.createdAt <= new Date(endDate as string))
    }
    if (status) {
      tickets = tickets.filter((t) => t.status === status)
    }
    if (priority) {
      tickets = tickets.filter((t) => t.priority === priority)
    }

    // Generate CSV content
    const csvHeader =
      "ID,Title,Description,Status,Priority,Category,Created By,Assigned To,Created At,Updated At,Due Date,Resolved At\n"

    const csvContent = tickets
      .map((ticket) => {
        const creator = db.getUserById(ticket.createdBy)
        const assignee = ticket.assignedTo ? db.getUserById(ticket.assignedTo) : null

        return [
          ticket.id,
          `"${ticket.title.replace(/"/g, '""')}"`,
          `"${ticket.description.replace(/"/g, '""')}"`,
          ticket.status,
          ticket.priority,
          ticket.category,
          creator ? `"${creator.firstName} ${creator.lastName}"` : "",
          assignee ? `"${assignee.firstName} ${assignee.lastName}"` : "",
          ticket.createdAt.toISOString(),
          ticket.updatedAt.toISOString(),
          ticket.dueDate ? ticket.dueDate.toISOString() : "",
          ticket.resolvedAt ? ticket.resolvedAt.toISOString() : "",
        ].join(",")
      })
      .join("\n")

    const csv = csvHeader + csvContent

    res.setHeader("Content-Type", "text/csv")
    res.setHeader("Content-Disposition", "attachment; filename=tickets-export.csv")
    res.send(csv)
  }),
)

export default router
