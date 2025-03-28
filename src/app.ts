import cors from "cors"
import express from "express"
import helmet from "helmet"
import "reflect-metadata"
import { AppDataSource } from "./config/database"
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware"
import adminRoutes from "./routes/admin.routes"
import eventRoutes from "./routes/event.routes"
import posterRoutes from "./routes/poster.routes"
import userRoutes from "./routes/user.routes"

// Initialize express app
const app = express()

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use("/admin", adminRoutes)
app.use("/events", eventRoutes)
app.use("/posters", posterRoutes)
app.use("/users", userRoutes)

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

// Database connection and server startup
const PORT = process.env.PORT || 3000

AppDataSource.initialize()
  .then(() => {
    console.log("Database connection established")
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((error) => {
    console.error("Error connecting to database:", error)
  })

export default app

