import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  getAllEvents,
  getEventById,
  archiveEvent,
  generateReports,
  deleteEvent,
} from "../controller/event.controller";
import {
  validateCreateEvent,
  validateGetEventById,
  validateArchiveEvent,
  validateGenerateReports,
  validateDeleteEvent,
} from "../validation/event.validation";

const router = express.Router();

// Admin Event APIs
router.get("/events", authenticate, authorize(["admin"]), getAllEvents); // Retrieve all events
router.get(
  "/events/:id",
  authenticate,
  authorize(["admin"]),
  validateGetEventById,
  getEventById
); // Retrieve a single event
router.post(
  "/events/archive/:id",
  authenticate,
  authorize(["admin"]),
  validateArchiveEvent,
  archiveEvent
); // Archive an event
router.get(
  "/reports",
  authenticate,
  authorize(["admin"]),
  validateGenerateReports,
  generateReports
); // Generate system reports
router.delete(
  "/events/:id",
  authenticate,
  authorize(["admin"]),
  validateDeleteEvent,
  deleteEvent
); // Delete an event

export default router;
