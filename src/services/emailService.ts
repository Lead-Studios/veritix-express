import nodemailer from "nodemailer"
import handlebars from "handlebars"
import fs from "fs"
import path from "path"
import { logger } from "../utils/logger"
import type { TicketDispute, DisputeNotification } from "../types/dispute"

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface EmailData {
  to: string
  subject: string
  html: string
  text: string
  attachments?: Array<{
    filename: string
    path?: string
    content?: Buffer
    contentType?: string
  }>
}

export class EmailService {
  private transporter: nodemailer.Transporter
  private templates: Map<string, handlebars.TemplateDelegate> = new Map()

  constructor() {
    this.initializeTransporter()
    this.loadTemplates()
  }

  private initializeTransporter() {
    // Support multiple email providers
    const emailProvider = process.env.EMAIL_PROVIDER || "smtp"

    switch (emailProvider) {
      case "sendgrid":
        this.transporter = nodemailer.createTransporter({
          service: "SendGrid",
          auth: {
            user: "apikey",
            pass: process.env.SENDGRID_API_KEY,
          },
        })
        break

      case "ses":
        this.transporter = nodemailer.createTransporter({
          SES: {
            aws: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
              region: process.env.AWS_REGION || "us-east-1",
            },
          },
        })
        break

      default:
        this.transporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST || "localhost",
          port: Number.parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        })
    }
  }

  private loadTemplates() {
    const templatesDir = path.join(__dirname, "../templates/email")

    try {
      const templateFiles = [
        "dispute-created.hbs",
        "dispute-updated.hbs",
        "status-changed.hbs",
        "admin-response.hbs",
        "escalation.hbs",
        "resolution.hbs",
        "refund-processed.hbs",
        "reminder.hbs",
      ]

      for (const file of templateFiles) {
        const templatePath = path.join(templatesDir, file)
        if (fs.existsSync(templatePath)) {
          const templateContent = fs.readFileSync(templatePath, "utf8")
          const templateName = file.replace(".hbs", "")
          this.templates.set(templateName, handlebars.compile(templateContent))
        }
      }

      logger.info(`Loaded ${this.templates.size} email templates`)
    } catch (error) {
      logger.error("Error loading email templates:", error)
    }
  }

  async sendDisputeNotification(
    notification: DisputeNotification,
    dispute: TicketDispute,
    userEmail: string,
  ): Promise<boolean> {
    try {
      const template = this.getTemplate(notification.type)
      if (!template) {
        logger.error(`Template not found for notification type: ${notification.type}`)
        return false
      }

      const templateData = {
        dispute,
        notification,
        user: { email: userEmail },
        baseUrl: process.env.FRONTEND_URL || "http://localhost:3000",
        supportEmail: process.env.SUPPORT_EMAIL || "support@example.com",
        companyName: process.env.COMPANY_NAME || "Event Tickets",
      }

      const html = template(templateData)
      const text = this.htmlToText(html)

      const emailData: EmailData = {
        to: userEmail,
        subject: notification.title,
        html,
        text,
      }

      await this.sendEmail(emailData)
      logger.info(`Email sent successfully for dispute ${dispute._id}`)
      return true
    } catch (error) {
      logger.error("Error sending dispute notification email:", error)
      return false
    }
  }

  async sendBulkNotifications(
    notifications: Array<{
      notification: DisputeNotification
      dispute: TicketDispute
      userEmail: string
    }>,
  ): Promise<{ success: number; failed: number }> {
    let success = 0
    let failed = 0

    const promises = notifications.map(async ({ notification, dispute, userEmail }) => {
      try {
        await this.sendDisputeNotification(notification, dispute, userEmail)
        success++
      } catch (error) {
        failed++
        logger.error(`Failed to send notification ${notification._id}:`, error)
      }
    })

    await Promise.allSettled(promises)
    return { success, failed }
  }

  private async sendEmail(emailData: EmailData): Promise<void> {
    const mailOptions = {
      from: process.env.FROM_EMAIL || "noreply@example.com",
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
      attachments: emailData.attachments,
    }

    await this.transporter.sendMail(mailOptions)
  }

  private getTemplate(type: string): handlebars.TemplateDelegate | null {
    return this.templates.get(type) || null
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim()
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify()
      logger.info("Email service connection verified")
      return true
    } catch (error) {
      logger.error("Email service connection failed:", error)
      return false
    }
  }
}
