import express from "express"
import { authenticate, type AuthRequest } from "../middleware/auth"
import { db } from "../config/database"
import { UserRole, TicketStatus, TicketPriority } from "../types"
import { asyncHandler } from "../middleware/errorHandler"

const router = express.Router()

// Get dashboard statistics
router.get(
  "/stats",
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const tickets = db.getTickets()
    const users = db.getUsers()

    // Filter tickets based on user role
    let userTickets = tickets
    if (req.user?.role === UserRole.USER) {
      userTickets = tickets.filter((ticket) => ticket.createdBy === req.user?.id || ticket.assignedTo === req.user?.id)
    }

    // Basic statistics
    const totalTickets = userTickets.length
    const openTickets = userTickets.filter((t) => t.status === TicketStatus.OPEN).length
    const inProgressTickets = userTickets.filter((t) => t.status === TicketStatus.IN_PROGRESS).length
    const resolvedTickets = userTickets.filter((t) => t.status === TicketStatus.RESOLVED).length
    const closedTickets = userTickets.filter((t) => t.status === TicketStatus.CLOSED).length

    // Priority breakdown
    const priorityStats = {
      critical: userTickets.filter((t) => t.priority === TicketPriority.CRITICAL).length,
      urgent: userTickets.filter((t) => t.priority === TicketPriority.URGENT).length,
      high: userTickets.filter((t) => t.priority === TicketPriority.HIGH).length,
      medium: userTickets.filter((t) => t.priority === TicketPriority.MEDIUM).length,
      low: userTickets.filter((t) => t.priority === TicketPriority.LOW).length,
    }

    // Status breakdown
    const statusStats = {
      open: openTickets,
      inProgress: inProgressTickets,
      pending: userTickets.filter((t) => t.status === TicketStatus.PENDING).length,
      resolved: resolvedTickets,
      closed: closedTickets,
      cancelled: userTickets.filter((t) => t.status === TicketStatus.CANCELLED).length,
    }

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentTickets = userTickets.filter((t) => t.createdAt >= sevenDaysAgo).length

    // Average resolution time (mock calculation)
    const resolvedTicketsWithTime = userTickets.filter((t) => t.resolvedAt)
    const avgResolutionTime =
      resolvedTicketsWithTime.length > 0
        ? resolvedTicketsWithTime.reduce((acc, ticket) => {
            const resolutionTime = ticket.resolvedAt!.getTime() - ticket.createdAt.getTime()
            return acc + resolutionTime
          }, 0) /
          resolvedTicketsWithTime.length /
          (1000 * 60 * 60) // Convert to hours
        : 0

    // Admin-only statistics
    let adminStats = {}
    if (req.user?.role === UserRole.ADMIN) {
      adminStats = {
        totalUsers: users.length,
        activeUsers: users.filter((u) => u.isActive).length,
        totalAgents: users.filter((u) => u.role === UserRole.AGENT).length,
        categories: db.getCategories().filter((c) => c.isActive).length,
      }
    }

    res.json({
      success: true,
      data: {
        overview: {
          totalTickets,
          openTickets,
          inProgressTickets,
          resolvedTickets,
          closedTickets,
          recentTickets,
          avgResolutionTime: Math.round(avgResolutionTime * 100) / 100,
        },
        priorityStats,
        statusStats,
        ...adminStats,
      },
    })
  }),
)

// Get recent tickets
router.get(
  "/recent-tickets",
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    let tickets = db.getTickets()

    // Filter tickets based on user role
    if (req.user?.role === UserRole.USER) {
      tickets = tickets.filter((ticket) => ticket.createdBy === req.user?.id || ticket.assignedTo === req.user?.id)
    }

    // Get 10 most recent tickets
    const recentTickets = tickets
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map((ticket) => {
        const creator = db.getUserById(ticket.createdBy)
        const assignee = ticket.assignedTo ? db.getUserById(ticket.assignedTo) : null

        return {
          id: ticket.id,
          title: ticket.title,
          status: ticket.status,
          priority: ticket.priority,
          createdAt: ticket.createdAt,
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
        }
      })

    res.json({
      success: true,
      data: recentTickets,
    })
  }),
)

// Get my assigned tickets
router.get(
  "/my-tickets",
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const tickets = db
      .getTickets()
      .filter((ticket) => ticket.assignedTo === req.user?.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map((ticket) => {
        const creator = db.getUserById(ticket.createdBy)

        return {
          id: ticket.id,
          title: ticket.title,
          status: ticket.status,
          priority: ticket.priority,
          createdAt: ticket.createdAt,
          dueDate: ticket.dueDate,
          creator: creator
            ? {
                id: creator.id,
                username: creator.username,
                firstName: creator.firstName,
                lastName: creator.lastName,
              }
            : null,
        }
      })

    res.json({
      success: true,
      data: tickets,
    })
  }),
)

// Get tickets by status for charts
router.get(
  "/charts/status",
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    let tickets = db.getTickets()

    // Filter tickets based on user role
    if (req.user?.role === UserRole.USER) {
      tickets = tickets.filter((ticket) => ticket.createdBy === req.user?.id || ticket.assignedTo === req.user?.id)
    }

    const statusData = Object.values(TicketStatus).map((status) => ({
      status,
      count: tickets.filter((t) => t.status === status).length,
    }))

    res.json({
      success: true,
      data: statusData,
    })
  }),
)

// Get tickets by priority for charts
router.get(
  "/charts/priority",
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    let tickets = db.getTickets()

    // Filter tickets based on user role
    if (req.user?.role === UserRole.USER) {
      tickets = tickets.filter((ticket) => ticket.createdBy === req.user?.id || ticket.assignedTo === req.user?.id)
    }

    const priorityData = Object.values(TicketPriority).map((priority) => ({
      priority,
      count: tickets.filter((t) => t.priority === priority).length,
    }))

    res.json({
      success: true,
      data: priorityData,
    })
  }),
)

// Get ticket trends (last 30 days)
router.get(
  "/charts/trends",
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    let tickets = db.getTickets()

    // Filter tickets based on user role
    if (req.user?.role === UserRole.USER) {
      tickets = tickets.filter((ticket) => ticket.createdBy === req.user?.id || ticket.assignedTo === req.user?.id)
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const trendData = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      const dayTickets = tickets.filter((ticket) => {
        const ticketDate = ticket.createdAt.toISOString().split("T")[0]
        return ticketDate === dateStr
      })

      trendData.push({
        date: dateStr,
        created: dayTickets.length,
        resolved: dayTickets.filter((t) => t.status === TicketStatus.RESOLVED).length,
      })
    }

    res.json({
      success: true,
      data: trendData,
    })
  }),
)

export default router
