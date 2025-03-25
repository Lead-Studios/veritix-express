import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import { AppDataSource } from "./data-source";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// Connect to Database
AppDataSource.initialize()
  .then(() => {
    console.log("📌 Database Connected Successfully!");
  })
  .catch((err) => {
    console.error("❌ Database Connection Failed:", err);
  });

// Health Check Route
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
