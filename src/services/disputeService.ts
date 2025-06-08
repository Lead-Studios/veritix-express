import TicketDispute from "../models/TicketDispute"
import Ticket from "../models/Ticket"
import User from "../models/User"
import DisputeNotification from "../models/DisputeNotification"
import { EmailService } from "./emailService"
import { NotificationService } from "./notificationService"
import { logger } from "../utils/logger"
import type { CreateDisputeDto, UpdateDisputeDto, AdminUpdateDisputeDto, DisputeQueryDto } from "../dto/dispute.dto"
import type { TicketDispute as ITicketDispute } from "../types/dispute"

export class DisputeService {
  private emailService: EmailService
  private notificationService: NotificationService

  constructor() {
    this.emailService = new EmailService()
    this.notificationService = new NotificationService()
  }

  async createDispute(userId: string, disputeData: CreateDisputeDto): Promise<ITicketDispute> {
    // Verify ticket ownership
    const ticket = await Ticket.findOne({ _id: disputeData.ticketId, userId })
    if (!ticket) {
      throw new Error("Ticket not found or you don't have permission to dispute it")
    }

    // Check for existing open disputes
    const existingDispute = await TicketDispute.findOne({
      ticketId: disputeData.ticketId,
      status: { $nin: ["resolved", "rejected", "cancelled", "closed"] },
    })

    if (existingDispute) {
      throw new Error("An open dispute already exists for this ticket")
    }

    // Determine priority based on dispute type and ticket value
    let priority = disputeData.priority || "medium"
    if (ticket.price > 500 || disputeData.disputeType === "fraudulent_charge") {
      priority = "high"
    }

    // Create dispute
    const dispute = new TicketDispute({
      ...disputeData,
      userId,
      priority,
      lastActivityAt: new Date(),
    })

    await dispute.save()

    // Add initial communication
    await dispute.addCommunication({
      type: "user_message",
      from: userId,
      message: `Dispute created: ${disputeData.description}`,
      sentAt: new Date(),
      isInternal: false,
    })

    // Send notification
    await this.notificationService.createNotification({
      disputeId: dispute._id,
      userId,
      type: "dispute_created",
      title: "Dispute Created Successfully",
      message: `Your dispute for ticket #${ticket._id} has been created and is under review.`,
      channels: ["email", "in_app"],
      data: {
        disputeId: dispute._id,
        ticketId: ticket._id,
        disputeType: dispute.disputeType,
      },
    })

    logger.info(`Dispute created: ${dispute._id} by user ${userId}`)
    return dispute.toObject()
  }

