import DisputeNotification from "../models/DisputeNotification"
import { EmailService } from "./emailService"
import { logger } from "../utils/logger"
import type {
  DisputeNotification as IDisputeNotification,
  NotificationType,
  NotificationChannel,
} from "../types/dispute"

export interface CreateNotificationDto {
  disputeId: string
  userId: string
  type: NotificationType
  title: string
  message: string
  channels: NotificationChannel[]
  data?: Record<string, any>
  scheduledAt?: Date
}

export class NotificationService {
  private emailService: EmailService

  constructor() {
    this.emailService = new EmailService()
  }

  async createNotification(notificationData: CreateNotificationDto): Promise<IDisputeNotification> {
    const notification = new DisputeNotification(notificationData)
    await notification.save()

    // Process notification immediately if not scheduled
    if (!notificationData.scheduledAt) {
      await this.processNotification(notification._id.toString())
    }

    return notification.toObject()
  }

  async processNotification(notificationId: string): Promise<boolean> {
    try {
      const notification = await DisputeNotification.findById(notificationId)
        .populate("disputeId")
        .populate("userId", "email firstName lastName")

      if (!notification || notification.status !== "pending") {
        return false
      }

      const success = await this.sendNotification(notification)

      if (success) {
        notification.status = "sent"
        notification.sentAt = new Date()
      } else {
        notification.status = "failed"
      }

      await notification.save()
      return success
    } catch (error) {
      logger.error(`Error processing notification ${notificationId}:`, error)
      return false
    }
  }

  private async sendNotification(notification: any): Promise<boolean> {
    let success = true

    for (const channel of notification.channels) {
      try {
        switch (channel) {
          case "email":
            await this.sendEmailNotification(notification)
            break
          case "sms":
            await this.sendSMSNotification(notification)
            break
          case "push":
            await this.sendPushNotification(notification)
            break
          case "in_app":
            await this.sendInAppNotification(notification)
            break
          case "webhook":
            await this.sendWebhookNotification(notification)
            break
        }
      } catch (error) {
        logger.error(`Error sending ${channel} notification:`, error)
        success = false
      }
    }

    return success
  }

  private async sendEmailNotification(notification: any): Promise<void> {
    if (!notification.userId?.email) {
      throw new Error("User email not found")
    }

    await this.emailService.sendDisputeNotification(notification, notification.disputeId, notification.userId.email)
  }

  private async sendSMSNotification(notification: any): Promise<void> {
    // SMS implementation would go here
    logger.info(`SMS notification sent: ${notification._id}`)
  }

  private async sendPushNotification(notification: any): Promise<void> {
    // Push notification implementation would go here
    logger.info(`Push notification sent: ${notification._id}`)
  }

  private async sendInAppNotification(notification: any): Promise<void> {
    // In-app notification implementation would go here
    // This could use WebSockets or store in database for user to retrieve
    logger.info(`In-app notification sent: ${notification._id}`)
  }

  private async sendWebhookNotification(notification: any): Promise<void> {
    // Webhook implementation would go here
    logger.info(`Webhook notification sent: ${notification._id}`)
  }

  async getNotifications(
    userId: string,
    options: {
      page?: number
      limit?: number
      unreadOnly?: boolean
      type?: NotificationType
    } = {},
  ): Promise<{
    notifications: IDisputeNotification[]
    total: number
    unreadCount: number
  }> {
    const { page = 1, limit = 20, unreadOnly = false, type } = options
    const skip = (page - 1) * limit

    const filter: any = { userId }
    if (unreadOnly) filter.readAt = { $exists: false }
    if (type) filter.type = type

    const [notifications, total, unreadCount] = await Promise.all([
      DisputeNotification.find(filter)
        .populate("disputeId", "subject status disputeType")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DisputeNotification.countDocuments(filter),
      DisputeNotification.countDocuments({ userId, readAt: { $exists: false } }),
    ])

    return { notifications, total, unreadCount }
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const result = await DisputeNotification.updateOne({ _id: notificationId, userId }, { readAt: new Date() })

    return result.modifiedCount > 0
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await DisputeNotification.updateMany({ userId, readAt: { $exists: false } }, { readAt: new Date() })

    return result.modifiedCount
  }

  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const result = await DisputeNotification.deleteOne({
      _id: notificationId,
      userId,
    })

    return result.deletedCount > 0
  }

  async scheduleReminders(): Promise<void> {
    // Find disputes that need reminders
    const disputes = await DisputeNotification.aggregate([
      {
        $match: {
          status: { $in: ["pending", "under_review", "awaiting_response"] },
          lastActivityAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // 24 hours ago
        },
      },
    ])

    for (const dispute of disputes) {
      await this.createNotification({
        disputeId: dispute._id,
        userId: dispute.userId,
        type: "reminder",
        title: "Dispute Update Reminder",
        message: "Your dispute is still being processed. We'll update you soon.",
        channels: ["email", "in_app"],
        data: { disputeId: dispute._id },
      })
    }

    logger.info(`Scheduled ${disputes.length} reminder notifications`)
  }
}
