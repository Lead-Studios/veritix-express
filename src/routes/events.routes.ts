import express from "express"
import {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  getEventsByOrganizer,
  getFeaturedEvents,
  getUpcomingEvents,
  changeEventStatus,
  getEventsByCategory,
} from "../controllers/event.controller"
import { registerForEvent, cancelRegistration, getEventAttendees } from "../controllers/attendee.controller"
import { addComment, getEventComments, getEventRatings } from "../controllers/comment.controller"
import { protect } from "../middleware/auth.middleware"
import { validateEvent } from "../middleware/validation.middleware"

const router = express.Router()

// Public routes
router.get("/", getEvents)
router.get("/featured", getFeaturedEvents)
router.get("/upcoming", getUpcomingEvents)
router.get("/organizer/:userId", getEventsByOrganizer)
router.get("/category/:categoryId", getEventsByCategory)
router.get("/:id", getEvent)
router.get("/:eventId/comments", getEventComments)
router.get("/:eventId/ratings", getEventRatings)

// Protected routes
router.use(protect)

router.post("/", validateEvent, createEvent)
router.put("/:id", updateEvent)
router.delete("/:id", deleteEvent)
router.put("/:id/status", changeEventStatus)

// Event registration routes
router.post("/:eventId/register", registerForEvent)
router.put("/:eventId/cancel-registration", cancelRegistration)
router.get("/:eventId/attendees", getEventAttendees)

// Comment routes
router.post("/:eventId/comments", addComment)

export default router
