import nodemailer from "nodemailer"

interface EmailOptions {
  email: string
  subject: string
  message: string
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  // Create transporter
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || "smtp.mailtrap.io",
    port: Number.parseInt(process.env.SMTP_PORT || "2525", 10),
    auth: {
      user: process.env.SMTP_EMAIL || "your-email@example.com",
      pass: process.env.SMTP_PASSWORD || "your-password",
    },
  })

  // Message options
  const message = {
    from: `${process.env.FROM_NAME || "Event Management"} <${process.env.FROM_EMAIL || "noreply@eventmanagement.com"}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  }

  // Send email
  const info = await transporter.sendMail(message)
  console.log("Message sent: %s", info.messageId)
}
