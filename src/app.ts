import express from "express"
import cors from "cors"
import helmet from "helmet"
import "reflect-metadata"
import { AppDataSource } from "./config/database"
import router from "./routes/index"
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware"
import { swaggerUi, specs } from "./swagger";

// Initialize express app
const app = express()

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use("/api", router)

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

// Database connection and server startup
const PORT = process.env.PORT || 3000
app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs));
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

