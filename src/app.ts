import express from "express"
import cors from "cors"
import helmet from "helmet"
import "reflect-metadata"
import { AppDataSource } from "./config/database"
import adminRoutes from "./routes/admin.routes"
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware"
import 'reflect-metadata';

// Initialize express app
const app = express()

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use("/admin", adminRoutes)

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

