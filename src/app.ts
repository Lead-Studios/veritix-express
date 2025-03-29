import cors from "cors";
import express from "express";
import helmet from "helmet";
import passport from "passport";
import "reflect-metadata";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import adminRoutes from "./routes/admin.routes";
import eventRoutes from "./routes/event.routes";
import posterRoutes from "./routes/poster.routes";
import userRoutes from "./routes/user.routes";
import apiRoutes from "./routes/api.routes";
import authRoutes from "./routes/auth.routes";
import authenticateJWT from "./authenticateJWT";
import rateLimit from "express-rate-limit";

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Rate Limiting Middleware
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use("/admin", adminRoutes);
app.use("/events", eventRoutes);
app.use("/posters", posterRoutes);
app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/api", authenticateJWT, apiRoutes); // Protecting /api routes with JWT

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
