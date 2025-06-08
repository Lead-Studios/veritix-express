import Bull from "bull"
import { NotificationService } from "../services/notificationService"
import { logger } from "../utils/logger"

const notificationQueue = new Bull("notification processing", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: Number.parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
  },
})

const notificationService = new NotificationService()

// Process notification jobs
notificationQueue.process("send-notification", async (job) => {
  const { notificationId } = job.data

  try {
    const success = await notificationService.processNotification(notificationId)

    if (!success) {
      throw new Error(`Failed to process notification ${notificationId}`)
    }

    logger.info(`Notification processed successfully: ${notificationId}`)
    return { success: true, notificationId }
  } catch (error) {
    logger.error(`Error processing notification ${notificationId}:`, error)
    throw error
  }
})

// Process scheduled reminders
notificationQueue.process("send-reminders", async (job) => {
  try {
    await notificationService.scheduleReminders()
    logger.info("Reminder notifications scheduled successfully")
    return { success: true }
  } catch (error) {
    logger.error("Error scheduling reminder notifications:", error)
    throw error
  }
})

// Schedule reminder job to run every hour
notificationQueue.add(
  "send-reminders",
  {},
  {
    repeat: { cron: "0 * * * *" }, // Every hour
    removeOnComplete: 10,
    removeOnFail: 5,
  },
)

export { notificationQueue }
