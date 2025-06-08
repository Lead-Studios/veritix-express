import express from "express"
import cors from "cors"
import helmet from "helmet"
import compression from "compression"
import mongoSanitize from "express-mongo-sanitize"
import dotenv from "dotenv"
import { connectDatabase } from "./config/database"
import eventSalesRoutes from "./routes/eventSalesRoutes"
import disputeRoutes from "./routes/disputeRoutes"
import { errorHandler, notFound } from "./middleware/errorHandler"
import { logger } from "./utils/logger"
import "./jobs/notificationProcessor" // Initialize background jobs

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Security middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)
app.use(compression())
app.use(mongoSanitize())

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Serve uploaded files
app.use("/uploads", express.static("uploads"))

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
  })
})

// API routes
app.use("/admin/event-sales", eventSalesRoutes)
app.use("/user/ticket/dispute", disputeRoutes)

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully")
  process.exit(0)
})

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully")
  process.exit(0)
})

// Start server
const startServer = async () => {
  try {
    await connectDatabase()

    app.listen(PORT, () => {
      logger.info(`🚀 Server is running on port ${PORT}`)
      logger.info(`📧 Email service initialized`)
      logger.info(`📁 File upload service ready`)
      logger.info(`🔔 Notification service active`)
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`)
    })
  } catch (error) {
    logger.error("Failed to start server:", error)
    process.exit(1)
  }
}

startServer()

export default app