  async getUserDisputes(
    userId: string,
    query: DisputeQueryDto,
  ): Promise<{
    disputes: ITicketDispute[]
    total: number
    page: number
    totalPages: number
  }> {
    const {
      status,
      disputeType,
      priority,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      search,
    } = query

    // Build filter
    const filter: any = { userId }

    if (status) filter.status = status
    if (disputeType) filter.disputeType = disputeType
    if (priority) filter.priority = priority
    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) filter.createdAt.$gte = startDate
      if (endDate) filter.createdAt.$lte = endDate
    }

    // Text search
    if (search) {
      filter.$text = { $search: search }
    }

    // Build sort
    const sort: any = {}
    sort[sortBy] = sortOrder === "asc" ? 1 : -1

    const skip = (page - 1) * limit

    const [disputes, total] = await Promise.all([
      TicketDispute.find(filter)
        .populate("ticket", "eventId price quantity status")
        .populate("admin", "email firstName lastName")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      TicketDispute.countDocuments(filter),
    ])

    return {
      disputes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  async getDisputeById(disputeId: string, userId?: string): Promise<ITicketDispute | null> {
    const filter: any = { _id: disputeId }
    if (userId) filter.userId = userId

    const dispute = await TicketDispute.findOne(filter)
      .populate("ticket", "eventId price quantity status")
      .populate("user", "email firstName lastName")
      .populate("admin", "email firstName lastName")
      .populate("escalationHistory.escalatedBy", "email firstName lastName")
      .populate("escalationHistory.escalatedTo", "email firstName lastName")
      .populate("communicationHistory.from", "email firstName lastName")
      .populate("communicationHistory.to", "email firstName lastName")
      .lean()

    return dispute
  }

  async updateDispute(disputeId: string, userId: string, updateData: UpdateDisputeDto): Promise<ITicketDispute> {
    const dispute = await TicketDispute.findOne({ _id: disputeId, userId })
    if (!dispute) {
      throw new Error("Dispute not found or you don't have permission to update it")
    }

    // Check if dispute can be updated
    if (["resolved", "rejected", "cancelled", "closed"].includes(dispute.status)) {
      throw new Error("Cannot update a closed dispute")
    }

    // Update dispute
    Object.assign(dispute, updateData)
    await dispute.save()

    // Add communication for the update
    const changes = Object.keys(updateData).join(", ")
    await dispute.addCommunication({
      type: "user_message",
      from: userId,
      message: `Dispute updated. Changed: ${changes}`,
      sentAt: new Date(),
      isInternal: false,
    })

    // Send notification
    await this.notificationService.createNotification({
      disputeId: dispute._id,
      userId,
      type: "dispute_updated",
      title: "Dispute Updated",
      message: "Your dispute has been updated successfully.",
      channels: ["email", "in_app"],
      data: { changes: updateData },
    })

    logger.info(`Dispute updated: ${disputeId} by user ${userId}`)
    return dispute.toObject()
  }

  async deleteDispute(disputeId: string, userId: string): Promise<boolean> {
    const dispute = await TicketDispute.findOne({ _id: disputeId, userId })
    if (!dispute) {
      throw new Error("Dispute not found or you don't have permission to delete it")
    }

    // Only allow deletion if dispute is in pending status
    if (dispute.status !== "pending") {
      throw new Error("Can only delete disputes in pending status")
    }

    // Soft delete by changing status
    dispute.status = "cancelled"
    await dispute.save()

    // Clean up notifications
    await DisputeNotification.updateMany({ disputeId }, { status: "cancelled" })

    logger.info(`Dispute deleted: ${disputeId} by user ${userId}`)
    return true
  }

  async addCommunication(
    disputeId: string,
    userId: string,
    message: string,
    isInternal = false,
    attachments?: string[],
  ): Promise<ITicketDispute> {
    const dispute = await TicketDispute.findById(disputeId)
    if (!dispute) {
      throw new Error("Dispute not found")
    }

    // Check permissions
    const user = await User.findById(userId)
    if (!user) {
      throw new Error("User not found")
    }

    const canAccess = dispute.userId.toString() === userId || ["admin", "super_admin"].includes(user.role)

    if (!canAccess) {
      throw new Error("You don't have permission to add communication to this dispute")
    }

    // Add communication
    await dispute.addCommunication({
      type: user.role === "user" ? "user_message" : "admin_message",
      from: userId,
      to: user.role === "user" ? dispute.adminId : dispute.userId,
      message,
      attachments,
      sentAt: new Date(),
      isInternal,
    })

    // Send notification if not internal
    if (!isInternal) {
      const notificationUserId = user.role === "user" ? dispute.userId : dispute.adminId
      if (notificationUserId) {
        await this.notificationService.createNotification({
          disputeId: dispute._id,
          userId: notificationUserId.toString(),
          type: user.role === "user" ? "admin_response" : "dispute_updated",
          title: "New Message on Your Dispute",
          message: `A new message has been added to your dispute #${dispute._id}`,
          channels: ["email", "in_app"],
          data: { message: message.substring(0, 100) },
        })
      }
    }

    return dispute.toObject()
  }

  async escalateDispute(
    disputeId: string,
    escalatedBy: string,
    reason: string,
    escalatedTo?: string,
  ): Promise<ITicketDispute> {
    const dispute = await TicketDispute.findById(disputeId)
    if (!dispute) {
      throw new Error("Dispute not found")
    }

    if (dispute.escalationLevel >= 5) {
      throw new Error("Dispute has reached maximum escalation level")
    }

    // Escalate dispute
    await dispute.escalate({
      escalatedBy,
      escalatedTo,
      reason,
      escalatedAt: new Date(),
    })

    // Send notifications
    await this.notificationService.createNotification({
      disputeId: dispute._id,
      userId: dispute.userId.toString(),
      type: "escalation",
      title: "Dispute Escalated",
      message: `Your dispute has been escalated to level ${dispute.escalationLevel}`,
      channels: ["email", "in_app"],
      data: {
        escalationLevel: dispute.escalationLevel,
        reason,
      },
    })

    logger.info(`Dispute escalated: ${disputeId} to level ${dispute.escalationLevel}`)
    return dispute.toObject()
  }

  async getDisputeAnalytics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalDisputes: number
    byStatus: Record<string, number>
    byType: Record<string, number>
    byPriority: Record<string, number>
    resolutionTime: {
      average: number
      median: number
    }
    escalationRate: number
    satisfactionRate: number
  }> {
    const dateFilter: any = {}
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.$gte = startDate
      if (endDate) dateFilter.createdAt.$lte = endDate
    }

    const [totalDisputes, statusStats, typeStats, priorityStats, resolutionStats, escalationStats] = await Promise.all([
      TicketDispute.countDocuments(dateFilter),
      TicketDispute.aggregate([{ $match: dateFilter }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      TicketDispute.aggregate([{ $match: dateFilter }, { $group: { _id: "$disputeType", count: { $sum: 1 } } }]),
      TicketDispute.aggregate([{ $match: dateFilter }, { $group: { _id: "$priority", count: { $sum: 1 } } }]),
      TicketDispute.aggregate([
        {
          $match: {
            ...dateFilter,
            resolvedAt: { $exists: true },
            createdAt: { $exists: true },
          },
        },
        {
          $project: {
            resolutionTime: {
              $divide: [
                { $subtract: ["$resolvedAt", "$createdAt"] },
                1000 * 60 * 60 * 24, // Convert to days
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgResolutionTime: { $avg: "$resolutionTime" },
            resolutionTimes: { $push: "$resolutionTime" },
          },
        },
      ]),
      TicketDispute.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalDisputes: { $sum: 1 },
            escalatedDisputes: {
              $sum: { $cond: [{ $gt: ["$escalationLevel", 0] }, 1, 0] },
            },
          },
        },
      ]),
    ])

    // Process results
    const byStatus = statusStats.reduce((acc: any, item: any) => {
      acc[item._id] = item.count
      return acc
    }, {})

    const byType = typeStats.reduce((acc: any, item: any) => {
      acc[item._id] = item.count
      return acc
    }, {})

    const byPriority = priorityStats.reduce((acc: any, item: any) => {
      acc[item._id] = item.count
      return acc
    }, {})

    const resolutionTime = resolutionStats[0] || { avgResolutionTime: 0, resolutionTimes: [] }
    const sortedTimes = resolutionTime.resolutionTimes.sort((a: number, b: number) => a - b)
    const median = sortedTimes.length > 0 ? sortedTimes[Math.floor(sortedTimes.length / 2)] : 0

    const escalationData = escalationStats[0] || { totalDisputes: 0, escalatedDisputes: 0 }
    const escalationRate =
      escalationData.totalDisputes > 0 ? (escalationData.escalatedDisputes / escalationData.totalDisputes) * 100 : 0

    return {
      totalDisputes,
      byStatus,
      byType,
      byPriority,
      resolutionTime: {
        average: resolutionTime.avgResolutionTime || 0,
        median,
      },
      escalationRate,
      satisfactionRate: 85, // This would come from user feedback in a real system
    }
  }

  // Admin methods
  async adminUpdateDispute(
    disputeId: string,
    adminId: string,
    updateData: AdminUpdateDisputeDto,
  ): Promise<ITicketDispute> {
    const dispute = await TicketDispute.findById(disputeId)
    if (!dispute) {
      throw new Error("Dispute not found")
    }

    const oldStatus = dispute.status

    // Update dispute
    Object.assign(dispute, updateData)
    dispute.adminId = adminId
    await dispute.save()

    // Add communication for admin response
    if (updateData.adminResponse) {
      await dispute.addCommunication({
        type: "admin_message",
        from: adminId,
        to: dispute.userId,
        message: updateData.adminResponse,
        sentAt: new Date(),
        isInternal: false,
      })
    }

    // Send notification if status changed
    if (updateData.status && updateData.status !== oldStatus) {
      await this.notificationService.createNotification({
        disputeId: dispute._id,
        userId: dispute.userId.toString(),
        type: "status_changed",
        title: `Dispute Status Updated to ${updateData.status}`,
        message: `Your dispute status has been changed from ${oldStatus} to ${updateData.status}`,
        channels: ["email", "in_app"],
        data: {
          oldStatus,
          newStatus: updateData.status,
          adminResponse: updateData.adminResponse,
        },
      })
    }

    logger.info(`Dispute admin updated: ${disputeId} by admin ${adminId}`)
    return dispute.toObject()
  }

  async getAllDisputes(query: DisputeQueryDto & { adminId?: string }): Promise<{
    disputes: ITicketDispute[]
    total: number
    page: number
    totalPages: number
  }> {
    const {
      status,
      disputeType,
      priority,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      search,
      adminId,
    } = query

    // Build filter
    const filter: any = {}

    if (status) filter.status = status
    if (disputeType) filter.disputeType = disputeType
    if (priority) filter.priority = priority
    if (adminId) filter.adminId = adminId
    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) filter.createdAt.$gte = startDate
      if (endDate) filter.createdAt.$lte = endDate
    }

    // Text search
    if (search) {
      filter.$text = { $search: search }
    }

    // Build sort
    const sort: any = {}
    sort[sortBy] = sortOrder === "asc" ? 1 : -1

    const skip = (page - 1) * limit

    const [disputes, total] = await Promise.all([
      TicketDispute.find(filter)
        .populate("ticket", "eventId price quantity status")
        .populate("user", "email firstName lastName")
        .populate("admin", "email firstName lastName")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      TicketDispute.countDocuments(filter),
    ])

    return {
      disputes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }
}
